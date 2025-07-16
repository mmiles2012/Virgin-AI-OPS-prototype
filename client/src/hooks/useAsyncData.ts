import { useState, useEffect, useCallback, useRef } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isStale: boolean;
}

interface UseAsyncDataOptions {
  initialData?: any;
  cacheTTL?: number; // Time to live in milliseconds
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  dependencies?: any[]; // Dependency array for automatic refetch
}

export function useAsyncData<T>(
  fetchFunction: () => Promise<T>,
  options: UseAsyncDataOptions = {}
): AsyncState<T> {
  const {
    initialData = null,
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    retryCount = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    dependencies = []
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);
  
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isStale = lastFetch ? Date.now() - lastFetch > cacheTTL : true;

  const fetchData = useCallback(async () => {
    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      
      if (!abortControllerRef.current.signal.aborted) {
        setData(result);
        setLastFetch(Date.now());
        retryCountRef.current = 0;
        onSuccess?.(result);
      }
    } catch (err: any) {
      if (!abortControllerRef.current.signal.aborted) {
        const errorMessage = err.message || 'An error occurred while fetching data';
        
        if (retryCountRef.current < retryCount) {
          retryCountRef.current++;
          console.log(`Retrying request (${retryCountRef.current}/${retryCount}) after ${retryDelay}ms...`);
          
          setTimeout(() => {
            fetchData();
          }, retryDelay);
          return;
        }
        
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [fetchFunction, retryCount, retryDelay, onSuccess, onError]);

  const refetch = useCallback(() => {
    retryCountRef.current = 0;
    return fetchData();
  }, [fetchData]);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    fetchData();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);

  // Auto-refresh stale data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isStale && !loading) {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isStale, loading, refetch]);

  return {
    data,
    loading,
    error,
    refetch,
    isStale
  };
}

// Hook for paginated data
interface UsePaginatedDataOptions extends UseAsyncDataOptions {
  pageSize?: number;
  initialPage?: number;
}

interface PaginatedState<T> extends AsyncState<T[]> {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function usePaginatedData<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
  options: UsePaginatedDataOptions = {}
): PaginatedState<T> {
  const {
    pageSize = 20,
    initialPage = 1,
    ...asyncOptions
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalItems, setTotalItems] = useState(0);

  const paginatedFetch = useCallback(async () => {
    const result = await fetchFunction(currentPage, pageSize);
    setTotalItems(result.total);
    return result.data;
  }, [fetchFunction, currentPage, pageSize]);

  const asyncState = useAsyncData<T[]>(paginatedFetch, {
    ...asyncOptions,
    dependencies: [currentPage, ...(asyncOptions.dependencies || [])]
  });

  const totalPages = Math.ceil(totalItems / pageSize);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  return {
    ...asyncState,
    currentPage,
    totalPages,
    totalItems,
    nextPage,
    previousPage,
    goToPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  };
}

// Hook for real-time data with polling
interface UsePollingDataOptions extends UseAsyncDataOptions {
  pollingInterval?: number;
  enablePolling?: boolean;
}

export function usePollingData<T>(
  fetchFunction: () => Promise<T>,
  options: UsePollingDataOptions = {}
): AsyncState<T> & { startPolling: () => void; stopPolling: () => void } {
  const {
    pollingInterval = 30000, // 30 seconds default
    enablePolling = true,
    ...asyncOptions
  } = options;

  const [isPolling, setIsPolling] = useState(enablePolling);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const asyncState = useAsyncData<T>(fetchFunction, asyncOptions);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPolling && !asyncState.loading) {
      intervalRef.current = setInterval(() => {
        if (!document.hidden) { // Only poll when page is visible
          asyncState.refetch();
        }
      }, pollingInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isPolling, asyncState.loading, asyncState.refetch, pollingInterval]);

  return {
    ...asyncState,
    startPolling,
    stopPolling
  };
}

export default useAsyncData;
