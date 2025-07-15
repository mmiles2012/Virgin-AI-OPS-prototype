#!/usr/bin/env python3
"""
Aviation News Intelligence System for AINO Platform
ML-powered news analysis and operational intelligence
"""

import os
import json
import sqlite3
import requests
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
import re
from dataclasses import dataclass, asdict
from flask import Flask, render_template_string, request, jsonify
import threading
import time
from collections import defaultdict
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class NewsArticle:
    """Data structure for news articles"""
    title: str
    content: str
    url: str
    source: str
    published_at: str
    relevance_score: float = 0.0
    categories: List[str] = None
    entities: Dict[str, List[str]] = None
    sentiment: float = 0.0

    def __post_init__(self):
        if self.categories is None:
            self.categories = []
        if self.entities is None:
            self.entities = {}

class AviationNewsClassifier:
    """ML classifier for aviation-relevant news"""
    
    def __init__(self):
        self.categories = [
            'direct_aviation', 'energy', 'economics', 'currency', 
            'geopolitics', 'military', 'weather', 'regulation'
        ]
        
        # Aviation-specific keywords and entities
        self.aviation_keywords = {
            'direct_aviation': [
                'airline', 'aircraft', 'airport', 'aviation', 'flight', 'pilot', 'crew',
                'boeing', 'airbus', 'embraer', 'bombardier', 'delta', 'united', 'american',
                'lufthansa', 'emirates', 'qatar airways', 'singapore airlines', 'cathay pacific',
                'virgin atlantic', 'british airways', 'air france', 'klm',
                'faa', 'icao', 'iata', 'terminal', 'runway', 'atc', 'air traffic control',
                'passenger', 'cargo', 'fleet', 'route', 'capacity', 'load factor', 'hub',
                'maintenance', 'mechanic', 'hangar', 'gate', 'boarding', 'takeoff', 'landing'
            ],
            'energy': [
                'oil price', 'fuel cost', 'jet fuel', 'crude oil', 'opec', 'energy crisis',
                'fuel efficiency', 'sustainable aviation fuel', 'saf', 'biofuel', 'kerosene',
                'fuel surcharge', 'energy prices', 'petroleum', 'refinery', 'barrel'
            ],
            'economics': [
                'gdp', 'inflation', 'recession', 'economic growth', 'interest rates',
                'federal reserve', 'unemployment', 'consumer spending', 'business travel',
                'revenue', 'profit', 'loss', 'earnings', 'stock price', 'market cap',
                'bankruptcy', 'merger', 'acquisition', 'ipo', 'financial results'
            ],
            'currency': [
                'dollar', 'usd', 'exchange rate', 'currency', 'forex', 'devaluation',
                'euro', 'yen', 'pound', 'rmb', 'yuan', 'cad', 'aud', 'hedging',
                'currency fluctuation', 'strong dollar', 'weak dollar'
            ],
            'geopolitics': [
                'sanctions', 'trade war', 'diplomatic', 'border', 'visa', 'travel ban',
                'international relations', 'conflict', 'peace treaty', 'alliance',
                'embargo', 'tariff', 'bilateral agreement', 'airspace rights',
                'open skies', 'aviation agreement', 'diplomatic immunity'
            ],
            'military': [
                'defense', 'military aircraft', 'fighter jet', 'air force', 'nato',
                'defense contract', 'military spending', 'airspace', 'no-fly zone',
                'military transport', 'drone', 'surveillance', 'reconnaissance'
            ],
            'weather': [
                'hurricane', 'storm', 'weather', 'climate', 'volcanic ash',
                'extreme weather', 'flight delay', 'cancellation', 'turbulence',
                'lightning', 'fog', 'wind shear', 'ice', 'snow', 'thunderstorm'
            ],
            'regulation': [
                'regulation', 'safety', 'compliance', 'certification', 'faa approval',
                'airworthiness', 'maintenance', 'inspection', 'aviation law',
                'safety directive', 'ad', 'airworthiness directive', 'mandate',
                'fine', 'penalty', 'investigation', 'audit', 'violation'
            ]
        }
        
        self.importance_weights = {
            'direct_aviation': 1.0,
            'energy': 0.8,
            'economics': 0.7,
            'currency': 0.7,
            'geopolitics': 0.6,
            'military': 0.5,
            'weather': 0.4,
            'regulation': 0.9
        }

    def calculate_relevance_score(self, article: NewsArticle) -> float:
        """Calculate overall relevance score for an article"""
        score = 0.0
        text = f"{article.title} {article.content}".lower()
        
        # Category-based scoring
        for category, keywords in self.aviation_keywords.items():
            category_score = 0
            for keyword in keywords:
                if keyword in text:
                    # Give more weight to title matches
                    if keyword in article.title.lower():
                        category_score += 2
                    else:
                        category_score += 1
                        
            weight = self.importance_weights.get(category, 0.5)
            score += category_score * weight
        
        # Bonus for multiple category matches
        matching_categories = len(self.classify_categories(article))
        if matching_categories > 1:
            score *= (1 + matching_categories * 0.1)
            
        # Normalize score (approximate)
        return min(score * 5, 100)  # Scale to 0-100

    def classify_categories(self, article: NewsArticle) -> List[str]:
        """Classify article into relevant categories"""
        text = f"{article.title} {article.content}".lower()
        relevant_categories = []
        
        for category, keywords in self.aviation_keywords.items():
            matches = sum(1 for keyword in keywords if keyword in text)
            if matches > 0:
                relevant_categories.append(category)
                
        return relevant_categories

