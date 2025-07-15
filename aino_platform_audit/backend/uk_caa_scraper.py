"""
UK CAA Punctuality Data Scraper for AINO Aviation Intelligence Platform
Automated collection of UK Civil Aviation Authority delay and punctuality datasets
"""
import requests
from bs4 import BeautifulSoup
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import json
from typing import Dict, List, Any, Optional
import re

class UKCAADataScraper:
    """UK Civil Aviation Authority data scraper and analyzer"""
    
    def __init__(self):
        self.base_url = "https://www.caa.co.uk"
        self.delays_url = "https://www.caa.co.uk/data-and-analysis/uk-aviation-market/airlines/delays/"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
    def scrape_available_datasets(self) -> List[Dict[str, str]]:
        """Scrape available UK CAA punctuality datasets"""
        try:
            response = requests.get(self.delays_url, headers=self.headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, "html.parser")
            
            # Find all links to Excel/CSV files
            links = soup.find_all("a", href=True)
            delay_files = []
            
            for link in links:
                href = link.get("href", "")
                text = link.get_text().lower()
                
                # Look for punctuality-related files
                if (("xlsx" in href or "csv" in href) and 
                    ("punctuality" in text or "delay" in text or "performance" in text)):
                    
                    # Build full URL
                    full_url = href if href.startswith("http") else self.base_url + href
                    
                    delay_files.append({
                        "url": full_url,
                        "filename": os.path.basename(href),
                        "description": link.get_text().strip(),
                        "file_type": "xlsx" if "xlsx" in href else "csv"
                    })
            
            # Also look for recent 2025 files specifically
            recent_files = self._find_recent_files(soup)
            delay_files.extend(recent_files)
            
            return delay_files
            
        except Exception as e:
            print(f"Error scraping UK CAA datasets: {e}")
            return []
    
    def _find_recent_files(self, soup) -> List[Dict[str, str]]:
        """Find recent 2025 punctuality files"""
        recent_files = []
        
        # Look for 2025 or recent dates in links
        for link in soup.find_all("a", href=True):
            href = link.get("href", "")
            text = link.get_text()
            
            if (("2025" in text or "2024" in text) and 
                ("punctuality" in text.lower() or "performance" in text.lower()) and
                ("xlsx" in href or "csv" in href)):
                
                full_url = href if href.startswith("http") else self.base_url + href
                
                recent_files.append({
                    "url": full_url,
                    "filename": os.path.basename(href),
                    "description": text.strip(),
                    "file_type": "xlsx" if "xlsx" in href else "csv"
                })
        
        return recent_files
    
    def download_dataset(self, file_info: Dict[str, str], save_path: str = None) -> str:
        """Download a specific UK CAA dataset"""
        try:
            url = file_info["url"]
            filename = file_info["filename"]
            
            if save_path is None:
                save_path = f"uk_caa_data/{filename}"
            
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            
            # Download file
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            with open(save_path, 'wb') as f:
                f.write(response.content)
            
            print(f"Downloaded: {filename} -> {save_path}")
            return save_path
            
        except Exception as e:
            print(f"Error downloading {file_info['filename']}: {e}")
            return None
    
    def create_heathrow_training_dataset(self, nm_data_path: str = "nm_network_punctuality.csv") -> pd.DataFrame:
        """Create comprehensive training dataset using your feature engineering approach"""
        try:
            # Load NM data and apply your feature engineering
            nm_df = pd.read_csv(nm_data_path, parse_dates=["DATE"])
            
            # Apply your exact feature engineering approach
            nm_df["LHR_ARR_DELAY_MIN"] = (1 - nm_df["ARR_PUN_DY"]) * 100
            nm_df["LHR_DEP_DELAY_MIN"] = (1 - nm_df["DEP_PUN_DY"]) * 100
            
            # Feature engineering exactly as you specified
            nm_df["day_of_week"] = nm_df["DATE"].dt.dayofweek
            nm_df["month"] = nm_df["DATE"].dt.month
            nm_df["week"] = nm_df["DATE"].dt.isocalendar().week
            
            # Extract the features you specified
            features = nm_df[[
                "DATE", "ARR_PUN_DY", "DEP_PUN_DY", "day_of_week", "month", "week",
                "LHR_ARR_DELAY_MIN", "LHR_DEP_DELAY_MIN"
            ]].dropna()
            
            # Save the training dataset
            output_path = "heathrow_training_dataset.csv"
            features.to_csv(output_path, index=False)
            
            print(f"Created training dataset: {output_path}")
            print(f"Dataset shape: {features.shape}")
            print(f"Date range: {features['DATE'].min()} to {features['DATE'].max()}")
            
            return features
            
        except Exception as e:
            print(f"Error creating training dataset: {e}")
            return pd.DataFrame()
    
    def generate_correlation_analysis(self, dataset: pd.DataFrame) -> Dict[str, Any]:
        """Generate comprehensive correlation analysis"""
        if dataset.empty:
            return {}
        
        try:
            # Calculate correlations using your exact approach
            correlations = {
                "dep_punctuality_vs_lhr_dep_delay": dataset["DEP_PUN_DY"].corr(dataset["LHR_DEP_DELAY_MIN"]),
                "arr_punctuality_vs_lhr_arr_delay": dataset["ARR_PUN_DY"].corr(dataset["LHR_ARR_DELAY_MIN"]),
                "dep_punctuality_vs_lhr_arr_delay": dataset["DEP_PUN_DY"].corr(dataset["LHR_ARR_DELAY_MIN"]),
                "arr_punctuality_vs_lhr_dep_delay": dataset["ARR_PUN_DY"].corr(dataset["LHR_DEP_DELAY_MIN"])
            }
            
            # Calculate statistics
            statistics = {
                "avg_nm_dep_punctuality": dataset["DEP_PUN_DY"].mean() * 100,
                "avg_nm_arr_punctuality": dataset["ARR_PUN_DY"].mean() * 100,
                "avg_lhr_dep_delay": dataset["LHR_DEP_DELAY_MIN"].mean(),
                "avg_lhr_arr_delay": dataset["LHR_ARR_DELAY_MIN"].mean(),
                "lhr_dep_delay_std": dataset["LHR_DEP_DELAY_MIN"].std(),
                "lhr_arr_delay_std": dataset["LHR_ARR_DELAY_MIN"].std()
            }
            
            # Monthly analysis
            monthly_analysis = dataset.groupby("month").agg({
                "DEP_PUN_DY": "mean",
                "ARR_PUN_DY": "mean", 
                "LHR_DEP_DELAY_MIN": "mean",
                "LHR_ARR_DELAY_MIN": "mean",
                "DATE": "count"
            }).reset_index()
            
            monthly_trends = []
            for _, row in monthly_analysis.iterrows():
                monthly_trends.append({
                    "month": int(row["month"]),
                    "nm_dep_punctuality": round(row["DEP_PUN_DY"] * 100, 1),
                    "nm_arr_punctuality": round(row["ARR_PUN_DY"] * 100, 1),
                    "lhr_avg_dep_delay": round(row["LHR_DEP_DELAY_MIN"], 1),
                    "lhr_avg_arr_delay": round(row["LHR_ARR_DELAY_MIN"], 1),
                    "record_count": int(row["DATE"])
                })
            
            return {
                "correlations": correlations,
                "statistics": statistics,
                "monthly_trends": monthly_trends,
                "dataset_info": {
                    "total_records": len(dataset),
                    "date_range": {
                        "start": dataset["DATE"].min().strftime("%Y-%m-%d"),
                        "end": dataset["DATE"].max().strftime("%Y-%m-%d")
                    }
                }
            }
            
        except Exception as e:
            print(f"Error generating correlation analysis: {e}")
            return {}
    
    def save_analysis_results(self, analysis: Dict[str, Any], filename: str = "uk_caa_correlation_analysis.json"):
        """Save analysis results to JSON file"""
        try:
            # Convert numpy types to Python types for JSON serialization
            def convert_numpy(obj):
                if isinstance(obj, np.ndarray):
                    return obj.tolist()
                elif isinstance(obj, np.floating):
                    return float(obj)
                elif isinstance(obj, np.integer):
                    return int(obj)
                elif isinstance(obj, pd.Timestamp):
                    return obj.isoformat()
                return obj
            
            # Recursively convert the analysis dictionary
            def clean_for_json(data):
                if isinstance(data, dict):
                    return {key: clean_for_json(value) for key, value in data.items()}
                elif isinstance(data, list):
                    return [clean_for_json(item) for item in data]
                else:
                    return convert_numpy(data)
            
            clean_analysis = clean_for_json(analysis)
            
            with open(filename, 'w') as f:
                json.dump(clean_analysis, f, indent=2)
            
            print(f"Analysis results saved to: {filename}")
            
        except Exception as e:
            print(f"Error saving analysis results: {e}")

