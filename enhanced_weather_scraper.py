#!/usr/bin/env python3
"""
Enhanced Weather Scraper for AINO Aviation Intelligence Platform
Integrates SIGMET data and turbulence mapping for comprehensive weather intelligence
"""

import os
import requests
from datetime import datetime
from bs4 import BeautifulSoup
import json
import time
from typing import Dict, List, Optional

class EnhancedWeatherScraper:
    """Enhanced weather scraper with SIGMET and turbulence data integration"""
    
    def __init__(self):
        self.setup_directories()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'AINO-Aviation-Weather-Intelligence/1.0'
        })
    
    def setup_directories(self):
        """Create necessary directories for weather data storage"""
        os.makedirs("weather_maps", exist_ok=True)
        os.makedirs("sigmet_texts", exist_ok=True)
        os.makedirs("weather_analysis", exist_ok=True)
    
    def fetch_sigmet_text(self) -> Dict:
        """Fetch latest international SIGMETs from Aviation Weather Center"""
        try:
            url = "https://aviationweather.gov/sigmet/data?type=INTL"
            response = self.session.get(url, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, "html.parser")
                sigmet_element = soup.find("pre")
                if sigmet_element:
                    sigmet_text = sigmet_element.text
                    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
                    
                    # Save raw SIGMET text
                    with open(f"sigmet_texts/sigmet_{timestamp}.txt", "w") as f:
                        f.write(sigmet_text)
                    
                    # Parse and analyze SIGMET data
                    parsed_sigmets = self.parse_sigmet_data(sigmet_text)
                    
                    # Save parsed data
                    with open(f"weather_analysis/sigmet_analysis_{timestamp}.json", "w") as f:
                        json.dump(parsed_sigmets, f, indent=2)
                    
                    return {
                        "success": True,
                        "timestamp": timestamp,
                        "raw_text": sigmet_text,
                        "parsed_sigmets": parsed_sigmets,
                        "total_sigmets": len(parsed_sigmets)
                    }
                else:
                    return {"success": False, "error": "No SIGMET data found in response"}
            else:
                return {"success": False, "error": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def parse_sigmet_data(self, sigmet_text: str) -> List[Dict]:
        """Parse SIGMET text into structured data"""
        sigmets = []
        lines = sigmet_text.strip().split('\n')
        
        current_sigmet = {}
        for line in lines:
            line = line.strip()
            if not line:
                if current_sigmet:
                    sigmets.append(current_sigmet)
                    current_sigmet = {}
                continue
            
            # Basic SIGMET parsing
            if line.startswith('SIGMET'):
                current_sigmet['type'] = 'SIGMET'
                current_sigmet['raw_line'] = line
            elif 'VALID' in line:
                current_sigmet['validity'] = line
            elif any(hazard in line for hazard in ['TURB', 'TURBULENCE', 'THUNDERSTORM', 'CONVECTIVE']):
                current_sigmet['hazard_type'] = self.identify_hazard_type(line)
                current_sigmet['description'] = line
            elif 'FLT LVL' in line or 'FL' in line:
                current_sigmet['flight_levels'] = line
            
            # Add full text for reference
            if 'full_text' not in current_sigmet:
                current_sigmet['full_text'] = line
            else:
                current_sigmet['full_text'] += '\n' + line
        
        # Don't forget the last SIGMET
        if current_sigmet:
            sigmets.append(current_sigmet)
        
        return sigmets
    
    def identify_hazard_type(self, line: str) -> str:
        """Identify the type of weather hazard from SIGMET text"""
        line_upper = line.upper()
        if 'TURB' in line_upper:
            return 'TURBULENCE'
        elif 'THUNDERSTORM' in line_upper or 'TS' in line_upper:
            return 'THUNDERSTORM'
        elif 'CONVECTIVE' in line_upper:
            return 'CONVECTIVE'
        elif 'ICING' in line_upper:
            return 'ICING'
        elif 'VOLCANIC' in line_upper:
            return 'VOLCANIC_ASH'
        else:
            return 'OTHER'
    
    def download_turbli_tile(self, z: int = 4, x: int = 8, y: int = 5, layer: str = "turbulence") -> Dict:
        """Download turbulence tile from Turbli for global coverage"""
        try:
            url = f"https://tiles.turbli.com/{layer}/{z}/{x}/{y}.png"
            response = self.session.get(url, timeout=15)
            if response.status_code == 200:
                filename = f"weather_maps/{layer}_{z}_{x}_{y}.png"
                with open(filename, "wb") as f:
                    f.write(response.content)
                return {
                    "success": True,
                    "filename": filename,
                    "tile_coords": {"z": z, "x": x, "y": y},
                    "layer": layer,
                    "size_bytes": len(response.content)
                }
            else:
                return {"success": False, "error": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def download_global_turbulence_coverage(self) -> Dict:
        """Download multiple turbulence tiles for global coverage"""
        results = []
        
        # Key regions for aviation operations
        regions = [
            # North Atlantic
            {"z": 4, "x": 7, "y": 5, "name": "North Atlantic"},
            {"z": 4, "x": 8, "y": 5, "name": "North Atlantic East"},
            # Europe
            {"z": 4, "x": 8, "y": 4, "name": "Europe"},
            {"z": 4, "x": 9, "y": 4, "name": "Europe East"},
            # North America
            {"z": 4, "x": 3, "y": 5, "name": "North America West"},
            {"z": 4, "x": 4, "y": 5, "name": "North America East"},
            # Asia Pacific
            {"z": 4, "x": 12, "y": 6, "name": "Asia Pacific"},
            {"z": 4, "x": 13, "y": 6, "name": "Asia Pacific East"},
        ]
        
        for region in regions:
            result = self.download_turbli_tile(
                z=region["z"], 
                x=region["x"], 
                y=region["y"], 
                layer="turbulence"
            )
            result["region"] = region["name"]
            results.append(result)
            time.sleep(1)  # Rate limiting
        
        return {
            "success": True,
            "total_tiles": len(results),
            "successful_downloads": sum(1 for r in results if r["success"]),
            "results": results
        }
    
    def generate_weather_intelligence_report(self) -> Dict:
        """Generate comprehensive weather intelligence report"""
        report = {
            "timestamp": datetime.utcnow().isoformat(),
            "report_type": "AINO Weather Intelligence",
            "sigmets": {},
            "turbulence": {},
            "summary": {}
        }
        
        # Fetch SIGMET data
        sigmet_result = self.fetch_sigmet_text()
        report["sigmets"] = sigmet_result
        
        # Download turbulence data
        turbulence_result = self.download_global_turbulence_coverage()
        report["turbulence"] = turbulence_result
        
        # Generate summary
        report["summary"] = {
            "sigmet_count": sigmet_result.get("total_sigmets", 0) if sigmet_result.get("success") else 0,
            "turbulence_tiles": turbulence_result.get("successful_downloads", 0),
            "data_quality": "HIGH" if sigmet_result.get("success") and turbulence_result.get("successful_downloads", 0) > 6 else "MEDIUM",
            "operational_impact": self.assess_operational_impact(sigmet_result, turbulence_result)
        }
        
        return report
    
    def assess_operational_impact(self, sigmet_result: Dict, turbulence_result: Dict) -> str:
        """Assess operational impact based on weather data"""
        if not sigmet_result.get("success"):
            return "UNKNOWN - SIGMET data unavailable"
        
        sigmet_count = sigmet_result.get("total_sigmets", 0)
        if sigmet_count > 10:
            return "HIGH - Multiple active weather hazards"
        elif sigmet_count > 5:
            return "MEDIUM - Several active weather hazards"
        elif sigmet_count > 0:
            return "LOW - Limited weather hazards"
        else:
            return "MINIMAL - No significant weather hazards"

def main():
    """Main execution function for enhanced weather scraping"""
    scraper = EnhancedWeatherScraper()
    
    print("🌩️ AINO Enhanced Weather Intelligence Collection Started")
    print("=" * 60)
    
    # Generate comprehensive weather report
    report = scraper.generate_weather_intelligence_report()
    
    # Save report
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    report_filename = f"weather_analysis/aino_weather_report_{timestamp}.json"
    with open(report_filename, "w") as f:
        json.dump(report, f, indent=2)
    
    # Display results
    print(f"📊 Weather Intelligence Report Generated")
    print(f"   Report saved to: {report_filename}")
    print(f"   SIGMETs collected: {report['summary']['sigmet_count']}")
    print(f"   Turbulence tiles: {report['summary']['turbulence_tiles']}")
    print(f"   Data quality: {report['summary']['data_quality']}")
    print(f"   Operational impact: {report['summary']['operational_impact']}")
    
    return report

if __name__ == "__main__":
    main()