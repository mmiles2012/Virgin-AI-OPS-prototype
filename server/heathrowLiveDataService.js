/**
 * Heathrow Live Data Service for AINO Platform
 * Integrates with existing live_flight_board_scraper.py for authentic data
 */

import { spawn } from 'child_process';
import { join } from 'path';

class HeathrowLiveDataService {
  constructor() {
    this.lastUpdate = null;
    this.cachedData = null;
    this.updateInterval = 5 * 60 * 1000; // 5 minutes cache
  }

  async getHeathrowData() {
    // Check cache validity
    if (this.cachedData && this.lastUpdate && 
        (Date.now() - this.lastUpdate.getTime()) < this.updateInterval) {
      return this.cachedData;
    }

    try {
      console.log('Fetching fresh Heathrow arrival/departure data...');
      
      // Execute Python scraper
      const scraperPath = join(process.cwd(), 'live_flight_board_scraper.py');
      const pythonProcess = spawn('python3', ['-c', `
import sys
sys.path.append('${process.cwd()}')
from live_flight_board_scraper import LiveFlightBoardScraper
import json

try:
    scraper = LiveFlightBoardScraper()
    # Focus on LHR data only for performance
    lhr_data = scraper.scrape_lhr_arrivals()
    
    if not lhr_data.empty:
        # Convert to JSON
        result = {
            "success": True,
            "airport": "LHR",
            "flights": lhr_data.to_dict('records'),
            "total_flights": len(lhr_data),
            "virgin_atlantic_flights": len(lhr_data[lhr_data['IsVirginAtlantic'] == True]) if 'IsVirginAtlantic' in lhr_data.columns else 0,
            "scraped_at": lhr_data.iloc[0]['ScrapeTimeUTC'] if 'ScrapeTimeUTC' in lhr_data.columns else None
        }
    else:
        result = {
            "success": False,
            "error": "No flight data retrieved",
            "airport": "LHR",
            "flights": [],
            "total_flights": 0,
            "virgin_atlantic_flights": 0
        }
    
    print(json.dumps(result))
    
except Exception as e:
    error_result = {
        "success": False,
        "error": str(e),
        "airport": "LHR",
        "flights": [],
        "total_flights": 0,
        "virgin_atlantic_flights": 0
    }
    print(json.dumps(error_result))
`]);

      return new Promise((resolve, reject) => {
        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
          try {
            if (code === 0 && output.trim()) {
              const result = JSON.parse(output.trim());
              
              if (result.success) {
                this.cachedData = result;
                this.lastUpdate = new Date();
                console.log(`✅ Heathrow data updated: ${result.total_flights} total flights, ${result.virgin_atlantic_flights} Virgin Atlantic`);
              }
              
              resolve(result);
            } else {
              console.error(`Heathrow scraper failed with code ${code}:`, errorOutput);
              resolve({
                success: false,
                error: `Scraper exit code: ${code}`,
                airport: "LHR",
                flights: [],
                total_flights: 0,
                virgin_atlantic_flights: 0
              });
            }
          } catch (parseError) {
            console.error('Failed to parse Heathrow scraper output:', parseError);
            resolve({
              success: false,
              error: "Failed to parse scraper output",
              airport: "LHR", 
              flights: [],
              total_flights: 0,
              virgin_atlantic_flights: 0
            });
          }
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          pythonProcess.kill();
          reject(new Error('Heathrow scraper timeout'));
        }, 30000);
      });

    } catch (error) {
      console.error('Heathrow scraper execution error:', error);
      return {
        success: false,
        error: error.message,
        airport: "LHR",
        flights: [],
        total_flights: 0,
        virgin_atlantic_flights: 0
      };
    }
  }

  calculateNetworkHealth(flightData) {
    if (!flightData.success || !flightData.flights.length) {
      return {
        onTimePerformance: 95, // Default when no data
        delays: 0,
        cancellations: 0,
        diversions: 0
      };
    }

    const flights = flightData.flights;
    const totalFlights = flights.length;
    
    // Calculate delays (flights with DelayMinutes > 15)
    const delayedFlights = flights.filter(f => 
      f.DelayMinutes && f.DelayMinutes > 15
    ).length;
    
    // Calculate cancellations
    const cancelledFlights = flights.filter(f => 
      f.Status && f.Status.toLowerCase().includes('cancel')
    ).length;
    
    // Calculate diversions
    const divertedFlights = flights.filter(f => 
      f.Status && f.Status.toLowerCase().includes('divert')
    ).length;
    
    // Calculate on-time performance
    const onTimeFlights = totalFlights - delayedFlights - cancelledFlights;
    const onTimePerformance = totalFlights > 0 ? 
      Math.round((onTimeFlights / totalFlights) * 100) : 95;

    return {
      onTimePerformance,
      delays: delayedFlights,
      cancellations: cancelledFlights,
      diversions: divertedFlights,
      totalFlights,
      virginAtlanticFlights: flightData.virgin_atlantic_flights
    };
  }
}

const heathrowLiveDataService = new HeathrowLiveDataService();
export default heathrowLiveDataService;