/**
 * Virgin Atlantic XGBoost Delay Prediction API Routes for AINO Platform
 * Enhanced ML-powered delay prediction endpoints
 */

import { spawn } from 'child_process';
import path from 'path';

export function setupVirginXGBoostRoutes(app: any) {
  
  // Virgin Atlantic XGBoost delay prediction for single flight
  app.get("/api/virgin-xgboost/predict/:flightNumber", async (req: any, res: any) => {
    try {
      const { flightNumber } = req.params;
      
      // Get flight data
      const flightResponse = await fetch(`http://localhost:5000/api/aviation/virgin-atlantic-flights`);
      const flightData = await flightResponse.json();
      
      if (!flightData.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch flight data'
        });
      }
      
      // Find specific flight
      const targetFlight = flightData.flights.find((f: any) => f.flight_number === flightNumber);
      
      if (!targetFlight) {
        return res.status(404).json({
          success: false,
          error: `Flight ${flightNumber} not found`
        });
      }
      
      // Run Python XGBoost prediction
      const pythonProcess = spawn('python3', [
        'virgin_xgboost_delay_predictor.py',
        '--predict-single',
        JSON.stringify(targetFlight)
      ]);
      
      let pythonOutput = '';
      let pythonError = '';
      
      pythonProcess.stdout.on('data', (data) => {
        pythonOutput += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        pythonError += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Parse Python output
            const lines = pythonOutput.trim().split('\n');
            const jsonLine = lines.find(line => line.startsWith('{'));
            
            if (jsonLine) {
              const prediction = JSON.parse(jsonLine);
              res.json({
                success: true,
                flight_number: flightNumber,
                prediction,
                timestamp: new Date().toISOString()
              });
            } else {
              throw new Error('No JSON output from Python script');
            }
          } catch (parseError) {
            res.status(500).json({
              success: false,
              error: 'Failed to parse prediction result',
              debug: pythonOutput
            });
          }
        } else {
          res.status(500).json({
            success: false,
            error: 'XGBoost prediction failed',
            details: pythonError
          });
        }
      });
      
    } catch (error) {
      console.error('Virgin XGBoost prediction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate XGBoost prediction'
      });
    }
  });
  
  // Virgin Atlantic XGBoost predictions for all flights
  app.get("/api/virgin-xgboost/predict-all", async (req: any, res: any) => {
    try {
      // Get all Virgin Atlantic flights
      const flightResponse = await fetch(`http://localhost:5000/api/aviation/virgin-atlantic-flights`);
      const flightData = await flightResponse.json();
      
      if (!flightData.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch flight data'
        });
      }
      
      // Run Python XGBoost prediction for all flights
      const pythonProcess = spawn('python3', [
        'virgin_xgboost_delay_predictor.py',
        '--predict-multiple',
        JSON.stringify(flightData.flights)
      ]);
      
      let pythonOutput = '';
      let pythonError = '';
      
      pythonProcess.stdout.on('data', (data) => {
        pythonOutput += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        pythonError += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Parse Python output
            const lines = pythonOutput.trim().split('\n');
            const jsonLine = lines.find(line => line.startsWith('[') || line.startsWith('{'));
            
            if (jsonLine) {
              const predictions = JSON.parse(jsonLine);
              res.json({
                success: true,
                predictions,
                total_flights: flightData.flights.length,
                timestamp: new Date().toISOString()
              });
            } else {
              throw new Error('No JSON output from Python script');
            }
          } catch (parseError) {
            res.status(500).json({
              success: false,
              error: 'Failed to parse prediction results',
              debug: pythonOutput
            });
          }
        } else {
          res.status(500).json({
            success: false,
            error: 'XGBoost predictions failed',
            details: pythonError
          });
        }
      });
      
    } catch (error) {
      console.error('Virgin XGBoost batch prediction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate batch XGBoost predictions'
      });
    }
  });
  
  // Virgin Atlantic XGBoost model status
  app.get("/api/virgin-xgboost/status", async (req: any, res: any) => {
    try {
      // Run Python script to get model status
      const pythonProcess = spawn('python3', [
        'virgin_xgboost_delay_predictor.py',
        '--status'
      ]);
      
      let pythonOutput = '';
      let pythonError = '';
      
      pythonProcess.stdout.on('data', (data) => {
        pythonOutput += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        pythonError += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const lines = pythonOutput.trim().split('\n');
            const jsonLine = lines.find(line => line.startsWith('{'));
            
            if (jsonLine) {
              const status = JSON.parse(jsonLine);
              res.json({
                success: true,
                xgboost_status: status,
                timestamp: new Date().toISOString()
              });
            } else {
              throw new Error('No JSON output from Python script');
            }
          } catch (parseError) {
            res.status(500).json({
              success: false,
              error: 'Failed to parse status result',
              debug: pythonOutput
            });
          }
        } else {
          res.status(500).json({
            success: false,
            error: 'Failed to get XGBoost status',
            details: pythonError
          });
        }
      });
      
    } catch (error) {
      console.error('Virgin XGBoost status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve XGBoost model status'
      });
    }
  });
  
  // Virgin Atlantic XGBoost prediction logs
  app.get("/api/virgin-xgboost/logs", async (req: any, res: any) => {
    try {
      const fs = require('fs').promises;
      const logPath = path.join(__dirname, '../attached_assets/virgin_delay_prediction_log.csv');
      
      try {
        const logData = await fs.readFile(logPath, 'utf-8');
        const lines = logData.trim().split('\n');
        
        if (lines.length > 1) {
          const headers = lines[0].split(',');
          const records = lines.slice(1).map(line => {
            const values = line.split(',');
            const record: any = {};
            headers.forEach((header, index) => {
              record[header] = values[index] || '';
            });
            return record;
          });
          
          res.json({
            success: true,
            logs: records,
            total_predictions: records.length,
            timestamp: new Date().toISOString()
          });
        } else {
          res.json({
            success: true,
            logs: [],
            total_predictions: 0,
            message: 'No predictions logged yet',
            timestamp: new Date().toISOString()
          });
        }
      } catch (fileError) {
        res.json({
          success: true,
          logs: [],
          total_predictions: 0,
          message: 'Log file not found - no predictions made yet',
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Virgin XGBoost logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve prediction logs'
      });
    }
  });
}