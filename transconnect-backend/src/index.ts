import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Import services
import { DatabaseService } from './services/database.service';
import { BackupService } from './services/backup.service';
import { MonitoringService } from './services/monitoring.service';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import routeRoutes from './routes/routes';
import bookingRoutes from './routes/bookings';
import paymentRoutes from './routes/payments';
import operatorRoutes from './routes/operators';
import busRoutes from './routes/buses';
import rideRoutes from './routes/rides';
import qrRoutes from './routes/qr';
import notificationRoutes from './routes/notifications';
import operatorPaymentRoutes from './routes/operator-payments';
import operatorManagementRoutes from './routes/operator-management';
import adminOperatorUserRoutes from './routes/admin-operator-users';
import databaseAdminRoutes from './routes/admin/database';
import systemFixesRoutes from './routes/admin/system-fixes';
import adminSeedRoutes from './routes/admin-seed';
import agentRoutes from './routes/agents';
import segmentRoutes from './routes/segments'; // NEW: Route segments management
import { cleanupOfflineAgents } from './middleware/agentActivity';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001", 
      "https://transconnect.app",
      "https://www.transconnect.app",
      "https://admin.transconnect.app",
      "https://operators.transconnect.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Initialize Database Service (replaces direct Prisma Client)
const dbService = DatabaseService.getInstance();
export const prisma = dbService.getPrismaClient();

// Initialize Production Services
let backupService: BackupService;
let monitoringService: MonitoringService;

// Initialize services only in production or when explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_PRODUCTION_FEATURES === 'true') {
  backupService = BackupService.getInstance();
  monitoringService = MonitoringService.getInstance();
  console.log('🔧 Production database services initialized');
} else {
  console.log('⚠️  Production database services disabled (development mode)');
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// CORS configuration - must be before other middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001", 
      "https://transconnect.app",
      "https://www.transconnect.app",
      "https://admin.transconnect.app", 
      "https://operators.transconnect.app",
      "https://transconnect-admin-staging.onrender.com"
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma',
    'Expires',
    'If-None-Match',
    'If-Modified-Since'
  ],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Other middleware
app.use(limiter);
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/segments', segmentRoutes); // NEW: Route segments management
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/operator-payments', operatorPaymentRoutes);
app.use('/api/operator-management', operatorManagementRoutes);
app.use('/api/admin/operator-users', adminOperatorUserRoutes);
app.use('/api/admin/database', databaseAdminRoutes);
app.use('/api/admin/system-fixes', systemFixesRoutes);
app.use('/api/admin', adminSeedRoutes);
app.use('/api/agents', agentRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Basic health check
    const basicHealth = {
      status: 'OK',
      message: 'TransConnect Backend API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      demoMode: process.env.PAYMENT_DEMO_MODE === 'true',
    };

    // Enhanced health check with database status
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_PRODUCTION_FEATURES === 'true') {
      const dbHealth = await dbService.performHealthCheck();
      res.status(200).json({
        ...basicHealth,
        database: {
          connected: dbHealth.database,
          redis: dbHealth.redis,
          connectionPool: dbHealth.connectionPool,
        },
        services: {
          backup: backupService ? 'enabled' : 'disabled',
          monitoring: monitoringService ? 'enabled' : 'disabled',
        },
      });
    } else {
      res.status(200).json(basicHealth);
    }
  } catch (error: any) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Service health check failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// API health check endpoint (for Render)
app.get('/api/health', async (req, res) => {
  try {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'TransConnect Backend API',
      version: '1.0.1', // Updated for deployment test
      message: 'Backend is running properly',
      demoMode: process.env.PAYMENT_DEMO_MODE === 'true',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// WebSocket for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-ride-room', (rideId) => {
    socket.join(`ride-${rideId}`);
  });

  socket.on('bus-location-update', (data) => {
    socket.broadcast.emit('bus-location', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

console.log('Starting TransConnect Backend...');
console.log(`Port: ${PORT}, Host: ${HOST}`);

// Agent cleanup scheduler to handle offline agents
function startAgentCleanupScheduler() {
  // Run cleanup every 2 minutes
  const cleanupInterval = setInterval(async () => {
    try {
      const cleanedUp = await cleanupOfflineAgents();
      if (cleanedUp > 0) {
        console.log(`📴 Auto-cleanup: ${cleanedUp} agents marked offline`);
      }
    } catch (error) {
      console.error('❌ Agent cleanup scheduler error:', error);
    }
  }, 2 * 60 * 1000); // Every 2 minutes
  
  console.log('⏰ Agent cleanup scheduler started (runs every 2 minutes)');
  
  // Store interval for cleanup on shutdown
  process.on('SIGTERM', () => {
    clearInterval(cleanupInterval);
    console.log('✅ Agent cleanup scheduler stopped');
  });
  
  process.on('SIGINT', () => {
    clearInterval(cleanupInterval);
  });
}

// Deploy database migrations on startup in production
async function deployMigrations() {
  if (process.env.NODE_ENV === 'production') {
    console.log('🗄️ Deploying database migrations...');
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      await execAsync('npx prisma migrate deploy');
      console.log('✅ Database migrations deployed successfully');
      
      // Seed database with initial data
      console.log('🌱 Seeding database with initial data...');
      try {
        await execAsync('node scripts/seed-production.js');
        console.log('✅ Database seeded successfully');
      } catch (seedError: any) {
        console.log('⚠️ Database seeding skipped (already seeded or seed failed):', seedError.message);
      }
    } catch (error) {
      console.error('❌ Migration deployment failed:', error);
      // Don't exit - let the server start anyway in case migrations aren't needed
    }
  }
}

// Deploy migrations before starting server
deployMigrations().then(() => {
  server.listen(PORT, HOST, () => {
    console.log(`🚀 TransConnect Backend server running on ${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
    console.log('🛤️ Route stops system ready');
    
    // Start agent cleanup scheduler
    startAgentCleanupScheduler();
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  try {
    // Stop production services
    if (monitoringService) {
      await monitoringService.stop();
      console.log('✅ Monitoring service stopped');
    }
    
    if (backupService) {
      backupService.stopScheduledBackups();
      console.log('✅ Backup service stopped');
    }
    
    // Disconnect database
    await dbService.disconnect();
    console.log('✅ Database disconnected');
    
    // Close server
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  try {
    // Stop production services
    if (monitoringService) {
      await monitoringService.stop();
    }
    
    if (backupService) {
      backupService.stopScheduledBackups();
    }
    
    // Disconnect database
    await dbService.disconnect();
    
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

export { io };