require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const socketIO = require('socket.io');
const cron = require('node-cron');
const connectDB = require('./config/db.config');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const marketRoutes = require('./routes/market.routes');
const orderRoutes = require('./routes/order.routes');
const strategyRoutes = require('./routes/strategy.routes');
const profileRoutes = require('./routes/profile.routes');
const radarRoutes = require('./routes/radar.routes');
const scannerRoutes = require('./routes/scanner.routes');
const heatmapRoutes = require('./routes/heatmap.routes');
const alertRoutes = require('./routes/alert.routes');

// Import services
const TickerService = require('./services/ticker.service');
const StrategyService = require('./services/strategy.service');
const authService = require('./services/auth.service');
const vixService = require('./services/vix.service');
const RadarService = require('./services/radar.service');
const ScannerService = require('./services/scanner.service');
const heatmapService = require('./services/heatmap.service');
const AlertService = require('./services/alert.service');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for auth.html
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:5000", "http://localhost:3000"],
      },
    },
  })
);
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Connect to database
connectDB();

// Load saved Kite access token on startup (if available)
const initializeAuth = async () => {
  const { isDemoMode } = require('./config/kite.config');
  
  if (!isDemoMode()) {
    logger.info('🔑 Attempting to load saved access token...');
    const tokenData = await authService.loadSavedAccessToken();
    
    if (tokenData) {
      logger.info('✅ Access token loaded successfully');
      // Validate the token
      const isValid = await authService.validateAccessToken().catch(() => false);
      if (!isValid) {
        logger.error('❌ Saved token is invalid or expired');
        logger.info('💡 Please authenticate at: http://localhost:' + (process.env.PORT || 5000) + '/auth.html');
      }
    } else {
      logger.warn('⚠️  No saved access token found');
      logger.info('💡 Please authenticate at: http://localhost:' + (process.env.PORT || 5000) + '/auth.html');
    }
  }
};

// Initialize auth after a short delay to ensure server is ready
setTimeout(initializeAuth, 1000);

// Seed demo data into MemoryStore before services start
const { isDemoModeDb } = require('./config/kite.config');
if (isDemoModeDb()) {
  const seedDemo = require('./services/demo-seed.service');
  seedDemo();
}

// Initialize services
const tickerService = new TickerService(io);
const strategyService = new StrategyService(io);
const radarService = new RadarService(io);
const scannerService = new ScannerService(io);
const alertService = new AlertService(io);
vixService.io = io; // wire socket after io is ready

// Make services available to routes
app.locals.tickerService = tickerService;
app.locals.strategyService = strategyService;
app.locals.radarService = radarService;
app.locals.scannerService = scannerService;
app.locals.alertService = alertService;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/radar', radarRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/heatmap', heatmapRoutes);
app.use('/api/alerts', alertRoutes);
// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    tickerConnected: tickerService.isConnected()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('subscribe', (instruments) => {
    logger.info(`Client ${socket.id} subscribing to instruments:`, instruments);
    tickerService.addSubscription(socket.id, instruments);
  });
  
  socket.on('unsubscribe', (instruments) => {
    logger.info(`Client ${socket.id} unsubscribing from instruments:`, instruments);
    tickerService.removeSubscription(socket.id, instruments);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
    tickerService.removeClient(socket.id);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    tickerService.disconnect();
    strategyService.stop();
    vixService.stop();
    radarService.stop();
    scannerService.stop();
    heatmapService.stop();
    alertService.stop();
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  
  try {
    // Initialize ticker service
    tickerService.connect();
    
    // Start strategy engine
    strategyService.start();
    
    // Start VIX monitoring
    vixService.start();

    // Start new services
    radarService.start();
    scannerService.start();
    heatmapService.start();
    alertService.start();

    // Wire up cross-service dependencies
    scannerService.setRadarService(radarService);

    // Morning market brief — 9:00 AM IST, Mon–Fri
    cron.schedule('0 9 * * 1-5', async () => {
      logger.info('🌅 Running morning brief...');
      try {
        const telegramService = require('./services/telegram.service');
        const vixService = require('./services/vix.service');
        const fs = require('fs');
        const path = require('path');
        const scanTemplates = require('./config/scan-templates');

        const scanSummary = [];
        for (const template of scanTemplates) {
          try {
            const results = await scannerService.runScan(template.id);
            scanSummary.push({
              templateName: template.name,
              count: results.length,
              topSymbols: results.slice(0, 3).map(r => r.symbol)
            });
          } catch (e) { /* skip failed templates */ }
        }

        const profilesDir = path.join(__dirname, '../profiles');
        if (!fs.existsSync(profilesDir)) return;
        const profiles = fs.readdirSync(profilesDir);
        const brief = {
          vix: vixService.getCurrentVIX(),
          vixCondition: vixService.getMarketCondition().condition,
          scanSummary,
          date: new Date().toLocaleDateString('en-IN')
        };

        for (const name of profiles) {
          const cfgPath = path.join(profilesDir, name, 'config.json');
          if (!fs.existsSync(cfgPath)) continue;
          const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
          const tg = cfg?.trading?.notifications?.telegram;
          if (!tg?.enabled || !tg.botToken || !tg.chatId) continue;
          telegramService.registerBot(tg.chatId, tg.botToken, true);
          await telegramService.sendMorningBrief(tg.chatId, brief);
        }

        logger.info('🌅 Morning brief sent');
      } catch (err) {
        logger.error('Morning brief error:', err.message);
      }
    }, { timezone: 'Asia/Kolkata' });

    logger.info('✅ All services started successfully');
    logger.info('📈 India VIX monitoring active (Kite Connect + NSE fallback)');
    logger.info('👥 Profile system ready');
    logger.info('📝 Paper trading available');
    logger.info('📱 Telegram notifications configured');
    logger.info('📡 Order flow radar active');
    logger.info('🔍 Market scanner ready (with Watch Mode)');
    logger.info('🗺️  Sector heatmap active');
    logger.info('🔔 Alert service active');
    logger.info('🌅 Morning brief cron scheduled (9:00 AM IST, Mon–Fri)');
    
  } catch (error) {
    logger.error('Error starting services:', error);
  }
});

module.exports = { app, server, io };
