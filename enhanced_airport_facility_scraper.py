#!/usr/bin/env python3
"""
Enhanced Airport Facility Scraper for AINO Aviation Intelligence Platform
Multi-phase comprehensive data collection from authentic aviation sources
"""

import requests
import pandas as pd
import json
import time
from bs4 import BeautifulSoup
import csv
from urllib.parse import urljoin, urlparse
import logging
from datetime import datetime
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import List, Dict, Optional
import os

# Setup logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('airport_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class FacilityInfo:
    """Data structure for detailed airport facility information"""
    icao: str
    airport_name: str
    ground_handlers: List[str]
    maintenance_providers: List[str]
    fuel_suppliers: List[str]
    cargo_handlers: List[str]
    catering_services: List[str]
    fbo_services: List[str]
    customs_hours: str
    immigration_services: str
    contact_info: Dict[str, str]
    operating_hours: str
    source_url: str
    last_updated: str

class EnhancedAirportScraper:
    """Enhanced airport facility scraper for AINO platform"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; AINO-Aviation-Platform/1.0; +https://aino-aviation.com)'
        })
        
        # Create output directory
        self.output_dir = 'airport_facility_data'
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Service provider keywords for detailed scraping
        self.ground_handlers = [
            'dnata', 'swissport', 'menzies', 'worldwide flight services', 'wfs',
            'celebi', 'aviapartner', 'groundforce', 'bags', 'servisair',
            'globe ground', 'airport handling', 'signature flight support'
        ]
        
        self.maintenance_providers = [
            'lufthansa technik', 'st aerospace', 'aar corp', 'ameco',
            'tap maintenance', 'turkish technic', 'mro', 'sr technics',
            'haeco', 'jet maintenance', 'aircraft maintenance'
        ]
        
        self.fuel_suppliers = [
            'shell aviation', 'bp aviation', 'total aviation', 'chevron',
            'world energy', 'avgas', 'jet fuel', 'fuel services',
            'aviation fuel', 'into-plane'
        ]

        # Virgin Atlantic priority airports
        self.virgin_atlantic_hubs = [
            'EGLL',  # London Heathrow
            'EGKK',  # London Gatwick
            'EGCC',  # Manchester
            'KJFK',  # New York JFK
            'KLAX',  # Los Angeles
            'KBOS',  # Boston
            'KSFO',  # San Francisco
            'KMIA',  # Miami
            'KATL',  # Atlanta
            'OMDB',  # Dubai
            'VABB',  # Mumbai
            'VIDP',  # Delhi
            'VTBS',  # Bangkok
            'RJAA',  # Tokyo Narita
        ]
    
    def download_ourairports_data(self) -> Dict:
        """Download comprehensive CSV data from OurAirports.com"""
        logger.info("Downloading OurAirports foundation data...")
        
        urls = {
            'airports': 'http://ourairports.com/data/airports.csv',
            'countries': 'http://ourairports.com/data/countries.csv',
            'regions': 'http://ourairports.com/data/regions.csv',
            'runways': 'http://ourairports.com/data/runways.csv',
            'navaids': 'http://ourairports.com/data/navaids.csv'
        }
        
        data = {}
        for name, url in urls.items():
            try:
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                
                # Save raw CSV
                filepath = os.path.join(self.output_dir, f'ourairports_{name}.csv')
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                
                # Parse into DataFrame
                data[name] = pd.read_csv(url)
                logger.info(f"Downloaded {name}: {len(data[name])} records")
                
            except Exception as e:
                logger.error(f"Error downloading {name}: {e}")
        
        return data
    
    def get_priority_airports(self, merged_data: pd.DataFrame) -> pd.DataFrame:
        """Filter for Virgin Atlantic priority airports and major hubs"""
        priority_airports = merged_data[
            (merged_data['ident'].isin(self.virgin_atlantic_hubs)) |
            (merged_data['type'] == 'large_airport')
        ].copy()
        
        logger.info(f"Identified {len(priority_airports)} priority airports")
        return priority_airports
    
    def find_airport_website(self, icao: str, airport_name: str) -> Optional[str]:
        """Find the official airport website using common patterns"""
        potential_urls = [
            f"https://www.{icao.lower()}.com",
            f"https://www.{icao.lower()}airport.com",
            f"https://www.{icao.lower()}-airport.com",
            f"https://{icao.lower()}.aero",
            f"https://www.{icao.lower()}.org"
        ]
        
        for url in potential_urls:
            try:
                response = self.session.get(url, timeout=10)
                if response.status_code == 200 and 'airport' in response.text.lower():
                    logger.info(f"Found website for {icao}: {url}")
                    return url
            except:
                continue
        
        logger.warning(f"No website found for {icao}")
        return None
    
    def extract_service_providers(self, text_content: str, keywords: List[str]) -> List[str]:
        """Extract service providers based on keywords"""
        providers = []
        
        for keyword in keywords:
            if keyword.lower() in text_content.lower():
                # Look for company names near the keyword
                sentences = text_content.split('.')
                for sentence in sentences:
                    if keyword.lower() in sentence.lower():
                        # Extract potential company names
                        words = sentence.split()
                        for i, word in enumerate(words):
                            if keyword.lower() in word.lower():
                                context_words = words[max(0, i-3):i+4]
                                for context_word in context_words:
                                    if (context_word.istitle() and 
                                        len(context_word) > 3 and 
                                        context_word.isalpha()):
                                        providers.append(context_word)
        
        # Remove duplicates and clean
        providers = list(set([p.strip() for p in providers if p.strip()]))
        return providers[:5]
    
    def extract_contact_info(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract contact information from website"""
        contact_info = {}
        
        # Email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, soup.get_text())
        if emails:
            contact_info['emails'] = emails[:3]
        
        # Phone numbers (international format)
        phone_pattern = r'\+?[\d\s\-\(\)]{10,}'
        phones = re.findall(phone_pattern, soup.get_text())
        if phones:
            contact_info['phones'] = [p.strip() for p in phones[:3]]
        
        return contact_info
    
    def scrape_airport_facilities(self, icao: str, airport_name: str) -> Optional[FacilityInfo]:
        """Scrape detailed facilities for a single airport"""
        website_url = self.find_airport_website(icao, airport_name)
        
        if not website_url:
            return None
        
        try:
            response = self.session.get(website_url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            text_content = soup.get_text()
            
            # Extract different service types
            ground_handlers = self.extract_service_providers(text_content, self.ground_handlers)
            maintenance_providers = self.extract_service_providers(text_content, self.maintenance_providers)
            fuel_suppliers = self.extract_service_providers(text_content, self.fuel_suppliers)
            
            # Extract contact information
            contact_info = self.extract_contact_info(soup)
            
            facility_info = FacilityInfo(
                icao=icao,
                airport_name=airport_name,
                ground_handlers=ground_handlers,
                maintenance_providers=maintenance_providers,
                fuel_suppliers=fuel_suppliers,
                cargo_handlers=[],  # Could be enhanced further
                catering_services=[],
                fbo_services=[],
                customs_hours="",  # Could be extracted from specific sections
                immigration_services="",
                contact_info=contact_info,
                operating_hours="",
                source_url=website_url,
                last_updated=datetime.now().isoformat()
            )
            
            logger.info(f"Successfully scraped facilities for {icao}")
            return facility_info
            
        except Exception as e:
            logger.error(f"Error scraping facilities for {icao}: {e}")
            return None
    
    def generate_aino_facility_report(self, facilities: List[FacilityInfo]) -> Dict:
        """Generate comprehensive facility report for AINO platform"""
        report = {
            "generated_at": datetime.now().isoformat(),
            "total_airports": len(facilities),
            "virgin_atlantic_hubs": 0,
            "facilities_summary": {
                "ground_handlers_identified": 0,
                "maintenance_providers_identified": 0,
                "fuel_suppliers_identified": 0,
                "contact_info_available": 0
            },
            "airports": []
        }
        
        for facility in facilities:
            # Count Virgin Atlantic hubs
            if facility.icao in self.virgin_atlantic_hubs:
                report["virgin_atlantic_hubs"] += 1
            
            # Count facility types
            if facility.ground_handlers:
                report["facilities_summary"]["ground_handlers_identified"] += 1
            if facility.maintenance_providers:
                report["facilities_summary"]["maintenance_providers_identified"] += 1
            if facility.fuel_suppliers:
                report["facilities_summary"]["fuel_suppliers_identified"] += 1
            if facility.contact_info:
                report["facilities_summary"]["contact_info_available"] += 1
            
            # Add airport data
            airport_data = {
                "icao": facility.icao,
                "airport_name": facility.airport_name,
                "is_virgin_atlantic_hub": facility.icao in self.virgin_atlantic_hubs,
                "services": {
                    "ground_handlers": facility.ground_handlers,
                    "maintenance_providers": facility.maintenance_providers,
                    "fuel_suppliers": facility.fuel_suppliers
                },
                "contact_info": facility.contact_info,
                "data_source": facility.source_url,
                "last_updated": facility.last_updated
            }
            report["airports"].append(airport_data)
        
        return report
    
    def save_facility_data(self, facilities: List[FacilityInfo], format_type: str = 'json'):
        """Save facility data in specified format"""
        if format_type == 'json':
            report = self.generate_aino_facility_report(facilities)
            
            filepath = os.path.join(self.output_dir, 'aino_airport_facilities.json')
            with open(filepath, 'w') as f:
                json.dump(report, f, indent=2)
            
            logger.info(f"Saved facility data to {filepath}")
            
        elif format_type == 'csv':
            facility_data = []
            for facility in facilities:
                facility_data.append({
                    'icao': facility.icao,
                    'airport_name': facility.airport_name,
                    'ground_handlers': '; '.join(facility.ground_handlers),
                    'maintenance_providers': '; '.join(facility.maintenance_providers),
                    'fuel_suppliers': '; '.join(facility.fuel_suppliers),
                    'contact_emails': '; '.join(facility.contact_info.get('emails', [])),
                    'contact_phones': '; '.join(facility.contact_info.get('phones', [])),
                    'source_url': facility.source_url,
                    'last_updated': facility.last_updated
                })
            
            df = pd.DataFrame(facility_data)
            filepath = os.path.join(self.output_dir, 'aino_airport_facilities.csv')
            df.to_csv(filepath, index=False)
            
            logger.info(f"Saved facility data to {filepath}")
    
    def run_enhanced_scraping(self, max_airports: int = 50) -> Dict:
        """Run complete enhanced scraping workflow"""
        logger.info("Starting enhanced airport facility scraping for AINO platform...")
        
        # Phase 1: Download foundation data
        ourairports_data = self.download_ourairports_data()
        
        if not ourairports_data or 'airports' not in ourairports_data:
            logger.error("Failed to download foundation airport data")
            return {}
        
        # Phase 2: Filter priority airports
        airports_df = ourairports_data['airports']
        priority_airports = self.get_priority_airports(airports_df)
        
        # Limit processing to avoid overwhelming
        processing_airports = priority_airports.head(max_airports)
        
        # Phase 3: Scrape detailed facilities
        facilities = []
        
        with ThreadPoolExecutor(max_workers=3) as executor:
            future_to_airport = {
                executor.submit(
                    self.scrape_airport_facilities, 
                    row['ident'], 
                    row['name']
                ): row for _, row in processing_airports.iterrows()
            }
            
            for future in as_completed(future_to_airport):
                facility = future.result()
                if facility:
                    facilities.append(facility)
                
                # Add delay to be respectful
                time.sleep(2)
        
        # Phase 4: Generate and save report
        if facilities:
            self.save_facility_data(facilities, 'json')
            self.save_facility_data(facilities, 'csv')
            
            report = self.generate_aino_facility_report(facilities)
            logger.info(f"Enhanced scraping complete. Processed {len(facilities)} airports.")
            return report
        else:
            logger.warning("No facility data collected")
            return {}

def main():
    """Main execution function for AINO enhanced airport scraping"""
    scraper = EnhancedAirportScraper()
    
    # Run enhanced scraping with limited scope for demonstration
    report = scraper.run_enhanced_scraping(max_airports=25)
    
    if report:
        print("\n" + "="*60)
        print("AINO Enhanced Airport Facility Scraping Report")
        print("="*60)
        print(f"Total airports processed: {report['total_airports']}")
        print(f"Virgin Atlantic hubs covered: {report['virgin_atlantic_hubs']}")
        print(f"Ground handlers identified: {report['facilities_summary']['ground_handlers_identified']}")
        print(f"Maintenance providers identified: {report['facilities_summary']['maintenance_providers_identified']}")
        print(f"Fuel suppliers identified: {report['facilities_summary']['fuel_suppliers_identified']}")
        print(f"Contact info available: {report['facilities_summary']['contact_info_available']}")
        print("="*60)
    else:
        print("Enhanced scraping failed to collect data")

if __name__ == "__main__":
    main()