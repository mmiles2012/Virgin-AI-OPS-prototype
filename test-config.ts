// Simple test to validate our configuration system
import { config, hasApiKey, logConfig } from './server/config/index';

console.log('🧪 Testing AINO Configuration System...\n');

// Test 1: Basic configuration loading
console.log('✅ Configuration loaded successfully');
console.log(`   NODE_ENV: ${config.NODE_ENV}`);
console.log(`   PORT: ${config.PORT}`);
console.log(`   HOST: ${config.HOST}`);

// Test 2: API key detection
console.log('\n🔑 API Key Status:');
const apiKeys = [
  'FLIGHTAWARE_API_KEY',
  'RAPIDAPI_KEY',
  'OPENAI_API_KEY',
  'AVIATIONSTACK_API_KEY',
  'NEWS_API_KEY',
  'AVWX_API_KEY',
  'FAA_NOTAM_API_KEY'
] as const;

apiKeys.forEach(key => {
  const status = hasApiKey(key) ? '✅ Configured' : '❌ Missing';
  console.log(`   ${key}: ${status}`);
});

// Test 3: Security configuration
console.log('\n🔒 Security Configuration:');
console.log(`   Session Secret: ${config.SESSION_SECRET !== 'your-development-secret-key' ? '✅ Custom' : '⚠️ Default'}`);
console.log(`   JWT Secret: ${config.JWT_SECRET !== 'your-development-jwt-secret' ? '✅ Custom' : '⚠️ Default'}`);

// Test 4: Rate limiting configuration
console.log('\n⏱️ Rate Limiting:');
console.log(`   Window: ${config.RATE_LIMIT_WINDOW_MS / 1000}s`);
console.log(`   Max Requests: ${config.RATE_LIMIT_MAX_REQUESTS}`);

// Test 5: Cache configuration
console.log('\n📦 Cache Configuration:');
console.log(`   TTL: ${config.CACHE_TTL_SECONDS}s`);

// Test 6: ML configuration
console.log('\n🤖 ML Configuration:');
console.log(`   Model Path: ${config.ML_MODEL_PATH}`);
console.log(`   Timeout: ${config.ML_PREDICTION_TIMEOUT_MS}ms`);

console.log('\n🎉 Configuration system test completed successfully!');
console.log('\nTo use custom values, create a .env file based on .env.example');
