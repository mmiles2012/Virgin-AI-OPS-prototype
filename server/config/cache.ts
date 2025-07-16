import { config } from './index';

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds || config.CACHE_TTL_SECONDS;
    const expiresAt = Date.now() + (ttl * 1000);
    
    this.cache.set(key, {
      value,
      expiresAt
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Singleton cache instance
export const memoryCache = new MemoryCache();

// Cache middleware factory
export const cacheMiddleware = (keyGenerator: (req: any) => string, ttlSeconds?: number) => {
  return (req: any, res: any, next: any) => {
    const key = keyGenerator(req);
    const cached = memoryCache.get(key);
    
    if (cached) {
      return res.json(cached);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data: any) {
      memoryCache.set(key, data, ttlSeconds);
      return originalJson.call(this, data);
    };

    next();
  };
};

// Utility function for async cache-or-fetch pattern
export const cacheOrFetch = async <T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttlSeconds?: number
): Promise<T> => {
  const cached = memoryCache.get<T>(key);
  if (cached) {
    return cached;
  }

  const result = await fetchFunction();
  memoryCache.set(key, result, ttlSeconds);
  return result;
};

export default memoryCache;
