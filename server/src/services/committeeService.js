const { db } = require('../db/db');
const ProposalService = require('./proposalService');

class CommitteeService {
  static recordDecision(proposalId, committeeUser, decisionData) {
    const {
      decision_type,
      decision_reason,
      conditions,
      voting_summary,
      meeting_ref,
      meeting_date
    } = decisionData;

    const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    const currentStage = db.prepare('SELECT * FROM workflow_stages WHERE id = ?').get(proposal.current_stage_id);
    if (!currentStage) throw new Error('Active workflow stage not found.');

    if (!['Committee Review','Senate Review','Under Review','Submitted / Under Review'].includes(proposal.current_status)) throw new Error('Stale proposal: no active committee review.');
    if (!['DCC Reviewer','Senate / Academic Council'].includes(currentStage.responsible_role)) throw new Error('Current stage requires a review action.');
    if (!['Recommendation','Conditional Approval','Return for Revision','Rejection','Final Approval'].includes(decision_type)) throw new Error('Invalid committee decision.');
    if (decision_type === 'Final Approval' && currentStage.responsible_role !== 'Senate / Academic Council') throw new Error('Final approval requires the Senate stage.');
    if (currentStage.responsible_role === 'Senate / Academic Council' && decision_type === 'Recommendation') throw new Error('Final stage requires an approval or rejection.');

    // BR-010: Check authorization
    const isAuthorized = committeeUser.roles.includes(currentStage.responsible_role) ||
                         committeeUser.roles.includes('System Administrator');

    if (!isAuthorized) {
      throw new Error(`BR-010: User is not authorized to record decisions at stage "${currentStage.name}".`);
    }

    // BR-008: Return or Rejection requires a reason
    if ((decision_type === 'Return for Revision' || decision_type === 'Rejection') && (!decision_reason || decision_reason.trim().length < 5)) {
      throw new Error('BR-008 / A1: Return or Rejection requires an explicit recorded reason (minimum 5 characters).');
    }

    // BR-009: Conditional Approval requires conditions
    if (decision_type === 'Conditional Approval' && (!conditions || conditions.trim().length < 5)) {
      throw new Error('BR-009 / A2: Conditional Approval cannot be saved without recorded condition(s).');
    }

    // Fetch active version
    const currentVersion = db.prepare(`
      SELECT * FROM proposal_versions
      WHERE proposal_id = ? AND is_immutable = 1
      ORDER BY version_number DESC
      LIMIT 1
    `).get(proposalId);

    if (!currentVersion) throw new Error('No immutable proposal version found to bind decision.');

    // Optional meeting reference association (FR-031)
    let meetingId = null;
    if (meeting_ref && meeting_date) {
      meetingId = `meet-${require('crypto').randomUUID()}`;
      const committee = db.prepare('SELECT id FROM committees WHERE committee_type = ? LIMIT 1').get(currentStage.responsible_role.includes('Senate') ? 'SENATE' : 'DCC');
      db.prepare(`
        INSERT INTO committee_meetings (id, committee_id, meeting_ref, meeting_date, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(meetingId, committee ? committee.id : 'comm-dcc-cce', meeting_ref, meeting_date, 'Recorded via Decision Portal');
    }

    // Record decision in decisions table (16.17)
    const decisionId = `dec-${require('crypto').randomUUID()}`;
    db.prepare(`
      INSERT INTO decisions (
        id, proposal_id, version_id, meeting_id, decision_type, decision_reason,
        conditions, voting_summary, recorded_by, decision_timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      decisionId,
      proposalId,
      currentVersion.id,
      meetingId,
      decision_type,
      decision_reason || '',
      conditions || '',
      voting_summary || '',
      committeeUser.id
    );

    // Complete active pending action
    db.prepare(`
      UPDATE pending_actions
      SET status = 'Completed', completed_at = CURRENT_TIMESTAMP
      WHERE proposal_id = ? AND stage_id = ? AND status = 'Pending'
    `).run(proposalId, currentStage.id);

    // Route outcome based on decision type and workflow
    if (decision_type === 'Rejection') {
      db.prepare(`
        UPDATE proposals
        SET current_status = 'Rejected', current_responsible_role = 'None', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(proposalId);

      ProposalService.recordAudit(
        committeeUser.id,
        'COMMITTEE_DECISION_REJECTED',
        'Proposal',
        proposalId,
        'SUCCESS',
        `Proposal rejected by committee. Reason: ${decision_reason}`
      );

      ProposalService.createNotification(
        proposal.owner_id,
        'Faculty Proposer',
        proposalId,
        'PROPOSAL_REJECTED',
        `Proposal ${proposalId} was rejected by ${committeeUser.name}. Reason: ${decision_reason}`
      );

    } else if (decision_type === 'Return for Revision') {
      db.prepare(`
        UPDATE proposals
        SET current_status = 'Returned for Revision', current_responsible_role = 'Faculty Proposer', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(proposalId);

      const newActionId = `pa-${proposalId}-${require('crypto').randomUUID()}`;
      db.prepare(`
        INSERT INTO pending_actions (id, proposal_id, stage_id, action_type, status, assigned_role)
        VALUES (?, ?, ?, 'Revise Proposal', 'Pending', 'Faculty Proposer')
      `).run(newActionId, proposalId, currentStage.id);

      ProposalService.recordAudit(
        committeeUser.id,
        'COMMITTEE_DECISION_RETURNED',
        'Proposal',
        proposalId,
        'SUCCESS',
        `Committee returned proposal for revision. Reason: ${decision_reason}`
      );

      ProposalService.createNotification(
        proposal.owner_id,
        'Faculty Proposer',
        proposalId,
        'PROPOSAL_RETURNED',
        `Proposal ${proposalId} returned for revision by committee. Reason: ${decision_reason}`
      );

    } else {
      // Recommendation, Conditional Approval, or Final Approval
      const nextStage = db.prepare(`
        SELECT * FROM workflow_stages
        WHERE workflow_id = ? AND sequence_no > ?
        ORDER BY sequence_no ASC
        LIMIT 1
      `).get(currentStage.workflow_id, currentStage.sequence_no);

      if (nextStage) {
        // More approval stages required (e.g. Academic Office or Senate)
        const nextStatus = nextStage.responsible_role.includes('Senate')
          ? 'Senate Review'
          : 'Under Review';

        db.prepare(`
          UPDATE proposals
          SET current_stage_id = ?, current_status = ?, current_responsible_role = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(nextStage.id, nextStatus, nextStage.responsible_role, proposalId);

        const newActionId = `pa-${proposalId}-${require('crypto').randomUUID()}`;
        db.prepare(`
          INSERT INTO pending_actions (id, proposal_id, stage_id, action_type, status, assigned_role)
          VALUES (?, ?, ?, 'Committee Evaluation', 'Pending', ?)
        `).run(newActionId, proposalId, nextStage.id, nextStage.responsible_role);

        ProposalService.recordAudit(
          committeeUser.id,
          'COMMITTEE_DECISION_FORWARDED',
          'Proposal',
          proposalId,
          'SUCCESS',
          `Decision "${decision_type}" recorded. Routed to next authority "${nextStage.name}". Conditions/Notes: ${conditions || voting_summary || 'None'}`
        );

        ProposalService.createNotification(
          null,
          nextStage.responsible_role,
          proposalId,
          'PROPOSAL_FORWARDED',
          `Proposal ${proposalId} received ${decision_type} and is pending your scrutiny.`
        );

      } else {
        // Final institutional stage reached (BR-012)
        db.prepare(`
          UPDATE proposals
          SET current_status = ?,
              current_responsible_role = 'Academic Office',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(decision_type === 'Conditional Approval' ? 'Conditional Approval' : 'Approved', proposalId);

        ProposalService.recordAudit(
          committeeUser.id,
          'PROPOSAL_FINAL_APPROVAL',
          'Proposal',
          proposalId,
          'SUCCESS',
          `Final approval granted. Ready for implementation milestone tracking.`
        );

        ProposalService.createNotification(
          proposal.owner_id,
          'Faculty Proposer',
          proposalId,
          'FINAL_APPROVED',
          `Congratulations! Proposal ${proposalId} has received final institutional approval.`
        );

        ProposalService.createNotification(
          null,
          'Academic Office',
          proposalId,
          'IMPLEMENTATION_READY',
          `Proposal ${proposalId} approved. Please initiate implementation milestones.`
        );
      }
    }

    return ProposalService.getProposalById(proposalId);
  }
}

{ const original = CommitteeService.recordDecision; CommitteeService.recordDecision = (...args) => db.transaction(() => original.apply(CommitteeService, args))(); }
module.exports = CommitteeService;
