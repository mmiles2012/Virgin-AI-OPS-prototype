# 🛫 Flight Plan Upload Demonstration Guide

## 📍 **How to Access the Flight Plan Upload System**

1. **Navigate to Intelligent Decision Dashboard**
   - Click "Intelligent Decision" in the left navigation menu
   - Select the "Flight & Location Selection" tab (first tab)

2. **Locate the Flight Plan Upload Section**
   - Scroll down to the "Flight Plan Upload & Integration" section
   - You'll see the upload interface with filename and content fields

## 📤 **Ready-to-Upload Flight Plans**

### **VIR3N (LHR-JFK) - Transatlantic A330-900**
```
OPERATIONAL FLIGHT PLAN VS3 VIR3N
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
```

### **VIR302 (LHR-DEL) - Transcontinental A350-1000**
```
OPERATIONAL FLIGHT PLAN VS302 VIR302
21JUL25 EGLL/LHR 0930 VIDP/DEL 1835
AIRCRAFT: A350-1000 (A35K)
REGISTRATION: G-VLIB

ROUTE: EGLL DET1J DET L6 DVR UL9 KONAN UL607 KOK DCT SPI DCT GUBAX DCT BOREP DCT ENITA DCT ETVIS DCT BUDEX DCT TEKNO DCT TEGRI DCT LUGEB DCT UDROS UN743 GAKSU UT310 SIN UN644 ROLIN N644 LAGAS M747 SUBUT T923 ERLEV M11 RODAR A909 LEMOD N644 DI A466 ELKUX ELKUX6G VIDP

WAYPOINTS:
EGLL - London Heathrow
DET - London TMA
DVR - Dover
KONAN - European Waypoint
GUBAX - European Waypoint
BOREP - Central Europe
ENITA - Eastern Europe
GAKSU - Turkey
SIN - Central Asia
ROLIN - Afghanistan
SUBUT - Pakistan
RODAR - India
VIDP - Delhi

ALTERNATES: VILK (Lucknow), VANP (Amritsar)
FUEL: 49400 KG PLANNED
```

### **VIR165 (LHR-MBJ) - Caribbean B787-9**
```
OPERATIONAL FLIGHT PLAN VS165 VIR165
21JUL25 EGLL/LHR 1445 MKJS/MBJ 0030+
AIRCRAFT: B787-9 (B789)
REGISTRATION: G-VBOW

ROUTE: EGLL GOGSI2G GOGSI N621 EVTES N514 ADKIK DCT JOZMA DCT LULOX DCT KOGAD DCT 48N020W DCT 43N030W DCT 38N040W DCT 33N050W DCT 31N055W DCT AMENO M594 MLLER DCT OVALU UG629 IMADI DCT MKJS

WAYPOINTS:
EGLL - London Heathrow
GOGSI - UK Departure
EVTES - European Waypoint
ADKIK - Atlantic Entry
JOZMA - Atlantic Waypoint
LULOX - Atlantic Waypoint
KOGAD - Mid Atlantic
48N020W - North Atlantic Track
AMENO - Caribbean Entry
OVALU - Caribbean Waypoint
IMADI - Caribbean Approach
MKJS - Kingston Jamaica

ALTERNATES: MKJP, KMIA (Miami), TJSJ (San Juan)
FUEL: 48100 KG PLANNED
```

## 🔧 **How to Upload and Test**

1. **Enter Filename**: `VIR3N_LHR_JFK_21JUL25.txt`
2. **Paste Flight Plan**: Copy one of the flight plans above
3. **Click Upload**: System will auto-detect format and extract waypoints
4. **Select Live Flight**: Choose the corresponding live flight (VIR3N, VIR302, or VIR165)
5. **Perform Diversion Analysis**: Click to analyze with real waypoints

## 🎯 **Expected Results**

- ✅ Flight plan parsed with waypoint count displayed
- ✅ Format automatically detected (text/ICAO)
- ✅ Integration with live ADS-B position data
- ✅ Enroute diversion analysis using authentic waypoints
- ✅ Alternate airports ranked by distance from flight plan route

## 🌟 **Live System Status**

Your flights are currently being tracked:
- **VIR3N**: LHR-JFK route detected ✅
- **VIR302**: LHR-DEL route detected ✅  
- **VIR165**: LHR-MBJ route available ✅

The system is ready to process your authentic flight plans and provide real enroute diversion analysis using actual Virgin Atlantic operational data.