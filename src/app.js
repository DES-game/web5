const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');

const app = express();

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:"]
      }
    }
  })
);

// Body parser for form submissions
app.use(express.urlencoded({ extended: false }));

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configure View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Modest rate limiter for registration endpoint (protects against brute-force/spam)
// Skip rate limiting in test environment so automated tests run cleanly
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: 'Too many registration requests from this IP, please try again after 15 minutes.'
});

app.use('/register', registerLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount application routes
app.use('/', routes);

// Custom 404 Handler
app.use((req, res, next) => {
  res.status(404).render('404', {
    title: '404 — Page Not Found',
    path: req.originalUrl
  });
});

// Centralized Error Handler (does not expose stack traces in production)
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  console.error(`[Error] ${err.message}`, isProd ? '' : err.stack);

  res.status(err.status || 500).render('error', {
    title: '500 — Server Error',
    message: isProd ? 'An unexpected internal error occurred. Please try again later.' : err.message,
    status: err.status || 500,
    stack: isProd ? null : err.stack
  });
});

module.exports = app;
