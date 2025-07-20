import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../../../server/routes.js';
import { addIntelligenceRoutes } from '../../../server/intelligenceRoutes.js';
import envTestRouter from '../../../server/envTest.js';
import documentationRoutes from '../../../server/documentationRoutes.js';
import fullResponseRoutes from '../../../server/fullResponseRoutes.js';
import airportIntelRoutes from '../../../server/airportIntelRoutes.js';
import { defaultRateLimiter, readOnlyRateLimiter } from '../../../server/config/rateLimiting.js';
import { checkApiHealth } from '../../../server/config/apiClient.js';
import { config } from '../../../server/config.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply rate limiting to all API routes
app.use('/api', defaultRateLimiter);

// Health check endpoint (with lighter rate limiting)
app.get('/api/health', readOnlyRateLimiter, async (req, res) => {
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

// Register all routes
const server = createServer(app);
await registerRoutes(app);
addIntelligenceRoutes(app);
app.use('/api/env', envTestRouter);
app.use('/api/documentation', documentationRoutes);
app.use('/api/full-response', fullResponseRoutes);
app.use('/api/aviation', airportIntelRoutes);

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default app;
