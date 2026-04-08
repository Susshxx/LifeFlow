const express      = require("express");
const router       = express.Router();
const jwt          = require("jsonwebtoken");
const BloodRequest = require("../models/BloodRequest");

const SECRET = process.env.JWT_SECRET || "lifeflow_Secret_2026";

// ── Auth middleware ───────────────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(header.split(" ")[1], SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Optional auth — attaches req.user if a valid token is present, but never rejects
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header) {
    try { req.user = jwt.verify(header.split(" ")[1], SECRET); } catch {}
  }
  next();
}

// ── POST /api/blood-requests — create a request ───────────────────────────────
router.post("/", auth, async (req, res) => {
  try {
    const { name, phone, email, bloodGroup, isEmergency, location } = req.body;

    if (!name || !phone || !email || !bloodGroup || !location?.lat)
      return res.status(400).json({ error: "Missing required fields" });

    const VALID_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    if (!VALID_GROUPS.includes(bloodGroup))
      return res.status(400).json({ error: "Invalid blood group" });

    // Deactivate any previous active request by this user
    await BloodRequest.updateMany(
      { userId: req.user.id, isActive: true },
      { isActive: false }
    );

    const doc = await BloodRequest.create({
      userId:      req.user.id,
      name:        String(name).trim(),
      phone:       String(phone).trim(),
      email:       String(email).trim(),
      bloodGroup,
      isEmergency: !!isEmergency,
      location: {
        lat:   Number(location.lat),
        lng:   Number(location.lng),
        label: location.label ? String(location.label) : "",
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 h
    });

    return res.json({ success: true, request: doc });
  } catch (err) {
    console.error("Blood request create error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/blood-requests — all active requests (visible to all logged-in users)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const requests = await BloodRequest
      .find({ isActive: true })
      .populate("userId", "avatar name")
      .select('-__v')
      .lean()
      .sort({ isEmergency: -1, createdAt: -1 })
      .limit(100);
    return res.json(requests);
  } catch (err) {
    console.error("Blood request list error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ── DELETE /api/blood-requests/mine — cancel user's own active request ────────
router.delete("/mine", auth, async (req, res) => {
  try {
    await BloodRequest.updateMany(
      { userId: req.user.id, isActive: true },
      { isActive: false }
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("Blood request cancel error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;