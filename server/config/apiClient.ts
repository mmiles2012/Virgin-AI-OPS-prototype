import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { config, hasApiKey } from './index';
import { memoryCache, cacheOrFetch } from './cache';

// Base API client configuration
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

interface ApiClientOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retryAttempts?: number;
  retryDelay?: number;
  enableCaching?: boolean;
  cacheTTL?: number;
}

interface ApiError extends Error {
  status?: number;
  response?: any;
  isRetryable?: boolean;
}

class ApiClient {
  private client: AxiosInstance;
  private options: ApiClientOptions;

  constructor(options: ApiClientOptions = {}) {
    this.options = {
      timeout: DEFAULT_TIMEOUT,
      retryAttempts: DEFAULT_RETRY_ATTEMPTS,
      retryDelay: DEFAULT_RETRY_DELAY,
      enableCaching: true,
      cacheTTL: config.CACHE_TTL_SECONDS,
      ...options
    };

    this.client = axios.create({
      baseURL: this.options.baseURL,
      timeout: this.options.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AINO-Aviation-Intelligence/1.0',
        ...this.options.headers
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and retry
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        if (this.shouldRetry(error) && !originalRequest._retry) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          
          if (originalRequest._retryCount <= (this.options.retryAttempts || DEFAULT_RETRY_ATTEMPTS)) {
            console.log(`🔄 Retrying API request (${originalRequest._retryCount}/${this.options.retryAttempts}): ${originalRequest.url}`);
            
            await this.delay(this.options.retryDelay || DEFAULT_RETRY_DELAY);
            return this.client(originalRequest);
          }
        }
        
        console.error(`❌ API Error: ${error.response?.status || 'Network'} ${error.config?.url}`);
        return Promise.reject(this.createApiError(error));
      }
    );
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx server errors
    if (!error.response) return true; // Network error
    if (error.response.status >= 500) return true; // Server error
    if (error.response.status === 429) return true; // Rate limited
    
    return false;
  }

  private createApiError(error: any): ApiError {
    const apiError: ApiError = new Error(
      error.response?.data?.message || 
      error.message || 
      'Unknown API error'
    );
    
    apiError.status = error.response?.status;
    apiError.response = error.response?.data;
    apiError.isRetryable = this.shouldRetry(error);
    
    return apiError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generic request method with caching support
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const cacheKey = this.generateCacheKey(config);
    
    if (this.options.enableCaching && config.method?.toLowerCase() === 'get') {
      return cacheOrFetch(
        cacheKey,
        async () => {
          const response = await this.client.request<T>(config);
          return response.data;
        },
        this.options.cacheTTL
      );
    }
    
    const response = await this.client.request<T>(config);
    return response.data;
  }

  // Convenience methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  private generateCacheKey(config: AxiosRequestConfig): string {
    const { method, url, params, data } = config;
    const keyParts = [method, url];
    
    if (params) keyParts.push(JSON.stringify(params));
    if (data && method?.toLowerCase() === 'get') keyParts.push(JSON.stringify(data));
    
    return `api:${keyParts.join(':')}`;
  }
}

// Pre-configured API clients for different services
export const flightAwareClient = new ApiClient({
  baseURL: 'https://aeroapi.flightaware.com/aeroapi',
  headers: hasApiKey('FLIGHTAWARE_API_KEY') ? {
    'x-apikey': config.FLIGHTAWARE_API_KEY!
  } : {},
  timeout: 15000
});

export const aviationStackClient = new ApiClient({
  baseURL: 'http://api.aviationstack.com/v1',
  headers: hasApiKey('AVIATIONSTACK_API_KEY') ? {
    'access_key': config.AVIATIONSTACK_API_KEY!
  } : {},
  timeout: 10000
});

export const openAiClient = new ApiClient({
  baseURL: 'https://api.openai.com/v1',
  headers: hasApiKey('OPENAI_API_KEY') ? {
    'Authorization': `Bearer ${config.OPENAI_API_KEY!}`
  } : {},
  timeout: 30000,
  enableCaching: false // Don't cache AI responses
});

export const weatherClient = new ApiClient({
  baseURL: 'https://avwx.rest/api',
  headers: hasApiKey('AVWX_API_KEY') ? {
    'Authorization': `Bearer ${config.AVWX_API_KEY!}`
  } : {},
  timeout: 8000,
  cacheTTL: 600 // 10 minutes cache for weather data
});

export const newsClient = new ApiClient({
  baseURL: 'https://newsapi.org/v2',
  headers: hasApiKey('NEWS_API_KEY') ? {
    'X-API-Key': config.NEWS_API_KEY!
  } : {},
  timeout: 10000,
  cacheTTL: 1800 // 30 minutes cache for news
});

// Internal service clients
export const visaServiceClient = new ApiClient({
  baseURL: config.VISA_SERVICE_URL,
  timeout: 5000
});

export const aviationNewsServiceClient = new ApiClient({
  baseURL: config.AVIATION_NEWS_SERVICE_URL,
  timeout: 5000
});

// Health check for all API clients
export const checkApiHealth = async (): Promise<Record<string, boolean>> => {
  const services = {
    flightaware: hasApiKey('FLIGHTAWARE_API_KEY'),
    aviationstack: hasApiKey('AVIATIONSTACK_API_KEY'),
    openai: hasApiKey('OPENAI_API_KEY'),
    weather: hasApiKey('AVWX_API_KEY'),
    news: hasApiKey('NEWS_API_KEY'),
    visa_service: true,
    aviation_news_service: true
  };

  const health: Record<string, boolean> = {};
  
  for (const [service, hasCredentials] of Object.entries(services)) {
    health[service] = hasCredentials;
  }

  return health;
};

export { ApiClient };
export default ApiClient;
