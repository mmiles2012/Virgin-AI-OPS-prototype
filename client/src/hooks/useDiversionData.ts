import { useEffect, useState } from 'react';
import { DiversionResult } from '../components/DiversionMap';

interface Position {
  lat: number;
  lon: number;
}

export function useDiversionData(
  fetchSnapshot: () => Promise<{ current: Position; results: DiversionResult[] }>,
  pollMs = 30_000
) {
  const [data, setData] = useState<{ current: Position; results: DiversionResult[] } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  // First load + polling interval
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        setLoading(true);
        const snap = await fetchSnapshot();
        if (!cancelled) {
          setData(snap);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    poll(); // initial immediate fetch
    const id = setInterval(poll, pollMs); // repeat

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetchSnapshot, pollMs]);

  const refresh = async () => {
    try {
      setLoading(true);
      const snap = await fetchSnapshot();
      setData(snap);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { data, error, loading, refresh };
}