import uuid
import json
from datetime import datetime
from typing import Dict, Any, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from src.models import (
    CurriculumProposal, ProposalVersion, WorkflowDefinition, WorkflowStage,
    PendingAction, User
)
from src.schemas import ProposalCreate, ProposalUpdate
from src.services.audit_service import log_audit_event, create_notification

def create_proposal_draft(db: Session, data: ProposalCreate, owner: User) -> CurriculumProposal:
    proposal_id = f"CR-2026-{uuid.uuid4().hex[:6].upper()}"
    version_id = f"VER-{uuid.uuid4().hex[:8].upper()}"

    proposal = CurriculumProposal(
        proposalId=proposal_id,
        proposalType=data.proposalType,
        title=data.title,
        ownerId=owner.userId,
        departmentId=data.departmentId,
        affectedProgrammes=json.dumps(data.affectedProgrammes),
        currentStatus="Draft",
        currentWorkflowStage="Drafting",
        currentResponsibleRole="Faculty Proposer",
        proposedImplementationSession=data.proposedImplementationSession,
        createdAt=datetime.utcnow(),
        lastUpdatedAt=datetime.utcnow()
    )
    db.add(proposal)
    db.flush()

    # Create initial draft version (version 1, mutable)
    version = ProposalVersion(
        versionId=version_id,
        proposalId=proposal_id,
        versionNo=1,
        academicRationale=data.academicRationale,
        prerequisites=data.prerequisites,
        credits=data.credits,
        syllabusChangeDescription=data.syllabusChangeDescription,
        resourceImplications=data.resourceImplications,
        structuredFields=json.dumps({
            "title": data.title,
            "proposalType": data.proposalType,
            "departmentId": data.departmentId,
            "affectedProgrammes": data.affectedProgrammes,
            "session": data.proposedImplementationSession
        }),
        createdBy=owner.userId,
        createdAt=datetime.utcnow(),
        isImmutable=False
    )
    db.add(version)
    db.commit()
    db.refresh(proposal)

    log_audit_event(db, owner.userId, "PROPOSAL_CREATED", "CurriculumProposal", proposal_id, "SUCCESS")
    return proposal

def edit_proposal(db: Session, proposal_id: str, data: ProposalUpdate, user: User) -> CurriculumProposal:
    proposal = db.query(CurriculumProposal).filter(CurriculumProposal.proposalId == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    # BR-003: Owner only, and only when Draft or Returned for Revision
    if proposal.ownerId != user.userId:
        raise HTTPException(status_code=403, detail="Unauthorized: Only the proposal owner can edit.")
    if proposal.currentStatus not in ["Draft", "Returned for Revision"]:
        raise HTTPException(status_code=400, detail=f"Cannot edit proposal in status '{proposal.currentStatus}'. BR-003 violation.")

    if data.title is not None:
        proposal.title = data.title
    if data.affectedProgrammes is not None:
        proposal.affectedProgrammes = json.dumps(data.affectedProgrammes)
    if data.proposedImplementationSession is not None:
        proposal.proposedImplementationSession = data.proposedImplementationSession

    # Get active draft version or last version
    latest_version = db.query(ProposalVersion).filter(
        ProposalVersion.proposalId == proposal_id
    ).order_by(ProposalVersion.versionNo.desc()).first()

    if latest_version and latest_version.isImmutable:
        # Create new working version (BR-005, BR-006)
        import uuid
        latest_version = ProposalVersion(
            versionId=f"VER-{uuid.uuid4().hex[:8].upper()}",
            proposalId=proposal_id,
            versionNo=latest_version.versionNo + 1,
            academicRationale=latest_version.academicRationale,
            prerequisites=latest_version.prerequisites,
            credits=latest_version.credits,
            syllabusChangeDescription=latest_version.syllabusChangeDescription,
            resourceImplications=latest_version.resourceImplications,
            structuredFields=latest_version.structuredFields,
            createdBy=user.userId,
            createdAt=datetime.utcnow(),
            isImmutable=False
        )
        db.add(latest_version)
        db.flush()

    if latest_version:
        if data.academicRationale is not None:
            latest_version.academicRationale = data.academicRationale
        if data.prerequisites is not None:
            latest_version.prerequisites = data.prerequisites
        if data.credits is not None:
            latest_version.credits = data.credits
        if data.syllabusChangeDescription is not None:
            latest_version.syllabusChangeDescription = data.syllabusChangeDescription
        if data.resourceImplications is not None:
            latest_version.resourceImplications = data.resourceImplications
    
    proposal.lastUpdatedAt = datetime.utcnow()
    db.commit()
    db.refresh(proposal)

    log_audit_event(db, user.userId, "PROPOSAL_UPDATED", "CurriculumProposal", proposal_id, "SUCCESS")
    return proposal

def validate_proposal_completeness(proposal: CurriculumProposal, version: ProposalVersion):
    missing_fields = []
    if not proposal.title or not proposal.title.strip():
        missing_fields.append("title")
    if not proposal.proposedImplementationSession or not proposal.proposedImplementationSession.strip():
        missing_fields.append("proposedImplementationSession")
    if not version.academicRationale or not version.academicRationale.strip():
        missing_fields.append("academicRationale")
    if version.credits is None or version.credits <= 0:
        missing_fields.append("credits")
    try:
        progs = json.loads(proposal.affectedProgrammes)
        if not progs:
            missing_fields.append("affectedProgrammes")
    except:
        missing_fields.append("affectedProgrammes")

    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail=f"BR-004 Completeness validation failed. Missing required fields: {', '.join(missing_fields)}"
        )

