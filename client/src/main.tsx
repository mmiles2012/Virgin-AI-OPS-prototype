import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Enhanced error handling for React initialization
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = createRoot(rootElement);
  root.render(<App />);
  
  // Signal successful React load
  console.log('React app initialized successfully');
  document.body.setAttribute('data-react-status', 'loaded');
  
} catch (error) {
  console.error('React initialization failed:', error);
  document.body.setAttribute('data-react-status', 'failed');
  
  // Force emergency interface if React fails completely
  setTimeout(() => {
    if ((window as any).showMobileFallback) {
      (window as any).showMobileFallback();
    }
  }, 1000);
}
