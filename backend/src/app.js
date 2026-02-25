const express = require("express");
const rateLimit = require("express-rate-limit");
const path = require("path");
const heroBannerRoutes = require('./routes/heroBanner.routes');

const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, "../uploads");

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(express.json());

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

// CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) {
    res.header("Access-Control-Allow-Origin", "*");
  } else if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  } else {
    return res.status(403).json({
      success: false,
      message: "CORS origin denied",
    });
  }
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
app.use("/api/reviews", require("./routes/review.routes"));
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
app.use("/api/users", require("./routes/user.routes"));




// Global error handler
app.use(require("./middlewares/error.middleware"));


module.exports = app;
