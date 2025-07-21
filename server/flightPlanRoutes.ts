// Flight Plan Upload Routes with PDF Support
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Extended Request interface for multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
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
let flightPlanService: any;
let FlightPlanServiceClass: any;

async function getFlightPlanService() {
  if (!flightPlanService) {
    if (!FlightPlanServiceClass) {
      const module = await import('./flightPlanService.js');
      console.log('📦 Module keys:', Object.keys(module));
      console.log('📦 Default export type:', typeof module.default);
      console.log('📦 Module type:', typeof module);
      
      // Try different export patterns
      FlightPlanServiceClass = module.default || module.FlightPlanService || module;
      console.log('📦 Using class:', typeof FlightPlanServiceClass);
    }
    flightPlanService = new FlightPlanServiceClass();
  }
  return flightPlanService;
}

// Upload flight plan (file or text content)
router.post('/upload', upload.single('file'), async (req: MulterRequest, res: Response) => {
  try {
    console.log('📡 Flight plan upload request received');
    console.log('📋 Request body keys:', Object.keys(req.body));
    console.log('📁 File present:', !!req.file);
    
    const service = await getFlightPlanService();
    let fileContent, filename, format;

    if (req.file) {
      // File upload
      filename = req.body.filename || req.file.originalname;
      const ext = path.extname(filename).toLowerCase();
      
      if (ext === '.pdf') {
        fileContent = req.file.buffer; // Keep as buffer for PDF parsing
        format = 'pdf';
      } else {
        fileContent = req.file.buffer.toString('utf8');
        format = 'auto';
      }
      
      console.log(`📁 File uploaded: ${filename} (${req.file.size} bytes, format: ${format})`);
    } else if (req.body.content && req.body.filename) {
      // Text content upload
      fileContent = req.body.content;
      filename = req.body.filename;
      format = 'auto';
      
      console.log(`📝 Text content uploaded: ${filename}`);
    } else {
      console.log('❌ No file or content provided in request');
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
    const { currentPosition, emergencyType = 'engine_failure', waypointName, waypointIndex, routeProgress } = req.body;
    
    if (!currentPosition || !currentPosition.lat || !currentPosition.lon) {
      return res.status(400).json({
        success: false,
        error: 'Current position (lat, lon) is required'
      });
    }

    console.log(`🛠️ Starting diversion analysis for ${callsign} ${waypointName ? `from waypoint ${waypointName}` : 'from current position'} at ${currentPosition.lat}, ${currentPosition.lon}`);

    const service = await getFlightPlanService();
    const flightPlan = service.getFlightPlan(callsign);
    
    if (!flightPlan) {
      return res.status(404).json({
        success: false,
        error: 'Flight plan not found'
      });
    }

    // Perform diversion analysis with waypoint context
    const diversionOptions = service.calculateEnrouteDiversions(flightPlan, currentPosition, emergencyType, {
      waypointName,
      waypointIndex,
      routeProgress
    });
    
    const analysis = {
      flightPlan: {
        callsign: flightPlan.callsign,
        route: flightPlan.route,
        departure: flightPlan.departure,
        destination: flightPlan.destination
      },
      currentPosition,
      emergencyType,
      waypointContext: waypointName ? {
        waypoint: waypointName,
        index: waypointIndex,
        routeProgress: routeProgress
      } : null,
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
      diversionAnalysis: analysis
    });

  } catch (error) {
    console.error('Diversion analysis error:', error);
    res.status(500).json({
      success: false,
      error: (error as any).message || 'Failed to perform diversion analysis'
    });
  }
});

export default router;