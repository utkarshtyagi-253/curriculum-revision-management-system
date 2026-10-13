const { db } = require('../db/db');
const crypto = require('crypto');

class ProposalService {
  static getProposalById(proposalId) {
    const proposal = db.prepare(`
      SELECT p.*, d.name as department_name, u.name as owner_name, u.email as owner_email,
             ws.name as stage_name
      FROM proposals p
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN workflow_stages ws ON p.current_stage_id = ws.id
      WHERE p.id = ?
    `).get(proposalId);

    if (!proposal) return null;

    // Attach versions
    const versions = db.prepare(`
      SELECT pv.*, u.name as author_name
      FROM proposal_versions pv
      LEFT JOIN users u ON pv.created_by = u.id
      WHERE pv.proposal_id = ?
      ORDER BY pv.version_number DESC
    `).all(proposalId);

    // Attach documents
    const documents = db.prepare(`
      SELECT * FROM supporting_documents WHERE proposal_id = ?
    `).all(proposalId);

    // Attach pending actions
    const pendingActions = db.prepare(`
      SELECT * FROM pending_actions WHERE proposal_id = ? AND status = 'Pending'
    `).all(proposalId);

    return {
      ...proposal,
      versions,
      documents,
      pendingActions,
      review_history: db.prepare('SELECT ra.*, u.name as reviewer_name, ws.responsible_role as role FROM review_actions ra JOIN users u ON ra.reviewer_id=u.id JOIN workflow_stages ws ON ra.stage_id=ws.id WHERE proposal_id=? ORDER BY action_timestamp DESC').all(proposalId),
      decisions: db.prepare('SELECT dec.*, cm.meeting_ref, cm.meeting_date, u.name as recorded_by_name FROM decisions dec LEFT JOIN committee_meetings cm ON dec.meeting_id=cm.id JOIN users u ON dec.recorded_by=u.id WHERE proposal_id=? ORDER BY decision_timestamp DESC').all(proposalId)
    };
  }

  static createProposal(data, userId) {
    const id = data.id || `CR-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO proposals (
        id, proposal_type, title, owner_id, department_id, affected_programmes,
        current_status, current_responsible_role, proposed_implementation_session,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'Draft', 'Faculty Proposer', ?, ?, ?)
    `).run(
      id,
      data.proposal_type,
      data.title,
      userId,
      data.department_id,
      data.affected_programmes || '',
      data.proposed_implementation_session || '',
      now,
      now
    );

    // Initial draft version (version 0 or uncommitted draft data)
    this.saveDraftData(id, data, userId);

    // Record audit event
    this.recordAudit(userId, 'PROPOSAL_CREATED', 'Proposal', id, 'SUCCESS', 'Proposal draft initiated.');

