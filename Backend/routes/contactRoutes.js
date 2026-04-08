const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const ContactMessage = require("../models/ContactMessage");

const SECRET = process.env.JWT_SECRET || "lifeflow_Secret_2026";

// Auth middleware
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

// Admin-only middleware
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// POST /api/contact - Submit a contact message (public)
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    if (!firstName || !email || !message) {
      return res.status(400).json({ error: "First name, email, and message are required" });
    }

    const contactMessage = await ContactMessage.create({
      firstName: String(firstName).trim(),
      lastName: lastName ? String(lastName).trim() : "",
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : "",
      message: String(message).trim(),
    });

    return res.status(201).json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.error("Contact message error:", err);
    return res.status(500).json({ error: "Failed to send message" });
  }
});

// GET /api/contact - Get all contact messages (admin only)
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    return res.json(messages);
  } catch (err) {
    console.error("Fetch contact messages error:", err);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// PATCH /api/contact/:id/read - Mark message as read (admin only)
router.patch("/:id/read", auth, adminOnly, async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!message) return res.status(404).json({ error: "Message not found" });
    return res.json(message);
  } catch (err) {
    console.error("Mark as read error:", err);
    return res.status(500).json({ error: "Failed to update message" });
  }
});

// DELETE /api/contact/:id - Delete a message (admin only)
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("Delete message error:", err);
    return res.status(500).json({ error: "Failed to delete message" });
  }
});

module.exports = router;
