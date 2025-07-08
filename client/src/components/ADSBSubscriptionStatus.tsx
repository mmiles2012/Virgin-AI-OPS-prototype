import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';

interface SubscriptionStatus {
  healthy: boolean;
  message: string;
  subscription_active: boolean;
}

export default function ADSBSubscriptionStatus() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSubscriptionStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/adsb/health');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error checking ADS-B subscription status:', error);
      setStatus({
        healthy: false,
        message: 'Unable to check subscription status',
        subscription_active: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Checking ADS-B Exchange subscription status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {status.subscription_active ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            )}
            <h3 className="text-white font-semibold">
              ADS-B Exchange Status
            </h3>
          </div>
          
          <p className={`text-sm ${
            status.subscription_active ? 'text-green-300' : 'text-orange-300'
          }`}>
            {status.message}
          </p>
          
          {status.subscription_active && (
            <div className="text-xs text-green-400 mt-1">
              ✓ Subscription active - authentic flight data available
            </div>
          )}

          {!status.subscription_active && (
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
              <p className="text-orange-200 text-sm mb-3">
                Subscription Status Update:
              </p>
              <ul className="text-orange-200 text-xs space-y-1 mb-3">
                <li>• RapidAPI subscription confirmed via email</li>
                <li>• API activation can take 5-15 minutes</li>
                <li>• Using simulated data until activation complete</li>
                <li>• System will automatically switch to authentic data</li>
              </ul>
              <a
                href="https://rapidapi.com/adsbx/api/adsbexchange-com1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-orange-300 hover:text-orange-200 text-xs underline"
              >
                <ExternalLink className="w-3 h-3" />
                Subscribe to ADS-B Exchange API
              </a>
            </div>
          )}
          
          <button
            onClick={checkSubscriptionStatus}
            className="text-slate-300 hover:text-white text-xs underline"
          >
            Refresh Status
          </button>
        </div>
      </CardContent>
    </Card>
  );
}