import { rateLimit } from 'express-rate-limit';
import { config } from './index';

// Create rate limiter with configuration
export const createRateLimiter = (options?: Partial<Parameters<typeof rateLimit>[0]>) => {
  return rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    ...options
  });
};

// Stricter rate limiting for sensitive endpoints
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many requests to this sensitive endpoint, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  }
});

// More permissive rate limiting for read-only endpoints
export const readOnlyRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
});

// Default rate limiter
export const defaultRateLimiter = createRateLimiter();

export default defaultRateLimiter;
