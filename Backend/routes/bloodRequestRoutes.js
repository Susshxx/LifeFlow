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

// ── GET /api/blood-requests/my-notifications — get pending blood request notifications for current user
// IMPORTANT: This must come BEFORE /:id routes to avoid "my-notifications" being treated as an ID
router.get("/my-notifications", auth, async (req, res) => {
  try {
    console.log('[Blood Request Notifications] Checking for user:', req.user.id);
    
    // Find the most recent blood request for this user that is pending (hospital accepted, awaiting donation)
    const request = await BloodRequest.findOne({
      userId: req.user.id,
      status: 'pending', // Only show pending requests (hospital accepted, awaiting donation)
      acceptedBy: { $ne: null },
      isActive: true // Only show active requests
    })
      .populate('acceptedBy', 'name hospitalName')
      .sort({ acceptedAt: -1 })
      .lean();

    console.log('[Blood Request Notifications] Query criteria:', {
      userId: req.user.id,
      status: 'pending',
      acceptedBy: { $ne: null },
      isActive: true
    });

    console.log('[Blood Request Notifications] Found request:', request ? {
      _id: request._id,
      status: request.status,
      isActive: request.isActive,
      acceptedBy: request.acceptedBy,
      bloodGroup: request.bloodGroup
    } : 'null');

    if (!request) {
      console.log('[Blood Request Notifications] No notification to return');
      return res.json({ notification: null });
    }

    const notification = {
      requestId: request._id,
      hospitalName: request.acceptedBy?.hospitalName || request.acceptedBy?.name || 'Hospital',
      bloodGroup: request.bloodGroup,
      status: request.status,
      acceptedAt: request.acceptedAt
    };
    
    console.log('[Blood Request Notifications] Returning notification:', notification);

    return res.json({ notification });
  } catch (err) {
    console.error("Blood request notifications error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/blood-requests/:id/accept — hospital accepts a blood request ────
router.post("/:id/accept", auth, async (req, res) => {
  try {
    // Only hospitals can accept blood requests
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ error: 'Only hospitals can accept blood requests' });
    }

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Blood request not found' });
    }

    if (!request.isActive) {
      return res.status(400).json({ error: 'Blood request is no longer active' });
    }

    if (request.status !== 'open') {
      return res.status(400).json({ error: 'Blood request has already been accepted' });
    }

    // Update request status to pending
    request.status = 'pending';
    request.acceptedBy = req.user.id;
    request.acceptedAt = new Date();
    await request.save();

    return res.json({ 
      success: true, 
      message: 'Blood request accepted successfully',
      request 
    });
  } catch (err) {
    console.error("Blood request accept error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/blood-requests/:id/accept-by-donor — donor confirms they will donate ────
router.post("/:id/accept-by-donor", auth, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Blood request not found' });
    }

    // Only the requester can accept their own request
    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to accept this request' });
    }

    if (!request.isActive) {
      return res.status(400).json({ error: 'Blood request is no longer active' });
    }

    // Keep status as pending (already set by hospital)
    // This just confirms the donor will proceed
    await request.save();

    return res.json({ 
      success: true, 
      message: 'Donor confirmed acceptance',
      request 
    });
  } catch (err) {
    console.error("Blood request donor accept error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/blood-requests/:id/fulfill — mark donation as completed ─────────
router.post("/:id/fulfill", auth, async (req, res) => {
  try {
    console.log('[Fulfill] Request ID:', req.params.id);
    console.log('[Fulfill] User ID:', req.user.id);
    
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      console.log('[Fulfill] Request not found');
      return res.status(404).json({ error: 'Blood request not found' });
    }

    console.log('[Fulfill] Current status:', request.status);
    console.log('[Fulfill] Current isActive:', request.isActive);
    console.log('[Fulfill] Request userId:', request.userId.toString());
    console.log('[Fulfill] Request acceptedBy:', request.acceptedBy?.toString());

    // Only the requester or the hospital that accepted can fulfill
    const isRequester = request.userId.toString() === req.user.id;
    const isAcceptingHospital = request.acceptedBy && request.acceptedBy.toString() === req.user.id;
    
    console.log('[Fulfill] Is requester:', isRequester);
    console.log('[Fulfill] Is accepting hospital:', isAcceptingHospital);
    
    if (!isRequester && !isAcceptingHospital) {
      console.log('[Fulfill] Not authorized');
      return res.status(403).json({ error: 'Not authorized to fulfill this request' });
    }

    // Update request status to fulfilled and deactivate
    request.status = 'fulfilled';
    request.isActive = false;
    const savedRequest = await request.save();

    console.log('[Fulfill] Updated status:', savedRequest.status);
    console.log('[Fulfill] Updated isActive:', savedRequest.isActive);
    
    // Verify the update by querying the database again
    const verifyRequest = await BloodRequest.findById(req.params.id).lean();
    console.log('[Fulfill] Verification from DB:', {
      status: verifyRequest?.status,
      isActive: verifyRequest?.isActive
    });
    console.log('[Fulfill] Request fulfilled successfully');

    return res.json({ 
      success: true, 
      message: 'Blood request fulfilled successfully',
      request: savedRequest
    });
  } catch (err) {
    console.error("Blood request fulfill error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/blood-requests/:id/close — close/cancel a blood request ─────────
router.post("/:id/close", auth, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Blood request not found' });
    }

    // Only the requester can close their own request
    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to close this request' });
    }

    // Update request status to closed and deactivate
    request.status = 'closed';
    request.isActive = false;
    await request.save();

    return res.json({ 
      success: true, 
      message: 'Blood request closed successfully',
      request 
    });
  } catch (err) {
    console.error("Blood request close error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;