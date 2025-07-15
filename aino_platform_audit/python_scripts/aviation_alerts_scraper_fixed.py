#!/usr/bin/env python3
"""
Aviation Data Web Scraper for Operations Center - Fixed Version
Scrapes NOTAMs, SIGMETs, TFRs, and other aviation alerts from accessible public sources
Updated URLs and improved error handling
"""

import requests
from bs4 import BeautifulSoup
import json
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
import time
import re
from typing import Dict, List, Optional
import logging
from urllib.parse import urljoin, urlparse
import csv
from dataclasses import dataclass, asdict
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('aviation_scraper.log')
    ]
)
logger = logging.getLogger(__name__)

# Configuration
REPLIT_MODE = os.getenv('REPLIT_DEPLOYMENT_ID') is not None
DEFAULT_TIMEOUT = 15 if REPLIT_MODE else 30
RATE_LIMIT_DELAY = 2

@dataclass
class AviationAlert:
    """Standard aviation alert data structure"""
    alert_type: str
    id: str
    location: str
    description: str
    effective_start: str
    effective_end: str
    severity: str
    source: str
    raw_data: str
    scraped_at: str

class AviationDataScraper:
    """Main scraper class for aviation data"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        self.alerts = []
        self.timeout = DEFAULT_TIMEOUT
        
        # Create output directory
        os.makedirs('output', exist_ok=True)
        
    def scrape_aviation_weather_center(self) -> List[AviationAlert]:
        """Scrape current conditions from Aviation Weather Center"""
        logger.info("Scraping Aviation Weather Center...")
        alerts = []
        
        try:
            # Main AWC page - more reliable
            url = "https://aviationweather.gov/data/api/products/text/sigmet"
            response = self.session.get(url, timeout=self.timeout)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        for item in data:
                            alert = AviationAlert(
                                alert_type="SIGMET",
                                id=item.get('id', f"SIGMET_{datetime.now().strftime('%Y%m%d_%H%M%S')}"),
                                location=item.get('location', 'US'),
                                description=item.get('rawText', 'SIGMET Alert'),
                                effective_start=item.get('validTimeFrom', datetime.now().isoformat()),
                                effective_end=item.get('validTimeTo', (datetime.now() + timedelta(hours=6)).isoformat()),
                                severity="HIGH",
                                source="AWC SIGMET API",
                                raw_data=json.dumps(item),
                                scraped_at=datetime.now().isoformat()
                            )
                            alerts.append(alert)
                except (json.JSONDecodeError, KeyError):
                    logger.warning("Could not parse AWC API response as JSON")
            
            # Fallback to HTML parsing
            if not alerts:
                url = "https://aviationweather.gov/"
                response = self.session.get(url, timeout=self.timeout)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Look for weather alerts
                    alert_sections = soup.find_all(['div', 'section'], class_=re.compile(r'alert|warning|notice', re.I))
                    
                    for section in alert_sections:
                        text = section.get_text(strip=True)
                        if len(text) > 50:
                            alert = AviationAlert(
                                alert_type="WEATHER_ALERT",
                                id=f"AWC_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(alerts)}",
                                location="US",
                                description=text[:500],
                                effective_start=datetime.now().isoformat(),
                                effective_end=(datetime.now() + timedelta(hours=6)).isoformat(),
                                severity="MEDIUM",
                                source="AWC Website",
                                raw_data=text,
                                scraped_at=datetime.now().isoformat()
                            )
                            alerts.append(alert)
                            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error scraping AWC: {e}")
        except Exception as e:
            logger.error(f"Error scraping AWC: {e}")
            
        return alerts
    
    def scrape_faa_tfr_data(self) -> List[AviationAlert]:
        """Scrape TFR data from alternative sources"""
        logger.info("Scraping TFR data...")
        alerts = []
        
        try:
            # Try multiple TFR sources
            urls = [
                "https://tfr.faa.gov/save_pages/list.html",
                "https://tfr.faa.gov/save_pages/detail_list.html"
            ]
            
            for url in urls:
                try:
                    response = self.session.get(url, timeout=self.timeout)
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.content, 'html.parser')
                        
                        # Look for TFR information
                        tfr_elements = soup.find_all(['div', 'tr', 'td'], string=re.compile(r'TFR|NOTAM|(\d+/\d+)', re.I))
                        
                        for element in tfr_elements:
                            parent = element.find_parent()
                            if parent:
                                text = parent.get_text(strip=True)
                                if len(text) > 30 and 'TFR' in text.upper():
                                    alert = AviationAlert(
                                        alert_type="TFR",
                                        id=f"TFR_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(alerts)}",
                                        location="US",
                                        description=text[:500],
                                        effective_start=datetime.now().isoformat(),
                                        effective_end=(datetime.now() + timedelta(days=1)).isoformat(),
                                        severity="HIGH",
                                        source="FAA TFR",
                                        raw_data=text,
                                        scraped_at=datetime.now().isoformat()
                                    )
                                    alerts.append(alert)
                        
                        if alerts:
                            break  # Stop if we found some alerts
                            
                except requests.exceptions.RequestException as e:
                    logger.warning(f"Could not access {url}: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error scraping TFR data: {e}")
            
        return alerts
    
    def scrape_faa_notam_search(self) -> List[AviationAlert]:
        """Try to scrape NOTAMs from FAA NOTAM Search"""
        logger.info("Scraping NOTAM data...")
        alerts = []
        
        try:
            # FAA NOTAM Search alternative endpoints
            urls = [
                "https://notams.aim.faa.gov/notamSearch/",
                "https://pilotweb.nas.faa.gov/PilotWeb/"
            ]
            
            for url in urls:
                try:
                    response = self.session.get(url, timeout=self.timeout)
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.content, 'html.parser')
                        
                        # Look for NOTAM-related content
                        notam_elements = soup.find_all(string=re.compile(r'NOTAM|!', re.I))
                        
                        for element in notam_elements:
                            if hasattr(element, 'parent'):
                                parent = element.parent
                                text = parent.get_text(strip=True)
                                if len(text) > 50 and any(keyword in text.upper() for keyword in ['NOTAM', 'CLOSED', 'RUNWAY', 'TAXIWAY']):
                                    alert = AviationAlert(
                                        alert_type="NOTAM",
                                        id=f"NOTAM_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(alerts)}",
                                        location="Various",
                                        description=text[:500],
                                        effective_start=datetime.now().isoformat(),
                                        effective_end=(datetime.now() + timedelta(days=1)).isoformat(),
                                        severity="MEDIUM",
                                        source="FAA NOTAM",
                                        raw_data=text,
                                        scraped_at=datetime.now().isoformat()
                                    )
                                    alerts.append(alert)
                        
                        if alerts:
                            break
                            
                except requests.exceptions.RequestException as e:
                    logger.warning(f"Could not access {url}: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error scraping NOTAM data: {e}")
            
        return alerts
    
    def scrape_weather_gov_aviation(self) -> List[AviationAlert]:
        """Scrape aviation weather from weather.gov"""
        logger.info("Scraping weather.gov aviation data...")
        alerts = []
        
        try:
            url = "https://www.weather.gov/aviation/"
            response = self.session.get(url, timeout=self.timeout)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for aviation-related alerts
                alert_elements = soup.find_all(['div', 'section'], class_=re.compile(r'alert|warning|watch', re.I))
                
                for element in alert_elements:
                    text = element.get_text(strip=True)
                    if len(text) > 50 and any(keyword in text.upper() for keyword in ['AVIATION', 'TURBULENCE', 'ICING', 'CONVECTIVE']):
                        alert = AviationAlert(
                            alert_type="AVIATION_WEATHER",
                            id=f"WX_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(alerts)}",
                            location="US",
                            description=text[:500],
                            effective_start=datetime.now().isoformat(),
                            effective_end=(datetime.now() + timedelta(hours=12)).isoformat(),
                            severity="MEDIUM",
                            source="Weather.gov Aviation",
                            raw_data=text,
                            scraped_at=datetime.now().isoformat()
                        )
                        alerts.append(alert)
                        
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error scraping weather.gov: {e}")
        except Exception as e:
            logger.error(f"Error scraping weather.gov aviation: {e}")
            
        return alerts
    
    def scrape_noaa_space_weather(self) -> List[AviationAlert]:
        """Scrape space weather from NOAA"""
        logger.info("Scraping NOAA space weather...")
        alerts = []
        
        try:
            url = "https://www.swpc.noaa.gov/alerts-watches-and-warnings"
            response = self.session.get(url, timeout=self.timeout)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for space weather alerts
                alert_elements = soup.find_all(['div', 'article', 'section'])
                
                for element in alert_elements:
                    text = element.get_text(strip=True)
                    if len(text) > 50 and any(keyword in text.upper() for keyword in ['SOLAR', 'GEOMAGNETIC', 'RADIATION', 'STORM']):
                        alert = AviationAlert(
                            alert_type="SPACE_WEATHER",
                            id=f"SWX_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(alerts)}",
                            location="Global",
                            description=text[:500],
                            effective_start=datetime.now().isoformat(),
                            effective_end=(datetime.now() + timedelta(hours=24)).isoformat(),
                            severity="MEDIUM",
                            source="NOAA Space Weather",
                            raw_data=text,
                            scraped_at=datetime.now().isoformat()
                        )
                        alerts.append(alert)
                        
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error scraping NOAA: {e}")
        except Exception as e:
            logger.error(f"Error scraping NOAA space weather: {e}")
            
        return alerts
    
    def scrape_all_data(self) -> List[AviationAlert]:
        """Scrape all aviation data sources"""
        logger.info("Starting comprehensive aviation data scraping...")
        
        all_alerts = []
        
        # Define scrapers with their names
        scrapers = [
            ("Aviation Weather Center", self.scrape_aviation_weather_center),
            ("FAA TFR", self.scrape_faa_tfr_data),
            ("FAA NOTAM", self.scrape_faa_notam_search),
            ("Weather.gov Aviation", self.scrape_weather_gov_aviation),
            ("NOAA Space Weather", self.scrape_noaa_space_weather)
        ]
        
        successful_scrapers = 0
        
        for name, scraper in scrapers:
            try:
                logger.info(f"Scraping {name}...")
                alerts = scraper()
                all_alerts.extend(alerts)
                
                if alerts:
                    successful_scrapers += 1
                    logger.info(f"✓ Retrieved {len(alerts)} alerts from {name}")
                else:
                    logger.warning(f"⚠ No alerts retrieved from {name}")
                    
                # Rate limiting
                time.sleep(RATE_LIMIT_DELAY)
                
            except Exception as e:
                logger.error(f"✗ Error scraping {name}: {e}")
                continue
        
        logger.info(f"Total alerts collected: {len(all_alerts)} (from {successful_scrapers} sources)")
        return all_alerts
    
    def get_alerts_for_api(self) -> Dict:
        """Get alerts formatted for API response"""
        alerts = self.scrape_all_data()
        
        return {
            'success': True,
            'alerts': [asdict(alert) for alert in alerts],
            'count': len(alerts),
            'timestamp': datetime.now().isoformat(),
            'sources': ['Aviation Weather Center', 'FAA TFR', 'FAA NOTAM', 'Weather.gov Aviation', 'NOAA Space Weather']
        }

def main():
    """Main execution function"""
    print("🛩️  Aviation Data Scraper - Operations Center Edition (Fixed)")
    print("="*65)
    
    scraper = AviationDataScraper()
    
    # Check if running via API (no console output)
    import sys
    if '--api' in sys.argv or os.getenv('API_MODE'):
        # API mode - output JSON only
        result = scraper.get_alerts_for_api()
        print(json.dumps(result))
        return
    
    alerts = scraper.scrape_all_data()
    
    if alerts:
        print(f"\n📊 COLLECTED {len(alerts)} TOTAL ALERTS")
        
        # Output JSON for API integration (always output JSON as last line)
        api_result = scraper.get_alerts_for_api()
        print(f"\nAPI_RESULT:{json.dumps(api_result)}")
        
        # Summary by type
        alert_types = {}
        for alert in alerts:
            alert_types[alert.alert_type] = alert_types.get(alert.alert_type, 0) + 1
        
        print(f"\n📈 SUMMARY BY TYPE:")
        print("-" * 30)
        for alert_type, count in sorted(alert_types.items()):
            print(f"  {alert_type}: {count} alerts")
            
        # Show sample alerts
        print(f"\n📅 SAMPLE ALERTS:")
        print("-" * 50)
        for i, alert in enumerate(alerts[:3], 1):
            print(f"{i}. [{alert.alert_type}] {alert.severity} - {alert.description[:80]}...")
            
    else:
        print("❌ No alerts retrieved")
        # Still output JSON for API
        api_result = scraper.get_alerts_for_api()
        print(f"\nAPI_RESULT:{json.dumps(api_result)}")

if __name__ == "__main__":
    main()