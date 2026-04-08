const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");

// ── Schemas ───────────────────────────────────────────────────────────────────

const connectionSchema = new mongoose.Schema({
  from:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  to:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
}, { timestamps: true });
connectionSchema.index({ from: 1, to: 1 }, { unique: true });
const Connection = mongoose.models.Connection || mongoose.model("Connection", connectionSchema);

const messageSchema = new mongoose.Schema({
  connectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Connection", required: true },
  sender:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type:         { type: String, enum: ["text", "file", "image", "audio"], default: "text" },
  content:      { type: String, default: "" },
  fileName:     { type: String, default: "" },
  fileSize:     { type: Number, default: 0  },
  duration:     { type: Number, default: 0  },
  readBy:       [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // ✅ Soft-delete: stores IDs of users who deleted this message for themselves.
  // The message stays in the DB; it is simply hidden from users in this array.
  deletedBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });
const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

// ── Hate Speech Detection ─────────────────────────────────────────────────────
const HATE_SPEECH_PATTERNS = [
  // General profanity
  /\b(fuck|shit|bitch|asshole|bastard|damn|hell|crap|piss|dick|cock|pussy|slut|whore|motherfucker|douche|prick|twat)\b/gi,
  // Intelligence insults
  /\b(idiot|stupid|dumb|moron|retard|imbecile|fool|clown|loser|airhead|nitwit|blockhead|dimwit|halfwit)\b/gi,
  // Aggressive insults
  /\b(jerk|scumbag|piece of shit|trash|garbage|filth|vermin|pig|dog|rat|snake|weasel)\b/gi,
  // Bullying / harassment
  /\b(shut up|go away|get lost|nobody likes you|you suck|hate you|kill yourself|kys|drop dead)\b/gi,
  // Derogatory personality terms
  /\b(arrogant|pathetic|worthless|useless|disgusting|annoying|obnoxious|creep|pervert|psycho|freak)\b/gi,
  // Toxic gamer/internet slang
  /\b(noob|trash player|ez|get rekt|owned|skill issue|cry more)\b/gi,
  // Mild slurs / harmful language
  /\b(simp|incel|beta|alpha loser|snowflake|keyboard warrior)\b/gi,
  // Body shaming
  /\b(fatass|lard|skinny bitch|ugly|hideous|disfigured)\b/gi,
  // Gender-based insults
  /\b(bitchy|nagging|gold digger|manchild|drama queen)\b/gi,
  // Violence / threats
  /\b(i will kill you|i'll kill you|die bitch|burn in hell|go die)\b/gi,
];

function containsHateSpeech(text) {
  if (!text || typeof text !== 'string') return false;
  
  // Trim and normalize the text
  const normalizedText = text.trim().toLowerCase();
  
  // Check each pattern
  const detected = HATE_SPEECH_PATTERNS.some(pattern => {
    const match = pattern.test(text);
    if (match) {
      console.log(`[HATE SPEECH DETECTED] Pattern matched: ${pattern}, Text: "${text.substring(0, 50)}..."`);
    }
    return match;
  });
  
  return detected;
}

// ── Auth middleware ───────────────────────────────────────────────────────────
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "lifeflow_Secret_2026";

function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized." });
  try { req.user = jwt.verify(h.split(" ")[1], SECRET); next(); }
  catch { return res.status(401).json({ error: "Invalid or expired token." }); }
}

// ── POST /api/connections/request ─────────────────────────────────────────────
router.post("/request", auth, async (req, res) => {
  try {
    const { toUserId } = req.body;
    if (!toUserId) return res.status(400).json({ error: "toUserId is required." });
    if (toUserId === req.user.id) return res.status(400).json({ error: "Cannot connect with yourself." });

    const existing = await Connection.findOne({
      $or: [
        { from: req.user.id, to: toUserId },
        { from: toUserId, to: req.user.id },
      ],
    });

    if (existing) {
      if (existing.status === "accepted")
        return res.status(409).json({ error: "Already connected." });
      if (existing.status === "pending")
        return res.status(409).json({ error: "Connection request already sent." });
      if (existing.status === "declined") {
        existing.status = "pending";
        existing.from   = req.user.id;
        existing.to     = toUserId;
        await existing.save();
        return res.status(201).json({ message: "Connection request sent.", connection: existing });
      }
    }

    const conn = await Connection.create({ from: req.user.id, to: toUserId });
    return res.status(201).json({ message: "Connection request sent.", connection: conn });
  } catch (err) {
    console.error("Connection request error:", err.message);
    return res.status(500).json({ error: "Failed to send request.", detail: err.message });
  }
});

// ── GET /api/connections/requests ─────────────────────────────────────────────
router.get("/requests", auth, async (req, res) => {
  try {
    const requests = await Connection.find({ to: req.user.id, status: "pending" })
      .populate("from", "name avatar bloodGroup phone role")
      .sort({ createdAt: -1 });
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch requests." });
  }
});

// ── GET /api/connections/unread/count ─────────────────────────────────────────
// NOTE: Must be defined BEFORE /:connectionId routes to avoid Express treating
// "unread" as a connectionId param.
router.get("/unread/count", auth, async (req, res) => {
  try {
    const userConns = await Connection.find({
      $or: [{ from: req.user.id }, { to: req.user.id }],
      status: "accepted",
    }).select("_id");

    const connIds = userConns.map(c => c._id);

    const [pendingRequests, unreadMessages] = await Promise.all([
      Connection.countDocuments({ to: req.user.id, status: "pending" }),
      Message.countDocuments({
        connectionId: { $in: connIds },
        sender:    { $ne: req.user.id },
        readBy:    { $ne: req.user.id },
        deletedBy: { $ne: req.user.id }, // ✅ don't count soft-deleted messages
      }),
    ]);

    // ✅ Count unique users (connections) with unread messages instead of total message count
    const conversationsWithUnread = await Message.aggregate([
      {
        $match: {
          connectionId: { $in: connIds },
          sender:    { $ne: new mongoose.Types.ObjectId(req.user.id) },
          readBy:    { $ne: new mongoose.Types.ObjectId(req.user.id) },
          deletedBy: { $ne: new mongoose.Types.ObjectId(req.user.id) },
        }
      },
      {
        $group: {
          _id: "$connectionId"
        }
      },
      {
        $count: "uniqueConversations"
      }
    ]);

    const usersWithUnreadMessages = conversationsWithUnread.length > 0 
      ? conversationsWithUnread[0].uniqueConversations 
      : 0;

    return res.json({ 
      pendingRequests, 
      unreadMessages,           // total message count (for inside chatbot)
      usersWithUnreadMessages,  // unique users with unread (for icon badge)
      total: pendingRequests + usersWithUnreadMessages  // icon shows users, not messages
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch counts." });
  }
});

// ── POST /api/connections/respond ─────────────────────────────────────────────
router.post("/respond", auth, async (req, res) => {
  try {
    const { connectionId, action } = req.body;
    if (!["accepted", "declined"].includes(action))
      return res.status(400).json({ error: "action must be 'accepted' or 'declined'." });

    const conn = await Connection.findOne({ _id: connectionId, to: req.user.id, status: "pending" });
    if (!conn) return res.status(404).json({ error: "Request not found." });

    conn.status = action;
    await conn.save();
    return res.json({ message: `Connection ${action}.`, connection: conn });
  } catch (err) {
    return res.status(500).json({ error: "Failed to respond.", detail: err.message });
  }
});

// ── GET /api/connections ──────────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const conns = await Connection.find({
      $or: [{ from: req.user.id }, { to: req.user.id }],
      status: "accepted",
    })
      .populate("from", "name avatar bloodGroup phone role municipality")
      .populate("to",   "name avatar bloodGroup phone role municipality")
      .sort({ updatedAt: -1 });
    return res.json(conns);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch connections." });
  }
});

