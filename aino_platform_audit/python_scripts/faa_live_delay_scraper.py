import requests
from bs4 import BeautifulSoup
import pandas as pd

def scrape_faa_nasstatus():
    url = "https://nasstatus.faa.gov"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    airports = []
    rows = soup.select("table.table-status tr")[1:]  # skip header

    for row in rows:
        cols = row.find_all("td")
        if not cols or len(cols) < 6:
            continue

        airports.append({
            "faa": cols[0].text.strip(),
            "airport_name": cols[1].text.strip(),
            "delay_category": cols[2].text.strip(),
            "status": cols[3].text.strip(),
            "reason": cols[4].text.strip(),
            "avg_delay": cols[5].text.strip(),
        })

    return pd.DataFrame(airports)

def parse_delay_minutes(delay_str):
    """Parse delay string into minutes"""
    if not delay_str or delay_str.lower() in ['n/a', 'none', '']:
        return 0
    
    # Extract numeric value from strings like "15 minutes", "1 hour 30 minutes"
    import re
    
    # Find all numbers in the string
    numbers = re.findall(r'\d+', delay_str)
    if not numbers:
        return 0
    
    # Simple parsing - if it contains "hour", multiply first number by 60
    if 'hour' in delay_str.lower():
        hours = int(numbers[0]) if numbers else 0
        minutes = int(numbers[1]) if len(numbers) > 1 else 0
        return hours * 60 + minutes
    else:
        # Assume it's just minutes
        return int(numbers[0])

def determine_risk_level(delay_minutes, status):
    """Determine risk level based on delay and status"""
    if status.lower() in ['closed', 'major delay']:
        return "Red"
    elif delay_minutes > 60 or status.lower() in ['delay', 'moderate delay']:
        return "Amber" if delay_minutes <= 120 else "Red"
    elif delay_minutes > 15:
        return "Amber"
    else:
        return "Green"

def calculate_otp_from_delay(delay_minutes):
    """Estimate OTP based on delay minutes"""
    if delay_minutes == 0:
        return 85.0
    elif delay_minutes <= 15:
        return 82.0
    elif delay_minutes <= 60:
        return 75.0
    elif delay_minutes <= 120:
        return 60.0
    else:
        return 45.0

if __name__ == "__main__":
    # Test the scraper
    try:
        df = scrape_faa_nasstatus()
        print(f"Successfully scraped {len(df)} airports from FAA NASSTATUS")
        print(df.head())
    except Exception as e:
        print(f"Error scraping FAA data: {e}")