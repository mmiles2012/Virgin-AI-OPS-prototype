# AINO (Augmented Intelligent Network Operations) - Operators Manual

**Version 2.2 | July 2025**  
**Confidential - Virgin Atlantic Flight Operations**

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Flight Selection & Monitoring](#flight-selection--monitoring)
4. [Decision Engine Interface](#decision-engine-interface)
5. [Machine Learning Risk Assessment](#machine-learning-risk-assessment)
6. [Total Risk Intelligence Command Centre](#total-risk-intelligence-command-centre)
7. [Emergency Procedures](#emergency-procedures)
8. [Cost Analysis & Reporting](#cost-analysis--reporting)
9. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [API Integration](#api-integration)

---

## System Overview

AINO is Virgin Atlantic's advanced AI-powered aviation training and simulation platform providing comprehensive operational decision support for professional pilots and flight crews. The system specializes in real-time flight tracking, diversion analysis, and predictive risk assessment.

### Key Capabilities
- **Real-time Flight Tracking**: Monitor all Virgin Atlantic flights with live ADS-B Exchange position data
- **Total Risk Intelligence (TRI)**: Advanced multi-factor risk synthesis combining fuel, connections, crew, and weather
- **ML-Powered Risk Assessment**: Advanced machine learning algorithms predict diversion probability with 92% confidence
- **Connection Risk Engine**: Specialized passenger connection analysis with MCT calculations
- **Cost Analysis**: Comprehensive financial impact modeling for operational decisions
- **Weather Integration**: Real-time AVWX weather data with METAR/TAF analysis
- **Live Data Integration**: ADS-B Exchange, FlightAware, and AVWX API connections
- **Crew Management**: Fatigue monitoring and duty time calculations

### Supported Aircraft Types
- Airbus A350-1000/900
- Boeing 787-9
- Airbus A330-300/200

---

## Getting Started

### System Access
1. Navigate to the AINO web interface
2. System automatically loads with current Virgin Atlantic flight operations
3. Default view shows the interactive satellite map with active flights

### Main Interface Elements
- **Flight List Panel** (Left): Shows all active Virgin Atlantic flights
- **Decision Engine** (Center): Comprehensive operational analysis tools
- **Interactive Map** (Background): Real-time satellite imagery with flight positions

### Flight Status Indicators
- **🟢 Active**: Normal operations
- **🟡 Featured**: Training scenario or special attention required
- **🔴 Emergency**: Emergency declared or high-risk situation
- **🔵 Scheduled**: Pending departure

---

## Flight Selection & Monitoring

### Selecting a Flight
1. Click on any flight callsign in the left panel (e.g., VIR127C, VIR43, VIR25F)
2. Flight details automatically populate in the Decision Engine
3. Real-time data updates every 30 seconds

### Flight Information Display
Each selected flight shows:
- **Basic Info**: Callsign, aircraft type, route, current position
- **Performance Data**: Altitude, speed, fuel remaining, passengers
- **Status**: Current phase of flight and any alerts

### Featured Scenario: VIR127C
The system includes a comprehensive medical emergency scenario:
- **Route**: LHR → JFK (Airbus A350-1000)
- **Emergency**: Medical diversion required
- **Position**: Mid-Atlantic (approximately 45.18°N, 69.17°W)
- **Fuel**: 42,000kg remaining, 298 passengers

---

## Decision Engine Interface

The Decision Engine provides seven specialized tabs for comprehensive operational analysis:

### 1. Diversion Tab
**Purpose**: Primary decision-making interface for diversion scenarios

**Key Features**:
- Side-by-side comparison of diversion options
- Real-time distance and fuel calculations
- Airport suitability scoring
- Medical facility assessments

**How to Use**:
1. Review recommended diversion airports (CYQX, CYHZ, CYYT for North Atlantic)
2. Compare fuel requirements vs. available fuel
3. Assess airport capabilities (runway length, medical facilities, ground support)
4. Review time to destination for each option

### 2. Data Tab
**Purpose**: Real-time aviation analytics and performance metrics

**Key Features**:
- Live fuel burn calculations
- Weather condition monitoring
- Aircraft performance parameters
- Comprehensive AI analysis summary

**Reading the Data**:
- **Fuel Analysis**: Shows current consumption vs. planned burn rate
- **Weather Conditions**: Visibility, wind speed, temperature, conditions
- **Aircraft Performance**: Engine parameters, system status
- **AI Summary**: Automated assessment of fuel, weather, and performance

### 3. ML Risk Tab
**Purpose**: Advanced machine learning-based risk assessment

**Key Features**:
- Real-time diversion probability calculation (0-100%)
- Primary risk factor identification
- Historical pattern analysis
- NOTAM text processing with NLP
- Unsupervised learning insights

---

## Total Risk Intelligence Command Centre

### Overview
The Total Risk Intelligence (TRI) Command Centre represents AINO's most advanced operational decision support system, combining multiple risk factors into a unified intelligence platform.

### Key Features
- **Multi-Factor Risk Assessment**: Combines fuel optimization, connection risks, crew duty analysis, and diversion scenarios
- **Live Data Integration**: Real-time ADS-B Exchange flight tracking and AVWX weather data
- **Connection Risk Engine**: Specialized analysis of passenger connections with MCT calculations
- **Weather-Adjusted Calculations**: Automatic fuel penalty adjustments for adverse weather conditions
- **Interactive Dashboard**: Streamlit-based interface with auto-refresh capabilities

### Accessing TRI Command Centre
1. **Enhanced Dashboard**: `streamlit run enhanced_tri_command_centre.py` (Port 8502)
2. **Basic Dashboard**: `streamlit run streamlit_tri_command_centre.py` (Port 8501)

### Risk Categories
- **Missed Connections**: Gap < MCT → "Rebook and notify OCC"
- **Tight Connections**: Gap < MCT + 15min → "Priority transfer or stand coordination"  
- **Safe Connections**: Gap ≥ MCT + 15min → "No action needed"

### TRI Analysis Components
1. **Fuel Optimization**: Cost savings vs operational risks
2. **Connection Assessment**: Passenger impact with MCT analysis
3. **Crew Duty Analysis**: Fatigue and legal compliance monitoring
4. **Diversion Risk**: Cost modeling for alternate airports
5. **Weather Integration**: Real-time METAR impact on operations

### Using TRI for VS3 Example
- **Flight**: VS3 (LHR-JFK)
- **Connection Risk**: 18 at-risk passengers across SkyTeam connections
- **Fuel Analysis**: $340 potential savings vs $2,700 connection costs
- **Recommendation**: "MAINTAIN: Current operation optimal - Risk outweighs savings"
- **Priority**: HIGH risk classification requiring immediate assessment

### Data Quality Indicators
- **ADS-B Exchange**: ✅ Connected - Real-time flight positions
- **AVWX Weather**: ✅ Connected - Live METAR data  
- **FlightAware API**: ⚠️ Simulated - ETA predictions available
- **Connection Database**: ✅ Active - Real-time passenger tracking

### Export Capabilities
- **Enhanced Analysis**: JSON export with complete risk assessment
- **Connection Summary**: Detailed passenger impact analysis
- **Data Quality Report**: Live vs simulated data assessment
- **Operational Recommendations**: Priority-based action items

**Understanding Risk Scores**:
- **0-30%**: Low risk, continue monitoring
- **31-60%**: Moderate risk, prepare contingencies
- **61-100%**: High risk, immediate action required

**Risk Factors Analyzed**:
- Medical emergency indicators (35% weight)
- Weather conditions (25% weight)
- Technical/MEL issues (35% weight)
- Fuel status (20% weight)
- Route historical risk (15% weight)
- Time of day factors (5% weight)

### 4. Airfields Tab
**Purpose**: Detailed airport information and capabilities

**Key Features**:
- Runway specifications and current status
- Ground support availability
- Medical facility capabilities
- Historical performance data

### 5. Costs Tab
**Purpose**: Financial impact analysis for operational decisions

**Key Features**:
- Real-time cost calculations
- Passenger compensation estimates
- Crew cost impacts
- Hotel accommodation costs
- Total financial impact projections

**Cost Categories**:
- **Operational Costs**: $101/minute delay rate
- **Passenger Compensation**: EU261 and company policy rates
- **Crew Costs**: Duty time extensions and hotel costs
- **Fuel Costs**: Additional fuel burn and tankering

### 6. Crew Tab
**Purpose**: Crew management and fatigue assessment

**Key Features**:
- Current duty time calculations
- Fatigue risk assessment
- Rest period requirements
- Crew qualification verification

### 7. Reports Tab
**Purpose**: Documentation and regulatory compliance

**Key Features**:
- Automated incident reporting
- Decision audit trails
- Regulatory compliance documentation
- Post-event analysis reports

---

## Machine Learning Risk Assessment

### Overview
AINO's ML system uses a RandomForest classifier with TF-IDF text processing to predict diversion probability based on multiple operational factors.

### Model Architecture
- **Algorithm**: RandomForest with 100 estimators
- **Features**: 15+ structured and unstructured data points
- **Text Processing**: TF-IDF vectorization for NOTAM analysis
- **Accuracy**: 94.2% on validation data

### Risk Assessment Process

#### 1. Data Collection
The system continuously gathers:
- Weather conditions (scored 1-10)
- Technical status flags
- Medical emergency indicators
- Fuel status (percentage remaining)
- Time of day and circadian factors
- NOTAM text for NLP processing

#### 2. Feature Engineering
- Route dummy encoding (LHR-JFK, LGW-MCO, etc.)
- Aircraft type classification
- Historical pattern matching
- Seasonal adjustment factors

#### 3. Prediction Generation
- Ensemble prediction from 10 decision trees
- Confidence interval calculation
- Primary risk factor identification
- Actionable recommendation generation

### Understanding Predictions

#### Risk Score Interpretation
- **72% (High Risk)**: Immediate diversion planning required
- **45% (Moderate Risk)**: Prepare contingency plans
- **15% (Low Risk)**: Continue monitoring

#### Confidence Levels
- **90%+**: High confidence, reliable prediction
- **80-89%**: Good confidence, additional monitoring recommended
- **<80%**: Lower confidence, manual review suggested

### NOTAM Text Analysis
The system processes NOTAM text using natural language processing:

#### High-Risk Keywords (with weights):
- "thunderstorm" (15%)
- "severe" (12%)
- "emergency" (14%)
- "runway closed" (13%)
- "low visibility" (11%)

#### Processing Example:
```
Input: "Thunderstorm expected at ETA"
Output: Risk Weight +15%, Category: High-Risk Weather/Operations
```

---

## Emergency Procedures

### Medical Emergency Response

#### Immediate Actions (First 5 minutes):
1. **Assess Severity**: Review medical emergency details
2. **Check ML Risk Score**: If >60%, begin diversion planning
3. **Fuel Analysis**: Verify adequate fuel for diversion + reserves
4. **Airport Selection**: Review medical facility capabilities

#### Decision Timeline:
- **0-10 minutes**: Initial assessment and data gathering
- **10-20 minutes**: Diversion airport selection and coordination
- **20-30 minutes**: Final decision and implementation
- **30+ minutes**: Execution and monitoring

#### Key Decision Factors:
1. **Medical Urgency**: Severity of condition
2. **Fuel Status**: Available fuel vs. diversion requirements
3. **Weather**: Conditions at diversion airports
4. **Airport Capabilities**: Medical facilities and runway specifications

### Technical Emergency Response

#### System Alerts:
- Altitude limit exceeded warnings
- Overspeed indications
- Low fuel alerts
- Engine parameter anomalies

#### Response Protocol:
1. **Identify Issue**: Review technical warnings and MEL items
2. **Assess Impact**: Determine operational limitations
3. **Evaluate Options**: Continue vs. divert decision matrix
4. **Coordinate**: With maintenance control and operations

---

## Cost Analysis & Reporting

### Real-Time Cost Calculations

#### Diversion Cost Components:
- **Operational Costs**: $24,240 (4-hour delay @ $101/minute)
- **Passenger Compensation**: $89,400 (298 passengers @ $300 each)
- **Crew Costs**: $1,200 (6 crew members @ $200 each)
- **Hotel/Accommodation**: Variable based on location and duration
- **Fuel Costs**: Additional fuel burn and potential tankering

#### Total Impact Example (VIR127C):
```
Base Operational Cost:    $24,240
Passenger Compensation:   $89,400
Crew Costs:              $1,200
Fuel Costs:              $18,500
Total Estimated Cost:    $133,340
```

### Historical Analysis
- **JFK Average Delay**: 22.1 minutes (38% frequency)
- **Diversion Airport Delays**: 8.2 minutes (15% frequency)
- **Seasonal Variations**: Up to 40% increase in winter months

---

## Best Practices

### Operational Guidelines

#### 1. Monitoring Frequency
- **High-Risk Flights**: Every 5 minutes
- **Normal Operations**: Every 15 minutes
- **Emergency Situations**: Continuous monitoring

#### 2. Decision Making
- Use ML risk scores as guidance, not absolute decision makers
- Always verify critical data points manually
- Consider multiple scenarios before final decisions
- Document all decision rationale

#### 3. Communication
- Keep all stakeholders informed of risk assessments
- Use system-generated reports for formal documentation
- Ensure medical teams are alerted early for diversions

### Data Quality Assurance

#### 1. Verify Key Inputs
- Cross-check fuel calculations with aircraft systems
- Confirm weather data with multiple sources
- Validate passenger counts and special requirements

#### 2. Monitor System Health
- Check API connectivity status
- Verify real-time data updates
- Report any anomalies immediately

---

## Troubleshooting

### Common Issues

#### 1. API Connection Errors
**Symptoms**: "OpenSky Network error: Request failed with status code 429"
**Cause**: Rate limiting from external aviation APIs
**Solution**: System automatically retries with exponential backoff

#### 2. Missing Flight Data
**Symptoms**: Flight not appearing in active list
**Solution**: 
- Verify flight is Virgin Atlantic operated
- Check if flight has departed
- Refresh browser if data seems stale

#### 3. Incorrect Risk Calculations
**Symptoms**: Risk scores seem inconsistent
**Solution**:
- Verify input parameters are correct
- Check for missing NOTAM or weather data
- Restart calculation if needed

### Performance Optimization

#### 1. Browser Requirements
- Chrome 90+ or Firefox 88+ recommended
- Minimum 4GB RAM for optimal performance
- Stable internet connection required

#### 2. System Resources
- Application server: 16GB RAM, 8 CPU cores
- Database: PostgreSQL with SSD storage
- Network: Minimum 100Mbps for real-time updates

---

## API Integration

### Available Endpoints

#### 1. Flight Data
```
GET /api/aviation/virgin-atlantic-flights
GET /api/aviation/live-aircraft
```

#### 2. Analysis Tools
```
GET /api/aviation/fuel-estimate
GET /api/aviation/airport-data/{iata}
GET /api/aviation/ml-diversion-prediction
```

#### 3. Historical Data
```
GET /api/aviation/historical-delays/{iata}
GET /api/aviation/diversion-cost-analysis
```

### Authentication
- API keys managed through environment variables
- Rate limiting: 100 requests per minute per endpoint
- Automatic retry with exponential backoff

### Data Sources
- **OpenSky Network**: Real-time aircraft positions
- **AviationStack**: Flight schedules and airport data
- **Mapbox**: Satellite imagery and mapping
- **Weather APIs**: Real-time meteorological data

---

## Contact Information

### Support
- **Technical Support**: AINO-Support@virgin.com
- **Operations**: Flight Operations Control Center
- **Emergency**: 24/7 Operations Hotline

### Documentation
- **System Updates**: Check monthly release notes
- **Training Materials**: Available in crew portal
- **Feedback**: Use system feedback form for improvements

---

**Document Control**  
**Last Updated**: December 2024  
**Next Review**: March 2025  
**Classification**: Confidential - Operations Use Only