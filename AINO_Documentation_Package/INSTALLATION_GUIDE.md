# AINO TRI Command Centre - Installation Guide

## Prerequisites

### Python Environment
```bash
pip install streamlit pandas requests datetime
```

### Required Files
- `enhanced_tri_command_centre.py` - Main dashboard
- `tri_risk_engine.py` - Risk synthesis engine
- `connection_risk_engine.py` - Connection assessment engine

## Quick Installation

### 1. Extract Package
```bash
tar -xzf AINO_Documentation_Package.tar.gz
cd AINO_Documentation_Package
```

### 2. Run Enhanced TRI Dashboard
```bash
streamlit run enhanced_tri_command_centre.py --server.port 8502 --server.address 0.0.0.0
```

### 3. Access Dashboard
- **URL**: `http://localhost:8502`
- **Enhanced Features**: Live data integration, auto-refresh, professional styling

## Configuration

### Data Sources
The TRI system integrates with:
- ADS-B Exchange for flight tracking
- AVWX API for weather data
- FlightAware for ETA predictions
- Internal connection database

### Auto-Refresh Settings
- Default: 30-second refresh interval
- Configurable: 10-300 seconds via sidebar
- Live data quality monitoring

## Operational Use

### Flight Selection
Choose from active Virgin Atlantic flights:
- VS3 (LHR-JFK)
- VS103 (LHR-ATL)  
- VS11 (LHR-BOS)
- VS141 (LHR-LAX)

### Risk Assessment
Monitor real-time:
- Connection risks with MCT analysis
- Weather-adjusted fuel calculations
- Crew duty compliance
- Diversion cost modeling

### Export Analysis
Generate comprehensive reports with:
- Risk assessment summaries
- Connection impact analysis
- Data quality assessments
- Operational recommendations

## Support

Refer to `AINO_Operators_Manual.md` for complete operational procedures and `AINO_PLATFORM_CAPABILITIES_OVERVIEW.md` for executive-level capabilities overview.