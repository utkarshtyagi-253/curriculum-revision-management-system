const express = require('express');
const router = express.Router();
const { db } = require('../db/db');
const { authenticate, requireRole } = require('../middleware/auth');
const ProposalService = require('../services/proposalService');

// GET /api/proposals (Search & Filter - FR-042, FR-043)
router.get('/', authenticate, (req, res) => {
  const { search, department, type, status, stage } = req.query;

  let query = `
    SELECT p.*, d.name as department_name, d.code as department_code,
           u.name as owner_name, ws.name as stage_name
    FROM proposals p
    LEFT JOIN departments d ON p.department_id = d.id
    LEFT JOIN users u ON p.owner_id = u.id
    LEFT JOIN workflow_stages ws ON p.current_stage_id = ws.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ' AND (p.title LIKE ? OR p.id LIKE ? OR p.affected_programmes LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (department) {
    query += ' AND p.department_id = ?';
    params.push(department);
  }

  if (type) {
    query += ' AND p.proposal_type = ?';
    params.push(type);
  }

  if (status) {
    query += ' AND p.current_status = ?';
    params.push(status);
  }

  if (stage) {
    query += ' AND p.current_stage_id = ?';
    params.push(stage);
  }

  query += ' ORDER BY p.updated_at DESC';

  const proposals = db.prepare(query).all(...params);
  res.json(proposals);
});

// GET /api/proposals/stats (FR-044: Status dashboard counts)
router.get('/stats', authenticate, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM proposals').get().count;
  const drafts = db.prepare("SELECT COUNT(*) as count FROM proposals WHERE current_status = 'Draft'").get().count;
  const underReview = db.prepare("SELECT COUNT(*) as count FROM proposals WHERE current_status LIKE '%Review%'").get().count;
  const approved = db.prepare("SELECT COUNT(*) as count FROM proposals WHERE current_status = 'Approved'").get().count;
  const returned = db.prepare("SELECT COUNT(*) as count FROM proposals WHERE current_status = 'Returned for Revision'").get().count;
  const rejected = db.prepare("SELECT COUNT(*) as count FROM proposals WHERE current_status = 'Rejected'").get().count;

  // Pending actions for current user roles
  let pendingForRole = 0;
  for (const role of req.user.roles) {
    const pCount = db.prepare("SELECT COUNT(*) as count FROM pending_actions WHERE assigned_role = ? AND status = 'Pending'").get(role).count;
    pendingForRole += pCount;
  }

  res.json({
    total,
    drafts,
    underReview,
    approved,
    returned,
    rejected,
    pendingForUserRole: pendingForRole
  });
});

// GET /api/proposals/:id
router.get('/:id', authenticate, (req, res) => {
  const proposal = ProposalService.getProposalById(req.params.id);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found' });
  }
  res.json(proposal);
});

// POST /api/proposals (Create new proposal draft - FR-009)
router.post('/', authenticate, requireRole(['Faculty Proposer']), (req, res) => {
  try {
    const proposal = ProposalService.createProposal(req.body, req.user.id);
    res.status(201).json(proposal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/proposals/:id/draft (Save draft - FR-012, BR-003)
router.put('/:id/draft', authenticate, (req, res) => {
  try {
    const proposal = ProposalService.saveDraftData(req.params.id, req.body, req.user.id);
    res.json(proposal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/proposals/:id/submit (Submit proposal - UC-005, FR-015, FR-016)
router.post('/:id/submit', authenticate, (req, res) => {
  try {
    const proposal = ProposalService.submitProposal(req.params.id, req.user.id);
    res.json({
      message: 'Proposal successfully submitted into the review workflow.',
      proposal
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/proposals/:id/compare (Compare versions - FR-027)
router.get('/:id/compare', authenticate, (req, res) => {
  try {
    const { v1, v2 } = req.query;
    if (!v1 || !v2) {
      return res.status(400).json({ error: 'Please specify version numbers v1 and v2 to compare.' });
    }
    const diff = ProposalService.compareVersions(req.params.id, Number(v1), Number(v2));
    res.json(diff);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/proposals/:id/documents (Upload supporting document - FR-013)
router.post('/:id/documents', authenticate, (req, res) => {
  try {
    const proposal = db.prepare('SELECT * FROM proposals WHERE id=?').get(req.params.id);
    if (!proposal || proposal.owner_id !== req.user.id || !['Draft','Returned for Revision'].includes(proposal.current_status)) return res.status(403).json({error:'Only the owner can attach documents to editable proposals.'});
    const { file_name, file_type, file_size, file_data } = req.body;
    const allowed = ['application/pdf','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!file_name || !allowed.includes(file_type) || !Number.isInteger(file_size) || file_size < 1 || file_size > 5*1024*1024 || typeof file_data !== 'string' || !file_data.startsWith(`data:${file_type};base64,`)) return res.status(400).json({error:'Provide a PDF, text or DOCX document of up to 5 MB.'});
    const bytes = Buffer.from(file_data.split(',')[1], 'base64');
    if (bytes.length !== file_size) return res.status(400).json({error:'File size does not match uploaded content.'});
    const docId = require('crypto').randomUUID();
    db.prepare('INSERT INTO supporting_documents (id,proposal_id,file_name,file_type,file_size,file_path,uploaded_by) VALUES (?,?,?,?,?,?,?)').run(docId,req.params.id,file_name,file_type,file_size,file_data,req.user.id);

    ProposalService.recordAudit(req.user.id, 'DOCUMENT_UPLOADED', 'Document', docId, 'SUCCESS', `Attached document "${file_name}" to proposal.`);
    res.json({ message: 'Document attached successfully', documentId: docId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/proposals/:id/timeline (Proposal Timeline - FR-045)
router.get('/:id/timeline', authenticate, (req, res) => {
  const events = db.prepare(`
    SELECT ae.*, u.name as actor_name
    FROM audit_events ae
    LEFT JOIN users u ON ae.actor_id = u.id
    WHERE ae.object_id = ?
    ORDER BY ae.timestamp ASC
  `).all(req.params.id);
  res.json(events);
});

module.exports = router;
