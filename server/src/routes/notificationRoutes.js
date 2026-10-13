const express = require('express');
const router = express.Router();
const { db } = require('../db/db');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications (FR-036: Event notification list)
router.get('/', authenticate, (req, res) => {
  const placeholders = req.user.roles.map(() => '?').join(',');
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE recipient_id = ? OR (recipient_id IS NULL AND recipient_role IN (${placeholders}))
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.user.id, ...req.user.roles);

  res.json(notifications);
});

// PUT /api/notifications/:id/read (Mark as read)
router.put('/:id/read', authenticate, (req, res) => {
  const roles = req.user.roles.map(()=>'?').join(',');
  const result = db.prepare(`UPDATE notifications SET read_status=1 WHERE id=? AND (recipient_id=? OR (recipient_id IS NULL AND recipient_role IN (${roles})))`).run(req.params.id,req.user.id,...req.user.roles);
  if (!result.changes) return res.status(404).json({error:'Notification not found'});
  res.json({ success: true });
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticate, (req, res) => {
  const placeholders = req.user.roles.map(() => '?').join(',');
  db.prepare(`
    UPDATE notifications
    SET read_status = 1
    WHERE recipient_id = ? OR (recipient_id IS NULL AND recipient_role IN (${placeholders}))
  `).run(req.user.id, ...req.user.roles);
  res.json({ success: true });
});

module.exports = router;
