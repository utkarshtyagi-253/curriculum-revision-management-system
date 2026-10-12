import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.models import CurriculumProposal, ProposalVersion, User
from src.schemas import (
    ProposalCreate, ProposalUpdate, ProposalResponse, VersionResponse,
    ReviewActionRequest, CommitteeDecisionRequest, VersionComparisonResponse
)
from src.services.auth_service import get_current_user, require_roles
from src.services.proposal_service import (
    create_proposal_draft, edit_proposal, submit_proposal, compare_proposal_versions
)
from src.services.workflow_service import process_review_action, process_committee_decision

router = APIRouter(prefix="/api/proposals", tags=["Proposals"])

def serialize_proposal(p: CurriculumProposal) -> dict:
    return {
        "proposalId": p.proposalId,
        "proposalType": p.proposalType,
        "title": p.title,
        "ownerId": p.ownerId,
        "departmentId": p.departmentId,
        "affectedProgrammes": json.loads(p.affectedProgrammes) if isinstance(p.affectedProgrammes, str) else p.affectedProgrammes,
        "currentStatus": p.currentStatus,
        "currentWorkflowStage": p.currentWorkflowStage,
        "currentResponsibleRole": p.currentResponsibleRole,
        "proposedImplementationSession": p.proposedImplementationSession,
        "createdAt": p.createdAt,
        "lastUpdatedAt": p.lastUpdatedAt,
        "versions": [
            {
                "versionId": v.versionId,
                "versionNo": v.versionNo,
                "academicRationale": v.academicRationale,
                "prerequisites": v.prerequisites,
                "credits": v.credits,
                "syllabusChangeDescription": v.syllabusChangeDescription,
                "resourceImplications": v.resourceImplications,
                "createdBy": v.createdBy,
                "createdAt": v.createdAt,
                "isImmutable": v.isImmutable
            }
            for v in p.versions
        ]
    }

@router.post("", response_model=ProposalResponse)
def create_proposal(
    req: ProposalCreate,
    current_user: User = Depends(require_roles(["Faculty Proposer", "ADMIN"])),
    db: Session = Depends(get_db)
):
    proposal = create_proposal_draft(db, req, current_user)
    return serialize_proposal(proposal)

@router.get("", response_model=List[ProposalResponse])
def list_proposals(
    department: Optional[str] = None,
    status: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(CurriculumProposal)
    if department:
        query = query.filter(CurriculumProposal.departmentId == department)
    if status:
        query = query.filter(CurriculumProposal.currentStatus == status)
    if q:
        query = query.filter(
            CurriculumProposal.title.contains(q) | CurriculumProposal.proposalId.contains(q)
        )
    proposals = query.all()
    return [serialize_proposal(p) for p in proposals]

@router.get("/{proposal_id}", response_model=ProposalResponse)
def get_proposal(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proposal = db.query(CurriculumProposal).filter(CurriculumProposal.proposalId == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return serialize_proposal(proposal)

@router.put("/{proposal_id}", response_model=ProposalResponse)
def update_proposal(
    proposal_id: str,
    req: ProposalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    proposal = edit_proposal(db, proposal_id, req, current_user)
    return serialize_proposal(proposal)

@router.post("/{proposal_id}/submit", response_model=ProposalResponse)
def submit(
    proposal_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    proposal = submit_proposal(db, proposal_id, current_user)
    return serialize_proposal(proposal)

@router.get("/{proposal_id}/versions", response_model=List[VersionResponse])
def get_versions(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    versions = db.query(ProposalVersion).filter(
        ProposalVersion.proposalId == proposal_id
    ).order_by(ProposalVersion.versionNo.asc()).all()
    return versions

@router.get("/{proposal_id}/compare", response_model=VersionComparisonResponse)
def compare_versions(
    proposal_id: str,
    version_a: int = Query(..., alias="versionA"),
    version_b: int = Query(..., alias="versionB"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return compare_proposal_versions(db, proposal_id, version_a, version_b)

@router.post("/{proposal_id}/review", response_model=ProposalResponse)
def review_proposal(
    proposal_id: str,
    req: ReviewActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    proposal = process_review_action(db, proposal_id, req, current_user)
    return serialize_proposal(proposal)

@router.post("/{proposal_id}/decision", response_model=ProposalResponse)
def record_decision(
    proposal_id: str,
    req: CommitteeDecisionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    proposal = process_committee_decision(db, proposal_id, req, current_user)
    return serialize_proposal(proposal)
