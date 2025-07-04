import React, { useMemo, useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Plane, Fuel, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";

// Fix leaflet default markers
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.divIcon({
  html: `<div style="background-color: #3b82f6; border-radius: 50%; width: 12px; height: 12px; border: 2px solid white;"></div>`,
  iconSize: [12, 12],
  className: 'custom-marker'
});

L.Marker.prototype.options.icon = DefaultIcon;

export interface DiversionResult {
  alternate: {
    name: string;
    lat: number;
    lon: number;
  };
  distance_nm: number;
  ground_speed_kt: number;
  time_hr: number;
  fuel_required_kg: number;
  remaining_fuel_kg: number;
  reachable: boolean;
  notes: string;
}

export interface DiversionMapProps {
  current: { lat: number; lon: number };
  results: DiversionResult[];
  onRefresh?: () => void;
  height?: string;
  zoom?: number;
  aircraftType?: string;
}

const lineColor = (reachable: boolean) => (reachable ? "#16a34a" : "#dc2626");
const toLatLng = (lat: number, lon: number): [number, number] => [lat, lon];

function FitBounds({ current, results }: { current: [number, number]; results: DiversionResult[] }) {
  const map = useMap();
  const bounds = useMemo(() => {
    const pts: [number, number][] = [current, ...results.map(r => toLatLng(r.alternate.lat, r.alternate.lon))];
    return pts;
  }, [current, results]);

  useEffect(() => {
    if (bounds.length > 1) {
      map.fitBounds(bounds as any, { padding: [50, 50] });
    }
  }, [map, bounds]);

  return null;
}

// Fuel-margin bar chart overlay
interface FuelChartProps {
  data: { name: string; margin: number; reachable: boolean }[];
}

const FuelMarginChart: React.FC<FuelChartProps> = ({ data }) => (
  <Card className="w-full md:w-auto overflow-hidden">
    <CardContent className="p-4 sm:p-6 w-[320px] h-[240px]">
      <h2 className="text-lg font-semibold mb-4">Fuel Margin (kg)</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis type="category" dataKey="name" width={80} />
          <Tooltip formatter={(v: number) => `${v} kg`} />
          <Bar dataKey="margin" isAnimationActive={false}>
            <LabelList
              dataKey="margin"
              position="right"
              formatter={(v: number) => `${v} kg`}
            />
            {/* Each bar coloured based on reachability */}
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.reachable ? "#16a34a" : "#dc2626"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

const DiversionMap: React.FC<DiversionMapProps> = ({ 
  current, 
  results, 
  onRefresh,
  height = "500px", 
  zoom = 6,
  aircraftType = "Boeing 787-9"
}) => {
  const currentLatLng = toLatLng(current.lat, current.lon);

  const sorted = useMemo(
    () => [...results].sort((a, b) => Number(b.reachable) - Number(a.reachable)),
    [results]
  );

  const chartData = useMemo(
    () =>
      sorted.map(r => ({
        name: r.alternate.name,
        margin: r.remaining_fuel_kg,
        reachable: r.reachable,
      })),
    [sorted]
  );

  const reachableCount = results.filter(r => r.reachable).length;
  const bestOption = sorted.find(r => r.reachable);
  const totalFuelRequired = bestOption?.fuel_required_kg || 0;

  return (
    <div className="grid gap-4 2xl:gap-6">
      {/* Summary Statistics */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Plane className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Reachable Options</p>
                <p className="text-2xl font-bold">{reachableCount}/{results.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Fuel className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Fuel Required</p>
                <p className="text-2xl font-bold">{Math.round(totalFuelRequired).toLocaleString()} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Flight Time</p>
                <p className="text-2xl font-bold">{bestOption ? `${bestOption.time_hr}h` : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Interactive Map */}
      <motion.div
        className="w-full rounded-2xl shadow-lg overflow-hidden bg-white"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Diversion Analysis - {aircraftType}</h3>
          <p className="text-sm text-gray-600">Real-time fuel and wind calculations for optimal routing</p>
        </div>
        
        <MapContainer
          style={{ height }}
          center={currentLatLng}
          zoom={zoom}
          scrollWheelZoom={true}
          className="z-0"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds current={currentLatLng} results={results} />

          {/* Current position marker */}
          <Marker position={currentLatLng}>
            <Popup>
              <div className="p-2">
                <strong className="text-blue-900">Current Position</strong>
                <br />
                <span className="text-sm">Lat: {current.lat.toFixed(4)}°</span>
                <br />
                <span className="text-sm">Lon: {current.lon.toFixed(4)}°</span>
                <br />
                <span className="text-sm font-medium">Aircraft: {aircraftType}</span>
              </div>
            </Popup>
          </Marker>

          {/* Diversion routes and airports */}
          {results.map(res => {
            const altPos = toLatLng(res.alternate.lat, res.alternate.lon);
            return (
              <React.Fragment key={res.alternate.name}>
                <Polyline
                  positions={[currentLatLng, altPos] as [number, number][]}
                  pathOptions={{ 
                    color: lineColor(res.reachable), 
                    weight: res.reachable ? 4 : 2,
                    opacity: res.reachable ? 0.8 : 0.5,
                    dashArray: res.reachable ? undefined : "10, 10"
                  }}
                />
                <Marker position={altPos}>
                  <Popup>
                    <div className="p-3 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        {res.reachable ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <strong className="text-gray-900">{res.alternate.name}</strong>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Distance:</span>
                          <span className="font-medium">{res.distance_nm} NM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Flight Time:</span>
                          <span className="font-medium">{res.time_hr}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ground Speed:</span>
                          <span className="font-medium">{res.ground_speed_kt} kt</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fuel Required:</span>
                          <span className="font-medium">{res.fuel_required_kg.toLocaleString()} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fuel Margin:</span>
                          <span className={`font-medium ${res.remaining_fuel_kg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {res.remaining_fuel_kg.toLocaleString()} kg
                          </span>
                        </div>
                        <div className="pt-2 border-t">
                          <span className={`text-xs px-2 py-1 rounded ${
                            res.reachable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {res.reachable ? "REACHABLE" : "UNREACHABLE"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </motion.div>

      {/* Detailed Results Table */}
      <Card className="w-full">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Diversion Options Analysis</h3>
          <div className="space-y-3">
            {sorted.map((res, index) => (
              <motion.div
                key={res.alternate.name}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  res.reachable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                } ${index === 0 && res.reachable ? 'ring-2 ring-blue-500' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  {res.reachable ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{res.alternate.name}</span>
                      {index === 0 && res.reachable && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">{res.notes}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">{res.distance_nm} NM</p>
                      <p className="text-gray-500">Distance</p>
                    </div>
                    <div>
                      <p className="font-medium">{res.time_hr}h</p>
                      <p className="text-gray-500">Flight Time</p>
                    </div>
                    <div>
                      <p className="font-medium">{res.ground_speed_kt} kt</p>
                      <p className="text-gray-500">Ground Speed</p>
                    </div>
                    <div>
                      <p className={`font-medium ${res.remaining_fuel_kg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {res.remaining_fuel_kg.toLocaleString()} kg
                      </p>
                      <p className="text-gray-500">Fuel Margin</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fuel margin chart overlay */}
      <FuelMarginChart data={chartData} />

      {/* Optional actions */}
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={onRefresh ?? (() => window.location.reload())}>
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default DiversionMap;