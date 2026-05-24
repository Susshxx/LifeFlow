const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// ── POST /api/notifications — Create notification (admin only) ────────────────
router.post('/', auth, async (req, res) => {
  try {
    // Only admins can send notifications
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can send notifications' });
    }

    const { title, message, recipients } = req.body;

    if (!title || !message || !recipients) {
      return res.status(400).json({ error: 'Title, message, and recipients are required' });
    }

    if (!['users', 'hospitals', 'all'].includes(recipients)) {
      return res.status(400).json({ error: 'Recipients must be users, hospitals, or all' });
    }

    const notification = new Notification({
      title,
      message,
      recipients,
      createdBy: req.user.id,
    });

    await notification.save();

    console.log(`✅ Notification created: "${title}" for ${recipients}`);

    res.status(201).json({
      message: 'Notification sent successfully',
      notification,
    });
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ error: 'Failed to create notification', detail: err.message });
  }
});

// ── GET /api/notifications — Get notifications for current user ───────────────
router.get('/', auth, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Build query based on user role
    let query = {};
    
    if (userRole === 'user') {
      query = { recipients: { $in: ['users', 'all'] } };
    } else if (userRole === 'hospital') {
      query = { recipients: { $in: ['hospitals', 'all'] } };
    } else if (userRole === 'admin') {
      // Admins can see all notifications
      query = {};
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('createdBy', 'name email role')
      .lean();

    // Mark which notifications the user has read
    const notificationsWithReadStatus = notifications.map(notif => ({
      ...notif,
      isReadByUser: notif.readBy.some(id => id.toString() === req.user.id),
    }));

    res.json(notificationsWithReadStatus);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications', detail: err.message });
  }
});

// ── GET /api/notifications/unread-count — Get unread count ────────────────────
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    let query = {};
    
    if (userRole === 'user') {
      query = { recipients: { $in: ['users', 'all'] } };
    } else if (userRole === 'hospital') {
      query = { recipients: { $in: ['hospitals', 'all'] } };
    } else if (userRole === 'admin') {
      query = {};
    }

    // Count notifications not read by this user
    query.readBy = { $ne: req.user.id };

    const count = await Notification.countDocuments(query);

    res.json({ count });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ error: 'Failed to get unread count', detail: err.message });
  }
});

// ── PUT /api/notifications/:id/read — Mark notification as read ───────────────
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Add user to readBy array if not already there
    if (!notification.readBy.includes(req.user.id)) {
      notification.readBy.push(req.user.id);
      await notification.save();
    }

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ error: 'Failed to mark as read', detail: err.message });
  }
});

// ── PUT /api/notifications/read-all — Mark all as read ────────────────────────
router.put('/read-all', auth, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    let query = {};
    
    if (userRole === 'user') {
      query = { recipients: { $in: ['users', 'all'] } };
    } else if (userRole === 'hospital') {
      query = { recipients: { $in: ['hospitals', 'all'] } };
    } else if (userRole === 'admin') {
      query = {};
    }

    // Add user to readBy array for all matching notifications
    query.readBy = { $ne: req.user.id };

    await Notification.updateMany(
      query,
      { $addToSet: { readBy: req.user.id } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all as read error:', err);
    res.status(500).json({ error: 'Failed to mark all as read', detail: err.message });
  }
});

// ── DELETE /api/notifications/:id — Delete notification (admin only) ──────────
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete notifications' });
    }

    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: 'Failed to delete notification', detail: err.message });
  }
});

module.exports = router;
