#!/usr/bin/env python3
"""
NAT (North Atlantic Track) Parser for AINO Aviation Intelligence Platform
Parses North Atlantic Tracks from FAA NOTAM data and provides GeoJSON output
"""

import requests
import re
import json
from datetime import datetime
import logging

# Configure logging for AINO platform integration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NATTrackParser:
    """North Atlantic Track parser for AINO platform"""
    
    def __init__(self):
        self.nat_url = "https://www.notams.faa.gov/common/nat.html"
        self.timeout = 15
        
    def fetch_nat_bulletin(self):
        """Fetch NAT bulletin from FAA NOTAM source"""
        try:
            logger.info("🌊 Fetching NAT tracks from FAA NOTAM source...")
            headers = {
                'User-Agent': 'Mozilla/5.0 (compatible; AINO-Aviation-Platform/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
            
            response = requests.get(self.nat_url, timeout=self.timeout, headers=headers)
            response.raise_for_status()
            
            logger.info(f"✅ NAT bulletin retrieved: {len(response.text)} bytes")
            return response.text
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Failed to fetch NAT bulletin: {e}")
            raise
    
    def extract_track_blocks(self, html_text):
        """Extract individual track blocks from NAT bulletin"""
        try:
            # Remove HTML tags to get plain text
            plain_text = re.sub(r"<[^>]+>", "", html_text)
            
            # Debug: Print part of the text to understand format
            logger.info(f"🔍 NAT bulletin sample text (first 500 chars):\n{plain_text[:500]}")
            
            # Find track blocks using NAT-specific pattern
            # NAT tracks appear as "A PIKIL 57/20 57/30..." format
            track_pattern = r"^([A-Z])\s+([A-Z]{5}\s+.*?)(?=\n[A-Z]\s+[A-Z]{5}|\nREMARKS|\nEND OF PART|\Z)"
            track_blocks = re.findall(track_pattern, plain_text, re.MULTILINE | re.DOTALL)
            
            logger.info(f"✅ Found {len(track_blocks)} NAT tracks using standard pattern")
            
            # If still no tracks found, try simpler pattern
            if not track_blocks:
                logger.warning("⚠️ Standard pattern failed, trying simpler approach...")
                # Look for lines starting with single letter followed by waypoint data
                simple_pattern = r"^([A-Z])\s+([A-Z0-9/\s]+(?:\d{2}/\d{2}|\d{4}/\d{2})[A-Z0-9/\s]*)"
                track_blocks = re.findall(simple_pattern, plain_text, re.MULTILINE)
                logger.info(f"📍 Found {len(track_blocks)} tracks with simple pattern")
            
            logger.info(f"📡 Extracted {len(track_blocks)} NAT track blocks")
            return track_blocks
            
        except Exception as e:
            logger.error(f"❌ Failed to extract track blocks: {e}")
            return []
    
    def parse_waypoints(self, track_text):
        """Parse waypoint coordinates from track text"""
        try:
            # NAT tracks use formats like "57/20", "5530/20" (lat/lon with implied decimals)
            coord_patterns = [
                r"(\d{2})/(\d{2})",  # DD/DD format like "57/20"
                r"(\d{4})/(\d{2})",  # DDMM/DD format like "5530/20" 
                r"(\d{2})/(\d{4})",  # DD/DDMM format
                r"(\d{4})/(\d{4})",  # DDMM/DDMM format
            ]
            
            coords = []
            for pattern in coord_patterns:
                coord_matches = re.findall(pattern, track_text)
                
                for match in coord_matches:
                    try:
                        lat_str, lon_str = match
                        
                        # Parse latitude
                        if len(lat_str) == 2:
                            lat = float(lat_str)  # Simple degrees
                        elif len(lat_str) == 4:
                            lat_deg = float(lat_str[:2])
                            lat_min = float(lat_str[2:])
                            lat = lat_deg + lat_min/60.0
                        else:
                            continue
                            
                        # Parse longitude  
                        if len(lon_str) == 2:
                            lon = -float(lon_str)  # Western hemisphere, simple degrees
                        elif len(lon_str) == 4:
                            lon_deg = float(lon_str[:2])
                            lon_min = float(lon_str[2:])
                            lon = -(lon_deg + lon_min/60.0)  # Western hemisphere
                        else:
                            continue
                            
                        # Validate coordinates are reasonable for North Atlantic
                        if 40 <= lat <= 70 and -80 <= lon <= -10:
                            coords.append([lon, lat])  # GeoJSON format is [longitude, latitude]
                            logger.debug(f"✅ Valid coordinate: {lat}, {lon}")
                            
                    except (ValueError, IndexError) as e:
                        logger.debug(f"⚠️ Failed to parse coordinate pair {match}: {e}")
                        continue
                        
                if coords:  # If we found coordinates with this pattern, use them
                    logger.info(f"🗺️ Successfully parsed {len(coords)} waypoints using pattern {pattern}")
                    break
            
            if not coords:
                logger.warning(f"⚠️ No valid coordinates found in track text: {track_text[:100]}...")
            
            return coords
            
        except Exception as e:
            logger.error(f"❌ Failed to parse waypoints: {e}")
            return []
    
    def determine_direction(self, track_text):
        """Determine if track is eastbound or westbound based on NAT bulletin patterns"""
        text_upper = track_text.upper()
        
        # Check for explicit direction indicators
        if "EAST LVLS" in text_upper and "WEST LVLS NIL" in text_upper:
            return "Eastbound"
        elif "WEST LVLS" in text_upper and "EAST LVLS NIL" in text_upper:
            return "Westbound"
        elif "EASTBOUND" in text_upper:
            return "Eastbound"
        elif "WESTBOUND" in text_upper:
            return "Westbound"
        
        # Analyze time periods for day/night track cycles
        # Day tracks (1130Z-1900Z): Typically Eastbound (Europe to North America morning departures)
        # Night tracks (0100Z-0800Z): Typically Westbound (North America to Europe evening departures)
        if any(time_pattern in text_upper for time_pattern in ["1130Z", "1200Z", "1300Z", "1400Z", "1500Z", "1600Z", "1700Z", "1800Z", "1900Z"]):
            # Day tracks - usually eastbound for morning Europe to NA traffic
            return "Eastbound"
        elif any(time_pattern in text_upper for time_pattern in ["0100Z", "0200Z", "0300Z", "0400Z", "0500Z", "0600Z", "0700Z", "0800Z"]):
            # Night tracks - usually westbound for evening NA to Europe traffic  
            return "Westbound"
        
        # Check flight level patterns - NAT tracks often use different FLs for different directions
        if "WEST LVLS NIL" in text_upper:
            return "Eastbound"
        elif "EAST LVLS NIL" in text_upper:
            return "Westbound"
        
        # Default to Eastbound if no clear indicators (current tracks are daytime eastbound)
        return "Eastbound"
    
    def build_geojson(self, track_blocks):
        """Build GeoJSON FeatureCollection from parsed track blocks"""
        features = []
        
        for track_id, block_text in track_blocks:
            coords = self.parse_waypoints(block_text)
            
            if coords and len(coords) >= 2:  # Need at least 2 points for a line
                direction = self.determine_direction(block_text)
                
                # Color coding: Orange for Eastbound (day), Purple for Westbound (night)
                color = "#FFA500" if direction == "Eastbound" else "#9333EA"
                
                feature = {
                    "type": "Feature",
                    "properties": {
                        "track_id": track_id,
                        "direction": direction,
                        "color": color,
                        "timestamp": datetime.utcnow().isoformat(),
                        "source": "FAA NOTAM",
                        "waypoint_count": len(coords),
                        "raw_text": block_text.strip()[:200] + "..." if len(block_text) > 200 else block_text.strip()
                    },
                    "geometry": {
                        "type": "LineString",
                        "coordinates": coords
                    }
                }
                features.append(feature)
                
                logger.info(f"🛩️ NAT Track {track_id}: {direction} with {len(coords)} waypoints")
        
        geojson = {
            "type": "FeatureCollection",
            "properties": {
                "generated_at": datetime.utcnow().isoformat(),
                "source": "FAA NOTAM",
                "total_tracks": len(features)
            },
            "features": features
        }
        
        return geojson
    
    def parse_nat_tracks(self):
        """Main parsing function - returns GeoJSON of current NAT tracks"""
        try:
            # Fetch bulletin
            html_text = self.fetch_nat_bulletin()
            
            # Extract track blocks
            track_blocks = self.extract_track_blocks(html_text)
            
            if not track_blocks:
                logger.warning("⚠️ No NAT tracks found in bulletin")
                return {"type": "FeatureCollection", "features": []}
            
            # Build GeoJSON
            geojson_output = self.build_geojson(track_blocks)
            
            logger.info(f"✅ Successfully parsed {len(geojson_output['features'])} NAT tracks")
            return geojson_output
            
        except Exception as e:
            logger.error(f"❌ NAT track parsing failed: {e}")
            return {"type": "FeatureCollection", "features": [], "error": str(e)}
    
    def save_tracks(self, filename="nat_tracks.geojson"):
        """Parse and save NAT tracks to file"""
        geojson_data = self.parse_nat_tracks()
        
        try:
            with open(filename, "w") as f:
                json.dump(geojson_data, f, indent=2)
            
            logger.info(f"💾 NAT tracks saved to {filename}")
            return filename
            
        except Exception as e:
            logger.error(f"❌ Failed to save NAT tracks: {e}")
            raise

def main():
    """Command-line interface for NAT track parsing"""
    parser = NATTrackParser()
    
    try:
        geojson_output = parser.parse_nat_tracks()
        
        # Save to file
        with open("nat_tracks.geojson", "w") as f:
            json.dump(geojson_output, f, indent=2)
        
        print(f"[OK] Parsed {len(geojson_output['features'])} NAT tracks.")
        
        # Print summary
        for feature in geojson_output['features']:
            props = feature['properties']
            print(f"Track {props['track_id']}: {props['direction']} ({props['waypoint_count']} waypoints)")
            
    except Exception as e:
        print(f"[ERROR] {e}")

if __name__ == "__main__":
    main()