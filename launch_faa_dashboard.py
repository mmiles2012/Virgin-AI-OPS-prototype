#!/usr/bin/env python3
"""
FAA Dashboard Service Launcher
Starts the Streamlit FAA dashboard as a background service
Integrates with AINO platform for seamless access
"""

import subprocess
import sys
import os
import time
import signal
import threading
from pathlib import Path

class FAADashboardService:
    def __init__(self, port=8501):
        self.port = port
        self.process = None
        self.running = False
        
    def start(self):
        """Start the FAA dashboard service"""
        if self.running:
            print(f"FAA Dashboard already running on port {self.port}")
            return True
            
        try:
            # Start Streamlit dashboard
            cmd = [
                sys.executable, "-m", "streamlit", "run", 
                "faa_dashboard_launcher.py",
                "--server.port", str(self.port),
                "--server.address", "0.0.0.0",
                "--server.headless", "true",
                "--server.enableCORS", "false",
                "--server.enableXsrfProtection", "false",
                "--browser.gatherUsageStats", "false"
            ]
            
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=os.getcwd()
            )
            
            # Wait a moment to check if it started successfully
            time.sleep(3)
            
            if self.process.poll() is None:
                self.running = True
                print(f"✅ FAA Dashboard started successfully on port {self.port}")
                print(f"🌐 Access URL: http://localhost:{self.port}")
                return True
            else:
                stdout, stderr = self.process.communicate()
                print(f"❌ Failed to start FAA Dashboard")
                print(f"Error: {stderr.decode()}")
                return False
                
        except Exception as e:
            print(f"❌ Error starting FAA Dashboard: {str(e)}")
            return False
    
    def stop(self):
        """Stop the FAA dashboard service"""
        if self.process and self.running:
            try:
                self.process.terminate()
                self.process.wait(timeout=10)
                self.running = False
                print("✅ FAA Dashboard stopped successfully")
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.running = False
                print("⚠️ FAA Dashboard force-stopped")
            except Exception as e:
                print(f"❌ Error stopping FAA Dashboard: {str(e)}")
    
    def restart(self):
        """Restart the FAA dashboard service"""
        print("🔄 Restarting FAA Dashboard...")
        self.stop()
        time.sleep(2)
        return self.start()
    
    def status(self):
        """Check the status of the FAA dashboard service"""
        if self.running and self.process and self.process.poll() is None:
            return "RUNNING"
        else:
            self.running = False
            return "STOPPED"

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    print("\n🛑 Shutting down FAA Dashboard Service...")
    if hasattr(signal_handler, 'service'):
        signal_handler.service.stop()
    sys.exit(0)

def main():
    """Main launcher function"""
    print("🛫 FAA NAS Status Dashboard Launcher")
    print("=" * 50)
    
    # Initialize service
    service = FAADashboardService(port=8501)
    signal_handler.service = service
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "start":
            success = service.start()
            if success:
                print("✅ FAA Dashboard service started")
                print("🌐 Open http://localhost:8501 in your browser")
                
                # Keep running
                try:
                    while True:
                        status = service.status()
                        if status == "STOPPED":
                            print("❌ Service unexpectedly stopped")
                            break
                        time.sleep(10)
                except KeyboardInterrupt:
                    print("\n🛑 Stopping service...")
                    service.stop()
            else:
                print("❌ Failed to start FAA Dashboard service")
                sys.exit(1)
                
        elif command == "stop":
            service.stop()
            
        elif command == "restart":
            service.restart()
            
        elif command == "status":
            status = service.status()
            print(f"FAA Dashboard Status: {status}")
            
        else:
            print("Usage: python launch_faa_dashboard.py [start|stop|restart|status]")
            
    else:
        # Interactive mode
        print("Starting FAA Dashboard in interactive mode...")
        success = service.start()
        
        if success:
            print("\n" + "=" * 50)
            print("🎯 FAA Dashboard Controls:")
            print("  • Press 'r' + Enter to restart")
            print("  • Press 'q' + Enter to quit")
            print("  • Press 's' + Enter to check status")
            print("=" * 50)
            
            try:
                while True:
                    user_input = input().strip().lower()
                    
                    if user_input == 'q':
                        break
                    elif user_input == 'r':
                        service.restart()
                    elif user_input == 's':
                        status = service.status()
                        print(f"Status: {status}")
                    else:
                        print("Commands: 'r' (restart), 's' (status), 'q' (quit)")
                        
            except KeyboardInterrupt:
                pass
            finally:
                service.stop()
        else:
            print("❌ Failed to start FAA Dashboard")
            sys.exit(1)

if __name__ == "__main__":
    main()