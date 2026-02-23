const express = require("express");
const path = require("path");
const heroBannerRoutes = require('./routes/heroBanner.routes');

const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, "../uploads");

const app = express();

// Middleware
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
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
app.use("/uploads", express.static(uploadsDir));
app.use("/api/uploads", require("./routes/upload.routes"));
app.use('/api/hero-banners', heroBannerRoutes);
app.use("/api/users", require("./routes/user.routes"));




// Global error handler
app.use(require("./middlewares/error.middleware"));


module.exports = app;
