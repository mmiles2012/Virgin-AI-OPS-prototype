
import express from 'express';

const router = express.Router();

// Test endpoint for environment variables
router.get('/test-env', (req, res) => {
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV,
    env_file_loaded: process.env.FLIGHTAWARE_API_KEY ? true : false,
    api_keys: {
      FLIGHTAWARE_API_KEY: process.env.FLIGHTAWARE_API_KEY ? 'Present' : 'Missing',
      RAPIDAPI_KEY: process.env.RAPIDAPI_KEY ? 'Present' : 'Missing',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Present' : 'Missing',
      AVIATIONSTACK_API_KEY: process.env.AVIATIONSTACK_API_KEY ? 'Present' : 'Missing',
      NEWS_API_KEY: process.env.NEWS_API_KEY ? 'Present' : 'Missing',
      AVWX_API_KEY: process.env.AVWX_API_KEY ? 'Present' : 'Missing',
      FAA_NOTAM_API_KEY: process.env.FAA_NOTAM_API_KEY ? 'Present' : 'Missing',
      OPENSKY_USERNAME: process.env.OPENSKY_USERNAME ? 'Present' : 'Missing',
      OPENSKY_PASSWORD: process.env.OPENSKY_PASSWORD ? 'Present' : 'Missing'
    },
    working_directory: process.cwd(),
    env_file_path: '.env'
  };

  res.json(envStatus);
});

// Test specific API key functionality
router.get('/test-flightaware', async (req, res) => {
  const apiKey = process.env.FLIGHTAWARE_API_KEY;
  
  if (!apiKey) {
    return res.json({ 
      status: 'error', 
      message: 'FLIGHTAWARE_API_KEY not found in environment variables' 
    });
  }

  try {
    const response = await fetch('https://aeroapi.flightaware.com/aeroapi/operators/VIR', {
      headers: {
        'x-apikey': apiKey,
        'Accept': 'application/json'
      }
    });

    res.json({
      status: 'success',
      api_key_present: true,
      api_response_status: response.status,
      api_response_ok: response.ok
    });
  } catch (error) {
    res.json({
      status: 'error',
      api_key_present: true,
      error: error.message
    });
  }
});

export default router;