    return this.getProposalById(id);
  }

  static saveDraftData(proposalId, data, userId) {
    const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    // BR-003: A proposal owner may modify proposal content only while in Draft or Returned for Revision
    if (proposal.current_status !== 'Draft' && proposal.current_status !== 'Returned for Revision') {
      throw new Error('BR-003: Cannot modify proposal content unless in Draft or Returned for Revision status.');
    }

    if (proposal.owner_id !== userId) {
      throw new Error('Access denied: You do not own this proposal.');
    }

    // Update main proposal fields
    db.prepare(`
      UPDATE proposals
      SET title = COALESCE(?, title),
          proposal_type = COALESCE(?, proposal_type),
          department_id = COALESCE(?, department_id),
          affected_programmes = COALESCE(?, affected_programmes),
          proposed_implementation_session = COALESCE(?, proposed_implementation_session),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.title,
      data.proposal_type,
      data.department_id,
      data.affected_programmes,
      data.proposed_implementation_session,
      proposalId
    );

    // Check if there is an existing uncommitted/draft version record
    const draftVersion = db.prepare(`
      SELECT * FROM proposal_versions
      WHERE proposal_id = ? AND is_immutable = 0
    `).get(proposalId);

    if (draftVersion) {
      db.prepare(`
        UPDATE proposal_versions
        SET academic_rationale = COALESCE(?, academic_rationale),
            prerequisites = COALESCE(?, prerequisites),
            credits = COALESCE(?, credits),
            syllabus_changes = COALESCE(?, syllabus_changes),
            resource_implications = COALESCE(?, resource_implications),
            structured_fields = COALESCE(?, structured_fields)
        WHERE id = ?
      `).run(
        data.academic_rationale,
        data.prerequisites,
        data.credits,
        data.syllabus_changes,
        data.resource_implications,
        data.structured_fields === undefined ? null : JSON.stringify(data.structured_fields),
        draftVersion.id
      );
    } else {
      // Get previous version to prefill unmodified fields
      const prevVersion = db.prepare(`
        SELECT * FROM proposal_versions
        WHERE proposal_id = ? AND is_immutable = 1
        ORDER BY version_number DESC LIMIT 1
      `).get(proposalId);

      const vid = `ver-${proposalId}-draft-${require('crypto').randomUUID()}`;
      db.prepare(`
        INSERT INTO proposal_versions (
          id, proposal_id, version_number, academic_rationale, prerequisites, credits,
          syllabus_changes, resource_implications, structured_fields, created_by, is_immutable
        ) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(
        vid,
        proposalId,
        data.academic_rationale !== undefined ? data.academic_rationale : (prevVersion ? prevVersion.academic_rationale : ''),
        data.prerequisites !== undefined ? data.prerequisites : (prevVersion ? prevVersion.prerequisites : ''),
        data.credits !== undefined ? Number(data.credits) : (prevVersion ? prevVersion.credits : null),
        data.syllabus_changes !== undefined ? data.syllabus_changes : (prevVersion ? prevVersion.syllabus_changes : ''),
        data.resource_implications !== undefined ? data.resource_implications : (prevVersion ? prevVersion.resource_implications : ''),
        JSON.stringify(data.structured_fields || (prevVersion ? JSON.parse(prevVersion.structured_fields || '{}') : {})),
        userId
      );
    }

    return this.getProposalById(proposalId);
  }

  static validateProposalCompleteness(proposalId) {
    const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    const draft = db.prepare(`
      SELECT * FROM proposal_versions
      WHERE proposal_id = ?
      ORDER BY is_immutable ASC, version_number DESC, created_at DESC
      LIMIT 1
    `).get(proposalId);

    const errors = [];
    if (!proposal.title || proposal.title.trim().length < 5) errors.push('Title is required and must be at least 5 characters');
    if (!proposal.proposal_type) errors.push('Proposal type classification is mandatory');
    if (!proposal.department_id) errors.push('Department association is required');
    if (!proposal.proposed_implementation_session) errors.push('Proposed implementation session is required');

    if (!draft || !draft.academic_rationale || draft.academic_rationale.trim().length < 15) {
      errors.push('Academic rationale is mandatory (minimum 15 characters)');
    }
    if (!draft || !draft.credits || draft.credits <= 0) {
      errors.push('Valid credit count is required');
    }
    if (!draft || !draft.syllabus_changes || draft.syllabus_changes.trim().length < 10) {
      errors.push('Syllabus change description is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static submitProposal(proposalId, userId) {
    const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    if (proposal.owner_id !== userId) {
      throw new Error('A4 - Unauthorized user: Only the proposal owner can submit this proposal.');
    }

    // BR-003: Check status
    if (proposal.current_status !== 'Draft' && proposal.current_status !== 'Returned for Revision') {
      throw new Error('Proposal must be in Draft or Returned for Revision status to submit.');
    }

    // BR-004: Completeness validation
    const validation = this.validateProposalCompleteness(proposalId);
    if (!validation.isValid) {
      throw new Error(`BR-004: Incomplete proposal fields: ${validation.errors.join('; ')}`);
    }

    // Determine workflow and first stage
    const firstStage = db.prepare(`
      SELECT ws.* FROM workflow_stages ws
      JOIN workflow_definitions wd ON ws.workflow_id = wd.id
      WHERE wd.active_status = 1
      ORDER BY ws.sequence_no ASC
      LIMIT 1
    `).get();

    if (!firstStage) {
      throw new Error('A3 - Workflow unavailable: No active review workflow configured.');
    }

    // Fetch latest draft content
    const latestDraft = db.prepare(`
      SELECT * FROM proposal_versions
      WHERE proposal_id = ?
      ORDER BY is_immutable ASC, version_number DESC, created_at DESC
      LIMIT 1
    `).get(proposalId);

    // Calculate new version number (BR-005: immutable version snapshot)
    const maxVersionRow = db.prepare(`
      SELECT MAX(version_number) as max_v FROM proposal_versions
      WHERE proposal_id = ? AND is_immutable = 1
    `).get(proposalId);

    const nextVersionNo = (maxVersionRow && maxVersionRow.max_v ? maxVersionRow.max_v : 0) + 1;
    const versionId = `ver-${proposalId}-v${nextVersionNo}`;

    // Insert immutable version snapshot
    db.prepare(`
      INSERT INTO proposal_versions (
        id, proposal_id, version_number, academic_rationale, prerequisites, credits,
        syllabus_changes, resource_implications, structured_fields, created_by,
        is_immutable, submission_timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    `).run(
      versionId,
      proposalId,
      nextVersionNo,
      latestDraft ? latestDraft.academic_rationale : '',
      latestDraft ? latestDraft.prerequisites : '',
      latestDraft ? latestDraft.credits : 3,
      latestDraft ? latestDraft.syllabus_changes : '',
      latestDraft ? latestDraft.resource_implications : '',
      latestDraft ? latestDraft.structured_fields : '{}',
      userId
    );

    // Remove old mutable draft record if exists
    db.prepare('DELETE FROM proposal_versions WHERE proposal_id = ? AND is_immutable = 0').run(proposalId);

    // Update proposal status & stage
    db.prepare(`
      UPDATE proposals
      SET current_status = 'Submitted / Under Review',
          current_stage_id = ?,
          current_responsible_role = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(firstStage.id, firstStage.responsible_role, proposalId);

    // Clear stale pending actions on this proposal
    db.prepare("UPDATE pending_actions SET status = 'Superceded' WHERE proposal_id = ? AND status = 'Pending'").run(proposalId);

    // Create new PendingAction for first stage
    const actionId = `pa-${proposalId}-${require('crypto').randomUUID()}`;
    db.prepare(`
      INSERT INTO pending_actions (id, proposal_id, stage_id, action_type, status, assigned_role)
      VALUES (?, ?, ?, 'Review Proposal', 'Pending', ?)
    `).run(actionId, proposalId, firstStage.id, firstStage.responsible_role);

    // Record Audit & Timeline events (FR-045, FR-047)
    this.recordAudit(
      userId,
      nextVersionNo === 1 ? 'PROPOSAL_SUBMITTED' : 'PROPOSAL_RESUBMITTED',
      'Proposal',
      proposalId,
      'SUCCESS',
      `Proposal submitted. Version snapshot v${nextVersionNo} sealed and routed to ${firstStage.name}.`
    );

    // Send in-app notification to responsible review role (FR-036)
    this.createNotification(
      null,
      firstStage.responsible_role,
      proposalId,
      'PROPOSAL_SUBMITTED',
      `Proposal ${proposalId} "${proposal.title}" (v${nextVersionNo}) submitted and awaiting your review.`
    );

    return this.getProposalById(proposalId);
  }

  static compareVersions(proposalId, v1Num, v2Num) {
    const v1 = db.prepare('SELECT * FROM proposal_versions WHERE proposal_id = ? AND version_number = ?').get(proposalId, v1Num);
    const v2 = db.prepare('SELECT * FROM proposal_versions WHERE proposal_id = ? AND version_number = ?').get(proposalId, v2Num);

    if (!v1 || !v2) throw new Error('One or both versions not found for comparison.');

    const fields = ['academic_rationale', 'prerequisites', 'credits', 'syllabus_changes', 'resource_implications'];
    const diffs = {};

    for (const field of fields) {
      diffs[field] = {
        from: v1[field],
        to: v2[field],
        isChanged: String(v1[field] || '') !== String(v2[field] || '')
      };
    }

    return {
      proposalId,
      v1: { versionNumber: v1.version_number, createdAt: v1.created_at },
      v2: { versionNumber: v2.version_number, createdAt: v2.created_at },
      diffs
    };
  }

  static recordAudit(actorId, action, objectType, objectId, result, details) {
    const id = `ae-${require('crypto').randomUUID()}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO audit_events (id, actor_id, action, object_type, object_id, result, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(id, actorId, action, objectType, objectId, result, details);
  }

  static createNotification(recipientId, recipientRole, proposalId, eventType, message) {
    const id = `notif-${require('crypto').randomUUID()}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO notifications (id, recipient_id, recipient_role, proposal_id, event_type, message, read_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(id, recipientId, recipientRole, proposalId, eventType, message);
  }
}

{ const original = ProposalService.createProposal; ProposalService.createProposal = (...args) => db.transaction(() => original.apply(ProposalService, args))(); }
{ const original = ProposalService.saveDraftData; ProposalService.saveDraftData = (...args) => db.transaction(() => original.apply(ProposalService, args))(); }
{ const original = ProposalService.submitProposal; ProposalService.submitProposal = (...args) => db.transaction(() => original.apply(ProposalService, args))(); }
module.exports = ProposalService;
