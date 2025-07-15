#!/usr/bin/env python3
"""
Operational Alerts Data Integrator for AINO Aviation Intelligence Platform
Processes authentic aviation datasets to generate real-time operational alerts
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from typing import Dict, List, Any

class OperationalAlertsDataIntegrator:
    """Integrates authentic aviation datasets for operational alert generation"""
    
    def __init__(self):
        self.delay_data = None
        self.punctuality_data = None
        self.alert_thresholds = {
            'severe_delay': 60,  # minutes
            'high_cancellation_rate': 10,  # percentage
            'poor_punctuality': 70,  # percentage on-time
            'weather_impact_high': 20,  # delay minutes from weather
            'carrier_performance_poor': 80  # percentage delays from carrier issues
        }
    
    def load_authentic_datasets(self):
        """Load authentic aviation datasets"""
        try:
            # Load airline delay cause data
            self.delay_data = pd.read_csv('attached_assets/Airline_Delay_Cause_1750447100736.csv')
            
            # Load punctuality statistics
            self.punctuality_data = pd.read_csv('attached_assets/202501_Punctuality_Statistics_Full_Analysis_Arrival_Departure_1750449206755.csv')
            
            print("✓ Loaded authentic aviation datasets")
            print(f"  - Delay data: {len(self.delay_data)} records")
            print(f"  - Punctuality data: {len(self.punctuality_data)} records")
            
            return True
        except Exception as e:
            print(f"Error loading datasets: {e}")
            return False
    
    def generate_delay_alerts(self) -> List[Dict[str, Any]]:
        """Generate operational alerts from delay cause data"""
        alerts = []
        
        if self.delay_data is None:
            return alerts
        
        # Recent data (last 3 months)
        recent_data = self.delay_data[
            (self.delay_data['year'] == 2025) & 
            (self.delay_data['month'].isin([1, 2, 3]))
        ]
        
        for _, row in recent_data.iterrows():
            carrier = row['carrier_name']
            airport = row['airport_name']
            
            # Calculate delay metrics with proper NaN handling
            total_flights = float(row['arr_flights']) if pd.notna(row['arr_flights']) else 0
            delayed_flights = float(row['arr_del15']) if pd.notna(row['arr_del15']) else 0
            delay_rate = (delayed_flights / total_flights) * 100 if total_flights > 0 else 0
            
            avg_delay = float(row['arr_delay']) / total_flights if total_flights > 0 and pd.notna(row['arr_delay']) else 0
            weather_delay_impact = float(row['weather_delay']) / float(row['arr_delay']) * 100 if pd.notna(row['arr_delay']) and float(row['arr_delay']) > 0 and pd.notna(row['weather_delay']) else 0
            carrier_delay_impact = float(row['carrier_delay']) / float(row['arr_delay']) * 100 if pd.notna(row['arr_delay']) and float(row['arr_delay']) > 0 and pd.notna(row['carrier_delay']) else 0
            
            # Generate alerts based on thresholds
            if delay_rate > 25:  # High delay rate
                alerts.append({
                    'id': f"delay_{row['carrier']}_{row['airport']}_{row['month']}",
                    'severity': 'high' if delay_rate > 35 else 'medium',
                    'type': 'operational_delay',
                    'title': f'High Delay Rate - {carrier}',
                    'description': f'{delay_rate:.1f}% of flights delayed at {airport}',
                    'airport': airport,
                    'carrier': carrier,
                    'affected_flights': int(delayed_flights),
                    'metrics': {
                        'delay_rate': delay_rate,
                        'avg_delay_minutes': avg_delay,
                        'weather_impact': weather_delay_impact,
                        'carrier_impact': carrier_delay_impact
                    },
                    'timestamp': datetime.now().isoformat(),
                    'data_source': 'DOT_Airline_Delay_Causes'
                })
            
            if weather_delay_impact > 30:  # Weather significantly impacting operations
                alerts.append({
                    'id': f"weather_{row['carrier']}_{row['airport']}_{row['month']}",
                    'severity': 'high',
                    'type': 'weather_impact',
                    'title': f'Weather Impact Alert - {airport}',
                    'description': f'Weather causing {weather_delay_impact:.1f}% of delays',
                    'airport': airport,
                    'carrier': carrier,
                    'affected_flights': int(delayed_flights),
                    'metrics': {
                        'weather_delay_minutes': row['weather_delay'],
                        'weather_impact_percentage': weather_delay_impact
                    },
                    'timestamp': datetime.now().isoformat(),
                    'data_source': 'DOT_Weather_Delays'
                })
            
            if row['arr_cancelled'] / total_flights * 100 > 5:  # High cancellation rate
                alerts.append({
                    'id': f"cancel_{row['carrier']}_{row['airport']}_{row['month']}",
                    'severity': 'critical',
                    'type': 'high_cancellations',
                    'title': f'High Cancellation Rate - {carrier}',
                    'description': f'{(row["arr_cancelled"] / total_flights * 100):.1f}% flights cancelled',
                    'airport': airport,
                    'carrier': carrier,
                    'affected_flights': int(row['arr_cancelled']),
                    'timestamp': datetime.now().isoformat(),
                    'data_source': 'DOT_Cancellation_Data'
                })
        
        return alerts
    
    def generate_punctuality_alerts(self) -> List[Dict[str, Any]]:
        """Generate alerts from punctuality statistics"""
        alerts = []
        
        if self.punctuality_data is None:
            return alerts
        
        # Group by airline and airport for analysis
        grouped = self.punctuality_data.groupby(['airline_name', 'reporting_airport']).agg({
            'flights_0_to_15_minutes_late_percent': 'mean',
            'average_delay_mins': 'mean',
            'flights_cancelled_percent': 'mean',
            'number_flights_matched': 'sum'
        }).reset_index()
        
        for _, row in grouped.iterrows():
            airline = row['airline_name']
            airport = row['reporting_airport']
            
            # On-time performance (0-15 minutes late considered on-time)
            on_time_rate = row['flights_0_to_15_minutes_late_percent']
            avg_delay = row['average_delay_mins']
            cancellation_rate = row['flights_cancelled_percent']
            
            if on_time_rate < 70:  # Poor punctuality
                alerts.append({
                    'id': f"punctuality_{airline}_{airport}",
                    'severity': 'medium' if on_time_rate > 60 else 'high',
                    'type': 'poor_punctuality',
                    'title': f'Punctuality Alert - {airline}',
                    'description': f'Only {on_time_rate:.1f}% on-time performance at {airport}',
                    'airport': airport,
                    'carrier': airline,
                    'metrics': {
                        'on_time_percentage': on_time_rate,
                        'average_delay_minutes': avg_delay,
                        'total_flights': int(row['number_flights_matched'])
                    },
                    'timestamp': datetime.now().isoformat(),
                    'data_source': 'UK_CAA_Punctuality_Stats'
                })
            
            if cancellation_rate > 5:  # High cancellation rate
                alerts.append({
                    'id': f"punctuality_cancel_{airline}_{airport}",
                    'severity': 'high',
                    'type': 'high_cancellations',
                    'title': f'Cancellation Alert - {airline}',
                    'description': f'{cancellation_rate:.1f}% cancellation rate at {airport}',
                    'airport': airport,
                    'carrier': airline,
                    'metrics': {
                        'cancellation_percentage': cancellation_rate
                    },
                    'timestamp': datetime.now().isoformat(),
                    'data_source': 'UK_CAA_Punctuality_Stats'
                })
        
        return alerts
    
    def generate_comprehensive_alerts(self) -> Dict[str, Any]:
        """Generate comprehensive operational alerts from all data sources"""
        
        if not self.load_authentic_datasets():
            return {'success': False, 'message': 'Failed to load authentic datasets'}
        
        delay_alerts = self.generate_delay_alerts()
        punctuality_alerts = self.generate_punctuality_alerts()
        
        all_alerts = delay_alerts + punctuality_alerts
        
        # Sort by severity
        severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        all_alerts.sort(key=lambda x: severity_order.get(x['severity'], 4))
        
        # Generate summary statistics
        summary = {
            'total_alerts': len(all_alerts),
            'critical_alerts': len([a for a in all_alerts if a['severity'] == 'critical']),
            'high_alerts': len([a for a in all_alerts if a['severity'] == 'high']),
            'medium_alerts': len([a for a in all_alerts if a['severity'] == 'medium']),
            'data_sources': ['DOT_Airline_Delay_Causes', 'UK_CAA_Punctuality_Stats'],
            'last_updated': datetime.now().isoformat()
        }
        
        return {
            'success': True,
            'alerts': all_alerts[:50],  # Limit to top 50 alerts
            'summary': summary,
            'data_integrity': 'authentic_government_sources'
        }

def main():
    """Demonstrate operational alerts from authentic data"""
    integrator = OperationalAlertsDataIntegrator()
    
    print("OPERATIONAL ALERTS DATA INTEGRATION")
    print("=" * 50)
    print("Processing authentic aviation datasets...")
    
    results = integrator.generate_comprehensive_alerts()
    
    if results['success']:
        print(f"\n✓ Generated {results['summary']['total_alerts']} operational alerts")
        print(f"  - Critical: {results['summary']['critical_alerts']}")
        print(f"  - High: {results['summary']['high_alerts']}")
        print(f"  - Medium: {results['summary']['medium_alerts']}")
        
        print("\nTOP OPERATIONAL ALERTS:")
        print("-" * 30)
        
        for alert in results['alerts'][:10]:
            print(f"\n[{alert['severity'].upper()}] {alert['title']}")
            print(f"  {alert['description']}")
            print(f"  Airport: {alert['airport']}")
            print(f"  Source: {alert['data_source']}")
            if 'affected_flights' in alert:
                print(f"  Affected Flights: {alert['affected_flights']}")
        
        # Clean data before saving to prevent NaN values
        def clean_data(obj):
            if isinstance(obj, dict):
                return {k: clean_data(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_data(item) for item in obj]
            elif pd.isna(obj) or obj != obj:  # NaN check
                return 0
            else:
                return obj
        
        cleaned_results = clean_data(results)
        
        # Save alerts for API consumption
        with open('operational_alerts_feed.json', 'w') as f:
            json.dump(cleaned_results, f, indent=2)
        
        print(f"\n✓ Alerts saved to operational_alerts_feed.json")
        print("✓ Ready for real-time operational dashboard integration")
    else:
        print(f"✗ Failed to generate alerts: {results['message']}")

if __name__ == "__main__":
    main()