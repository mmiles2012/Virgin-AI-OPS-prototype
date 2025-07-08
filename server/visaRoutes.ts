import express from 'express';
import { spawn } from 'child_process';
import path from 'path';

const router = express.Router();

// Virgin Atlantic's three main passenger nationalities
const SUPPORTED_NATIONALITIES = ['British', 'Indian', 'U.S.'];

// Virgin Atlantic destinations requiring visa intelligence
const VIRGIN_ATLANTIC_DESTINATIONS = [
  'United States', 'Jamaica', 'Barbados', 'Antigua and Barbuda',
  'Saint Lucia', 'Grenada', 'India', 'Pakistan', 'Nigeria', 'Ghana',
  'Kenya', 'South Africa', 'China', 'Japan', 'Hong Kong', 'Singapore',
  'Australia', 'New Zealand', 'Dubai', 'Tel Aviv', 'Turkey'
];

// Start visa service if not running
let visaServiceRunning = false;
let visaServiceProcess: any = null;

function startVisaService() {
  if (visaServiceRunning) return;
  
  try {
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    const scriptPath = path.join(process.cwd(), 'visa_requirements_system.py');
    
    visaServiceProcess = spawn(pythonPath, [scriptPath], {
      stdio: 'pipe',
      env: { ...process.env, PYTHONPATH: process.cwd() }
    });
    
    visaServiceProcess.stdout.on('data', (data: Buffer) => {
      console.log('[Visa Service]', data.toString());
    });
    
    visaServiceProcess.stderr.on('data', (data: Buffer) => {
      console.error('[Visa Service Error]', data.toString());
    });
    
    visaServiceProcess.on('close', (code: number) => {
      console.log(`[Visa Service] Process exited with code ${code}`);
      visaServiceRunning = false;
    });
    
    visaServiceRunning = true;
    console.log('[Visa Service] Started visa requirements system');
  } catch (error) {
    console.error('[Visa Service] Failed to start:', error);
  }
}

// Initialize visa service
startVisaService();

