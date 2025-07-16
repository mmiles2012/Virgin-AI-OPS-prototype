import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/inter";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import MobileFallback from "./components/MobileFallback";
import { ResponsiveProvider } from "./contexts/ResponsiveContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AppRouter } from "./components/AppRouter";

// Import Virgin Atlantic theme
import "./styles/virgin-atlantic-theme.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ResponsiveProvider>
        <ToastProvider>
          <ErrorBoundary>
            <div className="overflow-hidden">
              <MobileFallback>
                <AppRouter 
                  isNavigationCollapsed={isNavigationCollapsed}
                  setIsNavigationCollapsed={setIsNavigationCollapsed}
                />
              </MobileFallback>
            </div>
          </ErrorBoundary>
        </ToastProvider>
      </ResponsiveProvider>
    </QueryClientProvider>
  );
}

export default App;
