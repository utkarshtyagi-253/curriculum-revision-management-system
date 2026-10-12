from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    userId: str
    name: str
    email: str
    roles: List[str]
    department: Optional[str] = None

class UserResponse(BaseModel):
    userId: str
    name: str
    email: str
    department: Optional[str]
    roles: List[str]

class ProposalCreate(BaseModel):
    proposalType: str  # NEW_COURSE, COURSE_MODIFICATION, COURSE_DISCONTINUATION, PROGRAMME_STRUCTURE
    title: str
    departmentId: str
    affectedProgrammes: List[str] = []
    academicRationale: Optional[str] = None
    prerequisites: Optional[str] = None
    credits: Optional[int] = None
    syllabusChangeDescription: Optional[str] = None
    resourceImplications: Optional[str] = None
    proposedImplementationSession: Optional[str] = None

class ProposalUpdate(BaseModel):
    title: Optional[str] = None
    affectedProgrammes: Optional[List[str]] = None
    academicRationale: Optional[str] = None
    prerequisites: Optional[str] = None
    credits: Optional[int] = None
    syllabusChangeDescription: Optional[str] = None
    resourceImplications: Optional[str] = None
    proposedImplementationSession: Optional[str] = None

class VersionResponse(BaseModel):
    versionId: str
    versionNo: int
    academicRationale: Optional[str]
    prerequisites: Optional[str]
    credits: Optional[int]
    syllabusChangeDescription: Optional[str]
    resourceImplications: Optional[str]
    createdBy: str
    createdAt: datetime
    isImmutable: bool

class ProposalResponse(BaseModel):
    proposalId: str
    proposalType: str
    title: str
    ownerId: str
    departmentId: str
    affectedProgrammes: List[str]
    currentStatus: str
    currentWorkflowStage: Optional[str]
    currentResponsibleRole: Optional[str]
    proposedImplementationSession: Optional[str]
    createdAt: datetime
    lastUpdatedAt: datetime
    versions: List[VersionResponse] = []

class ReviewActionRequest(BaseModel):
    actionType: str  # Recommend, Return for Revision, Reject
    commentReason: str

class CommitteeDecisionRequest(BaseModel):
    decisionType: str  # Recommendation, Conditional Approval, Return, Rejection, Final Approval
    meetingRef: Optional[str] = None
    reason: Optional[str] = None
    conditions: Optional[str] = None
    votingSummary: Optional[str] = None

class VersionComparisonResponse(BaseModel):
    proposalId: str
    versionA: int
    versionB: int
    changes: Dict[str, Dict[str, Any]]
