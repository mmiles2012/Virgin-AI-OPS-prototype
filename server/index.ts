import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { addIntelligenceRoutes } from "./intelligenceRoutes";
import envTestRouter from "./envTest";
import documentationRoutes from "./documentationRoutes";
import fullResponseRoutes from "./fullResponseRoutes";
import { setupVite, serveStatic, log } from "./vite";
import { virginAtlanticConnectionService } from "./virginAtlanticConnectionService";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Debug environment variables loading
console.log('🔍 Environment Variables Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FLIGHTAWARE_API_KEY:', process.env.FLIGHTAWARE_API_KEY ? 'Present' : 'Missing');
console.log('RAPIDAPI_KEY:', process.env.RAPIDAPI_KEY ? 'Present' : 'Missing');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
console.log('AVIATIONSTACK_API_KEY:', process.env.AVIATIONSTACK_API_KEY ? 'Present' : 'Missing');
console.log('NEWS_API_KEY:', process.env.NEWS_API_KEY ? 'Present' : 'Missing');
console.log('AVWX_API_KEY:', process.env.AVWX_API_KEY ? 'Present' : 'Missing');
console.log('FAA_NOTAM_API_KEY:', process.env.FAA_NOTAM_API_KEY ? 'Present' : 'Missing');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
