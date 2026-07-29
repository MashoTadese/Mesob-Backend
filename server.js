// ============================================================
// MESOB Sululta Branch - Backend Server
// ============================================================
const express      = require('express');
const mongoose     = require('mongoose');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const dotenv       = require('dotenv');
const rateLimit    = require('express-rate-limit');
const connectDB    = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

const path = require('path');

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ── Security & Middleware ──
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', process.env.FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── Rate Limiting — protect public POST endpoints from spam ──
const publicPostLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 submissions per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
});
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                   // max 10 login attempts per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

// ── Serve Admin Panel ──
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));
app.get('/admin', (req, res) => res.redirect('/admin/login.html'));

// ── Serve uploaded news images publicly (accessible from frontend) ──
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'public/admin/uploads')));

// ── Routes ──
// Rate limit applied directly to POST-only public endpoints (spam protection)
app.post('/api/complaints', publicPostLimit);
app.post('/api/contact',    publicPostLimit);
app.post('/api/admin/login', loginLimit);

app.use('/api/complaints', require('./src/routes/complaintRoutes'));
app.use('/api/contact',    require('./src/routes/contactRoutes'));
app.use('/api/admin',      require('./src/routes/adminRoutes'));
app.use('/api/content',    require('./src/routes/contentRoutes'));
app.use('/api/news',         require('./src/routes/newsRoutes'));
app.use('/api/services',    require('./src/routes/serviceRoutes'));
app.use('/api/requirements',require('./src/routes/requirementRoutes'));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MESOB Sululta Branch API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ──
app.use(errorHandler);

// ── Start Server ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 MESOB Backend running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
