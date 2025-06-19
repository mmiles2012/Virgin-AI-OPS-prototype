import { FlightData } from './aviationApiService';

interface CachedFlightData {
  data: FlightData[];
  timestamp: number;
  source: string;
}

interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  lastApiCall: number;
  apiCallsToday: number;
}

export class FlightDataCache {
  private cache: Map<string, CachedFlightData> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private stats: CacheStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastApiCall: 0,
    apiCallsToday: 0
  };

  constructor() {
    // Reset daily API call counter at midnight
    this.scheduleDailyReset();
  }

  private scheduleDailyReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.stats.apiCallsToday = 0;
      this.scheduleDailyReset(); // Schedule next reset
    }, msUntilMidnight);
  }

  private generateCacheKey(airline: string, params?: any): string {
    const baseKey = `flights_${airline}`;
    if (params) {
      const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}:${params[key]}`)
        .join('_');
      return `${baseKey}_${sortedParams}`;
    }
    return baseKey;
  }

  private isDataFresh(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private evictOldEntries() {
    if (this.cache.size <= this.MAX_CACHE_SIZE) return;

    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25% of entries
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  get(airline: string, params?: any): FlightData[] | null {
    this.stats.totalRequests++;
    
    const key = this.generateCacheKey(airline, params);
    const cached = this.cache.get(key);
    
    if (cached && this.isDataFresh(cached.timestamp)) {
      this.stats.cacheHits++;
      console.log(`Cache hit for ${airline} flights (${cached.data.length} flights, age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
      return cached.data;
    }
    
    this.stats.cacheMisses++;
    return null;
  }

  set(airline: string, data: FlightData[], source: string, params?: any): void {
    const key = this.generateCacheKey(airline, params);
    
    this.cache.set(key, {
      data: [...data], // Create a copy to avoid mutations
      timestamp: Date.now(),
      source
    });
    
    this.stats.lastApiCall = Date.now();
    this.stats.apiCallsToday++;
    
    this.evictOldEntries();
    
    console.log(`Cached ${data.length} ${airline} flights from ${source}`);
  }

  getStats(): CacheStats & { cacheSize: number; hitRate: number } {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.cacheHits / this.stats.totalRequests) * 100 
      : 0;
    
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  clear(): void {
    this.cache.clear();
    console.log('Flight data cache cleared');
  }

  getLastValidData(airline: string, params?: any): FlightData[] | null {
    const key = this.generateCacheKey(airline, params);
    const cached = this.cache.get(key);
    
    if (cached) {
      const ageMinutes = Math.round((Date.now() - cached.timestamp) / (1000 * 60));
      console.log(`Returning stale data for ${airline} (${ageMinutes} minutes old)`);
      return cached.data;
    }
    
    return null;
  }

  // Enhanced Virgin Atlantic specific methods
  getVirginAtlanticFlights(): FlightData[] | null {
    return this.get('virgin_atlantic');
  }

  setVirginAtlanticFlights(data: FlightData[], source: string): void {
    this.set('virgin_atlantic', data, source);
  }

  getLastVirginAtlanticData(): FlightData[] | null {
    return this.getLastValidData('virgin_atlantic');
  }
}

// Global cache instance
export const flightDataCache = new FlightDataCache();