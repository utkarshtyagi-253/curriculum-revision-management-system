const express = require('express');
const router = express.Router();
const { db } = require('../db/db');
const { authenticate, requireRole } = require('../middleware/auth');
const ProposalService = require('../services/proposalService');

// GET /api/milestones/:proposalId (shorthand for frontend)
router.get('/:proposalId', authenticate, (req, res) => {
  const milestones = db.prepare(`
    SELECT im.*, u.name as updated_by_name
    FROM implementation_milestones im
    LEFT JOIN users u ON im.updated_by = u.id
    WHERE im.proposal_id = ?
    ORDER BY im.target_date ASC
  `).all(req.params.proposalId);
  res.json(milestones);
});

// GET /api/milestones/proposal/:proposalId
router.get('/proposal/:proposalId', authenticate, (req, res) => {
  const milestones = db.prepare(`
    SELECT im.*, u.name as updated_by_name
    FROM implementation_milestones im
    LEFT JOIN users u ON im.updated_by = u.id
    WHERE im.proposal_id = ?
    ORDER BY im.target_date ASC
  `).all(req.params.proposalId);
  res.json(milestones);
});

// POST /api/milestones/proposal/:proposalId (FR-038: Academic office creates milestone)
router.post('/proposal/:proposalId', authenticate, requireRole(['Academic Office']), (req, res) => {
  const { title, target_date, evidence_reference } = req.body;
  const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(req.params.proposalId);

  // BR-013: Implementation milestones may be created only after approval
  if (!proposal || (proposal.current_status !== 'Approved' && proposal.current_status !== 'Conditional Approval' && proposal.current_status !== 'Implemented')) {
    return res.status(400).json({ error: 'BR-013: Milestones can only be created for Approved proposals.' });
  }

  if (!title || !title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(target_date || '')) return res.status(400).json({error:'Title and target date are required.'});
  const id = require('crypto').randomUUID();
  db.prepare(`
    INSERT INTO implementation_milestones (id, proposal_id, title, target_date, status, evidence_reference, updated_by)
    VALUES (?, ?, ?, ?, 'Not Started', ?, ?)
  `).run(id, req.params.proposalId, title, target_date, evidence_reference || '', req.user.id);

  ProposalService.recordAudit(req.user.id, 'MILESTONE_CREATED', 'Milestone', id, 'SUCCESS', `Created milestone: "${title}"`);
  res.status(201).json({ id, message: 'Milestone created successfully' });
});

// PUT /api/milestones/:id (FR-039, FR-040: Update status and attach evidence)
router.put('/:id', authenticate, requireRole(['Academic Office']), (req, res) => {
  const { status, evidence_reference, completion_date } = req.body;
  const milestone = db.prepare('SELECT * FROM implementation_milestones WHERE id=?').get(req.params.id);
  if (!milestone) return res.status(404).json({error:'Milestone not found'});
  if (!['Not Started','In Progress','Completed','Delayed'].includes(status)) return res.status(400).json({error:'Invalid milestone status'});
  if (status === 'Completed' && !evidence_reference?.trim()) return res.status(400).json({error:'Completion requires an evidence reference.'});
  db.prepare(`
    UPDATE implementation_milestones
    SET status = COALESCE(?, status),
        evidence_reference = COALESCE(?, evidence_reference),
        completion_date = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, evidence_reference, status === 'Completed' ? (completion_date || new Date().toISOString().slice(0,10)) : null, req.user.id, req.params.id);

  ProposalService.recordAudit(req.user.id, 'MILESTONE_UPDATED', 'Milestone', req.params.id, 'SUCCESS', `Updated status to "${status}"`);
  res.json({ message: 'Milestone updated successfully' });
});

module.exports = router;