def submit_proposal(db: Session, proposal_id: str, user: User) -> CurriculumProposal:
    proposal = db.query(CurriculumProposal).filter(CurriculumProposal.proposalId == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    # BR-003 & Ownership check
    if proposal.ownerId != user.userId:
        raise HTTPException(status_code=403, detail="Unauthorized: Only the proposal owner can submit.")
    if proposal.currentStatus not in ["Draft", "Returned for Revision"]:
        raise HTTPException(status_code=400, detail=f"Proposal cannot be submitted from status '{proposal.currentStatus}'.")

    # Fetch latest version
    latest_version = db.query(ProposalVersion).filter(
        ProposalVersion.proposalId == proposal_id
    ).order_by(ProposalVersion.versionNo.desc()).first()

    if not latest_version:
        raise HTTPException(status_code=400, detail="Proposal has no version data.")

    # BR-004: Validate completeness
    validate_proposal_completeness(proposal, latest_version)

    # Find active workflow and first stage
    workflow = db.query(WorkflowDefinition).filter(WorkflowDefinition.isActive == True).first()
    if not workflow or not workflow.stages:
        raise HTTPException(status_code=500, detail="Workflow configuration unavailable.")

    first_stage = workflow.stages[0]

    # BR-005 & BR-006: Create or seal immutable version snapshot
    if latest_version.isImmutable:
        # Create next version number (v2, v3, etc.)
        new_version_no = latest_version.versionNo + 1
        new_version_id = f"VER-{uuid.uuid4().hex[:8].upper()}"
        snapshot = ProposalVersion(
            versionId=new_version_id,
            proposalId=proposal_id,
            versionNo=new_version_no,
            academicRationale=latest_version.academicRationale,
            prerequisites=latest_version.prerequisites,
            credits=latest_version.credits,
            syllabusChangeDescription=latest_version.syllabusChangeDescription,
            resourceImplications=latest_version.resourceImplications,
            structuredFields=json.dumps({
                "title": proposal.title,
                "proposalType": proposal.proposalType,
                "departmentId": proposal.departmentId,
                "affectedProgrammes": json.loads(proposal.affectedProgrammes),
                "session": proposal.proposedImplementationSession
            }),
            createdBy=user.userId,
            createdAt=datetime.utcnow(),
            submissionTimestamp=datetime.utcnow(),
            isImmutable=True
        )
        db.add(snapshot)
    else:
        # Seal current version
        latest_version.isImmutable = True
        latest_version.submissionTimestamp = datetime.utcnow()

    # Update proposal state & assign pending action
    proposal.currentStatus = "Submitted / Under Review"
    proposal.currentWorkflowStage = first_stage.stageName
    proposal.currentResponsibleRole = first_stage.responsibleRole
    proposal.lastUpdatedAt = datetime.utcnow()

    # Create pending action
    action = PendingAction(
        actionId=f"PA-{uuid.uuid4().hex[:8].upper()}",
        proposalId=proposal_id,
        stageId=first_stage.stageId,
        actionType="Review Proposal",
        status="Pending",
        assignedRole=first_stage.responsibleRole,
        createdAt=datetime.utcnow()
    )
    db.add(action)

    # Log audit event and notify
    log_audit_event(db, user.userId, "PROPOSAL_SUBMITTED", "CurriculumProposal", proposal_id, "SUCCESS")
    create_notification(
        db,
        first_stage.responsibleRole,
        proposal_id,
        "PROPOSAL_SUBMITTED",
        f"Proposal '{proposal.title}' has been submitted and is awaiting your review at {first_stage.stageName}."
    )

    db.commit()
    db.refresh(proposal)
    return proposal

def compare_proposal_versions(db: Session, proposal_id: str, ver_a_no: int, ver_b_no: int) -> Dict[str, Any]:
    ver_a = db.query(ProposalVersion).filter(
        ProposalVersion.proposalId == proposal_id,
        ProposalVersion.versionNo == ver_a_no
    ).first()
    ver_b = db.query(ProposalVersion).filter(
        ProposalVersion.proposalId == proposal_id,
        ProposalVersion.versionNo == ver_b_no
    ).first()

    if not ver_a or not ver_b:
        raise HTTPException(status_code=404, detail="One or both proposal versions not found")

    fields = ["academicRationale", "prerequisites", "credits", "syllabusChangeDescription", "resourceImplications"]
    changes = {}
    for f in fields:
        val_a = getattr(ver_a, f)
        val_b = getattr(ver_b, f)
        if val_a != val_b:
            changes[f] = {"from": val_a, "to": val_b}

    return {
        "proposalId": proposal_id,
        "versionA": ver_a_no,
        "versionB": ver_b_no,
        "changes": changes
    }
