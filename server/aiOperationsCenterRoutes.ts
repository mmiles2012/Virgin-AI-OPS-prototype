import express from 'express';

const router = express.Router();

// Hotel booking endpoint for AI Operations Center
router.post('/hotel-booking', async (req, res) => {
  try {
    const { flightNumber, aircraft, diversionAirport, reason } = req.body;
    
    // Aircraft capacity mapping
    const aircraftCapacity: Record<string, { passengers: number; crew: number }> = {
      'A330': { passengers: 310, crew: 12 },
      'A350': { passengers: 331, crew: 14 },
      'B787': { passengers: 274, crew: 10 },
      'B777': { passengers: 396, crew: 14 }
    };

    // Airport hotel database
    const airportHotels: Record<string, any[]> = {
      'SNN': [
        { name: 'Radisson Blu Hotel & Spa Limerick', rooms: 154, rate: 125, distance: '15 miles', rating: 4.4 },
        { name: 'Clayton Hotel Burlington Road Limerick', rooms: 230, rate: 110, distance: '18 miles', rating: 4.2 },
        { name: 'Strand Hotel Limerick', rooms: 184, rate: 95, distance: '20 miles', rating: 4.1 }
      ],
      'MAN': [
        { name: 'Radisson Blu Manchester Airport', rooms: 250, rate: 135, distance: '0.5 miles', rating: 4.3 },
        { name: 'Clayton Hotel Manchester Airport', rooms: 365, rate: 120, distance: '1.2 miles', rating: 4.1 },
        { name: 'Crowne Plaza Manchester Airport', rooms: 228, rate: 145, distance: '2.1 miles', rating: 4.4 }
      ],
      'EDI': [
        { name: 'DoubleTree by Hilton Edinburgh Airport', rooms: 203, rate: 140, distance: '0.5 miles', rating: 4.5 },
        { name: 'Premier Inn Edinburgh Airport', rooms: 240, rate: 105, distance: '1.0 miles', rating: 4.2 }
      ],
      'GLA': [
        { name: 'Hampton by Hilton Glasgow Airport', rooms: 298, rate: 115, distance: '0.3 miles', rating: 4.3 },
        { name: 'Premier Inn Glasgow Airport', rooms: 300, rate: 95, distance: '0.8 miles', rating: 4.1 }
      ]
    };

    const capacity = aircraftCapacity[aircraft];
    const hotels = airportHotels[diversionAirport] || [];
    
    if (!capacity || hotels.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid aircraft type or airport not supported'
      });
    }

    // Calculate room requirements
    const passengerRooms = Math.ceil(capacity.passengers / 2);
    const crewRooms = capacity.crew;
    
    // Select best hotel based on capacity and rating
    const bestHotel = hotels.reduce((best, current) => 
      (current.rooms >= passengerRooms + crewRooms && current.rating > best.rating) ? current : best
    );

    const totalCost = (passengerRooms * bestHotel.rate) + (crewRooms * (bestHotel.rate * 1.2));
    
    const bookingResult = {
      hotel: bestHotel,
      passengerRooms,
      crewRooms,
      totalCost,
      confirmationNumber: `AINO${Date.now().toString().slice(-6)}`,
      flightNumber,
      diversionAirport,
      reason
    };

    res.json({
      success: true,
      booking: bookingResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Hotel booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during hotel booking'
    });
  }
});

// Get available hotels for a specific airport
router.get('/hotels/:airportCode', async (req, res) => {
  try {
    const { airportCode } = req.params;
    
    const airportHotels: Record<string, any[]> = {
      'SNN': [
        { name: 'Radisson Blu Hotel & Spa Limerick', rooms: 154, rate: 125, distance: '15 miles', rating: 4.4 },
        { name: 'Clayton Hotel Burlington Road Limerick', rooms: 230, rate: 110, distance: '18 miles', rating: 4.2 },
        { name: 'Strand Hotel Limerick', rooms: 184, rate: 95, distance: '20 miles', rating: 4.1 }
      ],
      'MAN': [
        { name: 'Radisson Blu Manchester Airport', rooms: 250, rate: 135, distance: '0.5 miles', rating: 4.3 },
        { name: 'Clayton Hotel Manchester Airport', rooms: 365, rate: 120, distance: '1.2 miles', rating: 4.1 },
        { name: 'Crowne Plaza Manchester Airport', rooms: 228, rate: 145, distance: '2.1 miles', rating: 4.4 }
      ],
      'EDI': [
        { name: 'DoubleTree by Hilton Edinburgh Airport', rooms: 203, rate: 140, distance: '0.5 miles', rating: 4.5 },
        { name: 'Premier Inn Edinburgh Airport', rooms: 240, rate: 105, distance: '1.0 miles', rating: 4.2 }
      ],
      'GLA': [
        { name: 'Hampton by Hilton Glasgow Airport', rooms: 298, rate: 115, distance: '0.3 miles', rating: 4.3 },
        { name: 'Premier Inn Glasgow Airport', rooms: 300, rate: 95, distance: '0.8 miles', rating: 4.1 }
      ]
    };

    const hotels = airportHotels[airportCode] || [];
    
    res.json({
      success: true,
      airportCode,
      hotels,
      totalHotels: hotels.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Hotel lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during hotel lookup'
    });
  }
});

// System status endpoint
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      status: {
        aiSystems: 'online',
        hotelBookingApi: 'connected',
        groundTransport: 'available',
        crewScheduling: 'active',
        ainoIntegration: 'operational'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Status check failed'
    });
  }
});

export default router;