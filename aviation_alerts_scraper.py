#!/usr/bin/env python3
"""
Aviation Data Web Scraper for AINO Operations Center - Integrated Version
Scrapes NOTAMs, SIGMETs, TFRs, and other aviation alerts from public sources
Optimized for Replit environment with automatic monitoring
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
import threading
import asyncio
import signal

# Configure logging for AINO platform
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - [Aviation Scraper] %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Console output
        logging.FileHandler('aviation_alerts.log')  # File output
    ]
)
logger = logging.getLogger(__name__)

# AINO platform configuration
REPLIT_MODE = os.getenv('REPLIT_DEPLOYMENT_ID') is not None
if REPLIT_MODE:
    logger.info("Running in Replit environment for AINO platform")
    DEFAULT_TIMEOUT = 15
    RATE_LIMIT_DELAY = 3
else:
    DEFAULT_TIMEOUT = 30
    RATE_LIMIT_DELAY = 2

@dataclass
class AviationAlert:
    """Standard aviation alert data structure for AINO platform"""
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
    coordinates: Optional[Dict[str, float]] = None
    altitude_range: Optional[Dict[str, int]] = None

class AINOAviationScraper:
    """Main scraper class for AINO aviation intelligence platform"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.alerts = []
        self.timeout = DEFAULT_TIMEOUT
        self.monitoring_active = False
        self.monitoring_thread = None
        
        # Create output directory if it doesn't exist
        os.makedirs('data/aviation_alerts', exist_ok=True)
        
    def scrape_tfr_data(self) -> List[AviationAlert]:
        """Scrape TFR (Temporary Flight Restriction) data"""
        logger.info("Scraping TFR data for AINO platform...")
        alerts = []
        
        try:
            # TFR data from FAA
            url = "https://tfr.faa.gov/save_pages/detail_9_8155.html"
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Parse TFR details
            tfr_blocks = soup.find_all('div', class_='tfr-detail')
            
            for block in tfr_blocks:
                try:
                    title = block.find('h3')
                    if title:
                        tfr_id = title.get_text(strip=True)
                        
                        # Extract details
                        details = block.find('div', class_='tfr-text')
                        if details:
                            description = details.get_text(strip=True)
                            
                            alert = AviationAlert(
                                alert_type="TFR",
                                id=f"TFR_{tfr_id}_{datetime.now().strftime('%Y%m%d_%H%M')}",
                                location="United States",
                                description=description,
                                effective_start=datetime.now().isoformat(),
                                effective_end=(datetime.now() + timedelta(days=1)).isoformat(),
                                severity="HIGH",
                                source="FAA TFR System",
                                raw_data=str(block),
                                scraped_at=datetime.now().isoformat(),
                                coordinates={"lat": 39.8283, "lon": -98.5795},  # US center
                                altitude_range={"min": 0, "max": 18000}
                            )
                            alerts.append(alert)
                            
                except Exception as e:
                    logger.warning(f"Error parsing TFR block: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error scraping TFR data: {e}")
            
        return alerts
    
    def scrape_sigmet_data(self) -> List[AviationAlert]:
        """Scrape SIGMET data from Aviation Weather Center"""
        logger.info("Scraping SIGMET data for AINO platform...")
        alerts = []
        
        try:
            # AWC SIGMET data
            url = "https://aviationweather.gov/sigmet/data?hazard=conv&loc=us"
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            # Try to parse as JSON first
            try:
                data = response.json()
                if isinstance(data, list):
                    for item in data:
                        alert = AviationAlert(
                            alert_type="SIGMET",
                            id=f"SIGMET_{item.get('id', datetime.now().strftime('%Y%m%d_%H%M%S'))}",
                            location=item.get('location', 'United States'),
                            description=f"Weather hazard: {item.get('hazard', 'Unknown')}",
                            effective_start=item.get('validTime', datetime.now().isoformat()),
                            effective_end=item.get('validTimeEnd', (datetime.now() + timedelta(hours=6)).isoformat()),
                            severity="HIGH",
                            source="AWC SIGMET",
                            raw_data=json.dumps(item),
                            scraped_at=datetime.now().isoformat(),
                            coordinates={"lat": 39.8283, "lon": -98.5795},
                            altitude_range={"min": 0, "max": 45000}
                        )
                        alerts.append(alert)
            except json.JSONDecodeError:
                # Parse as HTML if JSON fails
                soup = BeautifulSoup(response.content, 'html.parser')
                sigmet_elements = soup.find_all('div', class_='sigmet-item')
                
                for element in sigmet_elements:
                    try:
                        text = element.get_text(strip=True)
                        alert = AviationAlert(
                            alert_type="SIGMET",
                            id=f"SIGMET_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                            location="United States",
                            description=text,
                            effective_start=datetime.now().isoformat(),
                            effective_end=(datetime.now() + timedelta(hours=6)).isoformat(),
                            severity="HIGH",
                            source="AWC SIGMET",
                            raw_data=text,
                            scraped_at=datetime.now().isoformat(),
                            coordinates={"lat": 39.8283, "lon": -98.5795},
                            altitude_range={"min": 0, "max": 45000}
                        )
                        alerts.append(alert)
                    except Exception as e:
                        logger.warning(f"Error parsing SIGMET element: {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error scraping SIGMET data: {e}")
            
        return alerts
    
    def scrape_airmet_data(self) -> List[AviationAlert]:
        """Scrape AIRMET data"""
        logger.info("Scraping AIRMET data for AINO platform...")
        alerts = []
        
        try:
            url = "https://aviationweather.gov/gairmet/data?date=&type=snapshot&region=us"
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            # Parse response
            soup = BeautifulSoup(response.content, 'html.parser')
            airmet_items = soup.find_all('pre') or soup.find_all('div', class_='airmet-text')
            
            for item in airmet_items:
                text = item.get_text(strip=True)
                if text and any(keyword in text.upper() for keyword in ['AIRMET', 'SIERRA', 'TANGO', 'ZULU']):
                    alert = AviationAlert(
                        alert_type="AIRMET",
                        id=f"AIRMET_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                        location="United States",
                        description=text,
                        effective_start=datetime.now().isoformat(),
                        effective_end=(datetime.now() + timedelta(hours=6)).isoformat(),
                        severity="MEDIUM",
                        source="AWC AIRMET",
                        raw_data=text,
                        scraped_at=datetime.now().isoformat(),
                        coordinates={"lat": 39.8283, "lon": -98.5795},
                        altitude_range={"min": 0, "max": 18000}
                    )
                    alerts.append(alert)
                    
        except Exception as e:
            logger.error(f"Error scraping AIRMET data: {e}")
            
        return alerts
    
    def scrape_notam_data(self) -> List[AviationAlert]:
        """Scrape NOTAM data from available sources"""
        logger.info("Scraping NOTAM data for AINO platform...")
        alerts = []
        
        try:
            # Try alternative NOTAM sources since main FAA site is JavaScript-heavy
            url = "https://aviationweather.gov/fcst/hazard"
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for NOTAM-related content
            notam_elements = soup.find_all('div', string=re.compile(r'NOTAM|NOTICE', re.IGNORECASE))
            
            for element in notam_elements:
                parent = element.find_parent()
                if parent:
                    text = parent.get_text(strip=True)
                    if len(text) > 20:  # Filter out very short entries
                        alert = AviationAlert(
                            alert_type="NOTAM",
                            id=f"NOTAM_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                            location="Various Airports",
                            description=text,
                            effective_start=datetime.now().isoformat(),
                            effective_end=(datetime.now() + timedelta(days=1)).isoformat(),
                            severity="MEDIUM",
                            source="AWC NOTAM",
                            raw_data=text,
                            scraped_at=datetime.now().isoformat(),
                            coordinates={"lat": 39.8283, "lon": -98.5795},
                            altitude_range={"min": 0, "max": 45000}
                        )
                        alerts.append(alert)
                        
        except Exception as e:
            logger.error(f"Error scraping NOTAM data: {e}")
            
        return alerts
    
    def scrape_space_weather(self) -> List[AviationAlert]:
        """Scrape space weather alerts that affect aviation"""
        logger.info("Scraping space weather data for AINO platform...")
        alerts = []
        
        try:
            url = "https://aviationweather.gov/swx/"
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for space weather alerts
            swx_elements = soup.find_all('div', class_='swx-alert') or soup.find_all('pre')
            
            for element in swx_elements:
                text = element.get_text(strip=True)
                if text and any(keyword in text.upper() for keyword in ['SOLAR', 'GEOMAG', 'RADIATION', 'OUTAGE']):
                    alert = AviationAlert(
                        alert_type="SPACE_WEATHER",
                        id=f"SWX_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                        location="Global",
                        description=text,
                        effective_start=datetime.now().isoformat(),
                        effective_end=(datetime.now() + timedelta(hours=24)).isoformat(),
                        severity="MEDIUM",
                        source="AWC Space Weather",
                        raw_data=text,
                        scraped_at=datetime.now().isoformat(),
                        coordinates={"lat": 0.0, "lon": 0.0},  # Global
                        altitude_range={"min": 30000, "max": 60000}
                    )
                    alerts.append(alert)
                    
        except Exception as e:
            logger.error(f"Error scraping space weather data: {e}")
            
        return alerts
    
    def scrape_all_data(self) -> List[AviationAlert]:
        """Scrape all aviation data sources for AINO platform"""
        logger.info("Starting comprehensive aviation data scraping for AINO...")
        
        all_alerts = []
        
        # Scrape different data sources
        scrapers = [
            self.scrape_tfr_data,
            self.scrape_sigmet_data,
            self.scrape_airmet_data,
            self.scrape_notam_data,
            self.scrape_space_weather
        ]
        
        for scraper in scrapers:
            try:
                alerts = scraper()
                all_alerts.extend(alerts)
                logger.info(f"Retrieved {len(alerts)} alerts from {scraper.__name__}")
                # Rate limiting
                time.sleep(RATE_LIMIT_DELAY)
            except Exception as e:
                logger.error(f"Error in {scraper.__name__}: {e}")
                continue
                
        logger.info(f"Total alerts retrieved for AINO platform: {len(all_alerts)}")
        return all_alerts
    
    def save_to_json(self, alerts: List[AviationAlert], filename: str = None):
        """Save alerts to JSON file"""
        if filename is None:
            filename = f"data/aviation_alerts/alerts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        try:
            data = [asdict(alert) for alert in alerts]
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved {len(alerts)} alerts to {filename}")
            return filename
        except Exception as e:
            logger.error(f"Error saving to JSON: {e}")
            return None
    
    def get_alerts_for_api(self) -> Dict:
        """Get alerts formatted for AINO API response"""
        alerts = self.scrape_all_data()
        
        # Convert to AINO API format
        formatted_alerts = []
        for alert in alerts:
            formatted_alert = {
                "id": alert.id,
                "type": alert.alert_type,
                "title": f"{alert.alert_type}: {alert.location}",
                "description": alert.description,
                "location": {
                    "lat": alert.coordinates["lat"] if alert.coordinates else 39.8283,
                    "lon": alert.coordinates["lon"] if alert.coordinates else -98.5795,
                    "radius": 50
                },
                "altitude": {
                    "min": alert.altitude_range["min"] if alert.altitude_range else 0,
                    "max": alert.altitude_range["max"] if alert.altitude_range else 45000
                },
                "timeframe": {
                    "start": alert.effective_start,
                    "end": alert.effective_end
                },
                "severity": alert.severity.lower(),
                "source": alert.source,
                "lastUpdated": alert.scraped_at
            }
            formatted_alerts.append(formatted_alert)
        
        return {
            "success": True,
            "alerts": formatted_alerts,
            "count": len(formatted_alerts),
            "timestamp": datetime.now().isoformat(),
            "data_sources": ["FAA_TFR", "AWC_SIGMET", "AWC_AIRMET", "AWC_NOTAM", "AWC_SPACE_WEATHER"]
        }

