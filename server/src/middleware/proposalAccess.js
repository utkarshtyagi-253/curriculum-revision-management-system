const { db } = require('../db/db');

function canViewProposal(proposalId, user) {
  if (!user) return false;
  const proposal = db.prepare('SELECT * FROM proposals WHERE id=?').get(proposalId);
  if (!proposal) return false;
  if (user.roles.includes('System Administrator') || user.roles.includes('Academic Office') || proposal.owner_id === user.id) return true;
  if (proposal.current_responsible_role !== 'Faculty Proposer' && user.roles.includes(proposal.current_responsible_role)) return true;
  return Boolean(db.prepare(`
    SELECT 1 FROM review_actions WHERE proposal_id=? AND reviewer_id=?
    UNION SELECT 1 FROM decisions WHERE proposal_id=? AND recorded_by=?
    UNION SELECT 1 FROM feedback WHERE proposal_id=? AND author_id=?
  `).get(proposalId, user.id, proposalId, user.id, proposalId, user.id));
}

function requireProposalAccess(req, res, next) {
  if (!canViewProposal(req.params.id || req.params.proposalId, req.user)) {
    return res.status(404).json({ error: 'Proposal not found.' });
  }
  next();
}

module.exports = { canViewProposal, requireProposalAccess };
