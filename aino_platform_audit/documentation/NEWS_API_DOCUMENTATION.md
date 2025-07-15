# AINO News Intelligence API Integration

## Overview
The AINO platform now includes comprehensive geopolitical intelligence capabilities powered by multiple professional news APIs to provide real-time risk assessment for Virgin Atlantic operations.

## Integrated News Sources

### 1. NewsAPI.org
- **Free Tier**: Personal and commercial use
- **Coverage**: 40,000+ sources in 50+ countries
- **Features**: Live, historical, and top aggregated news stories
- **Environment Variable**: `NEWS_API_KEY` or `NEWSAPI_ORG_KEY`
- **Endpoint**: https://newsapi.org/v2/

### 2. NewsData.io
- **Free Tier**: Development and testing available
- **Coverage**: 80,000+ sources globally
- **Features**: Real-time and historical news, trending stories
- **Environment Variable**: `NEWSDATA_API_KEY` or `NEWSDATA_IO_KEY`
- **Endpoint**: https://newsdata.io/api/1/

### 3. Mediastack
- **Free Plan**: Available with REST API
- **Coverage**: 7,500+ sources worldwide
- **Features**: Real-time headlines and blog articles
- **Environment Variable**: `MEDIASTACK_API_KEY`
- **Endpoint**: http://api.mediastack.com/v1/

### 4. GNews API
- **Free Tier**: Available for developers
- **Features**: Top headlines with easy integration
- **Environment Variable**: `GNEWS_API_KEY`
- **Endpoint**: https://gnews.io/api/v4/

### 5. World News API
- **Coverage**: 86 languages, 210 countries
- **Features**: Real-time, historical data, semantic search, location tagging
- **Environment Variable**: `WORLD_NEWS_API_KEY`
- **Endpoint**: https://api.worldnewsapi.com/

### 6. The Guardian API
- **Free Access**: Research and personal projects
- **Features**: Extensive archive access
- **Environment Variable**: `GUARDIAN_API_KEY`
- **Endpoint**: https://content.guardianapis.com/

### 7. New York Times API
- **Free Tier**: Historical archives and multimedia content
- **Features**: Comprehensive news search
- **Environment Variable**: `NYT_API_KEY` or `NYTIMES_API_KEY`
- **Endpoint**: https://api.nytimes.com/svc/

## API Integration Features

### Geopolitical Risk Analysis
- **Endpoint**: `/api/news/geopolitical-risk/:region`
- **Regions Supported**: 
  - Eastern Mediterranean
  - South China Sea
  - Eastern Europe
  - North Atlantic
- **Analysis Includes**:
  - Risk level assessment (critical/high/medium/low)
  - Risk factors with impact categories
  - Operational recommendations
  - Article sentiment analysis
  - Keyword extraction

### News API Health Monitoring
- **Endpoint**: `/api/news/test-connections`
- **Features**:
  - Real-time API status checking
  - Connection success/failure reporting
  - Error message details
  - Service availability monitoring

## Virgin Atlantic Operational Integration

### Risk Categories Analyzed
1. **Geopolitical Events**
   - Military operations
   - Diplomatic tensions
   - Economic sanctions
   
2. **Aviation Security**
   - Airspace restrictions
   - Security threats
   - Regulatory changes

3. **Economic Factors**
   - Currency fluctuations
   - Fuel cost impacts
   - Insurance premiums

4. **Operational Impacts**
   - Route diversions
   - Schedule disruptions
   - Cost implications

### Route-Specific Analysis
- **LHR-TLV**: Eastern Mediterranean focus
- **LGW-MCO**: North Atlantic monitoring
- **MAN-JFK**: Transatlantic corridor assessment
- **LHR-HKG**: South China Sea surveillance

## Dashboard Features

### News Intelligence Dashboard
- **API Connection Status**: Real-time monitoring of all news sources
- **Risk Analysis**: Comprehensive regional risk assessment
- **Live Intelligence Feed**: Current news articles with aviation relevance
- **Filtering**: By region, risk level, and news source
- **Export**: Risk reports for operational teams

### Integration with Existing Systems
- **Geopolitical Risk Centre**: Enhanced with real news data
- **Diversion Decision Engine**: Informed by current intelligence
- **Operations Center**: Real-time risk alerts
- **Flight Planning**: Route risk assessment

## Setup Instructions

### Environment Configuration
```bash
# Primary News APIs
NEWS_API_KEY=your_newsapi_key
NEWSDATA_API_KEY=your_newsdata_key
MEDIASTACK_API_KEY=your_mediastack_key
GNEWS_API_KEY=your_gnews_key

# Premium Sources
WORLD_NEWS_API_KEY=your_worldnews_key
GUARDIAN_API_KEY=your_guardian_key
NYT_API_KEY=your_nyt_key
```

### Testing API Connections
1. Navigate to News Intelligence Dashboard
2. Click "Test APIs" to verify connections
3. Review connection status for each source
4. Configure missing API keys as needed

### Loading Geopolitical Intelligence
1. Click "Load Intelligence" to fetch current analysis
2. Select specific regions for focused assessment
3. Review risk factors and operational recommendations
4. Export reports for operations teams

## Fallback Systems

### Open Source News Feeds
When premium APIs are unavailable, the system automatically falls back to:
- BBC RSS feeds
- Reuters open feeds
- Associated Press public feeds
- Al Jazeera international feed

### Cached Intelligence
- 15-minute cache duration for real-time performance
- Offline analysis capabilities
- Historical risk pattern matching

## Compliance and Security

### Data Handling
- All API keys stored as environment variables
- No news content stored permanently
- Compliance with news source terms of service
- Rate limiting respected for all APIs

### Virgin Atlantic Specific
- GDPR compliant data processing
- Aviation industry security standards
- Operational data integration protocols
- Emergency response compatibility

## Support and Monitoring

### Health Checks
- Automated API availability testing
- Connection failure alerts
- Performance monitoring
- Usage analytics

### Operational Support
- 24/7 news intelligence monitoring
- Crisis situation enhanced coverage
- Executive briefing capabilities
- Integration with Virgin Atlantic operations center

## Future Enhancements

### Planned Features
- Machine learning sentiment analysis
- Predictive risk modeling
- Natural language processing for threat detection
- Integration with aviation weather services
- Automated operational recommendations

### API Expansion
- Additional regional news sources
- Industry-specific aviation publications
- Regulatory body feeds
- Social media monitoring integration