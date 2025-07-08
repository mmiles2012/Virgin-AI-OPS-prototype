// Debug API key configuration
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Debugging API Key Configuration');
console.log('');

const rapidApiKey = process.env.RAPIDAPI_KEY;

if (rapidApiKey) {
  console.log(`✅ RAPIDAPI_KEY found in environment`);
  console.log(`📱 Key starts with: ${rapidApiKey.substring(0, 12)}...`);
  console.log(`📏 Key length: ${rapidApiKey.length} characters`);
  console.log(`🎯 Key ends with: ...${rapidApiKey.substring(rapidApiKey.length - 8)}`);
} else {
  console.log('❌ RAPIDAPI_KEY not found in environment variables');
}

console.log('');
console.log('💡 Note: When you tested successfully on RapidAPI website, the result was:');
console.log('{"ac": [], "msg": "No error", "total": 0}');
console.log('');
console.log('🔧 This confirms subscription is active on RapidAPI side.');
console.log('🔧 If our server tests still fail, it may be:');
console.log('   • Different API key being used');
console.log('   • Server environment variable not updated');
console.log('   • Need to restart server after key update');