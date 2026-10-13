const { db } = require('../db/db');
const ProposalService = require('./proposalService');

class WorkflowService {
  static reviewProposal(proposalId, reviewerUser, actionData) {
    const { action_type, comment, reason } = actionData;
    // action_type: 'Recommend/Forward' | 'Return for Revision'

    const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    const validReviewStatuses = ['Submitted / Under Review', 'Committee Review', 'Senate Review', 'Under Review'];
    if (!validReviewStatuses.includes(proposal.current_status)) {
      throw new Error(`A2 - Stale proposal stage: Proposal is currently in status "${proposal.current_status}". Cannot review.`);
    }

    const currentStage = db.prepare('SELECT * FROM workflow_stages WHERE id = ?').get(proposal.current_stage_id);
    if (!currentStage) throw new Error('Active workflow stage not found.');

    // BR-010: Only users assigned to the responsible role or committee may perform formal action
    const isAuthorized = reviewerUser.roles.includes(currentStage.responsible_role) ||
                         reviewerUser.roles.includes('System Administrator');

    if (!isAuthorized) {
      throw new Error(`BR-010 / A1: User is not authorized to act on stage "${currentStage.name}". Required role: "${currentStage.responsible_role}".`);
    }

    if (!['Recommend/Forward','Return for Revision','Forward to Senate'].includes(action_type)) throw new Error('Invalid review action.');
    if (action_type !== 'Return for Revision' && !db.prepare('SELECT id FROM workflow_stages WHERE workflow_id=? AND sequence_no>?').get(currentStage.workflow_id,currentStage.sequence_no)) throw new Error('Final stage requires a committee decision.');

    // BR-008: Return for Revision requires a reason
    if (action_type === 'Return for Revision' && (!reason || reason.trim().length < 5)) {
      throw new Error('BR-008 / A3: A Return for Revision action requires a valid recorded reason (min 5 chars).');
    }

    // Fetch active immutable version
    const currentVersion = db.prepare(`
      SELECT * FROM proposal_versions
      WHERE proposal_id = ? AND is_immutable = 1
      ORDER BY version_number DESC
      LIMIT 1
    `).get(proposalId);

    if (!currentVersion) throw new Error('No submitted version found.');

    // 1. Record Review Action (16.13)
    const reviewActionId = `ra-${proposalId}-${require('crypto').randomUUID()}`;
    db.prepare(`
      INSERT INTO review_actions (
        id, proposal_id, version_id, stage_id, reviewer_id, action_type, comment, reason, action_timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      reviewActionId,
      proposalId,
      currentVersion.id,
      currentStage.id,
      reviewerUser.id,
      action_type,
      comment || '',
      reason || ''
    );

    // 2. Complete current PendingAction (Assignment 4 & 5)
    db.prepare(`
      UPDATE pending_actions
      SET status = 'Completed', completed_at = CURRENT_TIMESTAMP
      WHERE proposal_id = ? AND stage_id = ? AND status = 'Pending'
    `).run(proposalId, currentStage.id);

    // 3. Process Transition
    if (action_type === 'Return for Revision') {
      // Transition back to 'Returned for Revision'
      db.prepare(`
        UPDATE proposals
        SET current_status = 'Returned for Revision',
            current_responsible_role = 'Faculty Proposer',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(proposalId);

      // Create PendingAction for Proposer
      const newActionId = `pa-${proposalId}-${require('crypto').randomUUID()}`;
      db.prepare(`
        INSERT INTO pending_actions (id, proposal_id, stage_id, action_type, status, assigned_role)
        VALUES (?, ?, ?, 'Revise Proposal', 'Pending', 'Faculty Proposer')
      `).run(newActionId, proposalId, currentStage.id);

      // Audit & Notify
      ProposalService.recordAudit(
        reviewerUser.id,
        'RETURN_FOR_REVISION',
        'Proposal',
        proposalId,
        'SUCCESS',
        `Returned for revision at stage "${currentStage.name}". Reason: ${reason}`
      );

      ProposalService.createNotification(
        proposal.owner_id,
        'Faculty Proposer',
        proposalId,
        'PROPOSAL_RETURNED',
        `Proposal ${proposalId} returned for revision by ${reviewerUser.name}. Reason: ${reason}`
      );

    } else {
      // Recommend/Forward to next stage
      const nextStage = db.prepare(`
        SELECT * FROM workflow_stages
        WHERE workflow_id = ? AND sequence_no > ?
        ORDER BY sequence_no ASC
        LIMIT 1
      `).get(currentStage.workflow_id, currentStage.sequence_no);

      if (!nextStage) {
        throw new Error('No further workflow stage defined.');
      }

      const nextStatus = nextStage.responsible_role.includes('DCC') || nextStage.responsible_role.includes('Committee')
        ? 'Committee Review'
        : nextStage.responsible_role.includes('Senate') ? 'Senate Review' : 'Under Review';

      db.prepare(`
        UPDATE proposals
        SET current_stage_id = ?,
            current_status = ?,
            current_responsible_role = ?,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `).run(nextStage.id, nextStatus, nextStage.responsible_role, proposalId);

      // Create PendingAction for next stage
      const newActionId = `pa-${proposalId}-${require('crypto').randomUUID()}`;
      db.prepare(`
        INSERT INTO pending_actions (id, proposal_id, stage_id, action_type, status, assigned_role)
        VALUES (?, ?, ?, 'Review Proposal', 'Pending', ?)
      `).run(newActionId, proposalId, nextStage.id, nextStage.responsible_role);

      // Audit & Notify
      ProposalService.recordAudit(
        reviewerUser.id,
        'PROPOSAL_RECOMMENDED_FORWARD',
        'Proposal',
        proposalId,
        'SUCCESS',
        `Recommended forward from stage "${currentStage.name}" to "${nextStage.name}". Comment: ${comment || 'None'}`
      );

      ProposalService.createNotification(
        null,
        nextStage.responsible_role,
        proposalId,
        'PROPOSAL_FORWARDED',
        `Proposal ${proposalId} has arrived at ${nextStage.name} for your review.`
      );
    }

    return ProposalService.getProposalById(proposalId);
  }
}

{ const original = WorkflowService.reviewProposal; WorkflowService.reviewProposal = (...args) => db.transaction(() => original.apply(WorkflowService, args))(); }
module.exports = WorkflowService;
