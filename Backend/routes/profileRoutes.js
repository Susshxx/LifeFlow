const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authMiddleware } = require("./authRoutes");

// ── PUT /api/profile ──────────────────────────────────────────────────────────
// Update contact info + avatar photo
router.put("/", authMiddleware, async (req, res) => {
  try {
    const { phone, province, district, municipality, avatar, tempLocation } = req.body;

    const updateFields = {};
    if (phone !== undefined) updateFields.phone = String(phone).trim();
    if (province !== undefined) updateFields.province = String(province).trim();
    if (district !== undefined) updateFields.district = String(district).trim();
    if (municipality !== undefined) updateFields.municipality = String(municipality).trim();

    // Avatar: accept base64 data URL or external URL, strip if oversized
    if (avatar !== undefined) {
      if (!avatar) {
        updateFields.avatar = "";
      } else if (avatar.length <= 2_000_000) {
        updateFields.avatar = avatar;
      } else {
        return res.status(400).json({ error: "Photo is too large. Please use an image under 1.5MB." });
      }
    }

    // tempLocation: { lat, lng, label } — user's pinned location on the map
    if (tempLocation !== undefined) {
      if (!tempLocation) {
        updateFields.tempLocation = null;
      } else if (
        typeof tempLocation === "object" &&
        typeof tempLocation.lat === "number" &&
        typeof tempLocation.lng === "number"
      ) {
        updateFields.tempLocation = {
          lat:   tempLocation.lat,
          lng:   tempLocation.lng,
          label: tempLocation.label ? String(tempLocation.label) : "",
        };
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ error: "User not found." });

    // Return the updated safe user object
    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      bloodGroup: user.bloodGroup || "",
      phone: user.phone || "",
      province: user.province || "",
      district: user.district || "",
      municipality: user.municipality || "",
      dobDay: user.dobDay || "",
      dobMonth: user.dobMonth || "",
      dobYear: user.dobYear || "",
      hospitalName: user.hospitalName || "",
      hospitalRegNumber: user.hospitalRegNumber || "",
      avatar: user.avatar || "",
      isVerified: user.isVerified || false,
      tempLocation: user.tempLocation || null,
    });
  } catch (err) {
    console.error("Profile update error:", err.message);
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)[0]?.message || "Validation failed.";
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: "Failed to update profile." });
  }
});

// ── GET /api/profile ──────────────────────────────────────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      bloodGroup: user.bloodGroup || "",
      phone: user.phone || "",
      province: user.province || "",
      district: user.district || "",
      municipality: user.municipality || "",
      dobDay: user.dobDay || "",
      dobMonth: user.dobMonth || "",
      dobYear: user.dobYear || "",
      hospitalName: user.hospitalName || "",
      hospitalRegNumber: user.hospitalRegNumber || "",
      avatar: user.avatar || "",
      isVerified: user.isVerified || false,
      tempLocation: user.tempLocation || null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch profile." });
  }
});

module.exports = router;