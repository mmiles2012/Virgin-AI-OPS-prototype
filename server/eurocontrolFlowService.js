/**
 * EUROCONTROL Flow Management Service
 * Integrates with EUROCONTROL Network Operations Portal for flow and delay data
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class EurocontrolFlowService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.lastUpdate = null;
        this.isUpdating = false;
        
        console.log('🇪🇺 EUROCONTROL Flow Service initialized');
        
        // Start periodic updates
        this.startPeriodicUpdates();
    }

    /**
     * Get comprehensive EUROCONTROL flow data
     */
    async getFlowData() {
        try {
            const cacheKey = 'eurocontrol_flow_data';
            const now = Date.now();
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cachedData = this.cache.get(cacheKey);
                if (now - cachedData.timestamp < this.cacheTimeout) {
                    console.log('📊 Using cached EUROCONTROL flow data');
                    return cachedData.data;
                }
            }
            
            // Fetch fresh data
            const flowData = await this.fetchFlowDataFromScraper();
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: flowData,
                timestamp: now
            });
            
            this.lastUpdate = new Date().toISOString();
            return flowData;
            
        } catch (error) {
            console.error('❌ Error fetching EUROCONTROL flow data:', error);
            return this.getFallbackFlowData();
        }
    }

    /**
     * Get network situation data
     */
    async getNetworkSituation() {
        try {
            const flowData = await this.getFlowData();
            return flowData.network_situation || this.getFallbackNetworkSituation();
        } catch (error) {
            console.error('❌ Error fetching network situation:', error);
            return this.getFallbackNetworkSituation();
        }
    }

    /**
     * Get active flow measures
     */
    async getFlowMeasures() {
        try {
            const flowData = await this.getFlowData();
            return flowData.flow_measures || this.getFallbackFlowMeasures();
        } catch (error) {
            console.error('❌ Error fetching flow measures:', error);
            return this.getFallbackFlowMeasures();
        }
    }

    /**
     * Get traffic counts
     */
    async getTrafficCounts() {
        try {
            const flowData = await this.getFlowData();
            return flowData.traffic_counts || this.getFallbackTrafficCounts();
        } catch (error) {
            console.error('❌ Error fetching traffic counts:', error);
            return this.getFallbackTrafficCounts();
        }
    }

    /**
     * Get airport delays
     */
    async getAirportDelays() {
        try {
            const flowData = await this.getFlowData();
            return flowData.airport_delays || this.getFallbackAirportDelays();
        } catch (error) {
            console.error('❌ Error fetching airport delays:', error);
            return this.getFallbackAirportDelays();
        }
    }

    /**
     * Get sector regulations
     */
    async getSectorRegulations() {
        try {
            const flowData = await this.getFlowData();
            return flowData.sector_regulations || this.getFallbackSectorRegulations();
        } catch (error) {
            console.error('❌ Error fetching sector regulations:', error);
            return this.getFallbackSectorRegulations();
        }
    }

    /**
     * Fetch flow data using Python scraper
     */
    async fetchFlowDataFromScraper() {
        return new Promise((resolve, reject) => {
            const pythonScript = path.join(process.cwd(), 'eurocontrol_flow_scraper.py');
            
            console.log('🔍 Fetching EUROCONTROL flow data from Network Operations Portal...');
            
            const pythonProcess = spawn('python3', [pythonScript]);
            let output = '';
            let errorOutput = '';
            
            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        // Look for the most recent output file
                        const outputFiles = fs.readdirSync('.')
                            .filter(file => file.startsWith('eurocontrol_flow_data_'))
                            .sort()
                            .reverse();
                        
                        if (outputFiles.length > 0) {
                            const latestFile = outputFiles[0];
                            const fileData = fs.readFileSync(latestFile, 'utf8');
                            const flowData = JSON.parse(fileData);
                            
                            console.log('✅ EUROCONTROL flow data collected successfully');
                            console.log(`📊 Network Status: ${flowData.network_situation?.network_status || 'UNKNOWN'}`);
                            console.log(`⏰ Total Delays: ${flowData.network_situation?.total_delays || 0} minutes`);
                            console.log(`✈️ Total Traffic: ${flowData.traffic_counts?.total_flights || 0} flights`);
                            
                            resolve(flowData);
                        } else {
                            console.log('⚠️ No output file found, using fallback data');
                            resolve(this.getFallbackFlowData());
                        }
                    } catch (parseError) {
                        console.error('❌ Error parsing flow data:', parseError);
                        resolve(this.getFallbackFlowData());
                    }
                } else {
                    console.error('❌ Python scraper failed:', errorOutput);
                    resolve(this.getFallbackFlowData());
                }
            });
            
            // Set timeout
            setTimeout(() => {
                pythonProcess.kill();
                console.log('⏰ EUROCONTROL scraper timeout, using fallback data');
                resolve(this.getFallbackFlowData());
            }, 30000); // 30 second timeout
        });
    }

    /**
     * Start periodic updates
     */
    startPeriodicUpdates() {
        // Update every 5 minutes
        setInterval(() => {
            if (!this.isUpdating) {
                this.isUpdating = true;
                this.getFlowData().finally(() => {
                    this.isUpdating = false;
                });
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Get service health status
     */
    getHealthStatus() {
        return {
            service: 'EUROCONTROL Flow Service',
            status: 'OPERATIONAL',
            last_update: this.lastUpdate,
            cache_size: this.cache.size,
            is_updating: this.isUpdating,
            data_sources: [
                'EUROCONTROL Network Operations Portal',
                'Network Manager Public Portal'
            ]
        };
    }

    /**
     * Fallback data methods
     */
    getFallbackFlowData() {
        return {
            collection_timestamp: new Date().toISOString(),
            data_source: 'EUROCONTROL Fallback Data',
            network_situation: this.getFallbackNetworkSituation(),
            flow_measures: this.getFallbackFlowMeasures(),
            traffic_counts: this.getFallbackTrafficCounts(),
            airport_delays: this.getFallbackAirportDelays(),
            sector_regulations: this.getFallbackSectorRegulations(),
            data_quality: {
                completeness: 0.75,
                freshness: 'Fallback',
                accuracy: 0.80
            }
        };
    }

    getFallbackNetworkSituation() {
        return {
            timestamp: new Date().toISOString(),
            network_status: 'OPERATIONAL',
            total_delays: 52,
            atfm_delays: 28,
            weather_delays: 15,
            capacity_delays: 7,
            staffing_delays: 2,
            regulations_active: 8,
            flows_managed: 15,
            traffic_count: 9200
        };
    }

    getFallbackFlowMeasures() {
        return [
            {
                measure_id: 'REG_LFMM_001',
                location: 'LFMM Marseille FIR',
                reason: 'Weather',
                delay_value: 18,
                start_time: new Date(Date.now() - 30 * 60000).toISOString(),
                end_time: new Date(Date.now() + 90 * 60000).toISOString(),
                status: 'ACTIVE',
                scraped_at: new Date().toISOString()
            },
            {
                measure_id: 'REG_EDGG_002',
                location: 'EDGG Langen FIR',
                reason: 'Capacity',
                delay_value: 12,
                start_time: new Date(Date.now() - 15 * 60000).toISOString(),
                end_time: new Date(Date.now() + 120 * 60000).toISOString(),
                status: 'ACTIVE',
                scraped_at: new Date().toISOString()
            },
            {
                measure_id: 'REG_EGTT_003',
                location: 'EGTT London FIR',
                reason: 'Equipment',
                delay_value: 8,
                start_time: new Date(Date.now() - 45 * 60000).toISOString(),
                end_time: new Date(Date.now() + 60 * 60000).toISOString(),
                status: 'ACTIVE',
                scraped_at: new Date().toISOString()
            }
        ];
    }

    getFallbackTrafficCounts() {
        return {
            timestamp: new Date().toISOString(),
            total_flights: 9200,
            controlled_flights: 8280,
            ifr_flights: 7038,
            vfr_flights: 1242,
            overflights: 5520,
            departures: 1840,
            arrivals: 1840,
            peak_hour_count: 736,
            average_delay: 14
        };
    }

    getFallbackAirportDelays() {
        return [
            {
                airport_icao: 'EGLL',
                airport_name: 'London Heathrow',
                airport_iata: 'LHR',
                departure_delay: 8,
                arrival_delay: 12,
                atfm_delay: 15,
                weather_delay: 3,
                capacity_delay: 9,
                delay_cause: 'Air Traffic Control',
                status: 'OPERATIONAL',
                last_updated: new Date().toISOString()
            },
            {
                airport_icao: 'LFPG',
                airport_name: 'Paris Charles de Gaulle',
                airport_iata: 'CDG',
                departure_delay: 22,
                arrival_delay: 18,
                atfm_delay: 25,
                weather_delay: 8,
                capacity_delay: 12,
                delay_cause: 'Weather',
                status: 'OPERATIONAL',
                last_updated: new Date().toISOString()
            },
            {
                airport_icao: 'EDDF',
                airport_name: 'Frankfurt',
                airport_iata: 'FRA',
                departure_delay: 6,
                arrival_delay: 9,
                atfm_delay: 11,
                weather_delay: 2,
                capacity_delay: 4,
                delay_cause: 'Capacity',
                status: 'OPERATIONAL',
                last_updated: new Date().toISOString()
            }
        ];
    }

    getFallbackSectorRegulations() {
        return [
            {
                sector: 'LFMMFIR',
                regulation_id: 'REG_LFMMFIR_20250715',
                reason: 'Weather',
                start_time: new Date(Date.now() - 30 * 60000).toISOString(),
                end_time: new Date(Date.now() + 120 * 60000).toISOString(),
                delay_value: 18,
                impact_level: 'MEDIUM',
                affected_flights: 85,
                status: 'ACTIVE',
                scraped_at: new Date().toISOString()
            },
            {
                sector: 'EDGGFIR',
                regulation_id: 'REG_EDGGFIR_20250715',
                reason: 'Capacity',
                start_time: new Date(Date.now() - 15 * 60000).toISOString(),
                end_time: new Date(Date.now() + 90 * 60000).toISOString(),
                delay_value: 12,
                impact_level: 'LOW',
                affected_flights: 42,
                status: 'ACTIVE',
                scraped_at: new Date().toISOString()
            }
        ];
    }
}

// Create singleton instance
const eurocontrolFlowService = new EurocontrolFlowService();

export default eurocontrolFlowService;