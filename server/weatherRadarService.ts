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

  // Get background map tiles
  async getBackgroundMap(bbox: number[], width: number, height: number): Promise<string | null> {
    try {
      // Use OpenStreetMap tile server for background
      const osmUrl = "https://tile.openstreetmap.org/carto/light_all/{z}/{x}/{y}.png";
      
      // For simplicity, use a static tile approach or NOAA's basemap
      const noaaBaseUrl = "https://mapservices.weather.noaa.gov/vector/rest/services/basemaps/NOAA_basemap/MapServer/export";
      
      const params = new URLSearchParams({
        bbox: `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`,
        bboxSR: '4326',
        size: `${width},${height}`,
        imageSR: '4326',
        format: 'png',
        f: 'image',
        layers: 'show:0,1,2,3,4', // Show geographic features
        transparent: 'false'
      });

      const response = await fetch(`${noaaBaseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 30000
      });

      if (!response.ok) {
        console.log('NOAA basemap failed, using simplified background');
        return this.createSimpleBackground(width, height);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('image')) {
        const buffer = await response.buffer();
        return `data:${contentType};base64,${buffer.toString('base64')}`;
      }
      
      return this.createSimpleBackground(width, height);
    } catch (error) {
      console.error('Background map error:', error);
      return this.createSimpleBackground(width, height);
    }
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

  // Create simple colored background when map tiles fail
  createSimpleBackground(width: number, height: number): string {
    // Create a simple SVG background with geographic context
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#334155" stroke-width="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#1e293b"/>
        <rect width="100%" height="100%" fill="url(#grid)"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="14">
          Weather Radar Background
        </text>
        <text x="50%" y="60%" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">
          Geographic context loading...
        </text>
      </svg>
    `;
    
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
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