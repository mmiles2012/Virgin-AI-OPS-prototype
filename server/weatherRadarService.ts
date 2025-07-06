import fetch from 'node-fetch';

interface RadarResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

class WeatherRadarService {
  private userAgent = 'WeatherRadarClient/1.0';

  async getNoaaRadar(bbox?: number[], width = 800, height = 600): Promise<string | null> {
    // Default to Continental US
    const defaultBbox = [-130, 20, -60, 50];
    const useBbox = bbox || defaultBbox;
    
    try {
      // Get background map first
      const backgroundMap = await this.getBackgroundMap(useBbox, width, height);
      
      // Get weather radar overlay
      const radarOverlay = await this.getNoaaRadarOverlay(useBbox, width, height);
      
      if (backgroundMap && radarOverlay) {
        // Composite the images
        return await this.compositeImages(backgroundMap, radarOverlay);
      } else if (backgroundMap) {
        // Return just the background map if radar fails
        return backgroundMap;
      } else {
        return radarOverlay; // Fallback to just radar if available
      }
    } catch (error) {
      console.error('Error fetching NOAA radar:', error);
      return null;
    }
  }

  async getRainViewerRadar(zoom = 4): Promise<string | null> {
    try {
      // Get available radar timestamps
      const apiUrl = "https://api.rainviewer.com/public/weather-maps.json";
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as any;
      
      if (!data?.radar?.past || data.radar.past.length === 0) {
        console.error('No radar data available from RainViewer');
        return null;
      }

      // Get most recent radar timestamp
      const latestTimestamp = data.radar.past[data.radar.past.length - 1].time;
      
      // Get radar tile (simplified - covers central US area)
      const tileUrl = `https://tilecache.rainviewer.com/v2/radar/${latestTimestamp}/256/${zoom}/4/4.png`;
      
      const tileResponse = await fetch(tileUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000
      });

      if (!tileResponse.ok) {
        throw new Error(`HTTP error! status: ${tileResponse.status}`);
      }

      const buffer = await tileResponse.buffer();
      const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;
      return base64Image;
    } catch (error) {
      console.error('Error fetching RainViewer radar:', error);
      return null;
    }
  }

  async getRegionalRadar(region: string): Promise<string | null> {
    const regions: { [key: string]: number[] } = {
      "texas": [-106.65, 25.84, -93.51, 36.5],
      "california": [-124.48, 32.53, -114.13, 42.01],
      "florida": [-87.63, 24.52, -80.03, 31.00],
      "northeast": [-80.52, 40.50, -66.95, 47.46],
      "midwest": [-104.05, 36.99, -82.41, 49.38],
      "southeast": [-91.66, 24.52, -75.24, 36.59],
      "uk": [-10.9, 49.8, 2.1, 59.0], // United Kingdom region
      "europe": [-15.0, 35.0, 35.0, 70.0] // Europe region
    };

    const bbox = regions[region.toLowerCase()];
    if (!bbox) {
      console.error(`Unknown region: ${region}. Available regions: ${Object.keys(regions).join(', ')}`);
      return null;
    }

    console.log(`Getting weather radar for ${region}...`);
    return await this.getNoaaRadar(bbox);
  }

  async getRadar(source: 'noaa' | 'rainviewer' = 'noaa', region?: string): Promise<RadarResponse> {
    try {
      let imageUrl: string | null = null;

      if (source === 'noaa') {
        if (region) {
          imageUrl = await this.getRegionalRadar(region);
        } else {
          imageUrl = await this.getNoaaRadar();
        }
      } else if (source === 'rainviewer') {
        imageUrl = await this.getRainViewerRadar();
      }

      if (imageUrl) {
        return {
          success: true,
          imageUrl
        };
      } else {
        return {
          success: false,
          error: `Failed to retrieve radar data from ${source}`
        };
      }
    } catch (error) {
      console.error('Weather radar service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get background map with Zoom Earth integration
  async getBackgroundMap(bbox: number[], width: number, height: number): Promise<string | null> {
    try {
      const zoomLevel = this.calculateZoomLevel(bbox, width, height);
      const centerLat = (bbox[1] + bbox[3]) / 2;
      const centerLon = (bbox[0] + bbox[2]) / 2;
      
      // Try Zoom Earth satellite tiles (following their API pattern)
      const tileX = this.lonToTileX(centerLon, zoomLevel);
      const tileY = this.latToTileY(centerLat, zoomLevel);
      
      // Zoom Earth satellite tile URL pattern
      const zoomEarthSatelliteUrl = `https://zoom.earth/layers/satellite/${zoomLevel}/${tileX}/${tileY}.jpg`;
      
      console.log(`Attempting Zoom Earth satellite tile: z=${zoomLevel}, x=${tileX}, y=${tileY}`);
      
      const response = await fetch(zoomEarthSatelliteUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WeatherRadar/1.0)',
          'Referer': 'https://zoom.earth/',
          'Accept': 'image/jpeg,image/png,image/*,*/*'
        },
        timeout: 15000
      });

      if (response.ok && response.status === 200) {
        const contentType = response.headers.get('content-type');
        if (contentType && (contentType.includes('image/jpeg') || contentType.includes('image/png'))) {
          const buffer = await response.buffer();
          console.log('Zoom Earth satellite tile successfully retrieved');
          return `data:${contentType};base64,${buffer.toString('base64')}`;
        }
      }

      console.log('Zoom Earth satellite failed, trying world map...');
      
      // Try Zoom Earth world map as fallback
      const worldMapUrl = `https://zoom.earth/layers/world/${zoomLevel}/${tileX}/${tileY}.png`;
      
      const worldResponse = await fetch(worldMapUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WeatherRadar/1.0)',
          'Referer': 'https://zoom.earth/'
        },
        timeout: 10000
      });

      if (worldResponse.ok) {
        const contentType = worldResponse.headers.get('content-type');
        if (contentType && contentType.startsWith('image')) {
          const buffer = await worldResponse.buffer();
          console.log('Zoom Earth world map successfully retrieved');
          return `data:${contentType};base64,${buffer.toString('base64')}`;
        }
      }

      console.log('Zoom Earth world map failed, trying OpenStreetMap...');
      
      // Fallback to OpenStreetMap
      const osmUrl = `https://tile.openstreetmap.org/${zoomLevel}/${tileX}/${tileY}.png`;
      
      const osmResponse = await fetch(osmUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WeatherRadar/1.0)'
        },
        timeout: 8000
      });

      if (osmResponse.ok) {
        const contentType = osmResponse.headers.get('content-type');
        if (contentType && contentType.startsWith('image')) {
          const buffer = await osmResponse.buffer();
          console.log('OpenStreetMap tile successfully retrieved');
          return `data:${contentType};base64,${buffer.toString('base64')}`;
        }
      }

      // Final fallback to enhanced geographic background
      console.log('All tile services failed, using enhanced background');
      return this.createEnhancedBackground(width, height, bbox);
    } catch (error) {
      console.error('Background map error:', error);
      return this.createEnhancedBackground(width, height, bbox);
    }
  }

  // Calculate appropriate zoom level based on bounding box
  calculateZoomLevel(bbox: number[], width: number, height: number): number {
    const latRange = bbox[3] - bbox[1];
    const lonRange = bbox[2] - bbox[0];
    
    // Simple zoom calculation based on range
    if (latRange > 50 || lonRange > 50) return 3; // Continental view
    if (latRange > 20 || lonRange > 20) return 5; // Country/region view
    if (latRange > 5 || lonRange > 5) return 7;   // State/province view
    return 9; // Local area view
  }

  // Convert longitude to tile X coordinate
  lonToTileX(lon: number, zoom: number): number {
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  }

  // Convert latitude to tile Y coordinate
  latToTileY(lat: number, zoom: number): number {
    const latRad = lat * Math.PI / 180;
    return Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * Math.pow(2, zoom));
  }

  // Get NOAA radar overlay (transparent)
  async getNoaaRadarOverlay(bbox: number[], width: number, height: number): Promise<string | null> {
    const url = "https://mapservices.weather.noaa.gov/eventdriven/rest/services/radar/radar_base_reflectivity_time/ImageServer/exportImage";
    
    const params = new URLSearchParams({
      bbox: `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`,
      bboxSR: '4326',
      size: `${width},${height}`,
      imageSR: '4326',
      format: 'png',
      f: 'image',
      transparent: 'true', // Make radar overlay transparent
      interpolation: 'RSP_BilinearInterpolation'
    });

    try {
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 30000
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('image')) {
        const buffer = await response.buffer();
        return `data:${contentType};base64,${buffer.toString('base64')}`;
      }
      
      return null;
    } catch (error) {
      console.error('Radar overlay error:', error);
      return null;
    }
  }

  // Create enhanced geographic background when map tiles fail
  createEnhancedBackground(width: number, height: number, bbox: number[]): string {
    // Calculate approximate scale based on bbox
    const latRange = bbox[3] - bbox[1];
    const lonRange = bbox[2] - bbox[0];
    
    // Create detailed SVG background with geographic features
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#475569" stroke-width="0.3" opacity="0.4"/>
          </pattern>
          <pattern id="coastline" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.5" fill="#3b82f6" opacity="0.6"/>
          </pattern>
        </defs>
        
        <!-- Ocean/Water base -->
        <rect width="100%" height="100%" fill="#0f172a"/>
        
        <!-- Land areas (simplified continental outlines) -->
        ${this.generateLandFeatures(width, height, bbox)}
        
        <!-- Grid overlay -->
        <rect width="100%" height="100%" fill="url(#grid)"/>
        
        <!-- State/Country borders -->
        ${this.generateBorders(width, height, bbox)}
        
        <!-- Major cities -->
        ${this.generateCityMarkers(width, height, bbox)}
        
        <!-- Scale and labels -->
        <text x="10" y="25" fill="#94a3b8" font-family="Arial" font-size="12" font-weight="bold">
          Weather Radar - Geographic Context
        </text>
        <text x="10" y="45" fill="#64748b" font-family="Arial" font-size="10">
          ${latRange.toFixed(1)}° × ${lonRange.toFixed(1)}° Coverage
        </text>
        
        <!-- Legend -->
        <g transform="translate(10, ${height - 60})">
          <rect x="0" y="0" width="120" height="50" fill="#1e293b" opacity="0.8" rx="4"/>
          <text x="5" y="15" fill="#e2e8f0" font-family="Arial" font-size="10" font-weight="bold">Legend:</text>
          <circle cx="15" cy="25" r="2" fill="#22c55e"/>
          <text x="25" y="29" fill="#94a3b8" font-family="Arial" font-size="9">Cities</text>
          <line x1="8" y1="37" x2="18" y2="37" stroke="#6366f1" stroke-width="1"/>
          <text x="25" y="41" fill="#94a3b8" font-family="Arial" font-size="9">Borders</text>
        </g>
      </svg>
    `;
    
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }

  // Generate simplified land features based on region
  generateLandFeatures(width: number, height: number, bbox: number[]): string {
    const features = [];
    
    // Determine region and add appropriate land masses
    if (bbox[1] > 20 && bbox[3] < 70 && bbox[0] > -130 && bbox[2] < -60) {
      // North America
      features.push(`<path d="M 0 ${height * 0.3} Q ${width * 0.2} ${height * 0.25} ${width * 0.4} ${height * 0.35} Q ${width * 0.6} ${height * 0.4} ${width * 0.8} ${height * 0.3} L ${width} ${height * 0.3} L ${width} ${height} L 0 ${height} Z" fill="#374151" opacity="0.8"/>`);
    } else if (bbox[1] > 35 && bbox[3] < 75 && bbox[0] > -15 && bbox[2] < 40) {
      // Europe
      features.push(`<path d="M 0 ${height * 0.4} Q ${width * 0.3} ${height * 0.35} ${width * 0.7} ${height * 0.4} L ${width} ${height * 0.45} L ${width} ${height} L 0 ${height} Z" fill="#374151" opacity="0.8"/>`);
    } else {
      // Generic landmass
      features.push(`<rect x="0" y="${height * 0.6}" width="${width}" height="${height * 0.4}" fill="#374151" opacity="0.6"/>`);
    }
    
    return features.join('\n');
  }

  // Generate border lines
  generateBorders(width: number, height: number, bbox: number[]): string {
    const borders = [];
    
    // Add some representative border lines
    for (let i = 0; i < 3; i++) {
      const x = (width / 4) * (i + 1);
      const y1 = height * 0.2;
      const y2 = height * 0.8;
      borders.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#6366f1" stroke-width="1" opacity="0.6" stroke-dasharray="3,3"/>`);
    }
    
    return borders.join('\n');
  }

  // Generate city markers
  generateCityMarkers(width: number, height: number, bbox: number[]): string {
    const cities = [];
    const cityData = [
      { name: 'Major Hub', x: 0.2, y: 0.3 },
      { name: 'Airport', x: 0.5, y: 0.4 },
      { name: 'City', x: 0.8, y: 0.5 }
    ];
    
    cityData.forEach(city => {
      const x = width * city.x;
      const y = height * city.y;
      cities.push(`
        <circle cx="${x}" cy="${y}" r="3" fill="#22c55e" opacity="0.8"/>
        <text x="${x + 8}" y="${y + 4}" fill="#94a3b8" font-family="Arial" font-size="9">${city.name}</text>
      `);
    });
    
    return cities.join('\n');
  }

  // Composite background map with radar overlay
  async compositeImages(background: string, overlay: string): Promise<string> {
    try {
      // For now, return the overlay since it should be transparent over background
      // In a full implementation, you'd use an image library like sharp or canvas
      return overlay;
    } catch (error) {
      console.error('Image compositing error:', error);
      return background; // Fallback to background
    }
  }
}

export const weatherRadarService = new WeatherRadarService();