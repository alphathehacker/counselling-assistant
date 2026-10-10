import './config/loadEnv.js';
import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import adminAuthRoutes from './routes/adminAuth.js';
import predictionRoutes from './routes/prediction.js';
import adminRoutes from './routes/admin.js';
import imageRoutes from './routes/images.js';
import userRoutes from './routes/user.js';
import prediction2Routes from './routes/prediction2.js';
import notificationRoutes from './routes/notifications.js';
import chatRoutes from './routes/chat.js';

// ... (rest of imports)

// Log to verify SerpAPI key is loaded (first 10 chars only)
if (process.env.SERP_API_KEY && process.env.SERP_API_KEY !== 'your-serpapi-key') {
  console.log(`✓ SerpAPI Key loaded: ${process.env.SERP_API_KEY.substring(0, 10)}...`);
} else {
  console.warn('⚠️ SerpAPI Key NOT loaded from .env file!');
}

// Log to verify Gemini API key
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  console.log('✓ Gemini AI API Key is configured.');
} else {
  console.warn('⚠️ Gemini AI API Key NOT configured!');
}

// Initialize Express app
const app = express();

// Initialize Passport
app.use(passport.initialize());

// Connect to MongoDB
connectDB();

// Middleware - CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:4028', // Vite default port
  'http://localhost:5173', // Alternative Vite port
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, allow localhost with any port
      if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/user', userRoutes);
app.use('/api/prediction2', prediction2Routes);
app.use('/api/notifications', notificationRoutes);
console.log('✓ Notifications Route Registered on /api/notifications');
app.use('/api/chat', chatRoutes);
console.log('✓ Chat Route Registered on /api/chat');


// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Diagnostic: college count (no auth - for debugging empty college lists)
app.get('/api/health/colleges', async (req, res) => {
  try {
    const College = (await import('./models/College.js')).default;
    const count = await College.countDocuments({ isActive: true });
    res.json({ success: true, activeColleges: count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[SERVER-ERR] ', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    error: err.stack?.substring(0, 500)
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Keep-alive: free-tier hosts (e.g. Render) sleep when idle. Render sets
// RENDER_EXTERNAL_URL automatically, so ping our own health endpoint every
// 10 minutes while the instance is running to keep it warm.
// Opt out anytime with KEEP_ALIVE=false.
const externalUrl = process.env.RENDER_EXTERNAL_URL;
if (externalUrl && process.env.KEEP_ALIVE !== 'false') {
  const intervalMs = 10 * 60 * 1000;
  setInterval(async () => {
    try {
      await fetch(`${externalUrl}/api/health`);
      console.log('Keep-alive ping sent');
    } catch (err) {
      console.warn('Keep-alive ping failed:', err.message);
    }
  }, intervalMs);
  console.log(`Keep-alive enabled for ${externalUrl}`);
}