def main():
    """Demonstrate UK CAA data scraping and analysis"""
    scraper = UKCAADataScraper()
    
    print("🛫 UK CAA Punctuality Data Scraper")
    print("=" * 50)
    
    # 1. Scrape available datasets
    print("1. Discovering available UK CAA datasets...")
    datasets = scraper.scrape_available_datasets()
    
    if datasets:
        print(f"Found {len(datasets)} punctuality datasets:")
        for i, dataset in enumerate(datasets[:5]):  # Show first 5
            print(f"  {i+1}. {dataset['description']}")
            print(f"     URL: {dataset['url']}")
            print(f"     Type: {dataset['file_type']}")
            print()
    
    # 2. Create training dataset using your approach
    print("2. Creating Heathrow training dataset...")
    training_data = scraper.create_heathrow_training_dataset()
    
    if not training_data.empty:
        print(f"✅ Training dataset created with {len(training_data)} records")
        
        # 3. Generate correlation analysis
        print("3. Generating correlation analysis...")
        analysis = scraper.generate_correlation_analysis(training_data)
        
        if analysis:
            print("✅ Correlation analysis complete")
            print(f"Key correlations:")
            for key, value in analysis["correlations"].items():
                print(f"  {key}: {value:.4f}")
            
            # 4. Save results
            scraper.save_analysis_results(analysis)
            print("✅ Analysis results saved")
    
    print("\n🎯 Integration ready for AINO platform")

if __name__ == "__main__":
    main()