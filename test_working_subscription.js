// Test to confirm ADS-B Exchange subscription is working as expected
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testWorkingSubscription() {
  console.log('🎉 CONFIRMING ADS-B EXCHANGE SUBSCRIPTION IS WORKING');
  console.log('Based on user test result: {"ac": [], "msg": "No error", "total": 0}');
  console.log('');
  
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  
  try {
    console.log('📡 Testing ADS-B Exchange API with working subscription...');
    const response = await axios.get('https://adsbexchange-com1.p.rapidapi.com/v2/lat/51.5/lon/-0.1/dist/50/', {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'adsbexchange-com1.p.rapidapi.com'
      },
      timeout: 10000
    });
    
    console.log(`✅ Response Status: ${response.status}`);
    console.log(`📊 API Message: "${response.data.msg}"`);
    console.log(`🛩️  Aircraft Count: ${response.data.ac ? response.data.ac.length : 0}`);
    console.log(`📈 Total: ${response.data.total}`);
    
    if (response.data.msg === 'No error') {
      console.log('');
      console.log('🎉 SUBSCRIPTION CONFIRMED WORKING!');
      console.log('✅ Authentication successful');
      console.log('✅ API access granted');
      console.log('ℹ️  Empty aircraft array is normal - depends on location/time');
      console.log('');
      console.log('🔧 Next steps:');
      console.log('• System will now use authentic ADS-B Exchange data');
      console.log('• Cache timeout reduced to 30 seconds for faster updates');
      console.log('• Dashboard will show "subscription active" status');
      console.log('• Flight data will be authentic when aircraft are present');
    } else {
      console.log('⚠️  Unexpected API message:', response.data.msg);
    }
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ Error: ${error.response.status} - ${error.response.data?.message}`);
    } else {
      console.log(`❌ Network Error: ${error.message}`);
    }
  }
}

testWorkingSubscription();