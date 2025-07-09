#!/usr/bin/env python3
"""
Scheduled Tasks for AINO Aviation Intelligence Platform
Automates model retraining and data management
"""

import schedule
import time
import logging
from datetime import datetime, timedelta
import os
import subprocess
import sys
from train_model import train_from_buffer
from buffer_live_data import AINOLiveDataBuffer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('aino_scheduler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AINOScheduler:
    """Automated task scheduler for AINO platform"""
    
    def __init__(self):
        self.buffer = AINOLiveDataBuffer()
        self.last_training = None
        self.last_data_collection = None
    
    def scheduled_retrain(self):
        """Weekly model retraining"""
        logger.info(f"🔄 Starting scheduled model retraining at {datetime.now()}")
        
        try:
            # Check if we have enough new data
            stats = self.buffer.get_buffer_stats()
            total_records = stats.get('total_records', 0)
            
            if total_records < 50:
                logger.warning(f"⚠️ Insufficient data for retraining: {total_records} records")
                return False
            
            # Train the model
            success = train_from_buffer()
            
            if success:
                self.last_training = datetime.now()
                logger.info("✅ Model retrained successfully")
                
                # Archive old buffer data (keep last 1000 records)
                self._archive_buffer_data(keep_records=1000)
                
                return True
            else:
                logger.error("❌ Model retraining failed")
                return False
                
        except Exception as e:
            logger.error(f"❌ Retraining error: {e}")
            return False
    
    def scheduled_data_collection(self):
        """Hourly data collection"""
        logger.info(f"📊 Starting scheduled data collection at {datetime.now()}")
        
        try:
            count = self.buffer.buffer_current_data()
            self.last_data_collection = datetime.now()
            logger.info(f"✅ Collected {count} flight records")
            return count
            
        except Exception as e:
            logger.error(f"❌ Data collection error: {e}")
            return 0
    
    def _archive_buffer_data(self, keep_records: int = 1000):
        """Archive old buffer data while keeping recent records"""
        try:
            import pandas as pd
            
            buffer_file = self.buffer.buffer_file
            archive_file = f"archive_{datetime.now().strftime('%Y%m%d_%H%M%S')}_buffer.csv"
            
            if os.path.exists(buffer_file):
                df = pd.read_csv(buffer_file)
                
                if len(df) > keep_records:
                    # Keep most recent records
                    df_archive = df[:-keep_records]
                    df_keep = df[-keep_records:]
                    
                    # Save archive
                    df_archive.to_csv(archive_file, index=False)
                    logger.info(f"📁 Archived {len(df_archive)} records to {archive_file}")
                    
                    # Update buffer with recent records
                    df_keep.to_csv(buffer_file, index=False)
                    logger.info(f"📊 Kept {len(df_keep)} recent records in buffer")
                else:
                    logger.info(f"📊 Buffer has {len(df)} records, no archiving needed")
                    
        except Exception as e:
            logger.error(f"❌ Archiving error: {e}")
    
    def cleanup_old_files(self):
        """Weekly cleanup of old archive files"""
        logger.info("🧹 Starting cleanup of old files")
        
        try:
            current_time = datetime.now()
            cleanup_count = 0
            
            for filename in os.listdir('.'):
                if filename.startswith('archive_') and filename.endswith('.csv'):
                    file_path = os.path.join('.', filename)
                    file_time = datetime.fromtimestamp(os.path.getctime(file_path))
                    
                    # Delete files older than 30 days
                    if current_time - file_time > timedelta(days=30):
                        os.remove(file_path)
                        cleanup_count += 1
                        logger.info(f"🗑️ Deleted old archive: {filename}")
            
            logger.info(f"✅ Cleanup completed: {cleanup_count} files removed")
            
        except Exception as e:
            logger.error(f"❌ Cleanup error: {e}")
    
    def health_check(self):
        """System health check"""
        logger.info("🏥 Performing system health check")
        
        health_status = {
            'timestamp': datetime.now().isoformat(),
            'buffer_exists': os.path.exists(self.buffer.buffer_file),
            'model_exists': os.path.exists('delay_model.pkl'),
            'last_training': self.last_training.isoformat() if self.last_training else None,
            'last_data_collection': self.last_data_collection.isoformat() if self.last_data_collection else None
        }
        
        # Check buffer stats
        try:
            stats = self.buffer.get_buffer_stats()
            health_status['buffer_records'] = stats.get('total_records', 0)
            health_status['buffer_status'] = 'healthy' if stats.get('total_records', 0) > 0 else 'empty'
        except:
            health_status['buffer_status'] = 'error'
        
        # Check model status
        try:
            from predict_delay import AINODelayPredictor
            predictor = AINODelayPredictor()
            model_status = predictor.get_model_status()
            health_status['model_accuracy'] = model_status.get('model_accuracy', 'unknown')
            health_status['model_status'] = 'healthy'
        except:
            health_status['model_status'] = 'error'
        
        # Log health status
        logger.info(f"🏥 Health check results: {health_status}")
        
        # Save health report
        import json
        with open('health_report.json', 'w') as f:
            json.dump(health_status, f, indent=2)
        
        return health_status
    
    def start_scheduler(self):
        """Start the scheduler with all tasks"""
        logger.info("📅 Starting AINO Aviation Intelligence Scheduler")
        
        # Schedule tasks
        schedule.every().sunday.at("03:00").do(self.scheduled_retrain)
        schedule.every().hour.at(":00").do(self.scheduled_data_collection)
        schedule.every().sunday.at("04:00").do(self.cleanup_old_files)
        schedule.every().day.at("00:00").do(self.health_check)
        
        # Immediate health check
        self.health_check()
        
        logger.info("📅 Scheduler configured:")
        logger.info("  🔄 Model retraining: Every Sunday at 03:00 UTC")
        logger.info("  📊 Data collection: Every hour")
        logger.info("  🧹 File cleanup: Every Sunday at 04:00 UTC")
        logger.info("  🏥 Health check: Daily at 00:00 UTC")
        
        # Run scheduler
        while True:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except KeyboardInterrupt:
                logger.info("⏹️ Scheduler stopped by user")
                break
            except Exception as e:
                logger.error(f"❌ Scheduler error: {e}")
                time.sleep(60)  # Wait before retry

def run_immediate_training():
    """Run immediate model training (for testing)"""
    scheduler = AINOScheduler()
    return scheduler.scheduled_retrain()

def run_immediate_collection():
    """Run immediate data collection (for testing)"""
    scheduler = AINOScheduler()
    return scheduler.scheduled_data_collection()

def main():
    """Main scheduler execution"""
    print("AINO Aviation Intelligence Platform Scheduler")
    print("=" * 50)
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        scheduler = AINOScheduler()
        
        if command == 'train':
            print("🔄 Running immediate training...")
            success = scheduler.scheduled_retrain()
            print(f"Training {'successful' if success else 'failed'}")
        
        elif command == 'collect':
            print("📊 Running immediate data collection...")
            count = scheduler.scheduled_data_collection()
            print(f"Collected {count} records")
        
        elif command == 'health':
            print("🏥 Running health check...")
            status = scheduler.health_check()
            print(f"Health status: {status}")
        
        elif command == 'cleanup':
            print("🧹 Running cleanup...")
            scheduler.cleanup_old_files()
        
        else:
            print(f"Unknown command: {command}")
            print("Available commands: train, collect, health, cleanup")
    
    else:
        # Start full scheduler
        scheduler = AINOScheduler()
        scheduler.start_scheduler()

if __name__ == "__main__":
    main()