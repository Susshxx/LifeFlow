const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Review = require("../models/Review");

const SECRET = process.env.JWT_SECRET || "lifeflow_Secret_2026";

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try { req.user = jwt.verify(header.split(" ")[1], SECRET); } catch (_) {}
  }
  next();
}

// ── GET /api/reviews  — public, newest first ──────────────────────────────
router.get("/", async (_req, res) => {
  try {
    const reviews = await Review.find({ approved: true })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(reviews);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch reviews." });
  }
});

// ── POST /api/reviews  — anyone can post (auth optional for enrichment) ───
router.post("/", optionalAuth, async (req, res) => {
  try {
    const { rating, content, location } = req.body;

    if (!rating || !content || content.trim().length < 5) {
      return res.status(400).json({ error: "Rating and a non-empty review are required." });
    }
    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    const review = await Review.create({
      userName: req.user?.name || req.body.userName || "Anonymous",
      userId: req.user?.id || null,
      role: req.user?.role || "user",
      bloodGroup: req.user?.bloodGroup || req.body.bloodGroup || "",
      rating: Number(rating),
      content: content.trim(),
      location: location || "",
    });

    return res.status(201).json(review);
  } catch (err) {
    console.error("Review create error:", err);
    return res.status(500).json({ error: "Failed to save review." });
  }
});

module.exports = router;
