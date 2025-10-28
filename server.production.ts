// server.production.ts - Production-optimized Next.js server
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { enhancedMonitoringService } from '@/lib/services/enhancedMonitoringService';
import { logger } from '@/lib/services/advancedLogger';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';

// Production server with enhanced monitoring and error handling
async function createProductionServer() {
  try {
    logger.info('Starting production server...', { port, hostname, env: process.env.NODE_ENV });

    // Initialize monitoring
    await enhancedMonitoringService.initialize();
    logger.info('Monitoring service initialized');

    // Create Next.js app with production optimizations
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      conf: {
        distDir: './.next',
        // Production-specific optimizations
        compress: true,
        poweredByHeader: false,
        generateEtags: false,
        httpAgentOptions: {
          keepAlive: true,
        },
      }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server with production optimizations
    const server = createServer({
      keepAlive: true,
      keepAliveTimeout: 65000,
      headersTimeout: 66000,
    }, async (req, res) => {
      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }

      // Monitor request
      const startTime = Date.now();
      const originalEnd = res.end;
      
      res.end = function(chunk?: any, encoding?: any) {
        const duration = Date.now() - startTime;
        enhancedMonitoringService.recordRequest(req.method || 'GET', req.url || '/', res.statusCode, duration);
        
        // Log slow requests
        if (duration > 5000) {
          logger.warn('Slow request detected', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
          });
        }
        
        return originalEnd.call(this, chunk, encoding);
      };

      try {
        handle(req, res);
      } catch (error) {
        logger.error('Request handling error', { error, url: req.url });
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      }
    });

    // Setup Socket.IO with production optimizations
    const io = new Server(server, {
      path: process.env.SOCKET_IO_PATH || '/api/socketio',
      cors: {
        origin: process.env.SOCKET_IO_CORS_ORIGIN || process.env.NEXTAUTH_URL,
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6,
    });

    setupSocket(io);
    logger.info('Socket.IO server configured');

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after timeout
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
      gracefulShutdown('unhandledRejection');
    });

    // Start the server
    server.listen(port, hostname, () => {
      logger.info(`Production server ready on http://${hostname}:${port}`);
      logger.info(`Socket.IO server running at ws://${hostname}:${port}${io.path()}`);
      logger.info('Health check available at /health');
    });

    // Health check endpoint
    server.on('request', (req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          environment: process.env.NODE_ENV,
        }));
      }
    });

  } catch (err) {
    logger.error('Server startup error', { error: err });
    process.exit(1);
  }
}

// Start the server
createProductionServer();