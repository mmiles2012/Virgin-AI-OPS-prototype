// Test fresh ADS-B Exchange connection with correct key
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testFreshConnection() {
  console.log('🚀 Testing ADS-B Exchange with updated RAPIDAPI_KEY...');
  
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  console.log(`📱 Using key: ${rapidApiKey?.substring(0, 12)}...${rapidApiKey?.substring(rapidApiKey.length - 8)}`);
  
  try {
    // Test with the exact same endpoint that worked for user
    const response = await axios.get('https://adsbexchange-com1.p.rapidapi.com/v2/lat/51.5/lon/-0.1/dist/50/', {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'adsbexchange-com1.p.rapidapi.com'
      },
      timeout: 10000
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📨 Message: "${response.data.msg}"`);
    console.log(`✈️  Aircraft: ${response.data.ac?.length || 0}`);
    console.log(`📊 Total: ${response.data.total}`);
    
    if (response.data.msg === 'No error') {
      console.log('\n🎉 SUCCESS! ADS-B Exchange subscription confirmed working!');
      console.log('✅ Authentication successful');
      console.log('✅ API access granted');
      console.log('📡 Ready for authentic flight data integration');
    }
    
  } catch (error) {
    if (error.response?.status === 403) {
      console.log(`❌ Still getting 403: ${error.response.data?.message}`);
      console.log('🔧 May need server restart to pick up new environment variable');
    } else {
      console.log(`❌ Error: ${error.response?.status || error.message}`);
    }
  }
}

testFreshConnection();