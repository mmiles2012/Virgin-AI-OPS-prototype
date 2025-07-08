// Check ADS-B Exchange subscription status with comprehensive testing
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function checkSubscriptionStatus() {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  
  if (!rapidApiKey) {
    console.error('❌ RAPIDAPI_KEY not found in environment variables');
    return;
  }
  
  console.log('🔍 Checking ADS-B Exchange subscription status...');
  console.log(`📱 Using RapidAPI Key: ${rapidApiKey.substring(0, 12)}...`);
  
  // Test multiple endpoints to check subscription status
  const testUrls = [
    'https://adsbexchange-com1.p.rapidapi.com/v2/lat/51.5/lon/-0.1/dist/25/',  // London
    'https://adsbexchange-com1.p.rapidapi.com/v2/lat/40.7/lon/-74.0/dist/25/', // NYC
    'https://adsbexchange-com1.p.rapidapi.com/v2/lat/34.0/lon/-118.2/dist/25/' // LA
  ];
  
  for (let i = 0; i < testUrls.length; i++) {
    console.log(`\n📡 Test ${i + 1}/3: ${testUrls[i].includes('51.5') ? 'London' : testUrls[i].includes('40.7') ? 'NYC' : 'LA'}`);
    
    try {
      const response = await axios.get(testUrls[i], {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'adsbexchange-com1.p.rapidapi.com'
        },
        timeout: 15000
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Aircraft found: ${response.data.ac ? response.data.ac.length : 0}`);
      
      if (response.data.ac && response.data.ac.length > 0) {
        console.log(`🛩️  Sample flight: ${response.data.ac[0].flight || 'N/A'} at ${response.data.ac[0].alt_baro || 'unknown'}ft`);
        console.log('🎉 SUBSCRIPTION IS ACTIVE AND WORKING!');
        break; // Exit if we get successful data
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        
        if (error.response.status === 403) {
          if (error.response.data?.message === 'You are not subscribed to this API.') {
            console.log('🔒 Subscription required - please subscribe on RapidAPI.com');
          } else {
            console.log('🔑 Authentication issue - check API key');
          }
        } else if (error.response.status === 429) {
          console.log('⏱️  Rate limited - subscription is active but too many requests');
          console.log('🎉 SUBSCRIPTION IS ACTIVE (rate limited)!');
          break;
        }
      } else {
        console.log(`❌ Network error: ${error.message}`);
      }
    }
    
    // Add delay between requests
    if (i < testUrls.length - 1) {
      console.log('⏳ Waiting 3 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('• If you see "403 - not subscribed": Visit https://rapidapi.com/adsbx/api/adsbexchange-com1');
  console.log('• If you see "429 - rate limited": Subscription is working, just reduce request frequency');
  console.log('• If you see aircraft data: Subscription is fully active!');
}

checkSubscriptionStatus().catch(console.error);