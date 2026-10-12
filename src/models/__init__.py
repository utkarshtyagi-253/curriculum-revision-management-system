from datetime import datetime
import json
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from src.database import Base

class User(Base):
    __tablename__ = "users"
    userId = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    passwordHash = Column(String(255), nullable=False)
    accountStatus = Column(String(20), default="ACTIVE")  # ACTIVE, INACTIVE, SUSPENDED
    department = Column(String(50), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    lastUpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")

class Role(Base):
    __tablename__ = "roles"
    roleId = Column(String(50), primary_key=True)
    roleName = Column(String(100), unique=True, nullable=False)
    roleDescription = Column(String(255), nullable=True)
    permissions = Column(Text, default="[]")  # JSON string of permissions

    user_roles = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")

class UserRole(Base):
    __tablename__ = "user_roles"
    id = Column(Integer, primary_key=True, autoincrement=True)
    userId = Column(String(50), ForeignKey("users.userId"), nullable=False)
    roleId = Column(String(50), ForeignKey("roles.roleId"), nullable=False)
    assignedBy = Column(String(50), nullable=True)
    assignedDate = Column(DateTime, default=datetime.utcnow)
    isActive = Column(Boolean, default=True)

    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")

class Department(Base):
    __tablename__ = "departments"
    departmentId = Column(String(50), primary_key=True)
    departmentName = Column(String(100), nullable=False)
    departmentCode = Column(String(20), unique=True, nullable=False)
    isActive = Column(Boolean, default=True)

class Programme(Base):
    __tablename__ = "programmes"
    programmeId = Column(String(50), primary_key=True)
    programmeName = Column(String(100), nullable=False)
    programmeCode = Column(String(20), unique=True, nullable=False)
    departmentId = Column(String(50), ForeignKey("departments.departmentId"), nullable=False)
    degreeLevel = Column(String(50), default="UG")  # UG, PG, PhD
    isActive = Column(Boolean, default=True)

class Course(Base):
    __tablename__ = "courses"
    courseId = Column(String(50), primary_key=True)
    courseCode = Column(String(20), unique=True, nullable=False)
    courseTitle = Column(String(150), nullable=False)
    credits = Column(Integer, default=3)
    departmentId = Column(String(50), ForeignKey("departments.departmentId"), nullable=False)
    currentStatus = Column(String(20), default="ACTIVE")

class Committee(Base):
    __tablename__ = "committees"
    committeeId = Column(String(50), primary_key=True)
    committeeName = Column(String(100), nullable=False)
    committeeType = Column(String(50), nullable=False)  # DCC, BOS, Senate
    scope = Column(String(100), default="DEPARTMENT")
    isActive = Column(Boolean, default=True)

class CurriculumProposal(Base):
    __tablename__ = "curriculum_proposals"
    proposalId = Column(String(50), primary_key=True)
    proposalType = Column(String(50), nullable=False)  # NEW_COURSE, COURSE_MODIFICATION, COURSE_DISCONTINUATION, PROGRAMME_STRUCTURE
    title = Column(String(255), nullable=False)
    ownerId = Column(String(50), ForeignKey("users.userId"), nullable=False)
    departmentId = Column(String(50), ForeignKey("departments.departmentId"), nullable=False)
    affectedProgrammes = Column(Text, default="[]")  # JSON string list
    currentStatus = Column(String(50), default="Draft")  # Draft, Submitted / Under Review, Returned for Revision, Committee Review, Approved, Rejected
    currentWorkflowStage = Column(String(50), nullable=True)
    currentResponsibleRole = Column(String(50), nullable=True)
    proposedImplementationSession = Column(String(50), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    lastUpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    versions = relationship("ProposalVersion", back_populates="proposal", cascade="all, delete-orphan")
    documents = relationship("SupportingDocument", back_populates="proposal", cascade="all, delete-orphan")
    actions = relationship("ReviewAction", back_populates="proposal", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="proposal", cascade="all, delete-orphan")

class ProposalVersion(Base):
    __tablename__ = "proposal_versions"
    versionId = Column(String(50), primary_key=True)
    proposalId = Column(String(50), ForeignKey("curriculum_proposals.proposalId"), nullable=False)
    versionNo = Column(Integer, nullable=False)
    academicRationale = Column(Text, nullable=True)
    prerequisites = Column(Text, nullable=True)
    credits = Column(Integer, nullable=True)
    syllabusChangeDescription = Column(Text, nullable=True)
    resourceImplications = Column(Text, nullable=True)
    structuredFields = Column(Text, default="{}")  # JSON data
    createdBy = Column(String(50), ForeignKey("users.userId"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    submissionTimestamp = Column(DateTime, nullable=True)
    isImmutable = Column(Boolean, default=False)

    proposal = relationship("CurriculumProposal", back_populates="versions")

class SupportingDocument(Base):
    __tablename__ = "supporting_documents"
    documentId = Column(String(50), primary_key=True)
    proposalId = Column(String(50), ForeignKey("curriculum_proposals.proposalId"), nullable=False)
    versionId = Column(String(50), nullable=True)
    fileName = Column(String(255), nullable=False)
    fileType = Column(String(50), nullable=False)
    fileReference = Column(String(255), nullable=False)
    fileSize = Column(Integer, default=0)
    uploadedBy = Column(String(50), nullable=False)
    uploadedTimestamp = Column(DateTime, default=datetime.utcnow)

    proposal = relationship("CurriculumProposal", back_populates="documents")

class WorkflowDefinition(Base):
    __tablename__ = "workflow_definitions"
    workflowId = Column(String(50), primary_key=True)
    workflowName = Column(String(100), nullable=False)
    proposalTypeScope = Column(String(100), default="ALL")
    isActive = Column(Boolean, default=True)
    version = Column(String(20), default="1.0")

    stages = relationship("WorkflowStage", back_populates="workflow", order_by="WorkflowStage.stageSequence", cascade="all, delete-orphan")

class WorkflowStage(Base):
    __tablename__ = "workflow_stages"
    stageId = Column(String(50), primary_key=True)
    workflowId = Column(String(50), ForeignKey("workflow_definitions.workflowId"), nullable=False)
    stageSequence = Column(Integer, nullable=False)
    stageName = Column(String(100), nullable=False)
    responsibleRole = Column(String(50), nullable=False)
    permittedActions = Column(Text, default="[\"Recommend\", \"Return\", \"Reject\"]")  # JSON list
    mandatoryFlag = Column(Boolean, default=True)

    workflow = relationship("WorkflowDefinition", back_populates="stages")

class ReviewAction(Base):
    __tablename__ = "review_actions"
    reviewActionId = Column(String(50), primary_key=True)
    proposalId = Column(String(50), ForeignKey("curriculum_proposals.proposalId"), nullable=False)
    proposalVersionId = Column(String(50), nullable=False)
    stageId = Column(String(50), nullable=False)
    reviewerId = Column(String(50), nullable=False)
    actionType = Column(String(50), nullable=False)  # Recommend, Return for Revision, Comment
    commentReason = Column(Text, nullable=True)
    actionTimestamp = Column(DateTime, default=datetime.utcnow)

    proposal = relationship("CurriculumProposal", back_populates="actions")

class PendingAction(Base):
    __tablename__ = "pending_actions"
    actionId = Column(String(50), primary_key=True)
    proposalId = Column(String(50), nullable=False)
    stageId = Column(String(50), nullable=False)
    actionType = Column(String(50), nullable=False)
    status = Column(String(20), default="Pending")  # Pending, Completed, Cancelled
    assignedRole = Column(String(50), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

class StakeholderInvitation(Base):
    __tablename__ = "stakeholder_invitations"
    invitationId = Column(String(50), primary_key=True)
    proposalId = Column(String(50), nullable=False)
    inviteeEmail = Column(String(100), nullable=False)
    stakeholderCategory = Column(String(50), nullable=False)  # Student, Alumni, Industry, External Expert
    invitedBy = Column(String(50), nullable=False)
    validFromDate = Column(DateTime, default=datetime.utcnow)
    expiryDate = Column(DateTime, nullable=True)
    status = Column(String(20), default="ACTIVE")

class Feedback(Base):
    __tablename__ = "feedbacks"
    feedbackId = Column(String(50), primary_key=True)
    proposalId = Column(String(50), nullable=False)
    proposalVersionId = Column(String(50), nullable=False)
    authorInvitationId = Column(String(50), nullable=True)
    parentFeedbackId = Column(String(50), nullable=True)
    feedbackText = Column(Text, nullable=False)
    createdTimestamp = Column(DateTime, default=datetime.utcnow)

class CommitteeMeeting(Base):
    __tablename__ = "committee_meetings"
    meetingId = Column(String(50), primary_key=True)
    committeeId = Column(String(50), nullable=False)
    meetingRef = Column(String(100), nullable=False)
    meetingDate = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)

class Decision(Base):
    __tablename__ = "decisions"
    decisionId = Column(String(50), primary_key=True)
    proposalId = Column(String(50), ForeignKey("curriculum_proposals.proposalId"), nullable=False)
    proposalVersionId = Column(String(50), nullable=False)
    meetingId = Column(String(50), nullable=True)
    decisionType = Column(String(50), nullable=False)  # Recommendation, Conditional Approval, Return, Rejection, Final Approval
    decisionReason = Column(Text, nullable=True)
    conditions = Column(Text, nullable=True)
    votingSummary = Column(Text, nullable=True)
    recordedBy = Column(String(50), nullable=False)
    decisionTimestamp = Column(DateTime, default=datetime.utcnow)

    proposal = relationship("CurriculumProposal", back_populates="decisions")

class Notification(Base):
    __tablename__ = "notifications"
    notificationId = Column(String(50), primary_key=True)
    recipientId = Column(String(50), nullable=False)  # user ID or role name
    proposalId = Column(String(50), nullable=False)
    eventType = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    createdTimestamp = Column(DateTime, default=datetime.utcnow)
    isRead = Column(Boolean, default=False)

class ImplementationMilestone(Base):
    __tablename__ = "implementation_milestones"
    milestoneId = Column(String(50), primary_key=True)
    proposalId = Column(String(50), nullable=False)
    milestoneTitle = Column(String(200), nullable=False)
    targetDate = Column(DateTime, nullable=True)
    completionDate = Column(DateTime, nullable=True)
    status = Column(String(50), default="Not Started")  # Not Started, In Progress, Completed, Delayed
    evidenceReference = Column(String(255), nullable=True)
    updatedBy = Column(String(50), nullable=False)
    updatedTimestamp = Column(DateTime, default=datetime.utcnow)

class AuditEvent(Base):
    __tablename__ = "audit_events"
    auditId = Column(String(50), primary_key=True)
    actorId = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    objectType = Column(String(50), nullable=False)
    objectId = Column(String(50), nullable=False)
    result = Column(String(20), default="SUCCESS")
    timestamp = Column(DateTime, default=datetime.utcnow)
    metadataJson = Column(Text, default="{}")
