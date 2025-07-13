#!/usr/bin/env python3
"""
Virgin Atlantic Heathrow T3 Connection Management System
Monitors SkyTeam alliance partner connections and Virgin Atlantic domestic feeds
"""

import json
import time
import os
import sys
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class HeathrowConnectionMonitor:
    def __init__(self):
        self.partner_airlines = os.getenv('PARTNER_AIRLINES', 'VS,DL,AF,KL,KE,KQ,SV,ET').split(',')
        self.min_connect_mins = int(os.getenv('MIN_CONNECT_MINS', '45'))
        self.poll_interval = int(os.getenv('POLL_INTERVAL_SEC', '120'))
        self.ops_publish_url = os.getenv('OPS_PUBLISH_URL', 'http://localhost:5000/api/heathrow/actions')
        
        logger.info(f"[Heathrow T3] Monitor initialized for airlines: {self.partner_airlines}")
        logger.info(f"[Heathrow T3] Minimum connection time: {self.min_connect_mins} minutes")
        
    def get_sample_connection_data(self) -> List[Dict]:
        """Generate sample connection data for monitoring"""
        sample_connections = [
            {
                "inbound_flight": "VS42X",
                "outbound_flight": "DL42",
                "passenger_name": "Hans Mueller",
                "connection_time": 38,
                "status": "AT_RISK",
                "terminal": "T3",
                "gate_inbound": "B12",
                "gate_outbound": "A24",
                "risk_level": "HIGH"
            },
            {
                "inbound_flight": "VS3N",
                "outbound_flight": "AF1380",
                "passenger_name": "Sarah O'Connor",
                "connection_time": 42,
                "status": "TIGHT",
                "terminal": "T3",
                "gate_inbound": "A8",
                "gate_outbound": "B16",
                "risk_level": "MEDIUM"
            },
            {
                "inbound_flight": "VS355",
                "outbound_flight": "KL1008",
                "passenger_name": "John Kimani",
                "connection_time": 35,
                "status": "MISSED",
                "terminal": "T3",
                "gate_inbound": "C4",
                "gate_outbound": "A12",
                "risk_level": "CRITICAL"
            }
        ]
        
        return sample_connections
    
    def analyze_connections(self, connections: List[Dict]) -> Dict:
        """Analyze connection risks and generate recommendations"""
        analysis = {
            "total_connections": len(connections),
            "at_risk_count": 0,
            "missed_count": 0,
            "recommendations": []
        }
        
        for conn in connections:
            if conn["status"] == "AT_RISK":
                analysis["at_risk_count"] += 1
                analysis["recommendations"].append({
                    "type": "CONNECTION_ALERT",
                    "flight": conn["inbound_flight"],
                    "passenger": conn["passenger_name"],
                    "action": "Priority transfer assistance required",
                    "urgency": "HIGH"
                })
            elif conn["status"] == "MISSED":
                analysis["missed_count"] += 1
                analysis["recommendations"].append({
                    "type": "REBOOKING_REQUIRED",
                    "flight": conn["inbound_flight"],
                    "passenger": conn["passenger_name"],
                    "action": "Immediate rebooking and passenger reaccommodation",
                    "urgency": "CRITICAL"
                })
        
        return analysis
    
    def publish_status(self, status: Dict):
        """Publish connection status (simulated)"""
        status_json = json.dumps(status, indent=2)
        logger.info(f"[Heathrow T3] Status update: {status_json}")
        
        # Output alerts for high-risk connections
        for rec in status.get("recommendations", []):
            if rec["urgency"] in ["HIGH", "CRITICAL"]:
                print(f"[AINO Connection Alert] {rec['type']} - {rec['passenger']} - {rec['urgency']}")
    
    def run(self):
        """Main monitoring loop"""
        logger.info("[Heathrow T3] Connection management system started")
        
        try:
            while True:
                # Get current connection data
                connections = self.get_sample_connection_data()
                
                # Analyze connections
                analysis = self.analyze_connections(connections)
                
                # Create status update
                status = {
                    "timestamp": datetime.now().isoformat(),
                    "system": "Heathrow T3 Connection Monitor",
                    "status": "OPERATIONAL",
                    "analysis": analysis,
                    "connections": connections
                }
                
                # Publish status
                self.publish_status(status)
                
                # Wait for next poll
                time.sleep(self.poll_interval)
                
        except KeyboardInterrupt:
            logger.info("[Heathrow T3] Monitor stopped by user")
        except Exception as e:
            logger.error(f"[Heathrow T3] Monitor error: {str(e)}")
            sys.exit(1)

def main():
    """Main entry point"""
    monitor = HeathrowConnectionMonitor()
    monitor.run()

if __name__ == "__main__":
    main()