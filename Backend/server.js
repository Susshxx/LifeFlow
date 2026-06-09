const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require("compression");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(compression());

// CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.startsWith("http://localhost:")) return callback(null, true);
    
    // Allow production frontend URL from environment variable
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    
    // Allow the production Render URL
    if (origin === "https://lifeflow-uj6d.onrender.com") {
      return callback(null, true);
    }
    
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    });

    console.log("✓ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);

    console.log("Retrying MongoDB connection in 5 seconds...");

    setTimeout(connectDB, 5000);
  }
};

// MongoDB events
mongoose.connection.on("connected", () => {
  console.log("✓ MongoDB connection established");
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("✓ MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB Runtime Error:", err.message);
});

// Connect database
connectDB();

// ─────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────

const authRoutes = require("./routes/authRoutes");
const donationRoutes = require("./routes/donationRoutes");
const donationHistoryRoutes = require("./routes/donationHistoryRoutes");
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
const notificationRoutes = require("./routes/notificationRoutes");
const geocodeRoutes = require("./routes/geocodeRoutes");


// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/donation", donationRoutes);
app.use("/api/donation-history", donationHistoryRoutes);
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
app.use("/api/notifications", notificationRoutes);
app.use("/api/geocode", geocodeRoutes);


// ─────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  const dbStates = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.status(200).json({
    success: true,
    server: "running",
    database: dbStates[mongoose.connection.readyState],
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────
// ROOT ROUTE
// ─────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.send("LifeFlow Backend API Running");
});

// ─────────────────────────────────────────────────────────────
// 404 HANDLER
// ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ─────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ─────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);

  // Start automatic camp status updater
  try {
    const { updateCampStatuses } = require("./utils/campStatusUpdater");

    // Run immediately
    updateCampStatuses()
      .then(() => {
        console.log("✓ Initial camp status update completed");
      })
      .catch((err) => {
        console.log("⚠️ Initial camp update failed:", err.message);
      });

    // Run every 5 minutes
    setInterval(() => {
      updateCampStatuses().catch((err) => {
        console.log("⚠️ Camp updater error:", err.message);
      });
    }, 5 * 60 * 1000);

    console.log("✓ Camp status updater started");
  } catch (err) {
    console.log("⚠️ Camp updater unavailable:", err.message);
  }
});

// ─────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────────────

process.on("SIGINT", async () => {
  console.log("\n⚠️ Shutting down server...");

  try {
    await mongoose.connection.close();
    console.log("✓ MongoDB connection closed");
  } catch (err) {
    console.log("❌ Error closing MongoDB:", err.message);
  }

  process.exit(0);
});