class NewsAggregator:
    """Aggregates news from multiple sources"""
    
    def __init__(self):
        self.api_key = os.getenv('NEWS_API_KEY', '')

    def fetch_news(self, query: str = 'aviation OR airline OR aircraft', hours_back: int = 24) -> List[NewsArticle]:
        """Fetch news from configured sources"""
        articles = []
        
        # Try to fetch from NewsAPI if key is available
        if self.api_key and self.api_key != '':
            try:
                articles.extend(self._fetch_from_newsapi(query, hours_back))
            except Exception as e:
                logger.error(f"Error fetching from NewsAPI: {e}")
        
        # Include realistic aviation news examples for demonstration
        articles.extend(self._generate_realistic_examples())
        
        return articles

    def _fetch_from_newsapi(self, query: str, hours_back: int) -> List[NewsArticle]:
        """Fetch from NewsAPI"""
        articles = []
        
        params = {
            'q': query,
            'from': (datetime.now() - timedelta(hours=hours_back)).isoformat(),
            'sortBy': 'publishedAt',
            'apiKey': self.api_key,
            'language': 'en',
            'pageSize': 50
        }
        
        try:
            response = requests.get('https://newsapi.org/v2/everything', params=params, timeout=10)
            data = response.json()
            
            if data.get('status') == 'ok':
                for item in data.get('articles', []):
                    if item.get('title') and item.get('description'):
                        article = NewsArticle(
                            title=item['title'],
                            content=item.get('description', '') + ' ' + (item.get('content', '') or ''),
                            url=item.get('url', ''),
                            source=item.get('source', {}).get('name', 'Unknown'),
                            published_at=item['publishedAt']
                        )
                        articles.append(article)
        except Exception as e:
            logger.error(f"NewsAPI error: {e}")
            
        return articles

    def _generate_realistic_examples(self) -> List[NewsArticle]:
        """Generate realistic aviation news examples for demonstration"""
        examples = [
            {
                'title': 'Virgin Atlantic Announces Fleet Modernization with New A350-1000 Deliveries',
                'content': 'Virgin Atlantic has confirmed the delivery of three new Airbus A350-1000 aircraft as part of its ongoing fleet modernization program. The aircraft will enter service on transatlantic routes, featuring enhanced fuel efficiency and passenger comfort.',
                'source': 'Aviation Business Weekly',
                'hours_ago': 2
            },
            {
                'title': 'Jet Fuel Prices Rise 12% Following OPEC Production Cuts',
                'content': 'Commercial aviation faces increased operational costs as jet fuel prices surge following OPEC production restrictions. Airlines are implementing fuel surcharges and optimizing route planning to maintain profitability.',
                'source': 'Energy Aviation Report',
                'hours_ago': 4
            },
            {
                'title': 'ICAO Introduces New Safety Management System Requirements',
                'content': 'The International Civil Aviation Organization has mandated enhanced safety management systems for all commercial operators by 2025. The requirements focus on predictive maintenance and data-driven safety protocols.',
                'source': 'Aviation Safety Today',
                'hours_ago': 6
            },
            {
                'title': 'Severe Weather Pattern Disrupts European Air Traffic Network',
                'content': 'A major storm system across Northern Europe has caused significant flight delays and cancellations. Air traffic control centers are implementing enhanced coordination protocols to manage capacity reductions.',
                'source': 'European Aviation Weather Service',
                'hours_ago': 8
            }
        ]
        
        articles = []
        for i, example in enumerate(examples):
            published_time = datetime.now() - timedelta(hours=example['hours_ago'])
            article = NewsArticle(
                title=example['title'],
                content=example['content'],
                url=f"https://aviation-news.example.com/article-{i+1}",
                source=example['source'],
                published_at=published_time.isoformat()
            )
            articles.append(article)
            
        return articles

