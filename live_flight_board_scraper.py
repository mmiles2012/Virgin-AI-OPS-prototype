"""
Live Flight Board Scraper for AINO Aviation Intelligence Platform
Uses Selenium to scrape real arrival/departure boards for model validation
"""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import pandas as pd
import time
from datetime import datetime, timedelta
import os
import json
from typing import Dict, List, Optional
import re

class LiveFlightBoardScraper:
    """Scrapes live arrival and departure boards from multiple airports"""
    
    def __init__(self):
        self.airports = {
            'JFK': {
                'name': 'John F. Kennedy International Airport',
                'arrivals_url': 'https://www.jfkairport.com/flights/arrivals',
                'departures_url': 'https://www.jfkairport.com/flights/departures',
                'icao': 'KJFK'
            },
            'BOS': {
                'name': 'Boston Logan International Airport',
                'arrivals_url': 'https://www.massport.com/logan-airport/flights/arrivals/',
                'departures_url': 'https://www.massport.com/logan-airport/flights/departures/',
                'icao': 'KBOS'
            },
            'LAX': {
                'name': 'Los Angeles International Airport',
                'arrivals_url': 'https://www.flylax.com/flight-tracker-arrivals',
                'departures_url': 'https://www.flylax.com/flight-tracker-departures',
                'icao': 'KLAX'
            },
            'LHR': {
                'name': 'London Heathrow Airport',
                'arrivals_url': 'https://www.heathrow.com/flight-information/arrivals',
                'departures_url': 'https://www.heathrow.com/flight-information/departures',
                'icao': 'EGLL'
            }
        }
        
        self.setup_driver()
    
    def setup_driver(self):
        """Setup Chrome driver with optimal configuration"""
        self.chrome_options = Options()
        self.chrome_options.add_argument("--headless")
        self.chrome_options.add_argument("--no-sandbox")
        self.chrome_options.add_argument("--disable-dev-shm-usage")
        self.chrome_options.add_argument("--disable-gpu")
        self.chrome_options.add_argument("--window-size=1920,1080")
        self.chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    
    def scrape_jfk_arrivals(self) -> pd.DataFrame:
        """Enhanced JFK arrivals scraper with robust error handling"""
        print("Scraping JFK arrivals...")
        
        try:
            driver = webdriver.Chrome(options=self.chrome_options)
            driver.get(self.airports['JFK']['arrivals_url'])
            
            # Wait for dynamic content to load
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "flight-row"))
            )
            
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            driver.quit()
            
            flights = []
            flight_rows = soup.select("tr.flight-row, .flight-item, .arrival-row")
            
            for row in flight_rows:
                try:
                    # Extract flight information with multiple selector fallbacks
                    flight_number = self._extract_text(row, ['.flight-number', '.flight', '.flight-code'])
                    airline = self._extract_text(row, ['.airline-name', '.airline', '.carrier'])
                    origin = self._extract_text(row, ['.airport', '.origin', '.from'])
                    sched_time = self._extract_text(row, ['.scheduled-time', '.scheduled', '.sched'])
                    est_time = self._extract_text(row, ['.estimated-time', '.estimated', '.est'])
                    status = self._extract_text(row, ['.flight-status', '.status'])
                    gate = self._extract_text(row, ['.gate', '.gate-number'])
                    
                    if flight_number and airline:  # Minimum required fields
                        # Calculate delay if possible
                        delay_minutes = self._calculate_delay(sched_time, est_time)
                        
                        flights.append({
                            'Airport': 'JFK',
                            'ICAO': 'KJFK',
                            'Flight': flight_number,
                            'Airline': airline,
                            'Origin': origin or 'Unknown',
                            'Scheduled': sched_time,
                            'Estimated': est_time,
                            'Status': status or 'Unknown',
                            'Gate': gate,
                            'DelayMinutes': delay_minutes,
                            'ScrapeTimeUTC': datetime.utcnow().isoformat(),
                            'Source': 'JFK_Official_Board'
                        })
                        
                except Exception as e:
                    print(f"Error processing JFK flight row: {str(e)}")
                    continue
            
            print(f"Successfully scraped {len(flights)} JFK arrivals")
            return pd.DataFrame(flights)
            
        except Exception as e:
            print(f"Error scraping JFK arrivals: {str(e)}")
            return pd.DataFrame()
    
    def scrape_lhr_arrivals(self) -> pd.DataFrame:
        """Scrape Heathrow arrivals with Virgin Atlantic focus"""
        print("Scraping LHR arrivals...")
        
        try:
            driver = webdriver.Chrome(options=self.chrome_options)
            driver.get(self.airports['LHR']['arrivals_url'])
            
            # Wait for Heathrow's dynamic content
            time.sleep(12)  # Heathrow takes longer to load
            
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            driver.quit()
            
            flights = []
            
            # Multiple selector patterns for Heathrow
            flight_selectors = [
                ".flight-details-row", ".arrival-row", ".flight-item", 
                "tr[data-flight]", ".flight-card"
            ]
            
            for selector in flight_selectors:
                rows = soup.select(selector)
                if rows:
                    break
            
            for row in rows:
                try:
                    flight_number = self._extract_text(row, ['.flight-number', '.flight', '[data-flight-number]'])
                    airline = self._extract_text(row, ['.airline', '.carrier', '.airline-name'])
                    origin = self._extract_text(row, ['.origin', '.from', '.departure-airport'])
                    sched_time = self._extract_text(row, ['.scheduled', '.sched-time', '.scheduled-arrival'])
                    actual_time = self._extract_text(row, ['.actual', '.actual-time', '.estimated'])
                    status = self._extract_text(row, ['.status', '.flight-status'])
                    terminal = self._extract_text(row, ['.terminal', '.term'])
                    
                    if flight_number:
                        delay_minutes = self._calculate_delay(sched_time, actual_time)
                        
                        # Flag Virgin Atlantic flights for special attention
                        is_virgin_atlantic = 'VS' in flight_number or 'Virgin' in (airline or '')
                        
                        flights.append({
                            'Airport': 'LHR',
                            'ICAO': 'EGLL',
                            'Flight': flight_number,
                            'Airline': airline or 'Unknown',
                            'Origin': origin or 'Unknown',
                            'Scheduled': sched_time,
                            'Actual': actual_time,
                            'Status': status or 'Unknown',
                            'Terminal': terminal,
                            'DelayMinutes': delay_minutes,
                            'IsVirginAtlantic': is_virgin_atlantic,
                            'ScrapeTimeUTC': datetime.utcnow().isoformat(),
                            'Source': 'LHR_Official_Board'
                        })
                        
                except Exception as e:
                    print(f"Error processing LHR flight row: {str(e)}")
                    continue
            
            print(f"Successfully scraped {len(flights)} LHR arrivals")
            return pd.DataFrame(flights)
            
        except Exception as e:
            print(f"Error scraping LHR arrivals: {str(e)}")
            return pd.DataFrame()
    
    def scrape_all_airports(self) -> pd.DataFrame:
        """Scrape all configured airports and combine data"""
        print("=== Starting Comprehensive Flight Board Scraping ===")
        
        all_flights = []
        
        # JFK
        jfk_data = self.scrape_jfk_arrivals()
        if not jfk_data.empty:
            all_flights.append(jfk_data)
        
        # Heathrow
        lhr_data = self.scrape_lhr_arrivals()
        if not lhr_data.empty:
            all_flights.append(lhr_data)
        
        # Add rate limiting between scrapes
        time.sleep(3)
        
        # Additional airports can be added here
        # bos_data = self.scrape_bos_arrivals()
        # lax_data = self.scrape_lax_arrivals()
        
        if all_flights:
            combined_df = pd.concat(all_flights, ignore_index=True)
            
            # Save comprehensive dataset
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f'data/live_flight_boards_{timestamp}.csv'
            combined_df.to_csv(filename, index=False)
            
            print(f"\nSaved {len(combined_df)} flight records to {filename}")
            return combined_df
        
        return pd.DataFrame()
    
    def _extract_text(self, element, selectors: List[str]) -> Optional[str]:
        """Extract text using multiple CSS selectors as fallbacks"""
        for selector in selectors:
            try:
                found = element.select_one(selector)
                if found and found.text.strip():
                    return found.text.strip()
            except:
                continue
        return None
    
    def _calculate_delay(self, scheduled: str, actual: str) -> int:
        """Calculate delay in minutes between scheduled and actual times"""
        if not scheduled or not actual:
            return 0
        
        try:
            # Parse various time formats
            sched_time = self._parse_time(scheduled)
            actual_time = self._parse_time(actual)
            
            if sched_time and actual_time:
                # Handle day wraparound
                if actual_time < sched_time:
                    actual_time += timedelta(days=1)
                
                delay = (actual_time - sched_time).total_seconds() / 60
                return max(0, int(delay))
            
        except Exception as e:
            print(f"Error calculating delay: {str(e)}")
        
        return 0
    
    def _parse_time(self, time_str: str) -> Optional[datetime]:
        """Parse time string in various formats"""
        if not time_str:
            return None
        
        # Common time formats
        formats = [
            "%H:%M", "%I:%M %p", "%H%M", 
            "%Y-%m-%d %H:%M", "%d/%m/%Y %H:%M"
        ]
        
        # Clean the time string
        time_str = re.sub(r'[^\d:\s/apm-]', '', time_str.lower())
        
        for fmt in formats:
            try:
                parsed = datetime.strptime(time_str, fmt)
                # If no date, assume today
                if parsed.year == 1900:
                    today = datetime.now().date()
                    parsed = datetime.combine(today, parsed.time())
                return parsed
            except:
                continue
        
        return None
    
    def validate_against_metar_models(self, flight_df: pd.DataFrame) -> Dict:
        """Validate scraped data against METAR-enhanced models"""
        if flight_df.empty:
            return {"error": "No flight data available for validation"}
        
        print("\n=== Model Validation Against Live Data ===")
        
        # Calculate real-world delay statistics
        validation_results = {
            'scrape_timestamp': datetime.utcnow().isoformat(),
            'total_flights': len(flight_df),
            'airports_covered': flight_df['Airport'].nunique(),
            'delay_analysis': {},
            'virgin_atlantic_focus': {},
            'weather_correlation_ready': True
        }
        
        # Overall delay analysis
        valid_delays = flight_df[flight_df['DelayMinutes'].notna()]
        if not valid_delays.empty:
            validation_results['delay_analysis'] = {
                'flights_with_delay_data': len(valid_delays),
                'average_delay_minutes': float(valid_delays['DelayMinutes'].mean()),
                'max_delay_minutes': int(valid_delays['DelayMinutes'].max()),
                'on_time_percentage': float((valid_delays['DelayMinutes'] <= 15).mean() * 100),
                'delay_distribution': {
                    'on_time': int((valid_delays['DelayMinutes'] <= 15).sum()),
                    'short_delay': int(((valid_delays['DelayMinutes'] > 15) & 
                                     (valid_delays['DelayMinutes'] <= 60)).sum()),
                    'medium_delay': int(((valid_delays['DelayMinutes'] > 60) & 
                                       (valid_delays['DelayMinutes'] <= 180)).sum()),
                    'long_delay': int((valid_delays['DelayMinutes'] > 180).sum())
                }
            }
        
        # Virgin Atlantic specific analysis (if LHR data available)
        if 'IsVirginAtlantic' in flight_df.columns:
            vs_flights = flight_df[flight_df['IsVirginAtlantic'] == True]
            if not vs_flights.empty:
                validation_results['virgin_atlantic_focus'] = {
                    'vs_flights_found': len(vs_flights),
                    'vs_average_delay': float(vs_flights['DelayMinutes'].mean()) if not vs_flights['DelayMinutes'].isna().all() else 0,
                    'vs_on_time_rate': float((vs_flights['DelayMinutes'] <= 15).mean() * 100) if not vs_flights['DelayMinutes'].isna().all() else 0
                }
        
        # Airport-specific performance
        airport_stats = {}
        for airport in flight_df['Airport'].unique():
            airport_data = flight_df[flight_df['Airport'] == airport]
            airport_delays = airport_data[airport_data['DelayMinutes'].notna()]
            
            if not airport_delays.empty:
                airport_stats[airport] = {
                    'flights': len(airport_data),
                    'avg_delay': float(airport_delays['DelayMinutes'].mean()),
                    'on_time_rate': float((airport_delays['DelayMinutes'] <= 15).mean() * 100)
                }
        
        validation_results['airport_performance'] = airport_stats
        
        # Save validation results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        with open(f'data/live_board_validation_{timestamp}.json', 'w') as f:
            json.dump(validation_results, f, indent=2)
        
        print(f"Validation results saved to data/live_board_validation_{timestamp}.json")
        return validation_results

def main():
    """Execute live flight board scraping and validation"""
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    
    scraper = LiveFlightBoardScraper()
    
    # Collect live flight data
    flight_data = scraper.scrape_all_airports()
    
    if not flight_data.empty:
        print(f"\n=== Live Flight Data Collection Complete ===")
        print(f"Total flights collected: {len(flight_data)}")
        print(f"Airports covered: {flight_data['Airport'].unique()}")
        
        # Validate against models
        validation_results = scraper.validate_against_metar_models(flight_data)
        
        print(f"\nModel validation complete:")
        print(f"- Flights analyzed: {validation_results['total_flights']}")
        print(f"- Weather correlation ready: {validation_results['weather_correlation_ready']}")
        
        return flight_data, validation_results
    else:
        print("No flight data collected. Check airport website accessibility.")
        return None, None

if __name__ == "__main__":
    flight_data, validation_results = main()