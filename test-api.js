// Test Aviation Stack API connection
const testApiKey = async () => {
  const apiKey = process.env.AVIATION_STACK_KEY;
  console.log('Testing API key format:', apiKey ? `${apiKey.substring(0, 8)}...` : 'undefined');
  
  const testUrl = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&limit=1`;
  
  try {
    const response = await fetch(testUrl);
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('API Error:', error.message);
  }
};

testApiKey();