// Proxy function to visa service
async function queryVisaService(endpoint: string, params: any = {}) {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `http://localhost:8080${endpoint}${queryString ? '?' + queryString : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Visa service error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Visa API] Error:', error);
    return {
      error: 'Visa service unavailable',
      fallback: true,
      message: 'Unable to connect to visa requirements service'
    };
  }
}

// Virgin Atlantic Visa Intelligence Routes
router.get('/status', async (req, res) => {
  try {
    const healthCheck = await queryVisaService('/health');
    res.json({
      success: true,
      visa_service_status: healthCheck.status || 'unknown',
      supported_nationalities: SUPPORTED_NATIONALITIES,
      virgin_atlantic_destinations: VIRGIN_ATLANTIC_DESTINATIONS.length,
      service_running: visaServiceRunning,
      last_checked: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Visa service status check failed',
      details: error.message
    });
  }
});

router.get('/passenger-requirements', async (req, res) => {
  const { nationality, destination, flight_number } = req.query;
  
  if (!nationality || !destination) {
    return res.status(400).json({
      error: 'Missing required parameters',
      usage: '/api/visa/passenger-requirements?nationality=British&destination=India&flight_number=VS355'
    });
  }
  
  try {
    const visaData = await queryVisaService('/api/visa/lookup', {
      passport: nationality,
      destination: destination
    });
    
    if (visaData.error) {
      return res.status(404).json({
        success: false,
        error: visaData.error,
        nationality: nationality,
        destination: destination,
        flight_number: flight_number || 'Not specified'
      });
    }
    
    res.json({
      success: true,
      passenger_nationality: nationality,
      destination: destination,
      flight_number: flight_number || null,
      visa_requirements: visaData.visa_requirement,
      virgin_atlantic_advisory: {
        check_before_travel: 'Always verify latest visa requirements before departure',
        support_contact: 'Virgin Atlantic Customer Services for travel document assistance',
        online_checkin_restriction: visaData.visa_requirement?.visa_requirement?.includes('visa required') 
          ? 'Visa verification required at airport' : 'Online check-in available'
      },
      operational_notes: visaData.operational_notes || {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Visa lookup failed',
      details: error.message
    });
  }
});

router.get('/nationality-analysis', async (req, res) => {
  const { nationality } = req.query;
  
  if (!nationality) {
    return res.status(400).json({
      error: 'Missing nationality parameter',
      usage: '/api/visa/nationality-analysis?nationality=British'
    });
  }
  
  try {
    const bulkData = await queryVisaService('/api/visa/bulk', {
      passport: nationality
    });
    
    if (bulkData.error) {
      return res.status(404).json({
        success: false,
        error: bulkData.error,
        available_nationalities: SUPPORTED_NATIONALITIES
      });
    }
    
    // Filter for Virgin Atlantic destinations
    const virginAtlanticRelevant = bulkData.visa_requirements?.filter((req: any) => 
      VIRGIN_ATLANTIC_DESTINATIONS.some(dest => 
        dest.toLowerCase().includes(req.destination?.toLowerCase()) ||
        req.destination?.toLowerCase().includes(dest.toLowerCase())
      )
    ) || [];
    
    res.json({
      success: true,
      nationality: nationality,
      total_destinations_analyzed: bulkData.total_destinations || 0,
      virgin_atlantic_relevant: virginAtlanticRelevant.length,
      summary: bulkData.summary || {},
      visa_requirements: virginAtlanticRelevant,
      operational_insights: {
        high_visa_complexity: virginAtlanticRelevant.filter((req: any) => 
          req.visa_requirement?.toLowerCase().includes('visa required')).length,
        visa_free_destinations: virginAtlanticRelevant.filter((req: any) => 
          req.visa_requirement?.toLowerCase().includes('visa not required') ||
          req.visa_requirement?.toLowerCase().includes('visa free')).length,
        visa_on_arrival: virginAtlanticRelevant.filter((req: any) => 
          req.visa_requirement?.toLowerCase().includes('visa on arrival')).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Nationality analysis failed',
      details: error.message
    });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const analytics = await queryVisaService('/api/visa/analytics');
    
    if (analytics.error) {
      return res.status(500).json({
        success: false,
        error: analytics.error
      });
    }
    
    // Enhanced analytics with Virgin Atlantic operational context
    const enhancedAnalytics = {
      ...analytics,
      virgin_atlantic_intelligence: {
        primary_nationalities: SUPPORTED_NATIONALITIES,
        destination_network: VIRGIN_ATLANTIC_DESTINATIONS,
        operational_complexity: {
          high_visa_requirements: [],
          streamlined_destinations: [],
          visa_on_arrival_options: []
        }
      }
    };
    
    // Analyze each nationality for Virgin Atlantic operations
    for (const nationality of SUPPORTED_NATIONALITIES) {
      const destAnalysis = analytics.destination_analysis?.[nationality];
      if (destAnalysis) {
        if (destAnalysis.visa_required > 15) {
          enhancedAnalytics.virgin_atlantic_intelligence.operational_complexity.high_visa_requirements.push(nationality);
        }
        if (destAnalysis.visa_free > 10) {
          enhancedAnalytics.virgin_atlantic_intelligence.operational_complexity.streamlined_destinations.push(nationality);
        }
        if (destAnalysis.visa_on_arrival > 5) {
          enhancedAnalytics.virgin_atlantic_intelligence.operational_complexity.visa_on_arrival_options.push(nationality);
        }
      }
    }
    
    res.json({
      success: true,
      analytics: enhancedAnalytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Analytics generation failed',
      details: error.message
    });
  }
});

router.post('/refresh-cache', async (req, res) => {
  try {
    const refreshResult = await queryVisaService('/api/visa/refresh', {}, 'POST');
    
    res.json({
      success: true,
      message: 'Visa cache refresh initiated',
      details: refreshResult,
      refreshed_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Cache refresh failed',
      details: error.message
    });
  }
});

// Flight-specific visa check
router.get('/flight-check/:flightNumber', async (req, res) => {
  const { flightNumber } = req.params;
  const { nationality } = req.query;
  
  if (!nationality) {
    return res.status(400).json({
      error: 'Missing nationality parameter',
      usage: '/api/visa/flight-check/VS355?nationality=British'
    });
  }
  
  try {
    // Mock flight destination lookup (would integrate with flight database)
    const flightDestinations: { [key: string]: string } = {
      'VS355': 'India',
      'VS103': 'United States',
      'VS11': 'United States',
      'VS21': 'United States',
      'VS401': 'Jamaica',
      'VS411': 'Barbados',
      'VS507': 'Nigeria',
      'VS601': 'South Africa'
    };
    
    const destination = flightDestinations[flightNumber.toUpperCase()];
    if (!destination) {
      return res.status(404).json({
        success: false,
        error: `Flight ${flightNumber} not found in Virgin Atlantic network`,
        available_flights: Object.keys(flightDestinations)
      });
    }
    
    const visaData = await queryVisaService('/api/visa/lookup', {
      passport: nationality,
      destination: destination
    });
    
    res.json({
      success: true,
      flight_number: flightNumber,
      destination: destination,
      passenger_nationality: nationality,
      visa_requirements: visaData.visa_requirement || visaData,
      pre_departure_checklist: {
        documents_required: visaData.visa_requirement?.visa_requirement?.includes('visa required') ? 
          ['Valid passport', 'Visa document', 'Return ticket'] : 
          ['Valid passport', 'Return ticket'],
        advance_notice: visaData.visa_requirement?.visa_requirement?.includes('visa required') ? 
          'Apply for visa well in advance' : 
          'No advance visa application required',
        airport_procedure: visaData.visa_requirement?.visa_requirement?.includes('visa on arrival') ? 
          'Visa available at destination airport' : 
          'Standard immigration procedures'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Flight visa check failed',
      details: error.message
    });
  }
});

// Cleanup on process exit
process.on('exit', () => {
  if (visaServiceProcess) {
    visaServiceProcess.kill();
  }
});

export default router;