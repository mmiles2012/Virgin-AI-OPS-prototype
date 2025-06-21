#!/usr/bin/env python3
"""
Aviation Economic Analyzer for AINO Aviation Intelligence Platform
ML-powered economic impact prediction and market analysis
"""

import pandas as pd
import numpy as np
import re
from datetime import datetime, timedelta
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import requests
from textblob import TextBlob
import json
import warnings

warnings.filterwarnings('ignore')

class AviationEconomicAnalyzer:
    def __init__(self):
        self.economic_keywords = {
            'fuel_price': ['jet fuel', 'oil price', 'crude oil', 'fuel cost', 'brent', 'wti', 'petroleum'],
            'currency': ['usd', 'eur', 'gbp', 'exchange rate', 'currency', 'forex', 'dollar', 'euro'],
            'inflation': ['inflation', 'cpi', 'consumer price', 'cost increase', 'price rise'],
            'interest_rates': ['interest rate', 'fed rate', 'monetary policy', 'central bank'],
            'economic_indicators': ['gdp', 'unemployment', 'recession', 'economic growth', 'market volatility'],
            'airline_costs': ['operational cost', 'maintenance cost', 'labor cost', 'overhead'],
            'demand_factors': ['passenger demand', 'travel demand', 'booking', 'capacity', 'load factor']
        }
        
        self.price_patterns = {
            'currency': r'\$?(\d+\.?\d*)\s*(usd|eur|gbp|dollars?|euros?|pounds?)',
            'fuel_price': r'\$?(\d+\.?\d*)\s*(?:per\s+)?(?:barrel|gallon|litre?)',
            'percentage': r'(\d+\.?\d*)%',
            'numbers': r'\b(\d+(?:,\d{3})*(?:\.\d+)?)\b'
        }
        
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        
    def extract_economic_factors(self, text):
        """Extract economic factors from news text"""
        text_lower = text.lower()
        factors = {}
        
        # Extract keywords for each category
        for category, keywords in self.economic_keywords.items():
            matches = []
            for keyword in keywords:
                if keyword in text_lower:
                    matches.append(keyword)
            factors[category] = matches
            
        # Extract numerical values
        for pattern_name, pattern in self.price_patterns.items():
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            factors[f'{pattern_name}_values'] = matches
            
        return factors
    
    def analyze_sentiment(self, text):
        """Analyze sentiment of economic news"""
        blob = TextBlob(text)
        return {
            'polarity': blob.sentiment.polarity,
            'subjectivity': blob.sentiment.subjectivity
        }
    
    def create_features(self, news_data):
        """Create features for ML model"""
        features_list = []
        labels = []
        
        for article in news_data:
            text = article.get('text', '')
            
            # Extract economic factors
            economic_factors = self.extract_economic_factors(text)
            
            # Sentiment analysis
            sentiment = self.analyze_sentiment(text)
            
            # Create feature vector
            features = {
                'fuel_mentions': len(economic_factors.get('fuel_price', [])),
                'currency_mentions': len(economic_factors.get('currency', [])),
                'inflation_mentions': len(economic_factors.get('inflation', [])),
                'interest_rate_mentions': len(economic_factors.get('interest_rates', [])),
                'economic_indicator_mentions': len(economic_factors.get('economic_indicators', [])),
                'sentiment_polarity': sentiment['polarity'],
                'sentiment_subjectivity': sentiment['subjectivity'],
                'text_length': len(text),
                'has_price_data': len(economic_factors.get('numbers_values', [])) > 0
            }
            
            features_list.append(features)
            
            # Create label based on economic impact
            impact_score = (features['fuel_mentions'] * 2 + 
                          features['currency_mentions'] * 1.5 + 
                          features['inflation_mentions'] * 1.8 +
                          features['interest_rate_mentions'] * 1.3)
            
            if impact_score >= 5:
                labels.append('high_impact')
            elif impact_score >= 2:
                labels.append('medium_impact')
            else:
                labels.append('low_impact')
        
        return pd.DataFrame(features_list), labels
    
    def train_model(self, news_data):
        """Train the ML model"""
        print("Creating features from aviation economic news data...")
        features_df, labels = self.create_features(news_data)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            features_df, labels, test_size=0.2, random_state=42
        )
        
        # Train classifier
        print("Training economic impact prediction model...")
        self.classifier.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.classifier.predict(X_test)
        print("\nEconomic Impact Model Performance:")
        print(classification_report(y_test, y_pred))
        
        return X_test, y_test, y_pred
    
    def predict_economic_impact(self, text):
        """Predict economic impact of news article"""
        # Extract features
        economic_factors = self.extract_economic_factors(text)
        sentiment = self.analyze_sentiment(text)
        
        features = {
            'fuel_mentions': len(economic_factors.get('fuel_price', [])),
            'currency_mentions': len(economic_factors.get('currency', [])),
            'inflation_mentions': len(economic_factors.get('inflation', [])),
            'interest_rate_mentions': len(economic_factors.get('interest_rates', [])),
            'economic_indicator_mentions': len(economic_factors.get('economic_indicators', [])),
            'sentiment_polarity': sentiment['polarity'],
            'sentiment_subjectivity': sentiment['subjectivity'],
            'text_length': len(text),
            'has_price_data': len(economic_factors.get('numbers_values', [])) > 0
        }
        
        features_df = pd.DataFrame([features])
        prediction = self.classifier.predict(features_df)[0]
        probability = self.classifier.predict_proba(features_df)[0]
        
        return {
            'prediction': prediction,
            'probability': dict(zip(self.classifier.classes_, probability)),
            'economic_factors': economic_factors,
            'sentiment': sentiment
        }
    
    def fetch_aviation_news(self, api_key=None):
        """Fetch real aviation economic news"""
        # This would integrate with news APIs in production
        # For demo, we'll simulate with structured data
        current_news = [
            {
                'title': 'Oil Prices Surge Amid Global Supply Concerns',
                'text': 'Crude oil prices climbed 4.2% to $87.50 per barrel today, driven by supply disruptions and geopolitical tensions. The increase is expected to impact airline operational costs, with jet fuel prices rising to $2.85 per gallon. Major carriers including Virgin Atlantic are monitoring fuel costs closely as the price surge could affect quarterly margins.',
                'timestamp': datetime.now().isoformat(),
                'source': 'Aviation Economic Monitor'
            },
            {
                'title': 'Federal Reserve Maintains Interest Rates',
                'text': 'The Federal Reserve held interest rates steady at 5.25%, providing relief for airlines planning aircraft acquisitions. The decision supports capital investment in the aviation sector, with Boeing reporting increased order interest. Currency markets remained stable with USD/EUR at 1.08.',
                'timestamp': datetime.now().isoformat(),
                'source': 'Financial Aviation Daily'
            },
            {
                'title': 'European Airlines Report Strong Q2 Performance',
                'text': 'European carriers including Lufthansa and Virgin Atlantic reported robust passenger demand with load factors exceeding 85%. The recovery in business travel has boosted premium cabin revenues by 15% year-over-year. Currency hedging strategies have protected against EUR volatility.',
                'timestamp': datetime.now().isoformat(),
                'source': 'European Aviation Report'
            }
        ]
        
        return current_news
    
    def generate_aviation_economic_report(self, news_articles=None):
        """Generate comprehensive aviation economic analysis report"""
        if news_articles is None:
            news_articles = self.fetch_aviation_news()
        
        print("Generating Aviation Economic Intelligence Report...")
        print("=" * 70)
        
        # Analyze all articles
        all_factors = []
        impact_predictions = []
        economic_alerts = []
        
        for i, article in enumerate(news_articles):
            text = article.get('text', '')
            result = self.predict_economic_impact(text)
            all_factors.append(result['economic_factors'])
            impact_predictions.append(result['prediction'])
            
            print(f"\nArticle {i+1}:")
            print(f"Title: {article.get('title', 'N/A')}")
            print(f"Economic Impact: {result['prediction'].upper()}")
            print(f"Confidence: {max(result['probability'].values()):.3f}")
            print(f"Sentiment: {result['sentiment']['polarity']:.2f}")
            
            # Generate alerts for high impact articles
            if result['prediction'] == 'high_impact':
                economic_alerts.append({
                    'title': article.get('title'),
                    'impact_level': 'HIGH',
                    'confidence': max(result['probability'].values()),
                    'key_factors': [k for k, v in result['economic_factors'].items() if v and not k.endswith('_values')]
                })
            
            # Show key economic factors
            significant_factors = []
            for category, mentions in result['economic_factors'].items():
                if mentions and not category.endswith('_values'):
                    significant_factors.append(f"{category}: {mentions}")
                    print(f"  {category}: {mentions}")
            
            # Extract price information
            for category, values in result['economic_factors'].items():
                if category.endswith('_values') and values:
                    print(f"  {category.replace('_values', '')}: {values}")
        
        # Summary statistics
        print(f"\n\nAVIATION ECONOMIC SUMMARY:")
        print(f"Total articles analyzed: {len(news_articles)}")
        print(f"High impact articles: {impact_predictions.count('high_impact')}")
        print(f"Medium impact articles: {impact_predictions.count('medium_impact')}")
        print(f"Low impact articles: {impact_predictions.count('low_impact')}")
        
        # Market sentiment analysis
        avg_sentiment = np.mean([self.analyze_sentiment(article.get('text', ''))['polarity'] 
                                for article in news_articles])
        sentiment_label = "Positive" if avg_sentiment > 0.1 else "Negative" if avg_sentiment < -0.1 else "Neutral"
        
        print(f"\nMARKET SENTIMENT ANALYSIS:")
        print(f"Overall sentiment: {sentiment_label} ({avg_sentiment:.3f})")
        
        # Generate operational recommendations
        recommendations = self._generate_economic_recommendations(impact_predictions, economic_alerts, avg_sentiment)
        
        print(f"\nECONOMIC RECOMMENDATIONS:")
        for i, rec in enumerate(recommendations, 1):
            print(f"{i}. {rec}")
        
        return {
            'timestamp': datetime.now().isoformat(),
            'impact_distribution': {
                'high': impact_predictions.count('high_impact'),
                'medium': impact_predictions.count('medium_impact'),
                'low': impact_predictions.count('low_impact')
            },
            'market_sentiment': {
                'score': avg_sentiment,
                'label': sentiment_label
            },
            'economic_alerts': economic_alerts,
            'recommendations': recommendations,
            'detailed_analysis': all_factors
        }
    
    def _generate_economic_recommendations(self, impact_predictions, economic_alerts, sentiment):
        """Generate actionable economic recommendations"""
        recommendations = []
        
        high_impact_count = impact_predictions.count('high_impact')
        
        if high_impact_count >= 2:
            recommendations.append("URGENT: Multiple high-impact economic factors detected - Review fuel hedging strategies")
            recommendations.append("Monitor currency exposure on international routes")
        
        if sentiment < -0.2:
            recommendations.append("Negative market sentiment - Consider defensive operational strategies")
        elif sentiment > 0.2:
            recommendations.append("Positive market sentiment - Potential expansion opportunities")
        
        # Fuel-specific recommendations
        fuel_alerts = [alert for alert in economic_alerts if any('fuel' in factor for factor in alert.get('key_factors', []))]
        if fuel_alerts:
            recommendations.append("Fuel price volatility detected - Implement fuel cost optimization measures")
        
        # Currency recommendations
        currency_alerts = [alert for alert in economic_alerts if any('currency' in factor for factor in alert.get('key_factors', []))]
        if currency_alerts:
            recommendations.append("Currency fluctuations identified - Review foreign exchange hedging positions")
        
        # Standard recommendations
        recommendations.extend([
            "Continue monitoring economic indicators for operational planning",
            "Update quarterly financial forecasts based on current economic trends",
            "Coordinate with procurement team on strategic purchasing decisions"
        ])
        
        return recommendations

