        ) : (
          // Detailed View
          selectedHub && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedHub.name}</h3>
                    <p className="text-gray-400">{selectedHub.city} • {selectedHub.iata}</p>
                  </div>
                  <button
                    onClick={() => setSelectedAirport(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Performance Metrics */}
                  <div className="lg:col-span-2">
                    <h4 className="text-lg font-semibold text-white mb-4">Performance Metrics</h4>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-green-400">{selectedHub.onTimeRate.toFixed(1)}%</div>
                        <div className="text-sm text-gray-400">On-Time Performance</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-yellow-400">{selectedHub.avgDelayMinutes}min</div>
                        <div className="text-sm text-gray-400">Average Delay</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-blue-400">{selectedHub.totalFlights}</div>
                        <div className="text-sm text-gray-400">Total Flights</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-red-400">{selectedHub.cancelledFlights}</div>
                        <div className="text-sm text-gray-400">Cancelled</div>
                      </div>
                    </div>

                    {/* Recent Flights */}
                    <h4 className="text-lg font-semibold text-white mb-4">Recent Flights</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {selectedHub.recentFlights.map((flight, index) => (
                        <div key={index} className="bg-gray-700/30 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium text-white">{flight.flightNumber}</span>
                              <span className="text-gray-400 ml-2">{flight.route}</span>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${
                                flight.status === 'on-time' ? 'text-green-400' :
                                flight.status === 'delayed' ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {flight.status.toUpperCase()}
                              </div>
                              {flight.delayMinutes > 0 && (
                                <div className="text-xs text-gray-400">+{flight.delayMinutes}min</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delay Analysis */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Delay Breakdown</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedHub.delayBreakdown).map(([category, count]) => (
                        <div key={category} className="flex justify-between bg-gray-700/30 rounded p-2">
                          <span className="text-sm text-gray-400">{category}:</span>
                          <span className="text-white font-medium">{count}</span>
                        </div>
                      ))}
                      {Object.keys(selectedHub.delayBreakdown).length === 0 && (
                        <div className="text-sm text-gray-400 text-center py-2">No delays reported</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}
        </div>
      </div>
    </div>
  );
}