// ── GET /api/connections/status/:userId ───────────────────────────────────────
router.get("/status/:userId", auth, async (req, res) => {
  try {
    const conn = await Connection.findOne({
      $or: [
        { from: req.user.id, to: req.params.userId },
        { from: req.params.userId, to: req.user.id },
      ],
    });
    return res.json({
      status:       conn?.status           || "none",
      connectionId: conn?._id              || null,
      initiator:    conn?.from?.toString() || null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to check status." });
  }
});

// ── GET /api/connections/:connectionId/messages ───────────────────────────────
// Returns messages visible to the requesting user (excludes soft-deleted ones).
// Query param: ?markAsRead=false to skip marking messages as read (for preview/background fetching)
router.get("/:connectionId/messages", auth, async (req, res) => {
  try {
    const conn = await Connection.findOne({
      _id: req.params.connectionId,
      $or: [{ from: req.user.id }, { to: req.user.id }],
      status: "accepted",
    });
    if (!conn) return res.status(403).json({ error: "Not authorised to view these messages." });

    // ✅ Exclude messages this user has soft-deleted
    const msgs = await Message.find({
      connectionId: req.params.connectionId,
      deletedBy:    { $ne: req.user.id },
    })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 })
      .limit(200);

    // Mark unread messages as read (unless markAsRead=false is passed)
    const shouldMarkAsRead = req.query.markAsRead !== 'false';
    if (shouldMarkAsRead) {
      await Message.updateMany(
        {
          connectionId: req.params.connectionId,
          sender:    { $ne: req.user.id },
          readBy:    { $ne: req.user.id },
          deletedBy: { $ne: req.user.id },
        },
        { $addToSet: { readBy: req.user.id } }
      );
    }

    return res.json(msgs);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch messages." });
  }
});

