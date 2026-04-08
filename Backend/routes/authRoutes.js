const express  = require("express");
const router   = express.Router();
const jwt      = require("jsonwebtoken");
const https    = require("https");
const crypto   = require("crypto");
const mongoose = require("mongoose");
const User     = require("../models/User");

const SECRET = process.env.JWT_SECRET || "lifeflow_Secret_2026";

// ── MongoDB Connection Check Middleware ──────────────────────────────────────
function checkDBConnection(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    console.error("[DB Check] MongoDB not connected. State:", mongoose.connection.readyState);
    return res.status(503).json({ 
      error: "Database connection unavailable. Please try again in a moment." 
    });
  }
  next();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    SECRET,
    { expiresIn: "30d" }
  );
}

function safeUser(user) {
  return {
    id:                user._id,
    name:              user.name,
    email:             user.email,
    role:              user.role,
    bloodGroup:        user.bloodGroup        || "",
    phone:             user.phone             || "",
    province:          user.province          || "",
    district:          user.district          || "",
    municipality:      user.municipality      || "",
    dobDay:            user.dobDay            || "",
    dobMonth:          user.dobMonth          || "",
    dobYear:           user.dobYear           || "",
    hospitalName:      user.hospitalName      || "",
    hospitalRegNumber: user.hospitalRegNumber || "",
    avatar:            user.avatar            || "",
    documentPhoto:     user.documentPhoto     || "",
    isVerified:        user.isVerified        || false,
    // tempLocation: { lat, lng, label } — used for map pinning
    tempLocation:      user.tempLocation      || null,
  };
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized." });
  try {
    req.user = jwt.verify(header.split(" ")[1], SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}
router.authMiddleware = authMiddleware;

// ── Temp-code store (Google OAuth) ────────────────────────────────────────────
const tempCodes = new Map();

function storeTempCode(token, user) {
  const code      = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes instead of 3
  tempCodes.set(code, { token, user, expiresAt });
  setTimeout(() => tempCodes.delete(code), 10 * 60 * 1000);
  return code;
}

// ── GET /api/auth/google/exchange ─────────────────────────────────────────────
router.get("/google/exchange", (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Missing code." });
  const entry = tempCodes.get(code);
  if (!entry) return res.status(404).json({ error: "Code not found or already used." });
  if (Date.now() > entry.expiresAt) {
    tempCodes.delete(code);
    return res.status(410).json({ error: "Code expired." });
  }
  tempCodes.delete(code);
  return res.json({ token: entry.token, user: entry.user });
});

// ── Google OAuth helpers ──────────────────────────────────────────────────────
function exchangeCodeForTokens(code) {
  return new Promise((resolve, reject) => {
    const CALLBACK_URL =
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:5000/api/auth/google/callback";

    const body = new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri:  CALLBACK_URL,
      grant_type:    "authorization_code",
    }).toString();

    console.log("[Google OAuth] token exchange, redirect_uri:", CALLBACK_URL);

    const options = {
      hostname: "oauth2.googleapis.com",
      path:     "/token",
      method:   "POST",
      headers:  {
        "Content-Type":   "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (googleRes) => {
      let data = "";
      googleRes.on("data", (chunk) => (data += chunk));
      googleRes.on("end", () => {
        console.log("[Google OAuth] token status:", googleRes.statusCode, "body:", data);
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(`${parsed.error}: ${parsed.error_description}`));
          else resolve(parsed);
        } catch (e) {
          reject(new Error("Could not parse token response: " + data));
        }
      });
    });
    req.on("error", (e) => { console.error("[Google OAuth] HTTPS error:", e.message); reject(e); });
    req.write(body);
    req.end();
  });
}

