#!/usr/bin/env python3
"""
Main Streamlit Application for Heathrow Connection Model
Entry point for the connection prediction dashboard
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'components'))

from components.dashboard_tile import HeathrowConnectionDashboard

def main():
    """Main application entry point"""
    dashboard = HeathrowConnectionDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()