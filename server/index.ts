import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler, notFoundHandler, requestIdMiddleware } from "./middleware/errorHandler";

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Add request ID middleware
app.use(requestIdMiddleware);

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

// Setup routes and middleware for local development
(async () => {
  const server = await registerRoutes(app);

  // Setup vite/static serving BEFORE error handlers
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Add 404 handler AFTER static serving
  app.use(notFoundHandler);
  
  // Add error handler
  app.use(errorHandler);

  // Start server for local development
  const port = parseInt(process.env.PORT || '5000', 10);
  console.log(`🔧 Environment PORT: ${process.env.PORT}`);
  console.log(`🔧 Using port: ${port}`);
  
  server.listen(port, () => {
    log(`serving on port ${port}`);
    log(`Frontend should be available at http://localhost:${port}`);
    log(`API health check: http://localhost:${port}/api/health`);
  });
})();
