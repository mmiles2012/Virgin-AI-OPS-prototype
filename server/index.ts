import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { addIntelligenceRoutes } from "./intelligenceRoutes";
import envTestRouter from "./envTest";
import documentationRoutes from "./documentationRoutes";
import fullResponseRoutes from "./fullResponseRoutes";
import airportIntelRoutes from "./airportIntelRoutes";
import { setupVite, serveStatic, log } from "./vite";
import { virginAtlanticConnectionService } from "./virginAtlanticConnectionService";
import { config, logConfig, isDevelopment } from "./config";
import { defaultRateLimiter, readOnlyRateLimiter } from "./config/rateLimiting";
import { checkApiHealth } from "./config/apiClient";

// Log configuration on startup
console.log('🚀 AINO Aviation Intelligence Platform Starting...');
logConfig();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply rate limiting to all API routes
app.use('/api', defaultRateLimiter);

// Health check endpoint (with lighter rate limiting)
app.get('/health', readOnlyRateLimiter, async (req, res) => {
  try {
    const apiHealth = await checkApiHealth();
    const uptime = process.uptime();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      uptimeHuman: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      environment: config.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      apis: apiHealth
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Add intelligence routes
  addIntelligenceRoutes(app);
  
  // Add environment test routes
  app.use('/api/env', envTestRouter);
  
  // Add documentation download routes
  app.use('/api/documentation', documentationRoutes);
  
  // Add full response simulation routes
  app.use('/api/full-response', fullResponseRoutes);
  
  // Add airport intelligence routes
  app.use('/api/aviation', airportIntelRoutes);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (isDevelopment) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on configured port
  // this serves both the API and the client
  server.listen({
    port: config.PORT,
    host: config.HOST,
    reusePort: true,
  }, () => {
    log(`🌟 AINO Platform serving on ${config.HOST}:${config.PORT} (${config.NODE_ENV})`);
  });
})();