// ── POST /api/connections/:connectionId/messages ──────────────────────────────
router.post("/:connectionId/messages", auth, async (req, res) => {
  try {
    const conn = await Connection.findOne({
      _id: req.params.connectionId,
      $or: [{ from: req.user.id }, { to: req.user.id }],
      status: "accepted",
    });
    if (!conn) return res.status(403).json({ error: "Not connected." });

    const { type = "text", content, fileName, fileSize, duration } = req.body;
    if (!content && type === "text") return res.status(400).json({ error: "Content is required." });

    // ✅ Check for hate speech in text messages - MUST BLOCK BEFORE SAVING
    if (type === "text" && containsHateSpeech(content)) {
      console.log(`[MESSAGE BLOCKED] Hate speech detected from user ${req.user.id}: "${content}"`);
      // DO NOT create the message - just return error immediately
      return res.status(400).json({ 
        error: "Message blocked", 
        message: "Your message contains inappropriate language. Please be respectful.",
        blocked: true  // Add explicit flag
      });
    }

    console.log(`[MESSAGE SENT] User ${req.user.id} sent message: "${content.substring(0, 30)}..."`);

    const msg = await Message.create({
      connectionId: conn._id,
      sender:       req.user.id,
      type, content, fileName, fileSize, duration,
      readBy:    [req.user.id],
      deletedBy: [],
    });

    const populated = await msg.populate("sender", "name avatar");
    return res.status(201).json(populated);
  } catch (err) {
    console.error(`[MESSAGE ERROR] ${err.message}`);
    return res.status(500).json({ error: "Failed to send message.", detail: err.message });
  }
});

// ── DELETE /api/connections/:connectionId/messages/:messageId ─────────────────
// ✅ Soft-delete: adds the requesting user's ID to the message's deletedBy array.
// The message stays in the database and remains visible to the other participant.
router.delete("/:connectionId/messages/:messageId", auth, async (req, res) => {
  try {
    const conn = await Connection.findOne({
      _id: req.params.connectionId,
      $or: [{ from: req.user.id }, { to: req.user.id }],
      status: "accepted",
    });
    if (!conn) return res.status(403).json({ error: "Not authorised." });

    const msg = await Message.findOne({
      _id:          req.params.messageId,
      connectionId: req.params.connectionId,
    });
    if (!msg) return res.status(404).json({ error: "Message not found." });

    // Idempotent: adding same ID twice has no effect
    await Message.updateOne(
      { _id: msg._id },
      { $addToSet: { deletedBy: req.user.id } }
    );

    return res.json({ success: true, message: "Message deleted for you." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete message.", detail: err.message });
  }
});

// ── DELETE /api/connections/:connectionId/messages/clear ──────────────────────
// ✅ Soft-delete all messages in a conversation for the requesting user.
// Messages stay in the database and remain visible to the other participant.
router.delete("/:connectionId/messages/clear", auth, async (req, res) => {
  try {
    const conn = await Connection.findOne({
      _id: req.params.connectionId,
      $or: [{ from: req.user.id }, { to: req.user.id }],
      status: "accepted",
    });
    if (!conn) return res.status(403).json({ error: "Not authorised." });

    // Add user ID to deletedBy array for all messages in this conversation
    await Message.updateMany(
      { connectionId: req.params.connectionId },
      { $addToSet: { deletedBy: req.user.id } }
    );

    return res.json({ success: true, message: "Conversation cleared for you." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to clear conversation.", detail: err.message });
  }
});

// ── GET /api/connections/:connectionId/preview ────────────────────────────────
// ✅ Returns the latest message and unread count for a conversation.
// Used by the conversation list to show previews without fetching all messages.
router.get("/:connectionId/preview", auth, async (req, res) => {
  try {
    const conn = await Connection.findOne({
      _id: req.params.connectionId,
      $or: [{ from: req.user.id }, { to: req.user.id }],
      status: "accepted",
    });
    if (!conn) return res.status(403).json({ error: "Not authorised." });

    const [latest, unreadCount] = await Promise.all([
      Message.findOne({
        connectionId: req.params.connectionId,
        deletedBy:    { $ne: req.user.id },
      })
        .sort({ createdAt: -1 })
        .populate("sender", "name"),

      Message.countDocuments({
        connectionId: req.params.connectionId,
        sender:    { $ne: req.user.id },
        readBy:    { $ne: req.user.id },
        deletedBy: { $ne: req.user.id },
      }),
    ]);

    return res.json({ latest, unreadCount });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch preview." });
  }
});

module.exports = router;