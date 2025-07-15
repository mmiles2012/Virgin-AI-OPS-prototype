#!/usr/bin/env python3
"""
Visa Requirements System for AINO Aviation Intelligence Platform
Web scraping-based visa intelligence for Virgin Atlantic's three main passenger nationalities
"""

from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime, timedelta
import logging
import threading
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Source pages per passport - Virgin Atlantic's three main nationalities
visa_pages = {
    "British": "https://en.wikipedia.org/wiki/Visa_requirements_for_British_citizens",
    "Indian": "https://en.wikipedia.org/wiki/Visa_requirements_for_Indian_citizens",
    "U.S.": "https://en.wikipedia.org/wiki/Visa_requirements_for_United_States_citizens"
}

# Virgin Atlantic destinations to check
target_countries = [
    "Turkey", "Pakistan", "Azerbaijan", "India", "Saudi Arabia",
    "Algeria", "Turkmenistan", "Uzbekistan", "Egypt", "South Africa", "Schengen",
    "United States", "Canada", "Jamaica", "Barbados", "Antigua and Barbuda",
    "Saint Lucia", "Grenada", "Nigeria", "Ghana", "Kenya", "China", "Japan",
    "Hong Kong", "Singapore", "Australia", "New Zealand", "Dubai", "Tel Aviv"
]

CACHE_FILE = "visa_cache.json"
CACHE_DAYS = 7

# Load and validate cached results
def load_cache():
    if not os.path.exists(CACHE_FILE):
        return {}
    
    try:
        with open(CACHE_FILE, "r") as f:
            cached = json.load(f)
            timestamp = datetime.fromisoformat(cached.get("timestamp", "1970-01-01T00:00:00"))
            if datetime.now() - timestamp < timedelta(days=CACHE_DAYS):
                logger.info(f"Using cached visa data from {timestamp}")
                return cached.get("data", {})
    except Exception as e:
        logger.error(f"Cache load error: {e}")
    
    return {}

# Save fresh scrape to cache
def save_cache(data):
    try:
        with open(CACHE_FILE, "w") as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "data": data
            }, f, indent=2)
        logger.info("Visa cache updated successfully")
    except Exception as e:
        logger.error(f"Cache save error: {e}")

# Scrape Wikipedia for a passport type
def scrape_passport(passport):
    url = visa_pages.get(passport)
    if not url:
        return []

    try:
        logger.info(f"Scraping visa requirements for {passport} passport")
        headers = {
            'User-Agent': 'AINO-Aviation-Platform/1.0 (Virgin Atlantic Visa Intelligence)'
        }
        
        res = requests.get(url, timeout=15, headers=headers)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.content, "html.parser")
        tables = soup.find_all("table", {"class": "wikitable"})

        rows = []
        for table in tables:
            for row in table.find_all("tr")[1:]:  # Skip header row
                cells = row.find_all(["td", "th"])
                text = [c.get_text(strip=True) for c in cells]
                
                if len(text) < 2:
                    continue
                
                country = text[0]
                visa = text[1]
                notes = text[2] if len(text) > 2 else ""
                
                # Check if this country is in our target list
                for target in target_countries:
                    if target.lower() in country.lower() or country.lower() in target.lower():
                        rows.append({
                            "passport": passport,
                            "destination": country,
                            "visa_requirement": visa,
                            "notes": notes,
                            "target_match": target,
                            "scraped_at": datetime.now().isoformat()
                        })
        
        logger.info(f"Found {len(rows)} visa requirements for {passport} passport")
        return rows
        
    except Exception as e:
        logger.error(f"Error scraping {passport} passport: {e}")
        return [{"error": f"{passport} scraping error: {str(e)}"}]

# Build full dataset (for all 3 passports)
def build_cache():
    logger.info("Building fresh visa cache for all passport types")
    full_data = {}
    
    for passport in visa_pages:
        full_data[passport] = scrape_passport(passport)
        time.sleep(2)  # Rate limiting
    
    save_cache(full_data)
    return full_data

# Enhanced visa lookup with fuzzy matching
def find_visa_requirement(passport_data, destination):
    """Find visa requirement with fuzzy matching"""
    if not passport_data:
        return None
    
    # Direct match first
    for entry in passport_data:
        if destination.lower() in entry.get("destination", "").lower():
            return entry
    
    # Fuzzy match with target countries
    for entry in passport_data:
        if destination.lower() in entry.get("target_match", "").lower():
            return entry
    
    return None

# Load or refresh cache
visa_data = load_cache()
if not visa_data:
    visa_data = build_cache()

# Background refresh function
def background_refresh():
    """Refresh visa data in background every 24 hours"""
    while True:
        time.sleep(24 * 3600)  # 24 hours
        try:
            global visa_data
            visa_data = build_cache()
        except Exception as e:
            logger.error(f"Background refresh error: {e}")

# Start background refresh thread
refresh_thread = threading.Thread(target=background_refresh, daemon=True)
refresh_thread.start()

# --------------------
# AINO API ROUTES
# --------------------

