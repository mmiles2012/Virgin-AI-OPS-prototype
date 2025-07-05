import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NMPunctualityData {
  DATE: string;
  ARR_PUN_DY: number;
  DEP_PUN_DY: number;
  OPE_SCH_DY: number;
  ARR_PUNCTUAL_FLIGHTS_DY: number;
  DEP_PUNCTUAL_FLIGHTS_DY: number;
  ARR_SCHED_FLIGHTS_DY: number;
  DEP_SCHED_FLIGHTS_DY: number;
}

interface NMResponse {
  success: boolean;
  data: NMPunctualityData[];
  total_records: number;
  recent_records: number;
  data_source: string;
  date_range: {
    start: string;
    end: string;
  };
}

export default function NMPunctualityChart() {
  const [data, setData] = useState<NMPunctualityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch main punctuality data
        const response = await fetch('/api/nm-punctuality');
        const result: NMResponse = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch NM punctuality data');
        }
        
        // Format data for chart display
        const formattedData = result.data.map(d => ({
          ...d,
          date: new Date(d.DATE).toISOString().split('T')[0],
          arrivalPunctuality: Math.round(d.ARR_PUN_DY * 100),
          departurePunctuality: Math.round(d.DEP_PUN_DY * 100),
          operationalSchedule: Math.round(d.OPE_SCH_DY * 100)
        }));
        
        setData(formattedData);
        
        // Fetch analytics data
        const analyticsResponse = await fetch('/api/nm-punctuality/analytics');
        const analyticsResult = await analyticsResponse.json();
        
        if (analyticsResult.success) {
          setAnalytics(analyticsResult.analytics);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Network Manager Punctuality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading European airspace data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Network Manager Punctuality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.overall.avgArrivalPunctuality}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Arrival Punctuality</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {analytics.overall.avgDeparturePunctuality}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Departure Punctuality</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.overall.avgOperationalSchedule}%
              </div>
              <div className="text-sm text-muted-foreground">Operational Schedule</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {analytics.overall.totalRecords.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Records</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Chart */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                Network Manager Punctuality Analytics
                <Badge variant="secondary">EUROCONTROL</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                European airspace punctuality data (15-minute tolerance standard)
              </p>
            </div>
            {analytics && (
              <div className="text-right">
                <div className="text-sm font-medium">
                  {analytics.overall.dateRange.start} to {analytics.overall.dateRange.end}
                </div>
                <div className="text-xs text-muted-foreground">
                  Pan-European Network Coverage
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-GB', { 
                    month: 'short', 
                    year: '2-digit' 
                  });
                }}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(v) => `${v}%`} 
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  const label = name === 'arrivalPunctuality' ? 'Arrival Punctuality' :
                               name === 'departurePunctuality' ? 'Departure Punctuality' :
                               'Operational Schedule';
                  return [`${value}%`, label];
                }}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-GB', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="arrivalPunctuality" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Arrival Punctuality"
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6' }}
              />
              <Line 
                type="monotone" 
                dataKey="departurePunctuality" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Departure Punctuality"
                dot={false}
                activeDot={{ r: 4, fill: '#10b981' }}
              />
              <Line 
                type="monotone" 
                dataKey="operationalSchedule" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Operational Schedule"
                dot={false}
                activeDot={{ r: 4, fill: '#8b5cf6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* European Airspace Insights */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>European Airspace Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Data Source</h4>
                <p className="text-sm text-muted-foreground">
                  {analytics.european_airspace_insights.data_source}
                </p>
                <p className="text-sm text-muted-foreground">
                  Regulatory Authority: {analytics.european_airspace_insights.regulatory_authority}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Coverage & Standards</h4>
                <p className="text-sm text-muted-foreground">
                  {analytics.european_airspace_insights.coverage}
                </p>
                <p className="text-sm text-muted-foreground">
                  Standard: {analytics.european_airspace_insights.punctuality_standard}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}