class DatabaseManager:
    """Manages SQLite database operations"""
    
    def __init__(self, db_path: str = 'aviation_news.db'):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Initialize database tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Articles table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT,
                url TEXT,
                source TEXT,
                published_at TEXT,
                relevance_score REAL,
                categories TEXT,
                entities TEXT,
                sentiment REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create index for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_relevance_score ON articles(relevance_score)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_created_at ON articles(created_at)')
        
        conn.commit()
        conn.close()

    def save_article(self, article: NewsArticle):
        """Save article to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Check if article already exists (by title)
        cursor.execute('SELECT id FROM articles WHERE title = ?', (article.title,))
        if cursor.fetchone():
            conn.close()
            return  # Skip duplicate
        
        cursor.execute('''
            INSERT INTO articles 
            (title, content, url, source, published_at, relevance_score, categories, entities, sentiment)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            article.title,
            article.content,
            article.url,
            article.source,
            article.published_at,
            article.relevance_score,
            json.dumps(article.categories),
            json.dumps(article.entities),
            article.sentiment
        ))
        
        conn.commit()
        conn.close()

    def get_articles(self, limit: int = 50, min_relevance: float = 0.0, category: str = '') -> List[Dict]:
        """Retrieve articles from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        base_query = '''
            SELECT * FROM articles 
            WHERE relevance_score >= ?
        '''
        params = [min_relevance]
        
        if category:
            base_query += ' AND categories LIKE ?'
            params.append(f'%"{category}"%')
            
        base_query += ' ORDER BY relevance_score DESC, published_at DESC LIMIT ?'
        params.append(limit)
        
        cursor.execute(base_query, params)
        
        columns = [description[0] for description in cursor.description]
        articles = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        # Parse JSON fields
        for article in articles:
            try:
                article['categories'] = json.loads(article.get('categories', '[]'))
                article['entities'] = json.loads(article.get('entities', '{}'))
            except:
                article['categories'] = []
                article['entities'] = {}
            
        conn.close()
        return articles

    def get_analytics(self) -> Dict:
        """Get analytics data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get basic stats
        cursor.execute('SELECT COUNT(*), AVG(relevance_score) FROM articles WHERE DATE(created_at) = DATE("now")')
        today_stats = cursor.fetchone()
        
        cursor.execute('SELECT COUNT(*), AVG(relevance_score) FROM articles')
        total_stats = cursor.fetchone()
        
        # Get category distribution
        cursor.execute('SELECT categories FROM articles WHERE categories != "[]" AND categories IS NOT NULL')
        all_categories = []
        for row in cursor.fetchall():
            try:
                cats = json.loads(row[0])
                all_categories.extend(cats)
            except:
                continue
            
        category_counts = defaultdict(int)
        for cat in all_categories:
            category_counts[cat] += 1
            
        conn.close()
        
        return {
            'today_articles': today_stats[0] or 0,
            'today_avg_relevance': round(today_stats[1] or 0, 2),
            'total_articles': total_stats[0] or 0,
            'total_avg_relevance': round(total_stats[1] or 0, 2),
            'category_distribution': dict(category_counts)
        }

class AviationNewsIntelligence:
    """Main aviation news intelligence engine"""
    
    def __init__(self):
        self.aggregator = NewsAggregator()
        self.classifier = AviationNewsClassifier()
        self.db = DatabaseManager()
        self.running = False
        
    def start_monitoring(self):
        """Start continuous news monitoring"""
        self.running = True
        self._monitor_thread = threading.Thread(target=self._monitoring_loop)
        self._monitor_thread.daemon = True
        self._monitor_thread.start()
        logger.info("Aviation news monitoring started")
        
    def stop_monitoring(self):
        """Stop news monitoring"""
        self.running = False
        logger.info("Aviation news monitoring stopped")
        
    def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.running:
            try:
                self.collect_and_analyze_news()
                time.sleep(1800)  # Check every 30 minutes
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(300)  # Wait 5 minutes on error
                
    def collect_and_analyze_news(self):
        """Collect and analyze news articles"""
        logger.info("Collecting aviation news...")
        
        # Fetch articles
        articles = self.aggregator.fetch_news()
        
        # Process each article
        processed_count = 0
        for article in articles:
            # Calculate relevance score
            article.relevance_score = self.classifier.calculate_relevance_score(article)
            
            # Classify categories
            article.categories = self.classifier.classify_categories(article)
            
            # Save to database
            self.db.save_article(article)
            processed_count += 1
            
        logger.info(f"Processed {processed_count} articles")
        
    def get_intelligence_report(self) -> Dict:
        """Generate intelligence report"""
        # Get recent high-relevance articles
        articles = self.db.get_articles(limit=20, min_relevance=10.0)
        
        # Get analytics
        analytics = self.db.get_analytics()
        
        # Generate operational alerts
        alerts = self._generate_operational_alerts(articles)
        
        return {
            'timestamp': datetime.now().isoformat(),
            'articles': articles,
            'analytics': analytics,
            'operational_alerts': alerts,
            'summary': self._generate_summary(articles, analytics)
        }
        
    def _generate_operational_alerts(self, articles: List[Dict]) -> List[Dict]:
        """Generate operational alerts from articles"""
        alerts = []
        
        for article in articles:
            alert_level = 'info'
            if article['relevance_score'] > 50:
                alert_level = 'high'
            elif article['relevance_score'] > 25:
                alert_level = 'medium'
                
            if 'direct_aviation' in article['categories']:
                alerts.append({
                    'type': 'operational',
                    'level': alert_level,
                    'title': article['title'],
                    'summary': article['content'][:200] + '...',
                    'source': article['source'],
                    'relevance_score': article['relevance_score'],
                    'timestamp': article['published_at']
                })
                
        return alerts[:10]  # Return top 10 alerts
        
    def _generate_summary(self, articles: List[Dict], analytics: Dict) -> str:
        """Generate intelligence summary"""
        if not articles:
            return "No significant aviation news detected in the current monitoring period."
            
        summary = f"Analyzed {analytics['today_articles']} articles today with average relevance of {analytics['today_avg_relevance']}%. "
        
        # Identify top categories
        top_categories = sorted(
            analytics['category_distribution'].items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:3]
        
        if top_categories:
            cat_summary = ", ".join([f"{cat} ({count})" for cat, count in top_categories])
            summary += f"Primary focus areas: {cat_summary}. "
            
        # Highlight high-relevance articles
        high_relevance = [a for a in articles if a['relevance_score'] > 40]
        if high_relevance:
            summary += f"Identified {len(high_relevance)} high-priority operational intelligence items requiring attention."
            
        return summary

# Initialize the intelligence system
aviation_intelligence = AviationNewsIntelligence()

def main():
    """Main function for standalone operation"""
    print("Starting Aviation News Intelligence System...")
    
    # Start monitoring
    aviation_intelligence.start_monitoring()
    
    # Generate initial report
    report = aviation_intelligence.get_intelligence_report()
    print(f"Intelligence Report Generated: {report['summary']}")
    
    try:
        while True:
            time.sleep(60)  # Keep running
    except KeyboardInterrupt:
        aviation_intelligence.stop_monitoring()
        print("Aviation News Intelligence System stopped.")

if __name__ == "__main__":
    main()