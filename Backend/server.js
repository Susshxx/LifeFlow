const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require("compression");
require("dotenv").config();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
// Enable gzip compression for all responses
app.use(compression());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.startsWith("http://localhost:")) return callback(null, true);
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)
      return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── MongoDB ───────────────────────────────────────────────────────────────────
let isConnecting = false;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;

const connectDB = async () => {
  if (isConnecting) return;
  isConnecting = true;
  
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
    });
    console.log("✓ MongoDB Connected");
    connectionAttempts = 0;
  } catch (err) {
    connectionAttempts++;
    console.error(`❌ MongoDB Connection Error (Attempt ${connectionAttempts}/${MAX_RETRY_ATTEMPTS}):`, err.message);
    
    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      console.log("\n⚠️  TROUBLESHOOTING:");
      console.log("1. Check your internet connection");
      console.log("2. Verify MongoDB Atlas IP whitelist (should include 0.0.0.0/0 or your IP)");
      console.log("3. Check if your network/firewall is blocking MongoDB Atlas");
      console.log("4. Try using Google DNS (8.8.8.8) in your network settings");
      console.log("5. Consider installing MongoDB locally: https://www.mongodb.com/try/download/community");
      console.log(`\nRetrying connection in ${5 * connectionAttempts} seconds...\n`);
      
      setTimeout(() => {
        isConnecting = false;
        connectDB();
      }, 5000 * connectionAttempts);
    } else {
      console.error("\n❌ Failed to connect to MongoDB after", MAX_RETRY_ATTEMPTS, "attempts");
      console.error("⚠️  Server will continue running but database operations will fail");
      console.error("⚠️  Please fix MongoDB connection and restart the server\n");
    }
  } finally {
    isConnecting = false;
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  console.log("✓ MongoDB connection established successfully");
  connectionAttempts = 0;
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️  MongoDB disconnected");
  if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
    setTimeout(() => {
      if (mongoose.connection.readyState === 0) {
        console.log("Attempting to reconnect...");
        connectDB();
      }
    }, 5000);
  }
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB Runtime Error:", err.message);
});

mongoose.connection.on("reconnected", () => {
  console.log("✓ MongoDB reconnected successfully");
  connectionAttempts = 0;
});

connectDB();

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const donationRoutes = require("./routes/donationRoutes");
const ocrRoutes = require("./routes/ocrRoutes");
const profileRoutes = require("./routes/profileRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const bloodRequestRoutes = require("./routes/bloodRequestRoutes");
const bloodCampRoutes = require("./routes/bloodCampRoutes");
const campRegistrationRoutes = require("./routes/campRegistrationRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");
const bloodInventoryRoutes = require("./routes/bloodInventoryRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/donation", donationRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/blood-requests", bloodRequestRoutes);
app.use("/api/blood-camps", bloodCampRoutes);
app.use("/api/camp-registration", campRegistrationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/blood-inventory", bloodInventoryRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  
  res.json({
    status: "ok",
    database: statusMap[dbStatus] || "unknown",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  
  // Check if headers already sent
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start automatic camp status updater
  const { updateCampStatuses } = require('./utils/campStatusUpdater');
  
  // Run immediately on startup
  updateCampStatuses().then(() => {
    console.log('✓ Initial camp status update completed');
  });
  
  // Run every 5 minutes to check for completed camps
  setInterval(() => {
    updateCampStatuses();
  }, 5 * 60 * 1000); // 5 minutes
  
  console.log('✓ Camp status auto-updater started (runs every 5 minutes)');
});