// Flight Plan Upload Routes with PDF Support
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, text, JSON, and XML files
    const allowedTypes = ['.pdf', '.txt', '.json', '.xml'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, JSON, and XML files are allowed.'));
    }
  }
});

// Initialize flight plan service
let flightPlanService;
async function getFlightPlanService() {
  if (!flightPlanService) {
    const { FlightPlanService } = await import('./flightPlanService.js');
    flightPlanService = new FlightPlanService();
  }
  return flightPlanService;
}

// Upload flight plan (file or text content)
router.post('/upload', upload.single('flightPlan'), async (req, res) => {
  try {
    const service = await getFlightPlanService();
    let fileContent, filename, format;

    if (req.file) {
      // File upload
      filename = req.file.originalname;
      const ext = path.extname(filename).toLowerCase();
      
      if (ext === '.pdf') {
        fileContent = req.file.buffer; // Keep as buffer for PDF parsing
        format = 'pdf';
      } else {
        fileContent = req.file.buffer.toString('utf8');
        format = 'auto';
      }
      
      console.log(`📁 File uploaded: ${filename} (${req.file.size} bytes)`);
    } else if (req.body.content && req.body.filename) {
      // Text content upload
      fileContent = req.body.content;
      filename = req.body.filename;
      format = 'auto';
      
      console.log(`📝 Text content uploaded: ${filename}`);
    } else {
      return res.status(400).json({
        success: false,
        error: 'No file or content provided'
      });
    }

    // Parse the flight plan
    const parsedPlan = await service.parseFlightPlan(fileContent, filename, format);
    
    if (!parsedPlan) {
      return res.status(400).json({
        success: false,
        error: 'Failed to parse flight plan'
      });
    }

    console.log(`✈️ Flight plan processed: ${parsedPlan.callsign || 'Unknown'}`);

    res.json({
      success: true,
      flightPlan: parsedPlan,
      message: `Flight plan ${parsedPlan.callsign || filename} uploaded successfully`
    });

  } catch (error) {
    console.error('Flight plan upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process flight plan'
    });
  }
});

// Upload text content (existing endpoint)
router.post('/upload-text', async (req, res) => {
  try {
    const { content, filename } = req.body;
    
    if (!content || !filename) {
      return res.status(400).json({
        success: false,
        error: 'Content and filename are required'
      });
    }

    const service = await getFlightPlanService();
    const parsedPlan = await service.parseFlightPlan(content, filename);
    
    res.json({
      success: true,
      flightPlan: parsedPlan,
      message: `Flight plan ${parsedPlan.callsign || filename} uploaded successfully`
    });

  } catch (error) {
    console.error('Text upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process flight plan'
    });
  }
});

// Get all uploaded flight plans
router.get('/', async (req, res) => {
  try {
    const service = await getFlightPlanService();
    const flightPlans = service.getUploadedFlightPlans();
    
    res.json({
      success: true,
      flightPlans,
      count: flightPlans.length
    });
  } catch (error) {
    console.error('Error fetching flight plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flight plans'
    });
  }
});

// Get specific flight plan
router.get('/:callsign', async (req, res) => {
  try {
    const { callsign } = req.params;
    const service = await getFlightPlanService();
    const flightPlan = service.getFlightPlan(callsign);
    
    if (!flightPlan) {
      return res.status(404).json({
        success: false,
        error: 'Flight plan not found'
      });
    }

    res.json({
      success: true,
      flightPlan
    });
  } catch (error) {
    console.error('Error fetching flight plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flight plan'
    });
  }
});

// Perform diversion analysis
router.post('/:callsign/diversion-analysis', async (req, res) => {
  try {
    const { callsign } = req.params;
    const { currentPosition, emergencyType = 'engine_failure' } = req.body;
    
    if (!currentPosition || !currentPosition.lat || !currentPosition.lon) {
      return res.status(400).json({
        success: false,
        error: 'Current position (lat, lon) is required'
      });
    }

    const service = await getFlightPlanService();
    const flightPlan = service.getFlightPlan(callsign);
    
    if (!flightPlan) {
      return res.status(404).json({
        success: false,
        error: 'Flight plan not found'
      });
    }

    // Perform diversion analysis
    const diversionOptions = service.calculateEnrouteDiversions(flightPlan, currentPosition, emergencyType);
    
    const analysis = {
      flightPlan: {
        callsign: flightPlan.callsign,
        route: flightPlan.route,
        departure: flightPlan.departure,
        destination: flightPlan.destination
      },
      currentPosition,
      emergencyType,
      diversionOptions,
      summary: {
        totalOptions: diversionOptions.length,
        recommendedOption: diversionOptions[0]?.airport?.name || 'None available',
        nearestOption: diversionOptions.sort((a, b) => a.distance - b.distance)[0]?.airport?.name || 'None available'
      }
    };

    console.log(`🛣️ Diversion analysis completed for ${callsign}: ${diversionOptions.length} options found`);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Diversion analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform diversion analysis'
    });
  }
});

export default router;