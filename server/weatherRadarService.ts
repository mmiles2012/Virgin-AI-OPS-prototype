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
    
    const url = "https://mapservices.weather.noaa.gov/eventdriven/rest/services/radar/radar_base_reflectivity_time/ImageServer/exportImage";
    
    const params = new URLSearchParams({
      bbox: `${useBbox[0]},${useBbox[1]},${useBbox[2]},${useBbox[3]}`,
      bboxSR: '4326',
      size: `${width},${height}`,
      imageSR: '4326',
      format: 'png',
      f: 'image'
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
        const base64Image = `data:${contentType};base64,${buffer.toString('base64')}`;
        return base64Image;
      } else {
        console.error('No image data received from NOAA');
        return null;
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
}

export const weatherRadarService = new WeatherRadarService();