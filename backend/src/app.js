const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const path = require("path");
const heroBannerRoutes = require('./routes/heroBanner.routes');

const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, "../uploads");

const app = express();
app.set("trust proxy", 1);

// Hide Express from attackers
app.disable("x-powered-by");

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(express.json({ limit: '10kb' })); // Prevent large payload attacks

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 200),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  skip: (req) => req.path === "/api/health",
});
app.use(limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // only 10 attempts per 15 minutes
  message: {
    success: false,
    message: "Too many attempts, please try again later.",
  }
});

// CORS - fixed to not allow all origins
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    // Browser request from allowed origin
    res.header("Access-Control-Allow-Origin", origin);
  } else if (!origin) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    res.header("Access-Control-Allow-Origin", "*");
  }
  // Blocked: browser requests from unknown origins get no CORS header
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/payments", require("./routes/payment.routes"));
app.use("/api/health", require("./routes/health.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use('/api/admin', authLimiter, require('./routes/admin.routes')); // Extra rate limit on admin
app.use("/api/partners", require("./routes/partner.routes"));
app.use(
  '/uploads',
  express.static(uploadsDir, {
    maxAge: '7d',
    etag: true,
    lastModified: true,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    },
  })
);
app.use("/api/uploads", require("./routes/upload.routes"));
app.use('/api/hero-banners', heroBannerRoutes);
app.use("/api/users", authLimiter, require("./routes/user.routes"));
app.use('/api/auth', require('./routes/auth.routes')); 
// const path = require('path');
app.use('/admin', express.static(path.join(__dirname, '../dashboard')));
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard', 'index.html'));
});
// Global error handler
app.use(require("./middlewares/error.middleware"));

module.exports = app;