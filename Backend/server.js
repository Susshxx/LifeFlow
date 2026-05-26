// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const compression = require("compression");
// require("dotenv").config();

// const app = express();

// // ── Middleware ────────────────────────────────────────────────────────────────
// // Enable gzip compression for all responses
// app.use(compression());

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true);
//     if (origin.startsWith("http://localhost:")) return callback(null, true);
//     if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)
//       return callback(null, true);
//     return callback(new Error("Not allowed by CORS"));
//   },
//   credentials: true,
// }));
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// // ── MongoDB ───────────────────────────────────────────────────────────────────
// let isConnecting = false;
// let connectionAttempts = 0;
// const MAX_RETRY_ATTEMPTS = 5;

// const connectDB = async () => {
//   if (isConnecting) return;
//   isConnecting = true;
  
//   try {
//     await mongoose.connect(process.env.MONGO_URI, {
//       serverSelectionTimeoutMS: 10000,
//       socketTimeoutMS: 45000,
//       family: 4, // Use IPv4, skip trying IPv6
//       maxPoolSize: 10,
//       minPoolSize: 2,
//       retryWrites: true,
//       retryReads: true,
//     });
//     console.log("✓ MongoDB Connected");
//     connectionAttempts = 0;
//   } catch (err) {
//     connectionAttempts++;
//     console.error(`❌ MongoDB Connection Error (Attempt ${connectionAttempts}/${MAX_RETRY_ATTEMPTS}):`, err.message);
    
//     if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
//       console.log("\n⚠️  TROUBLESHOOTING:");
//       console.log("1. Check your internet connection");
//       console.log("2. Verify MongoDB Atlas IP whitelist (should include 0.0.0.0/0 or your IP)");
//       console.log("3. Check if your network/firewall is blocking MongoDB Atlas");
//       console.log("4. Try using Google DNS (8.8.8.8) in your network settings");
//       console.log("5. Consider installing MongoDB locally: https://www.mongodb.com/try/download/community");
//       console.log(`\nRetrying connection in ${5 * connectionAttempts} seconds...\n`);
      
//       setTimeout(() => {
//         isConnecting = false;
//         connectDB();
//       }, 5000 * connectionAttempts);
//     } else {
//       console.error("\n❌ Failed to connect to MongoDB after", MAX_RETRY_ATTEMPTS, "attempts");
//       console.error("⚠️  Server will continue running but database operations will fail");
//       console.error("⚠️  Please fix MongoDB connection and restart the server\n");
//     }
//   } finally {
//     isConnecting = false;
//   }
// };

// // Handle connection events
// mongoose.connection.on("connected", () => {
//   console.log("✓ MongoDB connection established successfully");
//   connectionAttempts = 0;
// });

// mongoose.connection.on("disconnected", () => {
//   console.log("⚠️  MongoDB disconnected");
//   if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
//     setTimeout(() => {
//       if (mongoose.connection.readyState === 0) {
//         console.log("Attempting to reconnect...");
//         connectDB();
//       }
//     }, 5000);
//   }
// });

// mongoose.connection.on("error", (err) => {
//   console.error("MongoDB Runtime Error:", err.message);
// });

// mongoose.connection.on("reconnected", () => {
//   console.log("✓ MongoDB reconnected successfully");
//   connectionAttempts = 0;
// });

// connectDB();

// // ── Routes ────────────────────────────────────────────────────────────────────
// const authRoutes = require("./routes/authRoutes");
// const donationRoutes = require("./routes/donationRoutes");
// const donationHistoryRoutes = require("./routes/donationHistoryRoutes");
// const ocrRoutes = require("./routes/ocrRoutes");
// const profileRoutes = require("./routes/profileRoutes");
// const connectionRoutes = require("./routes/connectionRoutes");
// const bloodRequestRoutes = require("./routes/bloodRequestRoutes");
// const bloodCampRoutes = require("./routes/bloodCampRoutes");
// const campRegistrationRoutes = require("./routes/campRegistrationRoutes");
// const reviewRoutes = require("./routes/reviewRoutes");
// const userRoutes = require("./routes/userRoutes");
// const contactRoutes = require("./routes/contactRoutes");
// const bloodInventoryRoutes = require("./routes/bloodInventoryRoutes");
// const notificationRoutes = require("./routes/notificationRoutes");

// app.use("/api/auth", authRoutes);
// app.use("/api/donation", donationRoutes);
// app.use("/api/donation-history", donationHistoryRoutes);
// app.use("/api/ocr", ocrRoutes);
// app.use("/api/profile", profileRoutes);
// app.use("/api/connections", connectionRoutes);
// app.use("/api/blood-requests", bloodRequestRoutes);
// app.use("/api/blood-camps", bloodCampRoutes);
// app.use("/api/camp-registration", campRegistrationRoutes);
// app.use("/api/reviews", reviewRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/contact", contactRoutes);
// app.use("/api/blood-inventory", bloodInventoryRoutes);
// app.use("/api/notifications", notificationRoutes);

// // Health check endpoint
// app.get("/api/health", (req, res) => {
//   const dbStatus = mongoose.connection.readyState;
//   const statusMap = {
//     0: "disconnected",
//     1: "connected",
//     2: "connecting",
//     3: "disconnecting",
//   };
  
//   res.json({
//     status: "ok",
//     database: statusMap[dbStatus] || "unknown",
//     timestamp: new Date().toISOString(),
//   });
// });

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({ error: "Route not found" });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error("Error:", err.message);
  
//   // Check if headers already sent
//   if (res.headersSent) {
//     return next(err);
//   }
  
//   res.status(err.status || 500).json({
//     error: err.message || "Internal server error",
//     ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
//   });
// });

// // ── Start ─────────────────────────────────────────────────────────────────────
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
  
//   // Start automatic camp status updater
//   const { updateCampStatuses } = require('./utils/campStatusUpdater');
  
//   // Run immediately on startup
//   updateCampStatuses().then(() => {
//     console.log('✓ Initial camp status update completed');
//   });
  
//   // Run every 5 minutes to check for completed camps
//   setInterval(() => {
//     updateCampStatuses();
//   }, 5 * 60 * 1000); // 5 minutes
  
//   console.log('✓ Camp status auto-updater started (runs every 5 minutes)');
// });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require("compression");
require("dotenv").config();

const app = express();

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────

// Enable gzip compression
app.use(compression());

// CORS
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://lifeflow-uj6d.onrender.com"
  ],
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─────────────────────────────────────────────────────────────
// MONGODB CONNECTION
// ─────────────────────────────────────────────────────────────

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