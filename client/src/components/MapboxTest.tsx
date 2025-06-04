import React, { useState, useEffect } from 'react';

export default function MapboxTest() {
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState<string>('');

  useEffect(() => {
    fetch('/api/config/mapbox')
      .then(res => res.json())
      .then(data => {
        console.log('Mapbox token received:', data.token ? 'Yes' : 'No');
        setMapboxToken(data.token);
      })
      .catch(err => {
        console.error('Failed to fetch Mapbox token:', err);
        setImageError('Failed to fetch Mapbox token');
      });
  }, []);

  const testImageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/0,40,3/800x600@2x?access_token=${mapboxToken}`;

  return (
    <div className="fixed top-20 left-4 bg-black/80 text-white p-4 rounded-lg border border-gray-600 z-50 max-w-md">
      <h3 className="text-lg font-bold mb-2">Mapbox Satellite Test</h3>
      
      <div className="space-y-2 text-sm">
        <div>Token: {mapboxToken ? 'Available' : 'Missing'}</div>
        <div>Image Status: {imageLoaded ? 'Loaded' : imageError ? 'Error' : 'Loading'}</div>
        {imageError && <div className="text-red-400">Error: {imageError}</div>}
      </div>

      {mapboxToken && (
        <div className="mt-4">
          <div className="text-xs mb-2">Test Image (800x600):</div>
          <img 
            src={testImageUrl}
            alt="Mapbox Test"
            className="w-full h-32 object-cover border border-gray-500 rounded"
            onLoad={() => {
              console.log('Test image loaded successfully');
              setImageLoaded(true);
            }}
            onError={(e) => {
              console.error('Test image failed to load:', e.currentTarget.src);
              setImageError('Image failed to load');
            }}
          />
          
          <div className="text-xs mt-2 break-all">
            URL: {testImageUrl.substring(0, 100)}...
          </div>
        </div>
      )}
    </div>
  );
}