// Demo script to upload VIR3N flight plan and test diversion analysis
const fetch = require('node-fetch');

const vir3nFlightPlan = `OPERATIONAL FLIGHT PLAN VS3 VIR3N
21JUL25 EGLL/LHR 0835 KJFK/JFK 1645
AIRCRAFT: A330-900 (A339)
REGISTRATION: G-VEII

ROUTE: EGLL CPT5J CPT L9 BUCGO DCT FELCA DCT NICXI DCT BAKUR DCT DOGAL DCT 55N020W DCT 5630N03000W DCT 56N040W DCT 54N050W DCT NEEKO DCT DANOL DCT ENE PARCH4 KJFK

WAYPOINTS:
EGLL - London Heathrow (51.4706N, 0.4619W)
BUCGO - UK Waypoint
FELCA - UK Waypoint  
NICXI - UK Waypoint
BAKUR - Atlantic Entry Point
DOGAL - Shannon Oceanic (53.4N, 10.0W)
55N020W - North Atlantic Track Point (55.0N, 20.0W)
5630N03000W - Mid Atlantic Point (56.5N, 30.0W)
56N040W - Atlantic Waypoint (56.0N, 40.0W)
54N050W - Atlantic Waypoint (54.0N, 50.0W)
NEEKO - Atlantic Exit Point
DANOL - Canadian Waypoint
ENE - US Entry Point
KJFK - New York JFK (40.6413N, 73.7781W)

ALTERNATES: EINN (Shannon), BIKF (Keflavik), CYYR (Goose Bay)
FUEL: 38700 KG PLANNED
FLIGHT TIME: 7H 14M`;

async function demonstrateFlightPlanUpload() {
    try {
        console.log('🛫 Demonstrating VIR3N flight plan upload...');
        
        // Get the actual server URL from the running process
        const serverUrl = process.env.REPLIT_DEV_DOMAIN ? 
            `https://${process.env.REPLIT_DEV_DOMAIN}` : 
            'http://localhost:5173';
        
        console.log(`📡 Using server: ${serverUrl}`);
        
        // Upload the flight plan
        console.log('\n📤 Uploading VIR3N flight plan...');
        const uploadResponse = await fetch(`${serverUrl}/api/flight-plans/upload`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                filename: 'VIR3N_LHR_JFK_21JUL25_Authentic.txt',
                content: vir3nFlightPlan,
                format: 'text'
            })
        });
        
        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }
        
        const uploadResult = await uploadResponse.json();
        console.log('✅ Upload result:', uploadResult.success ? 'SUCCESS' : 'FAILED');
        
        if (uploadResult.success) {
            console.log(`📊 Waypoints extracted: ${uploadResult.waypointCount}`);
            console.log(`🔍 Format detected: ${uploadResult.format}`);
        }
        
        // Get uploaded flight plans
        console.log('\n📋 Retrieving uploaded flight plans...');
        const listResponse = await fetch(`${serverUrl}/api/flight-plans`);
        const listResult = await listResponse.json();
        
        if (listResult.success) {
            console.log(`📁 Total uploaded plans: ${listResult.flightPlans.length}`);
            listResult.flightPlans.forEach(plan => {
                console.log(`  - ${plan.callsign}: ${plan.route} (${plan.waypointCount} waypoints)`);
            });
        }
        
        // Test diversion analysis with uploaded flight plan
        console.log('\n🚨 Testing enroute diversion analysis...');
        const diversionResponse = await fetch(`${serverUrl}/api/flight-plans/VIR3N/diversion-analysis`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                currentPosition: { latitude: 55.0, longitude: -20.0 }, // Mid-Atlantic
                emergencyType: 'engine_failure',
                aircraftType: 'A339'
            })
        });
        
        if (diversionResponse.ok) {
            const diversionResult = await diversionResponse.json();
            console.log('✅ Diversion analysis completed');
            console.log(`🏭 Recommended alternate: ${diversionResult.recommendedAlternate}`);
            console.log(`📍 Distance to alternate: ${diversionResult.distance} nm`);
            console.log(`⛽ Fuel required: ${diversionResult.fuelRequired} kg`);
        }
        
        console.log('\n🎯 Flight plan upload and diversion analysis demonstration complete!');
        console.log('💡 Ready for user interaction through the Intelligent Decision Dashboard');
        
    } catch (error) {
        console.error('❌ Demo error:', error.message);
        console.log('ℹ️  Server may be starting up or using different port');
        console.log('🌐 Please use the web interface to upload flight plans');
    }
}

demonstrateFlightPlanUpload();