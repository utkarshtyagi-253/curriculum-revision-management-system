const express = require('express');
const router = express.Router();
const { db } = require('../db/db');
const { authenticate } = require('../middleware/auth');
const WorkflowService = require('../services/workflowService');
const CommitteeService = require('../services/committeeService');

// GET /api/workflow/pending (Get pending actions for the logged-in user's roles)
router.get('/pending', authenticate, (req, res) => {
  const placeholders = req.user.roles.map(() => '?').join(',');
  const query = `
    SELECT pa.*, p.title as proposal_title, p.proposal_type, p.current_status,
           ws.name as stage_name, d.name as department_name, u.name as owner_name
    FROM pending_actions pa
    JOIN proposals p ON pa.proposal_id = p.id
    JOIN workflow_stages ws ON pa.stage_id = ws.id
    LEFT JOIN departments d ON p.department_id = d.id
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE pa.status = 'Pending' AND (pa.assigned_role IN (${placeholders}) OR ? = 1) AND (pa.assigned_role != 'Faculty Proposer' OR p.owner_id = ? OR ? = 1)
    ORDER BY pa.created_at DESC
  `;

  const isAdmin = req.user.roles.includes('System Administrator') ? 1 : 0;
  const actions = db.prepare(query).all(...req.user.roles, isAdmin, req.user.id, isAdmin);
  res.json(actions);
});

// POST /api/workflow/proposals/:id/review (UC-009: Review Proposal & Record Feedback)
router.post('/proposals/:id/review', authenticate, (req, res) => {
  try {
    const updated = WorkflowService.reviewProposal(req.params.id, req.user, req.body);
    res.json({
      message: 'Review action recorded successfully.',
      proposal: updated
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/workflow/proposals/:id/decision (UC-015: Record Committee Decision)
router.post('/proposals/:id/decision', authenticate, (req, res) => {
  try {
    const updated = CommitteeService.recordDecision(req.params.id, req.user, req.body);
    res.json({
      message: 'Committee decision recorded and workflow updated.',
      proposal: updated
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/workflow/stages (Get stages of active workflow)
router.get('/stages', authenticate, (req, res) => {
  const stages = db.prepare(`
    SELECT ws.*, wd.name as workflow_name
    FROM workflow_stages ws
    JOIN workflow_definitions wd ON ws.workflow_id = wd.id
    WHERE wd.active_status = 1
    ORDER BY ws.sequence_no ASC
  `).all();
  res.json(stages);
});

module.exports = router;
