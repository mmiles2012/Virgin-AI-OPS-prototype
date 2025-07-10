
import fs from 'fs';
import path from 'path';

console.log('🔍 Validating .env file...\n');

// Check if .env file exists
const envPath = '.env';
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found');
  process.exit(1);
}

// Read and parse .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

console.log('📄 .env file contents:');
console.log('='.repeat(50));

const envVars = {};
const issues = [];

lines.forEach((line, index) => {
  const lineNumber = index + 1;
  const trimmedLine = line.trim();
  
  // Skip empty lines and comments
  if (!trimmedLine || trimmedLine.startsWith('#')) {
    return;
  }
  
  // Check for proper format
  if (!trimmedLine.includes('=')) {
    issues.push(`Line ${lineNumber}: Missing '=' separator`);
    return;
  }
  
  const [key, ...valueParts] = trimmedLine.split('=');
  const value = valueParts.join('=');
  
  if (!key.trim()) {
    issues.push(`Line ${lineNumber}: Empty key`);
    return;
  }
  
  if (value.includes(' ') && !value.startsWith('"') && !value.endsWith('"')) {
    issues.push(`Line ${lineNumber}: Value contains spaces but is not quoted`);
  }
  
  envVars[key.trim()] = value.trim();
  console.log(`${key.trim()}: ${value.trim() ? 'SET' : 'EMPTY'}`);
});

console.log('='.repeat(50));

if (issues.length > 0) {
  console.log('\n⚠️  Issues found:');
  issues.forEach(issue => console.log(`  • ${issue}`));
}

// Check for required API keys
const requiredKeys = [
  'FLIGHTAWARE_API_KEY',
  'RAPIDAPI_KEY',
  'OPENAI_API_KEY',
  'AVIATIONSTACK_API_KEY',
  'NEWS_API_KEY',
  'AVWX_API_KEY',
  'FAA_NOTAM_API_KEY'
];

console.log('\n🔑 Required API Keys Status:');
requiredKeys.forEach(key => {
  const status = envVars[key] ? '✅ Present' : '❌ Missing';
  console.log(`  ${key}: ${status}`);
});

console.log('\n✅ Validation complete');
