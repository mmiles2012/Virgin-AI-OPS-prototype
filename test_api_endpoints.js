// Quick test to verify API endpoints are working
import axios from 'axios';

async function testEndpoints() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Testing SIGMET/Airspace Alerts endpoint...');
  try {
    const sigmetResponse = await axios.get(`${baseUrl}/api/aviation/airspace-alerts`);
    console.log('✅ SIGMET endpoint working:', sigmetResponse.data.success);
    console.log('  - Alert count:', sigmetResponse.data.count);
    console.log('  - Data sources:', sigmetResponse.data.data_sources);
  } catch (error) {
    console.log('❌ SIGMET endpoint failed:', error.message);
  }
  
  console.log('\nTesting Weather Radar endpoint...');
  try {
    const radarResponse = await axios.get(`${baseUrl}/api/weather/radar?source=smart&lat=51.47&lng=-0.46`);
    console.log('✅ Weather radar endpoint working:', radarResponse.data.success);
    console.log('  - Image URL available:', !!radarResponse.data.imageUrl);
  } catch (error) {
    console.log('❌ Weather radar endpoint failed:', error.message);
  }
}

testEndpoints();