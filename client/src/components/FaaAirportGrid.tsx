import React, { useEffect, useState } from "react";
import FaaAirportPopup from "./FaaAirportPopup";

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

export default function FaaAirportGrid() {
  const [airports, setAirports] = useState<AirportData[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<AirportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/faa-comparator")
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setAirports(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching airport data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const riskColor = (risk: "Green" | "Amber" | "Red") => {
    switch (risk) {
      case "Green": return "bg-green-200 border-green-400";
      case "Amber": return "bg-yellow-200 border-yellow-400";
      case "Red": return "bg-red-200 border-red-400";
      default: return "bg-gray-100 border-gray-300";
    }
  };

  const riskTextColor = (risk: "Green" | "Amber" | "Red") => {
    switch (risk) {
      case "Green": return "text-green-800";
      case "Amber": return "text-yellow-800";
      case "Red": return "text-red-800";
      default: return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Airport Delay Risk Overview</h2>
        <div className="flex items-center justify-center h-40">
          <div className="text-gray-500">Loading airport data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Airport Delay Risk Overview</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 font-medium">Error Loading Data</div>
          <div className="text-red-700 text-sm mt-1">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">US Airport Delay Risk Overview</h2>
        <p className="text-sm text-gray-600">
          Weather-enhanced delay predictions with OGIMET integration • 
          Click on any airport for detailed analysis
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {airports.map(ap => (
          <div
            key={ap.airport}
            className={`cursor-pointer border-2 rounded-lg p-4 transition-all hover:shadow-md ${riskColor(ap.actual_risk)}`}
            onClick={() => setSelectedAirport(ap)}
          >
            <h3 className="text-lg font-semibold text-gray-900">{ap.airport}</h3>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-700">
                OTP: <span className="font-medium">{ap.actual_otp.toFixed(1)}%</span>
              </p>
              <p className="text-sm text-gray-700">
                Delay: <span className="font-medium">{ap.actual_delay} min</span>
              </p>
              <p className={`text-sm font-medium ${riskTextColor(ap.actual_risk)}`}>
                Risk: {ap.actual_risk}
              </p>
              {ap.weather_severity_score > 0 && (
                <p className="text-xs text-blue-600">
                  Weather Score: {ap.weather_severity_score.toFixed(1)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {airports.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-medium text-blue-900 mb-2">Weather Integration Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">High Risk Airports:</span>
              <span className="ml-1 font-medium text-blue-900">
                {airports.filter(ap => ap.actual_risk === "Red").length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Weather Impacted:</span>
              <span className="ml-1 font-medium text-blue-900">
                {airports.filter(ap => ap.weather_severity_score > 2.5).length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Storm Activity:</span>
              <span className="ml-1 font-medium text-blue-900">
                {airports.reduce((sum, ap) => sum + ap.storm_days, 0)} days
              </span>
            </div>
            <div>
              <span className="text-blue-700">OGIMET Data:</span>
              <span className="ml-1 font-medium text-blue-900">
                {airports.filter(ap => ap.ogimet_data_available).length}/9
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedAirport && (
        <FaaAirportPopup
          data={selectedAirport}
          onClose={() => setSelectedAirport(null)}
        />
      )}
    </div>
  );
}