@app.route("/")
def root():
    return jsonify({
        "service": "AINO Visa Requirements Intelligence",
        "version": "1.0",
        "supported_passports": list(visa_pages.keys()),
        "destinations": target_countries,
        "endpoints": {
            "visa_lookup": "/api/visa/lookup?passport=British&destination=Egypt",
            "bulk_passport": "/api/visa/bulk?passport=Indian",
            "analytics": "/api/visa/analytics",
            "refresh": "/api/visa/refresh"
        },
        "cache_status": {
            "cached_passports": len(visa_data),
            "last_updated": datetime.now().isoformat()
        }
    })

@app.route("/api/visa/lookup")
def visa_lookup():
    passport = request.args.get("passport")
    destination = request.args.get("destination")

    if not passport or not destination:
        return jsonify({
            "error": "Missing parameters",
            "usage": "/api/visa/lookup?passport=British&destination=Egypt"
        }), 400

    entries = visa_data.get(passport)
    if not entries:
        return jsonify({
            "error": f"No data for passport: {passport}",
            "available_passports": list(visa_pages.keys())
        }), 404

    result = find_visa_requirement(entries, destination)
    if result:
        return jsonify({
            "success": True,
            "visa_requirement": result,
            "operational_notes": {
                "passenger_advisory": "Check latest requirements before travel",
                "virgin_atlantic_support": "Contact Virgin Atlantic for travel document assistance"
            }
        })
    
    return jsonify({
        "error": f"No visa info for {passport} → {destination}",
        "available_destinations": [entry.get("destination") for entry in entries[:10]]
    }), 404

@app.route("/api/visa/bulk")
def bulk_lookup():
    passport = request.args.get("passport")
    if not passport:
        return jsonify({
            "error": "Missing passport parameter",
            "usage": "/api/visa/bulk?passport=British"
        }), 400

    data = visa_data.get(passport)
    if not data:
        return jsonify({
            "error": f"No data found for passport: {passport}",
            "available_passports": list(visa_pages.keys())
        }), 404
    
    return jsonify({
        "success": True,
        "passport": passport,
        "total_destinations": len(data),
        "visa_requirements": data,
        "summary": {
            "visa_required": len([d for d in data if "visa required" in d.get("visa_requirement", "").lower()]),
            "visa_free": len([d for d in data if "visa not required" in d.get("visa_requirement", "").lower() or "visa free" in d.get("visa_requirement", "").lower()]),
            "visa_on_arrival": len([d for d in data if "visa on arrival" in d.get("visa_requirement", "").lower()])
        }
    })

@app.route("/api/visa/analytics")
def visa_analytics():
    """Generate visa analytics for Virgin Atlantic operational intelligence"""
    analytics = {
        "report_timestamp": datetime.now().isoformat(),
        "passenger_nationalities": {
            "primary": ["British", "Indian", "U.S."],
            "coverage": len(visa_data)
        },
        "destination_analysis": {},
        "operational_insights": {
            "high_visa_complexity": [],
            "visa_free_destinations": [],
            "visa_on_arrival_destinations": []
        }
    }
    
    # Analyze each passport type
    for passport, data in visa_data.items():
        if not data:
            continue
            
        visa_required = []
        visa_free = []
        visa_on_arrival = []
        
        for entry in data:
            visa_req = entry.get("visa_requirement", "").lower()
            destination = entry.get("destination", "")
            
            if "visa required" in visa_req:
                visa_required.append(destination)
            elif "visa not required" in visa_req or "visa free" in visa_req:
                visa_free.append(destination)
            elif "visa on arrival" in visa_req:
                visa_on_arrival.append(destination)
        
        analytics["destination_analysis"][passport] = {
            "visa_required": len(visa_required),
            "visa_free": len(visa_free),
            "visa_on_arrival": len(visa_on_arrival),
            "total_destinations": len(data)
        }
        
        # Operational insights
        if len(visa_required) > 15:
            analytics["operational_insights"]["high_visa_complexity"].append(passport)
    
    return jsonify(analytics)

@app.route("/api/visa/refresh", methods=["POST"])
def refresh_cache():
    """Manually refresh visa cache"""
    try:
        global visa_data
        visa_data = build_cache()
        return jsonify({
            "success": True,
            "message": "Visa cache refreshed successfully",
            "updated_at": datetime.now().isoformat(),
            "passports_updated": len(visa_data)
        })
    except Exception as e:
        return jsonify({
            "error": f"Cache refresh failed: {str(e)}"
        }), 500

# --------------------
# AINO Integration Health Check
# --------------------

@app.route("/health")
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "AINO Visa Requirements System",
        "cache_status": "active" if visa_data else "empty",
        "supported_passports": len(visa_pages),
        "timestamp": datetime.now().isoformat()
    })

# --------------------
# Run Server
# --------------------

if __name__ == "__main__":
    logger.info("Starting AINO Visa Requirements System")
    logger.info(f"Supporting {len(visa_pages)} passport types")
    logger.info(f"Monitoring {len(target_countries)} destinations")
    
    app.run(host="0.0.0.0", port=8080, debug=False)