function fetchGoogleProfile(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "www.googleapis.com",
      path:     "/oauth2/v2/userinfo",
      method:   "GET",
      headers:  { Authorization: `Bearer ${accessToken}` },
    };
    const req = https.request(options, (googleRes) => {
      let data = "";
      googleRes.on("data", (chunk) => (data += chunk));
      googleRes.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(`Userinfo error: ${JSON.stringify(parsed.error)}`));
          else resolve(parsed);
        } catch (e) {
          reject(new Error("Could not parse userinfo response: " + data));
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function sendRedirectPage(res, destination, label = "Redirecting…") {
  const safeDest = destination.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>${label}</title></head>
<body>
  <p style="font-family:sans-serif;color:#555;margin:40px auto;text-align:center">${label}</p>
  <script>
    (function(){
      var dest='${safeDest}';
      setTimeout(function(){ window.location.href=dest; },50);
    })();
  </script>
</body></html>`);
}

// ── GET /api/auth/google ──────────────────────────────────────────────────────
router.get("/google", (req, res) => {
  const CALLBACK_URL =
    process.env.GOOGLE_CALLBACK_URL ||
    "http://localhost:5000/api/auth/google/callback";

  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID,
    redirect_uri:  CALLBACK_URL,
    response_type: "code",
    scope:         "openid email profile",
    access_type:   "offline",
    prompt:        "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ── GET /api/auth/google/callback ─────────────────────────────────────────────
router.get("/google/callback", async (req, res) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
  const { code, error, error_description } = req.query;

  console.log("\n[Google OAuth] ========== CALLBACK START ==========");
  console.log("[Google OAuth] hasCode:", !!code);
  console.log("[Google OAuth] error:", error || "none");
  console.log("[Google OAuth] error_description:", error_description || "none");
  console.log("[Google OAuth] MongoDB state:", mongoose.connection.readyState);

  const failPage = sendRedirectPage.bind(null, res,
    `${FRONTEND_URL}/login?error=google_failed`, "Sign-in failed…");

  if (error || !code) { 
    console.error("[Google OAuth] ❌ Error or missing code:", error, error_description); 
    return failPage(); 
  }

  // Check MongoDB connection before proceeding
  if (mongoose.connection.readyState !== 1) {
    console.error("[Google OAuth] ❌ MongoDB not connected. State:", mongoose.connection.readyState);
    return sendRedirectPage(res, 
      `${FRONTEND_URL}/login?error=database_unavailable`, 
      "Database connection unavailable. Please try again…");
  }

  try {
    console.log("[Google OAuth] 📝 Exchanging code for tokens...");
    const tokens  = await exchangeCodeForTokens(code);
    if (!tokens.access_token) {
      console.error("[Google OAuth] ❌ No access_token in response");
      throw new Error("No access_token in response");
    }
    console.log("[Google OAuth] ✓ Got access token");

    console.log("[Google OAuth] 📝 Fetching user profile...");
    const profile = await fetchGoogleProfile(tokens.access_token);
    console.log("[Google OAuth] ✓ Got profile:", { 
      id: profile.id, 
      email: profile.email,
      name: profile.name 
    });
    
    if (!profile.email) {
      console.error("[Google OAuth] ❌ No email in profile");
      throw new Error("Google did not return an email");
    }

    console.log("[Google OAuth] 📝 Looking up user in database...");
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      console.log("[Google OAuth] User not found by googleId, trying email...");
      user = await User.findOne({ email: profile.email.toLowerCase() });
    }

    if (!user) {
      console.log("[Google OAuth] 📝 Creating new user...");
      user = await User.create({
        name:       profile.name    || "",
        email:      profile.email.toLowerCase(),
        googleId:   profile.id,
        avatar:     profile.picture || "",
        isVerified: false,
      });
      console.log("[Google OAuth] ✓ New user created:", user._id, "- needs verification");
    } else if (!user.googleId) {
      console.log("[Google OAuth] 📝 Linking existing user to Google...");
      user.googleId = profile.id;
      if (!user.avatar && profile.picture) user.avatar = profile.picture;
      await user.save();
      console.log("[Google OAuth] ✓ Existing user linked to Google:", user._id);
    } else {
      console.log("[Google OAuth] ✓ Returning user:", user._id, "verified:", user.isVerified);
    }

    console.log("[Google OAuth] 📝 Generating JWT token...");
    const token    = signToken(user);
    const userData = safeUser(user);
    const tempCode = storeTempCode(token, userData);
    console.log("[Google OAuth] ✓ Generated temp code:", tempCode.substring(0, 8) + "...");

    console.log("[Google OAuth] ✓ Redirecting to frontend with code");
    console.log("[Google OAuth] ========== CALLBACK END ==========\n");
    
    return sendRedirectPage(res,
      `${FRONTEND_URL}/auth/google/callback?code=${tempCode}`,
      "Signing in…");

  } catch (err) {
    console.error("[Google OAuth] ========== ERROR ==========");
    console.error("[Google OAuth] ❌ Error type:", err.name);
    console.error("[Google OAuth] ❌ Error message:", err.message);
    console.error("[Google OAuth] ❌ Stack:", err.stack);
    
    // Check if it's a MongoDB error
    if (err.name === "MongooseError" || err.name === "MongoError" || err.message.includes("buffering timed out")) {
      console.error("[Google OAuth] ❌ Database error detected");
      return sendRedirectPage(res, 
        `${FRONTEND_URL}/login?error=database_error`, 
        "Database error. Please try again…");
    }
    
    console.error("[Google OAuth] ========== ERROR END ==========\n");
    return sendRedirectPage(res, `${FRONTEND_URL}/login?error=google_failed`, "Sign-in failed…");
  }
});

// ── DEBUG ─────────────────────────────────────────────────────────────────────
router.get("/debug", (req, res) => {
  res.json({
    GOOGLE_CLIENT_ID:     (process.env.GOOGLE_CLIENT_ID || "NOT SET").slice(0, 25) + "...",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "****" + process.env.GOOGLE_CLIENT_SECRET.slice(-4) : "NOT SET",
    GOOGLE_CALLBACK_URL:  process.env.GOOGLE_CALLBACK_URL || "NOT SET",
    FRONTEND_URL:         process.env.FRONTEND_URL        || "NOT SET",
  });
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post("/register", checkDBConnection, async (req, res) => {
  try {
    const {
      name, email, password, role = "user",
      bloodGroup, phone, province, district, municipality,
      dobDay, dobMonth, dobYear,
      hospitalName, hospitalRegNumber,
      documentPhoto,
      // tempLocation: { lat, lng, label }
      tempLocation,
    } = req.body;

    if (!name || !String(name).trim())
      return res.status(400).json({ error: "Name is required." });
    if (!email || !String(email).trim())
      return res.status(400).json({ error: "Email is required." });
    if (!password)
      return res.status(400).json({ error: "Password is required." });
    if (String(password).length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters." });

    const normalizedEmail = String(email).toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists)
      return res.status(409).json({ error: "An account with this email already exists." });

    // Duplicate document check
    if (role === "hospital" && hospitalRegNumber) {
      const dup = await User.findOne({ hospitalRegNumber: String(hospitalRegNumber).trim(), role: "hospital" });
      if (dup)
        return res.status(409).json({ error: "A hospital with this registration number already exists." });
    }
    if (role === "user" && dobDay && dobMonth && dobYear && phone) {
      const dup = await User.findOne({
        name:     { $regex: new RegExp(`^${String(name).trim()}$`, "i") },
        phone:    String(phone).trim(),
        dobDay:   String(dobDay),
        dobMonth: String(dobMonth),
        dobYear:  String(dobYear),
        role:     "user",
      });
      if (dup)
        return res.status(409).json({ error: "An account with this name and date of birth already exists. Please sign in instead." });
    }

    let safePhoto = "";
    if (documentPhoto && typeof documentPhoto === "string")
      safePhoto = documentPhoto.length <= 2_000_000 ? documentPhoto : "";

    // Validate tempLocation shape
    let safeTempLocation = null;
    if (tempLocation && typeof tempLocation === "object") {
      const { lat, lng, label } = tempLocation;
      if (typeof lat === "number" && typeof lng === "number") {
        safeTempLocation = { lat, lng, label: label ? String(label) : "" };
      }
    }

    const user = new User({
      name:              String(name).trim(),
      email:             normalizedEmail,
      password:          String(password),
      role:              ["user", "hospital"].includes(role) ? role : "user",
      bloodGroup:        bloodGroup        ? String(bloodGroup)        : "",
      phone:             phone             ? String(phone)             : "",
      province:          province          ? String(province)          : "",
      district:          district          ? String(district)          : "",
      municipality:      municipality      ? String(municipality)      : "",
      dobDay:            dobDay            ? String(dobDay)            : "",
      dobMonth:          dobMonth          ? String(dobMonth)          : "",
      dobYear:           dobYear           ? String(dobYear)           : "",
      hospitalName:      hospitalName      ? String(hospitalName)      : "",
      hospitalRegNumber: hospitalRegNumber ? String(hospitalRegNumber) : "",
      documentPhoto:     safePhoto,
      // Use the document photo as avatar if no other avatar is set
      avatar:            safePhoto ? safePhoto : "",
      isVerified:        true,
      tempLocation:      safeTempLocation,
    });

    await user.save();
    const token = signToken(user);
    return res.status(201).json({ token, user: safeUser(user) });

  } catch (err) {
    console.error("Register error:", err.message);
    if (err.code === 11000)
      return res.status(409).json({ error: "An account with this email already exists." });
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)[0]?.message || "Validation failed.";
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: "Registration failed.", detail: err.message });
  }
});

// ── POST /api/auth/register-google ───────────────────────────────────────────
router.post("/register-google", checkDBConnection, async (req, res) => {
  try {
    const {
      googleId, name, email, avatar,
      bloodGroup, phone, province, district, municipality,
      dobDay, dobMonth, dobYear, documentPhoto,
      tempLocation,
    } = req.body;

    if (!email)                        return res.status(400).json({ error: "Email is required." });
    if (!phone)                        return res.status(400).json({ error: "Phone number is required." });
    if (!bloodGroup)                   return res.status(400).json({ error: "Blood group is required." });
    if (!province || !district || !municipality)
      return res.status(400).json({ error: "Province, district, and municipality are required." });

    const safePhoto =
      documentPhoto && typeof documentPhoto === "string" && documentPhoto.length <= 2_000_000
        ? documentPhoto : "";

    let safeTempLocation = null;
    if (tempLocation && typeof tempLocation === "object") {
      const { lat, lng, label } = tempLocation;
      if (typeof lat === "number" && typeof lng === "number")
        safeTempLocation = { lat, lng, label: label ? String(label) : "" };
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    // Duplicate check
    if (dobDay && dobMonth && dobYear && phone) {
      const dup = await User.findOne({
        name:     { $regex: new RegExp(`^${String(name).trim()}$`, "i") },
        phone:    String(phone).trim(),
        dobDay:   String(dobDay),
        dobMonth: String(dobMonth),
        dobYear:  String(dobYear),
        role:     "user",
        ...(user ? { _id: { $ne: user._id } } : {}),
      });
      if (dup)
        return res.status(409).json({ error: "An account with this name and date of birth already exists. Please sign in with your original account instead." });
    }

    if (user) {
      user.bloodGroup   = bloodGroup;
      user.phone        = phone;
      user.province     = province;
      user.district     = district;
      user.municipality = municipality;
      user.dobDay       = dobDay   || user.dobDay;
      user.dobMonth     = dobMonth || user.dobMonth;
      user.dobYear      = dobYear  || user.dobYear;
      user.isVerified   = true;
      // Document photo becomes avatar if no avatar yet
      if (safePhoto) {
        user.documentPhoto = safePhoto;
        if (!user.avatar) user.avatar = safePhoto;
      }
      if (googleId && !user.googleId) user.googleId = googleId;
      if (safeTempLocation) user.tempLocation = safeTempLocation;
      await user.save();
    } else {
      user = await User.create({
        name, email: email.toLowerCase().trim(),
        googleId,
        // Google profile picture as initial avatar, overridden by document photo if present
        avatar: safePhoto || avatar || "",
        bloodGroup, phone, province, district, municipality,
        dobDay: dobDay || "", dobMonth: dobMonth || "", dobYear: dobYear || "",
        documentPhoto: safePhoto,
        isVerified:    true,
        tempLocation:  safeTempLocation,
      });
    }

    const token = signToken(user);
    return res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    console.error("Google register error:", err.message);
    return res.status(500).json({ error: "Registration failed.", detail: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", checkDBConnection, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required." });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: "Invalid email or password." });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: "Invalid email or password." });
    const token = signToken(user);
    return res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Login failed." });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json(safeUser(user));
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch user." });
  }
});

// ── POST /api/auth/onboarding ─────────────────────────────────────────────────
router.post("/onboarding", authMiddleware, async (req, res) => {
  try {
    const { bloodGroup, phone, province, district, municipality, tempLocation } = req.body;
    const updates = { bloodGroup, phone, province, district, municipality };
    if (tempLocation && typeof tempLocation.lat === "number")
      updates.tempLocation = tempLocation;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    return res.json(safeUser(user));
  } catch (err) {
    return res.status(500).json({ error: "Update failed." });
  }
});

// ── GET /api/auth/users/map ───────────────────────────────────────────────────
// Returns all verified users + hospitals that have a tempLocation set,
// for rendering on the search map. Excludes sensitive fields.
router.get("/users/map", authMiddleware, async (req, res) => {
  try {
    const users = await User.find(
      { isVerified: true, "tempLocation.lat": { $exists: true } },
      {
        _id: 1, name: 1, role: 1, bloodGroup: 1,
        avatar: 1, tempLocation: 1, isVerified: 1,
        hospitalName: 1, municipality: 1, district: 1,
      }
    )
    .lean()
    .limit(500);
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch map users." });
  }
});

module.exports = router;