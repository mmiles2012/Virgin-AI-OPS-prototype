// Test ADS-B Exchange API Health and Subscription Status
import axios from 'axios';

async function testADSBHealth() {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  
  if (!rapidApiKey) {
    console.error('❌ RAPIDAPI_KEY not found in environment');
    return;
  }
  
  console.log('🔍 Testing ADS-B Exchange API subscription status...');
  
  try {
    const response = await axios.get('https://adsbexchange-com1.p.rapidapi.com/v2/lat/51.5/lon/-0.1/dist/50/', {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'adsbexchange-com1.p.rapidapi.com'
      },
      timeout: 10000
    });
    
    console.log('✅ ADS-B Exchange API Response Status:', response.status);
    console.log('📊 Data received:', {
      hasAircraftData: !!response.data.ac,
      totalAircraft: response.data.ac ? response.data.ac.length : 0,
      responseSize: JSON.stringify(response.data).length + ' bytes'
    });
    
    if (response.data.ac && response.data.ac.length > 0) {
      console.log('🛩️  Sample aircraft data:', {
        icao24: response.data.ac[0].hex,
        callsign: response.data.ac[0].flight,
        altitude: response.data.ac[0].alt_baro,
        position: response.data.ac[0].lat && response.data.ac[0].lon ? 'available' : 'unavailable'
      });
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.data);
      
      if (error.response.status === 403) {
        console.log('🔒 Subscription issue detected');
      } else if (error.response.status === 429) {
        console.log('⏱️  Rate limit reached');
      }
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

testADSBHealth();