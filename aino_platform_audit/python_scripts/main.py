#!/usr/bin/env python3
"""
AINO Aviation Intelligence Platform - ML Pipeline Main Entry Point
Coordinates the complete machine learning workflow for Virgin Atlantic delay prediction
"""

import sys
import os
import time
import argparse
import subprocess
from datetime import datetime
from buffer_live_data import AINOLiveDataBuffer
from train_model import AINODelayPredictor as Trainer
from predict_delay import AINODelayPredictor as Predictor
from schedule_tasks import AINOScheduler

def print_banner():
    """Print AINO platform banner"""
    print("=" * 60)
    print("✈️  AINO Aviation Intelligence Platform")
    print("    Machine Learning Pipeline for Virgin Atlantic")
    print("=" * 60)

def check_dependencies():
    """Check if required dependencies are available"""
    try:
        import pandas as pd
        import numpy as np
        import sklearn
        import joblib
        import requests
        import geopy
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please install: pip install pandas scikit-learn joblib requests geopy")
        return False

def show_status():
    """Show current system status"""
    print("\n📊 System Status:")
    print("-" * 30)
    
    # Check buffer file
    buffer_exists = os.path.exists('live_buffer.csv')
    print(f"Data Buffer: {'✅ Available' if buffer_exists else '❌ Not found'}")
    
    if buffer_exists:
        try:
            buffer = AINOLiveDataBuffer()
            stats = buffer.get_buffer_stats()
            print(f"  Records: {stats.get('total_records', 0)}")
            print(f"  Date range: {stats.get('date_range', {}).get('start', 'N/A')} to {stats.get('date_range', {}).get('end', 'N/A')}")
        except Exception as e:
            print(f"  Error reading buffer: {e}")
    
    # Check model
    model_exists = os.path.exists('delay_model.pkl')
    print(f"ML Model: {'✅ Available' if model_exists else '❌ Not found'}")
    
    if model_exists:
        try:
            predictor = Predictor()
            status = predictor.get_model_status()
            print(f"  Accuracy: {status.get('model_accuracy', 'Unknown')}")
            print(f"  Features: {status.get('feature_count', 0)}")
            print(f"  Training date: {status.get('training_date', 'Unknown')}")
        except Exception as e:
            print(f"  Error loading model: {e}")
    
    # Check AINO platform connection
    try:
        import requests
        response = requests.get("http://localhost:5000/api/aviation/virgin-atlantic-flights", timeout=5)
        print(f"AINO Platform: {'✅ Connected' if response.status_code == 200 else '❌ Connection failed'}")
        if response.status_code == 200:
            data = response.json()
            flight_count = len(data.get('flights', []))
            print(f"  Live flights: {flight_count}")
    except Exception as e:
        print(f"AINO Platform: ❌ Not available ({e})")

def run_complete_workflow():
    """Run the complete ML workflow"""
    print("\n🚀 Starting Complete ML Workflow")
    print("-" * 40)
    
    # Step 1: Buffer data
    print("Step 1: Collecting live flight data...")
    try:
        buffer = AINOLiveDataBuffer()
        count = buffer.buffer_current_data()
        print(f"✅ Buffered {count} flights")
    except Exception as e:
        print(f"❌ Data collection failed: {e}")
        return False
    
    # Step 2: Train model
    print("\nStep 2: Training ML model...")
    try:
        from train_model import train_from_buffer
        success = train_from_buffer()
        if success:
            print("✅ Model trained successfully")
        else:
            print("❌ Model training failed")
            return False
    except Exception as e:
        print(f"❌ Training failed: {e}")
        return False
    
    # Step 3: Generate predictions
    print("\nStep 3: Generating predictions...")
    try:
        predictor = Predictor()
        predictions = predictor.predict_all_live_flights()
        print(f"✅ Generated predictions for {len(predictions)} flights")
        
        # Show sample predictions
        for pred in predictions[:3]:
            if 'error' not in pred:
                print(f"  {pred['flight_number']}: {pred['prediction']} (confidence: {pred['confidence']:.2f})")
    except Exception as e:
        print(f"❌ Prediction failed: {e}")
        return False
    
    print("\n🎉 Complete workflow executed successfully!")
    return True

def run_dashboard():
    """Launch the Streamlit dashboard"""
    print("\n🖥️ Launching Streamlit Dashboard...")
    try:
        subprocess.run([sys.executable, "-m", "streamlit", "run", "dashboard.py"])
    except KeyboardInterrupt:
        print("\n⏹️ Dashboard stopped")
    except Exception as e:
        print(f"❌ Dashboard failed: {e}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="AINO Aviation Intelligence Platform")
    parser.add_argument('command', nargs='?', choices=[
        'status', 'collect', 'train', 'predict', 'workflow', 'dashboard', 'schedule'
    ], default='status', help='Command to execute')
    parser.add_argument('--continuous', action='store_true', help='Run continuous data collection')
    parser.add_argument('--interval', type=int, default=5, help='Collection interval in minutes')
    
    args = parser.parse_args()
    
    print_banner()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    if args.command == 'status':
        show_status()
    
    elif args.command == 'collect':
        print("\n📊 Collecting Live Flight Data")
        print("-" * 35)
        
        buffer = AINOLiveDataBuffer()
        
        if args.continuous:
            print(f"Starting continuous collection (every {args.interval} minutes)")
            print("Press Ctrl+C to stop")
            try:
                buffer.continuous_buffering(interval_minutes=args.interval)
            except KeyboardInterrupt:
                print("\n⏹️ Collection stopped")
        else:
            count = buffer.buffer_current_data()
            print(f"✅ Collected {count} flight records")
    
    elif args.command == 'train':
        print("\n🧠 Training ML Model")
        print("-" * 25)
        
        try:
            trainer = Trainer()
            metadata = trainer.train_model()
            print(f"✅ Model trained with {metadata['test_accuracy']:.1%} accuracy")
        except Exception as e:
            print(f"❌ Training failed: {e}")
    
    elif args.command == 'predict':
        print("\n🔮 Generating Predictions")
        print("-" * 30)
        
        try:
            predictor = Predictor()
            predictions = predictor.predict_all_live_flights()
            
            print(f"Generated predictions for {len(predictions)} flights:")
            for pred in predictions:
                if 'error' not in pred:
                    print(f"  {pred['flight_number']}: {pred['prediction']} "
                          f"(confidence: {pred['confidence']:.1%})")
                else:
                    print(f"  {pred['flight_number']}: Error")
        except Exception as e:
            print(f"❌ Prediction failed: {e}")
    
    elif args.command == 'workflow':
        run_complete_workflow()
    
    elif args.command == 'dashboard':
        run_dashboard()
    
    elif args.command == 'schedule':
        print("\n📅 Starting Task Scheduler")
        print("-" * 30)
        
        scheduler = AINOScheduler()
        scheduler.start_scheduler()
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()