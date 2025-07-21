import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

interface AirportData {
  airport: string;
  month: number;
  year: number;
  actual_delay: number;
  actual_otp: number;
  actual_risk: "Green" | "Amber" | "Red";
  predicted_delay: number;
  predicted_otp: number;
  predicted_risk: "Green" | "Amber" | "Red";
  baseline_delay: number;
  baseline_otp: number;
  baseline_risk: "Green" | "Amber" | "Red";
  storm_days: number;
  snow_days: number;
  precip_mm: number;
  weather_severity_score: number;
  temperature_impact: number;
  ogimet_data_available: boolean;
}

interface FaaAirportPopupProps {
  data: AirportData;
  onClose: () => void;
}

export default function FaaAirportPopup({ data, onClose }: FaaAirportPopupProps) {
  const delayData = [
    { name: "Actual", value: data.actual_delay },
    { name: "Model", value: data.predicted_delay },
    { name: "Baseline", value: data.baseline_delay },
  ];

  const otpData = [
    { name: "Actual", value: data.actual_otp },
    { name: "Model", value: data.predicted_otp },
    { name: "Baseline", value: data.baseline_otp },
  ];

  const riskLevel = (risk: string) => {
    switch (risk) {
      case "Red": return "text-va-red-primary font-bold";
      case "Amber": return "text-aero-amber-caution font-bold";
      case "Green": return "text-aero-green-safe font-bold";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">{data.airport} Weather-Enhanced Analysis</h3>
          <button 
            className="text-foreground0 hover:text-gray-700 text-xl font-bold"
            onClick={onClose}
            aria-label="Close"
          >
            ✖
          </button>
        </div>

        {/* Weather Summary */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Weather Integration Summary</h4>
          <p className="text-sm text-blue-800 mb-2">
            <strong>Period:</strong> {data.month}/{data.year} • 
            <strong> Weather Score:</strong> {data.weather_severity_score.toFixed(1)}/5.0 • 
            <strong> OGIMET Data:</strong> {data.ogimet_data_available ? "Available" : "Limited"}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Storm Days:</span>
              <span className="ml-1 font-medium text-blue-900">{data.storm_days}</span>
            </div>
            <div>
              <span className="text-blue-700">Snow Days:</span>
              <span className="ml-1 font-medium text-blue-900">{data.snow_days}</span>
            </div>
            <div>
              <span className="text-blue-700">Precipitation:</span>
              <span className="ml-1 font-medium text-blue-900">{data.precip_mm} mm</span>
            </div>
            <div>
              <span className="text-blue-700">Temp Impact:</span>
              <span className="ml-1 font-medium text-blue-900">{data.temperature_impact.toFixed(1)}°C</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-semibold mb-2 text-gray-800">Total Delay (minutes)</h4>
            <BarChart width={300} height={220} data={delayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-gray-800">On-Time Performance (%)</h4>
            <BarChart width={300} height={220} data={otpData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </div>
        </div>

        {/* Risk Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <h5 className="font-medium text-gray-700 mb-2">Actual Risk</h5>
            <p className={`text-lg ${riskLevel(data.actual_risk)}`}>{data.actual_risk}</p>
            <p className="text-sm text-muted-foreground mt-1">Current operational state</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h5 className="font-medium text-gray-700 mb-2">Model Prediction</h5>
            <p className={`text-lg ${riskLevel(data.predicted_risk)}`}>{data.predicted_risk}</p>
            <p className="text-sm text-muted-foreground mt-1">Weather-enhanced ML forecast</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h5 className="font-medium text-gray-700 mb-2">Seasonal Baseline</h5>
            <p className={`text-lg ${riskLevel(data.baseline_risk)}`}>{data.baseline_risk}</p>
            <p className="text-sm text-muted-foreground mt-1">Historical monthly average</p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Performance Comparison</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Actual vs Model Delay:</span>
              <span className="ml-1 font-medium">
                {data.actual_delay > data.predicted_delay ? "+" : ""}
                {data.actual_delay - data.predicted_delay} min
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Actual vs Model OTP:</span>
              <span className="ml-1 font-medium">
                {data.actual_otp > data.predicted_otp ? "+" : ""}
                {(data.actual_otp - data.predicted_otp).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Weather Impact:</span>
              <span className="ml-1 font-medium">
                {data.weather_severity_score > 2.5 ? "High" : data.weather_severity_score > 1.0 ? "Moderate" : "Low"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">vs Baseline Delay:</span>
              <span className="ml-1 font-medium">
                {data.actual_delay > data.baseline_delay ? "+" : ""}
                {data.actual_delay - data.baseline_delay} min
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">vs Baseline OTP:</span>
              <span className="ml-1 font-medium">
                {data.actual_otp > data.baseline_otp ? "+" : ""}
                {(data.actual_otp - data.baseline_otp).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Model Accuracy:</span>
              <span className="ml-1 font-medium text-aero-green-safe">
                {(100 - Math.abs((data.actual_delay - data.predicted_delay) / data.actual_delay * 100)).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Weather Enhancement Note */}
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>Weather Enhancement:</strong> This analysis integrates OGIMET historical weather data 
            including temperature, precipitation, storm activity, and seasonal patterns to improve prediction 
            accuracy beyond standard operational models.
          </p>
        </div>
      </div>
    </div>
  );
}