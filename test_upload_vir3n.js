// Test script to upload authentic Virgin Atlantic flight plans
const flightPlanVIR3N = `OPERATIONAL FLIGHT PLAN      VS3   PG 1/8 PRTD    21JUL25 0502.14UTC

VIR3N                                      STD        LOCAL         REGN          GVEII
21JUL25                   EGLL/LHR         0835       P01.00        TYPE          330-9
EGLL-KJFK                                  STA                      PERF DEC      P0.0PCT
                          KJFK/JFK         1645       M04.00        MEL DEC       P0.0PCT

ROUTE EGLL CPT5J CPT L9 BUCGO DCT FELCA DCT NICXI DCT BAKUR DCT DOGAL DCT 55N020W DCT
5630N03000W DCT 56N040W DCT 54N050W DCT NEEKO DCT DANOL DCT ENE PARCH4 KJFK

ATC FLIGHT PLAN
(FPL-VIR3N-IS
-A339/H-SBDE3GHIJ1J2J3J5M1P2RVWXYZ/LB2D1G1
-EGLL0835
-N0475F380 CPT L9 BUCGO DCT FELCA DCT NICXI DCT BAKUR DCT
 DOGAL/M082F380 DCT 55N020W DCT 5630N03000W DCT 56N040W DCT
 54N050W DCT NEEKO/N0477F400 DCT DANOL DCT ENE PARCH4
-KJFK0714 KSWF KEWR
-PBN/A1B1C1D1L1O1S2 SUR/RSP180 260B CANMANDATE DOF/250721
 REG/GVEII EET/EGGX0122 CZQX0232 CZUL0448 CZQM0539 KZBW0601
 KZNY0706 SEL/CHEP OPR/VIR CODE/407ED8 RALT/EINN BIKF CYYR
 NAV/RNP2 RMK/ACAS II CONTACT +441293444798)

WAYPOINTS:
EGLL - London Heathrow
BUCGO - UK Waypoint
FELCA - UK Waypoint  
NICXI - UK Waypoint
BAKUR - Atlantic Entry
DOGAL - Shannon Oceanic
55N020W - North Atlantic Track
5630N03000W - Mid Atlantic
56N040W - Atlantic Waypoint
54N050W - Atlantic Waypoint
NEEKO - Atlantic Exit
DANOL - Canadian Waypoint
ENE - US Entry
KJFK - New York JFK

ALTERNATES: EINN (Shannon), BIKF (Keflavik), CYYR (Goose Bay)
AIRCRAFT: A339 (A330-900)
FUEL: 38700 KG PLANNED`;

const flightPlanVIR302 = `OPERATIONAL FLIGHT PLAN      VS302    PG 1/11 PRTD      21JUL25 0846.36UTC

VIR302                                     STD        LOCAL         REGN          GVLIB
21JUL25                   EGLL/LHR         0930       P01.00        TYPE          350X
EGLL-VIDP                                  STA                      PERF DEC      P0.5PCT
                          VIDP/DEL         1835       P05.30        MEL DEC       P0.0PCT

ROUTE EGLL DET1J DET L6 DVR UL9 KONAN UL607 KOK DCT SPI DCT GUBAX DCT BOREP DCT ENITA
DCT ETVIS DCT BUDEX DCT TEKNO DCT TEGRI DCT LUGEB DCT UDROS UN743 GAKSU UT310
SIN UN644 ROLIN N644 LAGAS M747 SUBUT T923 ERLEV M11 RODAR A909 LEMOD N644 DI
A466 ELKUX ELKUX6G VIDP

ATC FLIGHT PLAN
(FPL-VIR302-IS
-A35K/H-SBDE3GHIJ1J2J3J5M1P2RVWXYZ/LB2D1G1
-EGLL0930
-N0498F370 DET L6 DVR UL9 KONAN UL607 KOK DCT SPI DCT GUBAX
 DCT BOREP DCT ENITA DCT ETVIS DCT BUDEX DCT TEKNO DCT TEGRI DCT
 LUGEB DCT UDROS UN743 GAKSU/N0495F390 UT310 SIN UN644 ROLIN
 N644 LAGAS M747 SUBUT T923 ERLEV M11 RODAR A909 LEMOD N644 DI
 A466 ELKUX ELKUX6G
-VIDP0738 VILK VANP
-PBN/A1B1C1D1L1O1S2 NAV/RNP2 SUR/RSP180 260B CANMANDATE
 DOF/250721 REG/GVLIB EET/EBUR0016 EDVV0037 EDUU0038 LKAA0106
 LOVV0119 LHCC0132 LRBB0155 LBSR0231 LTBB0247 LTAA0249 UGGG0338
 UBBA0400 UTAK0434 UTAA0458 UTAV0533 OAKX0550 OPLR0627 VIDF0703
 SEL/FSHK CODE/4079CC OPR/VIR ORGN/DFWVSXH RMK/ACAS II CONTACT
 +441293444798 TURKEY PASSENGERFLT INDIA 7188APAXSSM2025IR)

WAYPOINTS:
EGLL - London Heathrow
DET - London TMA
DVR - Dover
KONAN - European Waypoint
KOK - European Waypoint
SPI - European Waypoint
GUBAX - European Waypoint
BOREP - Central Europe
ENITA - Eastern Europe
ETVIS - Czech Republic
BUDEX - Eastern Europe
TEKNO - Hungary
TEGRI - Romania
LUGEB - Bulgaria
UDROS - Turkey
GAKSU - Turkey
SIN - Central Asia
ROLIN - Afghanistan
LAGAS - Afghanistan
SUBUT - Pakistan
ERLEV - Pakistan
RODAR - India
LEMOD - India
VIDP - Delhi

ALTERNATES: VILK (Lucknow), VANP (Amritsar)
AIRCRAFT: A35K (A350-1000)
FUEL: 49400 KG PLANNED`;

async function uploadFlightPlan() {
  try {
    const response = await fetch('http://localhost:3000/api/flight-plans/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'VIR3N_LHR_JFK_21JUL25.txt',
        content: flightPlanContent,
        format: 'text'
      })
    });

    const data = await response.json();
    console.log('Upload result:', data);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

// Test with current position simulation
async function testDiversionAnalysis() {
  // Simulate current position somewhere over the Atlantic
  const currentPosition = {
    lat: 54.0,  // Mid-Atlantic position
    lon: -30.0
  };

  try {
    const response = await fetch('http://localhost:3000/api/flight-plans/VIR3N/diversion-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPosition,
        emergencyType: 'engine_failure'
      })
    });

    const data = await response.json();
    console.log('Diversion analysis result:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

if (typeof window === 'undefined') {
  // Node.js environment
  uploadFlightPlan().then(() => {
    setTimeout(testDiversionAnalysis, 1000);
  });
}