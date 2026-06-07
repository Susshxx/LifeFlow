const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Review = require("../models/Review");

const SECRET = process.env.JWT_SECRET || "lifeflow_Secret_2026";

// Authentication middleware - required for POST
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required." });
  }
  try {
    req.user = jwt.verify(header.split(" ")[1], SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

// ── GET /api/reviews/five-star  — public, 5-star reviews only ────────────
router.get("/five-star", async (_req, res) => {
  try {
    const reviews = await Review.find({ approved: true, rating: 5 })
      .sort({ createdAt: -1 })
      .limit(20);
    return res.json(reviews);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch five-star reviews." });
  }
});

// ── GET /api/reviews/four-star  — public, 4-star reviews only ────────────
router.get("/four-star", async (_req, res) => {
  try {
    const reviews = await Review.find({ approved: true, rating: 4 })
      .sort({ createdAt: -1 })
      .limit(20);
    return res.json(reviews);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch four-star reviews." });
  }
});

// ── GET /api/reviews/featured  — public, featured reviews for homepage ──
router.get("/featured", async (_req, res) => {
  try {
    const reviews = await Review.find({ approved: true, featured: true })
      .sort({ createdAt: -1 });
    return res.json(reviews);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch featured reviews." });
  }
});

// ── PATCH /api/reviews/:id/feature  — admin feature/unfeature review ────
router.patch("/:id/feature", requireAuth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can feature reviews." });
    }

    const { featured } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found." });
    }

    review.featured = featured;
    await review.save();

    return res.json(review);
  } catch (err) {
    console.error("Review feature error:", err);
    return res.status(500).json({ error: "Failed to update review." });
  }
});

// ── GET /api/reviews/my-review  — get current user's review ──────────────
// IMPORTANT: This must come BEFORE /:id route to avoid being matched as an id
router.get("/my-review", requireAuth, async (req, res) => {
  try {
    const review = await Review.findOne({ userId: req.user.id });
    return res.json(review);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch your review." });
  }
});

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

// ── POST /api/reviews  — requires authentication ─────────────────────────
router.post("/", requireAuth, async (req, res) => {
  try {
    const { rating, content, location, role } = req.body;

    if (!rating || !content || content.trim().length < 5) {
      return res.status(400).json({ error: "Rating and a non-empty review are required." });
    }
    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    // Check if user already has a review
    const existingReview = await Review.findOne({ userId: req.user.id });
    if (existingReview) {
      return res.status(400).json({ error: "You have already submitted a review. Please update or delete it first." });
    }

    const review = await Review.create({
      userName: req.user.name,
      userId: req.user.id,
      role: role || "donor", // Use the role from request body (donor/recipient), default to donor
      bloodGroup: req.user.bloodGroup || req.body.bloodGroup || "",
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

// ── PUT /api/reviews/:id  — update own review ─────────────────────────────
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { rating, content, location, role } = req.body;

    if (!rating || !content || content.trim().length < 5) {
      return res.status(400).json({ error: "Rating and a non-empty review are required." });
    }
    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    const review = await Review.findOne({ _id: req.params.id, userId: req.user.id });
    if (!review) {
      return res.status(404).json({ error: "Review not found or you don't have permission to edit it." });
    }

    review.rating = Number(rating);
    review.content = content.trim();
    review.location = location || review.location;
    review.role = role || review.role; // Update role if provided
    await review.save();

    return res.json(review);
  } catch (err) {
    console.error("Review update error:", err);
    return res.status(500).json({ error: "Failed to update review." });
  }
});

// ── DELETE /api/reviews/:id  — delete own review ──────────────────────────
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, userId: req.user.id });
    if (!review) {
      return res.status(404).json({ error: "Review not found or you don't have permission to delete it." });
    }

    await Review.deleteOne({ _id: req.params.id });
    return res.json({ message: "Review deleted successfully." });
  } catch (err) {
    console.error("Review delete error:", err);
    return res.status(500).json({ error: "Failed to delete review." });
  }
});

module.exports = router;