def create_comprehensive_sample_data():
    """Create comprehensive sample aviation economic data"""
    sample_articles = [
        {
            'title': 'Rising Jet Fuel Costs Impact Virgin Atlantic Operations',
            'text': 'Virgin Atlantic faces significant operational challenges as jet fuel prices have surged 18% this quarter to $2.95 per gallon. The airline is implementing fuel efficiency measures across its A350 and A330 fleet. WTI crude oil reached $89 per barrel, with Brent crude at $92. The carrier is considering dynamic fuel surcharges for transatlantic routes to offset the estimated $45 million quarterly impact.',
            'timestamp': datetime.now().isoformat(),
            'source': 'Aviation Fuel Report'
        },
        {
            'title': 'Bank of England Rate Decision Affects UK Aviation Financing',
            'text': 'The Bank of England raised interest rates by 0.25% to 5.5%, impacting aircraft lease financing costs for UK carriers. Virgin Atlantic and British Airways are reassessing their fleet expansion plans as borrowing costs increase. The pound strengthened 2.1% against the dollar following the announcement, providing some relief on USD-denominated expenses.',
            'timestamp': datetime.now().isoformat(),
            'source': 'UK Aviation Finance'
        },
        {
            'title': 'Passenger Demand Surge Drives Revenue Growth',
            'text': 'Virgin Atlantic reported exceptional passenger demand with 89% load factors on key routes including LHR-JFK and LHR-LAX. Premium cabin bookings increased 22% year-over-year, generating significant revenue uplift. The carrier expects $180 million additional quarterly revenue from the demand recovery, offsetting fuel cost pressures.',
            'timestamp': datetime.now().isoformat(),
            'source': 'Passenger Demand Analytics'
        },
        {
            'title': 'Global Supply Chain Disruptions Affect Maintenance Costs',
            'text': 'Aviation maintenance costs have increased 12% due to supply chain bottlenecks and component shortages. Aircraft parts inflation is running at 8% annually, with specialized components seeing 15% price increases. Airlines are extending maintenance intervals where regulations permit and building strategic inventory buffers.',
            'timestamp': datetime.now().isoformat(),
            'source': 'Aviation Maintenance Report'
        },
        {
            'title': 'ECB Monetary Policy Impacts European Aviation',
            'text': 'The European Central Bank maintained rates at 4.5% but signaled potential future increases due to persistent inflation at 3.2%. European airlines are managing currency volatility with EUR/USD fluctuating between 1.05 and 1.12. Lufthansa and Air France-KLM reported 6% currency impact on international operations.',
            'timestamp': datetime.now().isoformat(),
            'source': 'European Aviation Economics'
        }
    ]
    
    return sample_articles