class AINOAlertMonitor:
    """Continuous monitoring class for AINO operations center"""
    
    def __init__(self, check_interval: int = 300):  # 5 minutes
        self.check_interval = check_interval
        self.scraper = AINOAviationScraper()
        self.previous_alerts = set()
        self.monitoring_active = False
        self.monitoring_thread = None
        
    def start_monitoring(self):
        """Start continuous monitoring"""
        if self.monitoring_active:
            logger.warning("Monitoring already active")
            return
            
        logger.info(f"Starting AINO aviation alert monitoring (check interval: {self.check_interval}s)")
        self.monitoring_active = True
        
        def monitor_loop():
            while self.monitoring_active:
                try:
                    current_alerts = self.scraper.scrape_all_data()
                    
                    # Check for new alerts
                    current_alert_ids = {alert.id for alert in current_alerts}
                    new_alerts = current_alert_ids - self.previous_alerts
                    
                    if new_alerts:
                        new_alert_objects = [a for a in current_alerts if a.id in new_alerts]
                        logger.info(f"Found {len(new_alerts)} new alerts for AINO platform")
                        self.handle_new_alerts(new_alert_objects)
                    
                    self.previous_alerts = current_alert_ids
                    
                    # Save latest alerts
                    self.scraper.save_to_json(current_alerts, "data/aviation_alerts/latest_alerts.json")
                    
                    # Wait before next check
                    time.sleep(self.check_interval)
                    
                except Exception as e:
                    logger.error(f"Error in AINO monitoring loop: {e}")
                    time.sleep(60)  # Wait a minute before retrying
                    
        self.monitoring_thread = threading.Thread(target=monitor_loop, daemon=True)
        self.monitoring_thread.start()
        
    def stop_monitoring(self):
        """Stop monitoring"""
        if self.monitoring_active:
            logger.info("Stopping AINO aviation alert monitoring")
            self.monitoring_active = False
            if self.monitoring_thread:
                self.monitoring_thread.join(timeout=5)
                
    def handle_new_alerts(self, alerts: List[AviationAlert]):
        """Handle new alerts for AINO platform"""
        for alert in alerts:
            logger.info(f"NEW AINO ALERT: [{alert.alert_type}] {alert.severity} - {alert.description[:100]}...")
            
            # High severity alerts get special attention
            if alert.severity == "HIGH":
                logger.warning(f"HIGH SEVERITY AINO ALERT: {alert.alert_type} - {alert.description}")

# Global monitor instance
aino_monitor = None

def start_aino_monitoring(check_interval: int = 300):
    """Start AINO platform aviation monitoring"""
    global aino_monitor
    if aino_monitor is None:
        aino_monitor = AINOAlertMonitor(check_interval)
    aino_monitor.start_monitoring()
    return aino_monitor

def stop_aino_monitoring():
    """Stop AINO platform aviation monitoring"""
    global aino_monitor
    if aino_monitor:
        aino_monitor.stop_monitoring()

def get_latest_alerts():
    """Get latest alerts for AINO API"""
    scraper = AINOAviationScraper()
    return scraper.get_alerts_for_api()

if __name__ == "__main__":
    print("🛩️  AINO Aviation Alert Scraper - Starting automatic monitoring...")
    
    # Start monitoring
    monitor = start_aino_monitoring(check_interval=300)  # Check every 5 minutes
    
    try:
        # Keep the script running
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        print("\n✅ Stopping AINO aviation monitoring...")
        stop_aino_monitoring()
        print("👋 AINO aviation monitoring stopped!")