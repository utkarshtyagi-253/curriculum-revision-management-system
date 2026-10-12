import uuid
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
from src.models import (
    CurriculumProposal, ProposalVersion, WorkflowDefinition, WorkflowStage,
    ReviewAction, PendingAction, Decision, User
)
from src.schemas import ReviewActionRequest, CommitteeDecisionRequest
from src.services.audit_service import log_audit_event, create_notification

def process_review_action(
    db: Session,
    proposal_id: str,
    req: ReviewActionRequest,
    reviewer: User
) -> CurriculumProposal:
    proposal = db.query(CurriculumProposal).filter(CurriculumProposal.proposalId == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    if proposal.currentStatus != "Submitted / Under Review":
        raise HTTPException(status_code=400, detail=f"Proposal is not currently under review (Status: {proposal.currentStatus})")

    # Fetch active workflow and stages
    workflow = db.query(WorkflowDefinition).filter(WorkflowDefinition.isActive == True).first()
    if not workflow:
        raise HTTPException(status_code=500, detail="Workflow configuration missing")

    current_stage = None
    for stage in workflow.stages:
        if stage.stageName == proposal.currentWorkflowStage:
            current_stage = stage
            break

    if not current_stage:
        raise HTTPException(status_code=400, detail="Current workflow stage is invalid")

    # BR-010: Role check
    reviewer_roles = [ur.roleId for ur in reviewer.user_roles if ur.isActive]
    if current_stage.responsibleRole not in reviewer_roles and "ADMIN" not in reviewer_roles:
        raise HTTPException(
            status_code=403,
            detail=f"BR-010 violation: Only users with role '{current_stage.responsibleRole}' can act at this stage."
        )

    # Latest version ID
    latest_version = db.query(ProposalVersion).filter(
        ProposalVersion.proposalId == proposal_id
    ).order_by(ProposalVersion.versionNo.desc()).first()

    version_id = latest_version.versionId if latest_version else "V1"

    # BR-008: Return for revision requires recorded reason
    if req.actionType in ["Return for Revision", "Return", "Reject"]:
        if not req.commentReason or not req.commentReason.strip():
            raise HTTPException(
                status_code=400,
                detail=f"BR-008 violation: Action '{req.actionType}' requires a recorded reason."
            )

    # Record Review Action
    action_record = ReviewAction(
        reviewActionId=f"REV-{uuid.uuid4().hex[:8].upper()}",
        proposalId=proposal_id,
        proposalVersionId=version_id,
        stageId=current_stage.stageId,
        reviewerId=reviewer.userId,
        actionType=req.actionType,
        commentReason=req.commentReason,
        actionTimestamp=datetime.utcnow()
    )
    db.add(action_record)

    # Close existing pending action
    pending = db.query(PendingAction).filter(
        PendingAction.proposalId == proposal_id,
        PendingAction.stageId == current_stage.stageId,
        PendingAction.status == "Pending"
    ).first()
    if pending:
        pending.status = "Completed"

    # Branch according to action
    if req.actionType in ["Return for Revision", "Return"]:
        proposal.currentStatus = "Returned for Revision"
        proposal.currentResponsibleRole = "Faculty Proposer"
        # Make the latest version mutable so owner can revise it before next submission
        # previous version remains immutable (BR-005, BR-006)
        create_notification(
            db,
            proposal.ownerId,
            proposal_id,
            "PROPOSAL_RETURNED",
            f"Proposal '{proposal.title}' was returned for revision by {reviewer.name}. Reason: {req.commentReason}"
        )
    elif req.actionType in ["Recommend", "Forward"]:
        # Find next stage
        next_seq = current_stage.stageSequence + 1
        next_stage = None
        for stage in workflow.stages:
            if stage.stageSequence == next_seq:
                next_stage = stage
                break

        if next_stage:
            proposal.currentWorkflowStage = next_stage.stageName
            proposal.currentResponsibleRole = next_stage.responsibleRole
            
            new_pa = PendingAction(
                actionId=f"PA-{uuid.uuid4().hex[:8].upper()}",
                proposalId=proposal_id,
                stageId=next_stage.stageId,
                actionType="Review Proposal",
                status="Pending",
                assignedRole=next_stage.responsibleRole,
                createdAt=datetime.utcnow()
            )
            db.add(new_pa)
            create_notification(
                db,
                next_stage.responsibleRole,
                proposal_id,
                "PROPOSAL_ASSIGNED",
                f"Proposal '{proposal.title}' has advanced to {next_stage.stageName} for review."
            )
        else:
            # Reached end of sequential review stages, move to Committee Review
            proposal.currentStatus = "Committee Review"
            proposal.currentWorkflowStage = "Committee Decision"
            proposal.currentResponsibleRole = "Committee Member"
            create_notification(
                db,
                "Committee Member",
                proposal_id,
                "READY_FOR_COMMITTEE",
                f"Proposal '{proposal.title}' is ready for Committee Review."
            )
    elif req.actionType == "Reject":
        proposal.currentStatus = "Rejected"
        create_notification(
            db,
            proposal.ownerId,
            proposal_id,
            "PROPOSAL_REJECTED",
            f"Proposal '{proposal.title}' was rejected by {reviewer.name}. Reason: {req.commentReason}"
        )

    proposal.lastUpdatedAt = datetime.utcnow()
    log_audit_event(db, reviewer.userId, f"REVIEW_ACTION_{req.actionType.upper()}", "CurriculumProposal", proposal_id, "SUCCESS")

    db.commit()
    db.refresh(proposal)
    return proposal

def process_committee_decision(
    db: Session,
    proposal_id: str,
    req: CommitteeDecisionRequest,
    member: User
) -> CurriculumProposal:
    proposal = db.query(CurriculumProposal).filter(CurriculumProposal.proposalId == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    # BR-008: Return or Rejection requires a reason
    if req.decisionType in ["Return", "Rejection", "Reject"]:
        if not req.reason or not req.reason.strip():
            raise HTTPException(
                status_code=400,
                detail=f"BR-008 violation: Decision '{req.decisionType}' requires a recorded reason."
            )

    # BR-009: Conditional approval requires recorded condition(s)
    if req.decisionType == "Conditional Approval":
        if not req.conditions or not req.conditions.strip():
            raise HTTPException(
                status_code=400,
                detail="BR-009 violation: Conditional Approval must include recorded condition(s)."
            )

    latest_version = db.query(ProposalVersion).filter(
        ProposalVersion.proposalId == proposal_id
    ).order_by(ProposalVersion.versionNo.desc()).first()

    version_id = latest_version.versionId if latest_version else "V1"

    decision = Decision(
        decisionId=f"DEC-{uuid.uuid4().hex[:8].upper()}",
        proposalId=proposal_id,
        proposalVersionId=version_id,
        decisionType=req.decisionType,
        decisionReason=req.reason,
        conditions=req.conditions,
        votingSummary=req.votingSummary,
        recordedBy=member.userId,
        decisionTimestamp=datetime.utcnow()
    )
    db.add(decision)

    if req.decisionType == "Final Approval":
        proposal.currentStatus = "Approved"
    elif req.decisionType == "Conditional Approval":
        proposal.currentStatus = "Conditional Approval"
    elif req.decisionType in ["Rejection", "Reject"]:
        proposal.currentStatus = "Rejected"
    elif req.decisionType == "Return":
        proposal.currentStatus = "Returned for Revision"
        proposal.currentResponsibleRole = "Faculty Proposer"
        if latest_version:
            # previous version remains immutable (BR-005, BR-006)
            pass

    proposal.lastUpdatedAt = datetime.utcnow()
    log_audit_event(db, member.userId, f"COMMITTEE_DECISION_{req.decisionType.upper()}", "CurriculumProposal", proposal_id, "SUCCESS")
    create_notification(
        db,
        proposal.ownerId,
        proposal_id,
        "COMMITTEE_DECISION",
        f"Committee decided: '{req.decisionType}' on proposal '{proposal.title}'."
    )

    db.commit()
    db.refresh(proposal)
    return proposal