def main():
    """Demonstrate aviation economic analysis system"""
    # Initialize analyzer
    analyzer = AviationEconomicAnalyzer()
    
    print("=== AINO Aviation Economic Intelligence System ===\n")
    
    # Create comprehensive sample data
    sample_news = create_comprehensive_sample_data()
    
    # Train model
    analyzer.train_model(sample_news)
    
    # Generate comprehensive report
    report = analyzer.generate_aviation_economic_report(sample_news)
    
    # Test real-time analysis
    print(f"\n\nREAL-TIME ECONOMIC IMPACT ANALYSIS:")
    print("=" * 50)
    
    test_scenario = """
    Breaking: Oil prices spike 6% to $94 per barrel following geopolitical tensions. 
    Jet fuel costs now averaging $3.15 per gallon, representing a 25% quarterly increase. 
    Airlines face estimated $2.1 billion industry-wide cost impact. USD strengthens 
    against major currencies as investors seek safe haven assets.
    """
    
    result = analyzer.predict_economic_impact(test_scenario)
    print(f"Scenario Impact Prediction: {result['prediction'].upper()}")
    print(f"Confidence Level: {max(result['probability'].values()):.3f}")
    print(f"Market Sentiment: {result['sentiment']['polarity']:.3f}")
    
    # Save comprehensive analysis
    with open('aviation_economic_analysis.json', 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"\nComprehensive economic analysis saved to 'aviation_economic_analysis.json'")
    print(f"Analysis completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")

if __name__ == "__main__":
    main()