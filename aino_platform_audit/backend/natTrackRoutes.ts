/**
 * NAT Track API Routes for AINO Aviation Intelligence Platform
 * Provides North Atlantic Track data from FAA NOTAM parsing
 */

import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

interface NATTrack {
  track_id: string;
  direction: 'Eastbound' | 'Westbound';
  color: string;
  timestamp: string;
  waypoint_count: number;
  coordinates: number[][];
}

interface NATResponse {
  success: boolean;
  tracks?: NATTrack[];
  total_tracks?: number;
  generated_at?: string;
  error?: string;
  cache_status?: 'fresh' | 'cached';
}

// Cache for NAT tracks (refresh every 30 minutes)
let natTracksCache: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Execute NAT track parser Python script
 */
async function executeNATParser(): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log('🌊 Executing NAT track parser...');
    
    const pythonPath = 'python3';
    const scriptPath = path.join(process.cwd(), 'nat_track_parser.py');
    
    const pythonProcess = spawn(pythonPath, [scriptPath], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        try {
          // Read the generated GeoJSON file
          const geojsonPath = path.join(process.cwd(), 'nat_tracks.geojson');
          const geojsonData = await fs.readFile(geojsonPath, 'utf-8');
          const parsedData = JSON.parse(geojsonData);
          
          console.log(`✅ NAT parser completed: ${parsedData.features?.length || 0} tracks`);
          resolve(parsedData);
        } catch (error) {
          console.error('❌ Failed to read NAT tracks file:', error);
          reject(error);
        }
      } else {
        console.error('❌ NAT parser failed:', stderr);
        reject(new Error(`Python process failed with code ${code}: ${stderr}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error('❌ Failed to start NAT parser:', error);
      reject(error);
    });
  });
}

/**
 * Get NAT tracks with caching
 */
async function getNATTracks(forceRefresh = false): Promise<any> {
  const now = Date.now();
  
  // Use cache if available and not expired
  if (!forceRefresh && natTracksCache && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('📦 Using cached NAT tracks');
    return { ...natTracksCache, cache_status: 'cached' };
  }
  
  try {
    console.log('🔄 Fetching fresh NAT tracks...');
    const freshData = await executeNATParser();
    
    // Update cache
    natTracksCache = freshData;
    lastFetchTime = now;
    
    return { ...freshData, cache_status: 'fresh' };
  } catch (error) {
    // If fresh fetch fails but we have cache, use it
    if (natTracksCache) {
      console.log('⚠️ Fresh fetch failed, using cached NAT tracks');
      return { ...natTracksCache, cache_status: 'cached', warning: 'Fresh data unavailable' };
    }
    throw error;
  }
}

/**
 * GET /api/nat-tracks
 * Get current North Atlantic Tracks
 */
router.get('/', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const geojsonData = await getNATTracks(forceRefresh);
    
    // Transform GeoJSON to simplified track format
    const tracks: NATTrack[] = geojsonData.features?.map((feature: any) => ({
      track_id: feature.properties.track_id,
      direction: feature.properties.direction,
      color: feature.properties.color,
      timestamp: feature.properties.timestamp,
      waypoint_count: feature.properties.waypoint_count,
      coordinates: feature.geometry.coordinates
    })) || [];
    
    const response: NATResponse = {
      success: true,
      tracks,
      total_tracks: tracks.length,
      generated_at: geojsonData.properties?.generated_at || new Date().toISOString(),
      cache_status: geojsonData.cache_status
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ NAT tracks API error:', error);
    
    const errorResponse: NATResponse = {
      success: false,
      tracks: [],
      total_tracks: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    res.status(500).json(errorResponse);
  }
});

/**
 * GET /api/nat-tracks/geojson
 * Get NAT tracks as raw GeoJSON
 */
router.get('/geojson', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const geojsonData = await getNATTracks(forceRefresh);
    
    res.json(geojsonData);
  } catch (error) {
    console.error('❌ NAT tracks GeoJSON API error:', error);
    
    res.status(500).json({
      type: "FeatureCollection",
      features: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/nat-tracks/status
 * Get NAT tracks service status
 */
router.get('/status', (req, res) => {
  const now = Date.now();
  const cacheAge = natTracksCache ? now - lastFetchTime : null;
  
  res.json({
    success: true,
    service: 'NAT Track Parser',
    status: 'operational',
    cache_available: !!natTracksCache,
    cache_age_minutes: cacheAge ? Math.round(cacheAge / 60000) : null,
    last_update: lastFetchTime ? new Date(lastFetchTime).toISOString() : null,
    tracks_cached: natTracksCache?.features?.length || 0
  });
});

/**
 * POST /api/nat-tracks/refresh
 * Force refresh NAT tracks
 */
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 Force refreshing NAT tracks...');
    const freshData = await getNATTracks(true);
    
    res.json({
      success: true,
      message: 'NAT tracks refreshed successfully',
      total_tracks: freshData.features?.length || 0,
      generated_at: freshData.properties?.generated_at
    });
  } catch (error) {
    console.error('❌ NAT tracks refresh failed:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as natTrackRoutes };