const express = require('express');
const router = express.Router();
const { db } = require('../db/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/audit (alias for audit trail, accessible to admin and academic office)
router.get('/', authenticate, requireRole(['Academic Office', 'System Administrator']), (req, res) => {
  const events = db.prepare(`
    SELECT ae.*, u.name as actor_name, u.email as actor_email
    FROM audit_events ae
    LEFT JOIN users u ON ae.actor_id = u.id
    ORDER BY ae.timestamp DESC
    LIMIT 100
  `).all();
  res.json(events);
});

// GET /api/audit/trail (FR-046, FR-048: View system audit trail)
router.get('/trail', authenticate, requireRole(['Academic Office', 'System Administrator']), (req, res) => {
  const { action, object_type, limit = 100 } = req.query;

  let query = `
    SELECT ae.*, u.name as actor_name, u.email as actor_email
    FROM audit_events ae
    LEFT JOIN users u ON ae.actor_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (action) {
    query += ' AND ae.action = ?';
    params.push(action);
  }

  if (object_type) {
    query += ' AND ae.object_type = ?';
    params.push(object_type);
  }

  query += ' ORDER BY ae.timestamp DESC LIMIT ?';
  params.push(Number(limit));

  const events = db.prepare(query).all(...params);
  res.json(events);
});

module.exports = router;
