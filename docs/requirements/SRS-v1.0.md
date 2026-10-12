# The LNM Institute of Information Technology, Jaipur

## Software Development Laboratory
**Course Code:** CS314  
**Lab Assignment 2:** Requirements Specification / Initial SRS (v1.0)  
**Project:** Curriculum Revision Management System  
**Team ID:** T017  
**Team Members:** Utkarsh, Piyush, Yash, Mehul  
**Roll Numbers:** 24UCC096, 24UCC097, 24UCC099, 24UCC100  
**Development Model:** Agile - Iterative and Incremental Development  
**Date:** 6 September 2026

---

## Document Purpose and Scope Alignment

This SRS v1.0 transforms the stakeholders, objectives and initial scope established in Lab Assignment 1 into a structured and testable set of software requirements.

The system remains a **web-based workflow, document and approval management system** for curriculum revision. The baseline scope includes secure role-based access, academic master data, structured curriculum revision proposals, supporting documents, configurable review and approval workflow, stakeholder feedback, immutable version history, committee decisions, notifications, implementation tracking, search/filter/dashboard facilities and audit reporting.

The following remain outside the initial release: direct write-back to institute ERP/website/course-registration systems, institutional SSO, cross-university proposal exchange and external government/regulatory approval workflows.

---

# 1. User Classes

## 1.1 Faculty Proposer

Faculty Proposers initiate curriculum revision requests and remain responsible for the academic content of their proposals.

They shall be able to:

- authenticate and access role-permitted functions;
- create proposals for new courses, course modifications, course discontinuation and programme-structure changes;
- enter academic rationale, affected programmes, prerequisites, credits, syllabus changes, resource implications and proposed implementation session;
- save proposals as drafts;
- upload supporting documents;
- submit complete proposals into the configured review workflow;
- view feedback and requested changes;
- create revised versions without overwriting earlier versions;
- track proposal status, current owner and pending action;
- view notifications and the proposal timeline.

## 1.2 Programme Coordinator / HOD

The Programme Coordinator / HOD performs department-level scrutiny before a proposal progresses to later academic review stages.

They shall be able to:

- authenticate;
- view proposals assigned to their department;
- perform completeness and departmental review;
- record comments and recommendations;
- return a proposal for revision;
- recommend or forward a proposal to the next configured stage;
- view current and earlier proposal versions;
- view pending actions and relevant notifications.

## 1.3 Department Curriculum Committee / Board of Studies Reviewer

Committee reviewers examine academic merit and record formal review outcomes at committee level.

They shall be able to:

- authenticate;
- access proposals scheduled or assigned to their committee;
- review proposal content and supporting documents;
- record comments, recommendations and requested changes;
- view version history and compare successive versions;
- associate review activity with a committee meeting where applicable;
- record recommendation, conditional approval, return or rejection decisions permitted by their role.

## 1.4 Invited Stakeholder

This class includes Students, Alumni, Industry representatives and External Experts who are invited to provide feedback.

They shall be able to:

- access only the proposal material explicitly shared with them;
- submit feedback within the permitted invitation period;
- view their own submitted feedback and proposer/reviewer responses when permitted.

Invited Stakeholders shall not obtain committee approval authority.

## 1.5 Academic Office

The Academic Office manages policy compliance, formal review coordination, official records and post-approval implementation tracking.

They shall be able to:

- authenticate;
- verify policy and process compliance;
- view and manage proposals requiring Academic Office action;
- schedule or reference formal review meetings;
- maintain official decision records;
- send or review pending-action notifications;
- create and update implementation milestones after approval;
- upload or reference implementation evidence;
- search proposals and generate auditable reports.

## 1.6 Senate / Academic Council

The Senate / Academic Council provides the final institutional decision for revisions that require the highest level of authority.

They shall be able to:

- authenticate;
- view the formal proposal package and preceding recommendations;
- record final approval or rejection where the configured workflow requires their authority;
- record reasons, conditions or decision notes;
- view the final proposal version and decision history.

## 1.7 System Administrator

The System Administrator manages technical configuration and access control.

They shall be able to:

- authenticate;
- create, activate, deactivate and update user accounts;
- assign one or more approved roles to users;
- manage departments, programmes, courses and committee master data;
- configure the permitted workflow stages and role-to-stage mappings;
- manage access-control configuration;
- view system-level audit information required for administration.

---

# 2. System Context

The Curriculum Revision Management System acts as the authoritative workflow and record-management platform between academic proposers, reviewers, decision-making bodies, invited stakeholders and administrators.

![System Context Diagram](diagrams/System-Context.png)

### Context-Level Information Flows

| External Actor | Information Sent to System | Information Received from System |
|---|---|---|
| Faculty Proposer | Drafts, proposals, revised versions, supporting documents, responses | Status, feedback, requested changes, notifications |
| Programme Coordinator / HOD | Completeness review, comments, return/recommend/forward action | Assigned proposals, current version, pending-action list |
| DCC / Board of Studies | Review comments, recommendations, decisions | Proposal versions, documents, meeting context |
| Invited Stakeholders | Invited feedback | Invitation and permitted proposal context |
| Academic Office | Policy checks, formal review scheduling, implementation updates | Workflow status, official records, reports |
| Senate / Academic Council | Final approval/rejection and decision notes | Formal proposal package and prior recommendations |
| System Administrator | Users, roles, workflow configuration, master data | Administrative status and audit information |

---

# 3. Functional Requirements

## 3.1 Authentication and Role-Based Access

**FR-001 — User Login**  
The system shall allow a registered user to authenticate using valid credentials.

**FR-002 — Authentication Failure**  
The system shall notify a user when authentication fails without revealing whether a specific account, password or role value was correct.

**FR-003 — Logout**  
The system shall allow an authenticated user to terminate the current session.

**FR-004 — Role Assignment**  
The system shall allow a System Administrator to assign one or more approved roles to a user.

**FR-005 — Role-Based Dashboard**  
The system shall present dashboard information and pending actions according to the authenticated user's assigned role or roles.

**FR-006 — Role-Based Authorization**  
The system shall prevent a user from viewing or modifying proposal data, decisions, comments or administrative functions for which the user lacks permission.

## 3.2 Academic Master Data and Workflow Configuration

**FR-007 — Manage Academic Master Data**  
The system shall allow a System Administrator to create and update department, programme, course and committee master data required by curriculum proposals.

**FR-008 — Configure Review Workflow**  
The system shall allow a System Administrator to configure the ordered review stages, permitted actions and responsible role for each stage used by the initial prototype.

## 3.3 Proposal Creation and Draft Management

**FR-009 — Create Curriculum Revision Proposal**  
The system shall allow an authorized Faculty Proposer to create a new curriculum revision proposal.

**FR-010 — Select Proposal Type**  
The system shall require the proposer to classify a proposal as a new course, course modification, course discontinuation or programme-structure change.

**FR-011 — Capture Structured Proposal Details**  
The system shall capture the proposal title, academic rationale, affected programme(s), prerequisites, credits, syllabus changes, resource implications and proposed implementation session where applicable.

**FR-012 — Save Draft Proposal**  
The system shall allow a proposer to save an incomplete proposal as a draft without submitting it for review.

**FR-013 — Upload Supporting Documents**  
The system shall allow an authorized proposer to attach supported documents to a draft or returned proposal subject to configured file type and size limits.

**FR-014 — Edit Draft or Returned Proposal**  
The system shall allow the proposal owner to edit a proposal only while it is in Draft or Returned for Revision status.

**FR-015 — Validate Proposal Completeness**  
The system shall validate all mandatory fields and required supporting information before allowing submission.

**FR-016 — Submit Proposal**  
The system shall allow the proposal owner to submit a complete proposal into the configured review workflow.

**FR-017 — Display Proposal Status and Owner**  
The system shall display the current proposal status, current workflow stage, responsible role and pending action to authorized users.

## 3.4 Review, Feedback and Workflow Routing

**FR-018 — Route Submitted Proposal**  
The system shall route a submitted proposal to the first configured review stage and assign the pending action to the role responsible for that stage.

**FR-019 — Review Assigned Proposal**  
The system shall allow an authorized reviewer to open and review a proposal assigned to the reviewer's role or committee.

**FR-020 — Record Review Comment**  
The system shall allow an authorized reviewer to add a contextual comment, recommendation or requested change to the proposal.

**FR-021 — Return for Revision**  
The system shall allow an authorized reviewer to return a proposal to its proposer for revision with a recorded reason.

**FR-022 — Recommend or Forward Proposal**  
The system shall allow an authorized reviewer to recommend or forward a proposal to the next configured workflow stage.

**FR-023 — Resubmit Revised Proposal**  
The system shall allow the proposer to resubmit a returned proposal after creating a new version that addresses requested changes.

**FR-024 — Enforce Workflow Sequence**  
The system shall prevent a proposal from bypassing a mandatory configured review stage unless the workflow configuration explicitly permits that transition.

## 3.5 Version History and Comparison

**FR-025 — Create Version Snapshot**  
The system shall create an immutable version snapshot whenever a proposal is submitted or resubmitted.

**FR-026 — View Version History**  
The system shall allow authorized users to view all saved submission versions with version number, author and timestamp.

**FR-027 — Compare Proposal Versions**  
The system shall allow authorized users to compare two successive proposal versions and identify changed structured fields.

## 3.6 Invited Stakeholder Feedback

**FR-028 — Invite Stakeholder Feedback**  
The system shall allow an authorized academic reviewer or Academic Office user to invite a permitted stakeholder to provide feedback on a proposal.

**FR-029 — Submit Invited Feedback**  
The system shall allow an invited stakeholder to submit feedback only for a proposal for which a valid invitation exists.

**FR-030 — Preserve Feedback Context**  
The system shall associate each feedback item and authorized response with the relevant proposal, version, author and timestamp.

## 3.7 Committee Meetings and Decisions

**FR-031 — Record Meeting Reference**  
The system shall allow an authorized committee or Academic Office user to associate a proposal with a committee meeting reference and meeting date.

**FR-032 — Record Committee Decision**  
The system shall allow an authorized committee user to record a permitted decision such as recommendation, conditional approval, return or rejection.

**FR-033 — Record Decision Reason or Conditions**  
The system shall record the reason, conditions or decision notes required for a formal committee decision.

**FR-034 — Record Recommendation or Voting Summary**  
The system shall allow an authorized committee user to record a recommendation or voting summary when such information is part of the configured process.

**FR-035 — Record Final Institutional Decision**  
The system shall allow the Senate / Academic Council role to record final approval or rejection for proposals whose configured workflow requires that authority.

## 3.8 Notifications and Pending Actions

**FR-036 — Event Notification**  
The system shall create an in-application notification for relevant stakeholders when a proposal is submitted, returned, revised, scheduled, approved, rejected or assigned for action.

**FR-037 — Pending-Action Reminder**  
The system shall identify workflow actions that remain pending beyond a configurable reminder interval and generate a reminder for the responsible role.

## 3.9 Implementation Tracking

**FR-038 — Create Implementation Milestone**  
The system shall allow an authorized Academic Office user to create implementation milestones for an approved proposal.

**FR-039 — Update Implementation Status**  
The system shall allow an authorized Academic Office user to update a milestone or proposal implementation status.

**FR-040 — Record Implementation Evidence**  
The system shall allow an authorized Academic Office user to attach or reference evidence that an approved curriculum change has been implemented.

**FR-041 — Track Completion or Delay**  
The system shall display whether implementation is Not Started, In Progress, Completed or Delayed, together with the latest recorded milestone information.

## 3.10 Search, Dashboard, Timeline and Audit Reporting

**FR-042 — Search Proposals**  
The system shall allow an authorized user to search proposals by proposal ID, title or keyword.

**FR-043 — Filter Proposals**  
The system shall allow an authorized user to filter proposals by department, proposal type, workflow stage, current owner and implementation status as permitted by access rights.

**FR-044 — Status Dashboard**  
The system shall display role-scoped counts of proposals by relevant status and pending-action category.

**FR-045 — Proposal Timeline**  
The system shall display a chronological timeline of major proposal events including submissions, feedback, version creation, review actions, decisions and implementation updates.

**FR-046 — Audit Report**  
The system shall allow an authorized Academic Office or System Administrator user to view or generate an audit-oriented report of proposal actions for a selected proposal or period.

**FR-047 — Record Audit Event**  
The system shall record significant security, workflow, decision and administrative actions with actor, action, affected object and timestamp.

**FR-048 — View Audit Trail**  
The system shall allow only authorized roles to view the audit trail relevant to their administrative responsibility.

---

# 4. Business Rules

| ID | Business Rule |
|---|---|
| BR-001 | Only a System Administrator may create or modify user accounts, role assignments, workflow configuration and core academic master data. |
| BR-002 | A user may hold one or more approved roles, but the permissions exercised in a session shall be limited to those assigned roles. |
| BR-003 | A proposal owner may modify proposal content only while the proposal is in Draft or Returned for Revision status. |
| BR-004 | A proposal cannot be submitted unless all mandatory structured fields and required supporting information for its proposal type are complete. |
| BR-005 | Each submission or resubmission shall create a new immutable proposal version. |
| BR-006 | Earlier submitted versions shall remain viewable to authorized users and shall not be overwritten by later revisions. |
| BR-007 | A submitted proposal shall follow the configured review sequence and shall not skip a mandatory stage. |
| BR-008 | A Return for Revision or Rejection action shall include a recorded reason. |
| BR-009 | A Conditional Approval action shall include the applicable condition(s). |
| BR-010 | Only users assigned to the responsible role or committee for the current workflow stage may perform the stage's formal review action. |
| BR-011 | Invited Students, Alumni, Industry representatives and External Experts may provide feedback only when explicitly invited and shall not receive approval authority. |
| BR-012 | A final institutional approval or rejection may be recorded by Senate / Academic Council only when the configured workflow requires that authority. |
| BR-013 | Implementation milestones may be created only after the proposal has reached an approved state. |
| BR-014 | Committee decisions entered into the system shall be attributable to an authorized committee user and may be verified by the designated Academic Office or committee secretary. |
| BR-015 | Unpublished proposals, reviewer comments and decision records shall be visible only to roles permitted by the workflow and access-control configuration. |
| BR-016 | The proposal's displayed current owner and pending action shall be derived from the active workflow stage. |
| BR-017 | Audit events for formal submissions, review actions, role changes and decisions shall not be editable by ordinary users. |
| BR-018 | Uploaded supporting documents shall comply with configured supported formats and file-size limits. |

---

# 5. Non-Functional Requirements

## 5.1 Performance

**NFR-001:** Under the expected prototype workload, at least 95% of normal authenticated page and CRUD requests should complete within 3 seconds, excluding file upload time.

**NFR-002:** Proposal search and filter operations should return the first result page within 3 seconds for the representative dataset used during acceptance testing.

**NFR-003:** The system should support at least 50 concurrent authenticated prototype users without functional failure.

## 5.2 Security

**NFR-004:** Protected functions and proposal data shall require authentication.

**NFR-005:** Authorization shall be enforced on the server side for every protected operation, not only by hiding user-interface controls.

**NFR-006:** Passwords shall be stored using a secure one-way password hashing mechanism and shall never be stored in plain text.

**NFR-007:** Session identifiers and authentication tokens shall not be exposed in application logs.

**NFR-008:** A user shall be denied access to proposal, feedback, decision and administrative data outside the user's permitted role and workflow scope.

**NFR-009:** Production-style deployment shall use encrypted HTTPS transport where hosting infrastructure supports it.

## 5.3 Usability

**NFR-010:** Major modules shall use consistent navigation, terminology and status labels.

**NFR-011:** Validation and error messages shall identify the field or action requiring correction in understandable language.

**NFR-012:** The user interface shall clearly display proposal status, current owner and pending action on the proposal details view.

**NFR-013:** The web interface should remain usable on common laptop and tablet screen sizes without horizontal scrolling on primary forms.

## 5.4 Reliability

**NFR-014:** A successfully confirmed proposal submission, review action, decision or version creation shall remain persisted after page refresh or user re-login.

**NFR-015:** Failure during document upload or workflow action shall be reported to the user and shall not silently create an incomplete formal action.

**NFR-016:** Version history shall preserve all previously submitted versions even when a newer version is created.

## 5.5 Availability

**NFR-017:** The hosted prototype should be available during scheduled laboratory demonstrations and agreed testing periods except during announced maintenance.

## 5.6 Maintainability

**NFR-018:** The backend shall separate major concerns including authentication, proposal management, workflow, feedback, decisions, notifications, implementation tracking and audit logging.

**NFR-019:** Source code and requirements documentation shall be maintained using Git with meaningful commits.

**NFR-020:** Requirement IDs, use-case IDs and user-story IDs shall remain stable within SRS v1.x unless a controlled change explicitly retires an item.

## 5.7 Scalability

**NFR-021:** The design should allow additional departments, programmes, courses, committees and workflow stages to be added through data/configuration changes rather than fundamental redesign.

## 5.8 Privacy

**NFR-022:** Unpublished proposal content and reviewer comments shall not be made publicly accessible.

**NFR-023:** An invited stakeholder shall receive access only to the proposal information necessary for the specific invitation.

## 5.9 Compatibility

**NFR-024:** The web application should operate correctly on current stable versions of Google Chrome, Microsoft Edge and Mozilla Firefox used in the institute environment.

## 5.10 Auditability

**NFR-025:** Each auditable event shall record at minimum the actor, action, affected object, result and timestamp.

**NFR-026:** Audit and version-history timestamps shall be generated by the server to maintain consistent ordering of events.

---

# 6. Data Requirements

The initial logical data model shall include the following major entities.

## 6.1 User

Important attributes:

- User ID
- Name
- Institutional email
- Password hash / authentication reference
- Account status
- Department
- Created date
- Last updated date

## 6.2 Role

Important attributes:

- Role ID
- Role name
- Role description
- Permission set

## 6.3 UserRole

Important attributes:

- User ID
- Role ID
- Assigned by
- Assigned date
- Active status

## 6.4 Department

Important attributes:

- Department ID
- Department name
- Department code
- Active status

## 6.5 Programme

Important attributes:

- Programme ID
- Programme name
- Programme code
- Department ID
- Degree level
- Active status

## 6.6 Course

Important attributes:

- Course ID
- Course code
- Course title
- Credits
- Department ID
- Current status

## 6.7 Committee

Important attributes:

- Committee ID
- Committee name
- Committee type
- Department / institutional scope
- Active status

## 6.8 CurriculumProposal

Important attributes:

- Proposal ID
- Proposal type
- Title
- Owner / proposer ID
- Department ID
- Affected programme(s)
- Current status
- Current workflow stage
- Current responsible role
- Proposed implementation session
- Created date
- Last updated date

## 6.9 ProposalVersion

Important attributes:

- Version ID
- Proposal ID
- Version number
- Academic rationale
- Prerequisites
- Credits
- Syllabus-change description
- Resource implications
- Structured proposal fields
- Created by
- Created timestamp
- Submission timestamp

## 6.10 SupportingDocument

Important attributes:

- Document ID
- Proposal ID
- Version ID
- File name
- File type
- File reference / storage path
- Uploaded by
- Uploaded timestamp

## 6.11 WorkflowDefinition

Important attributes:

- Workflow ID
- Workflow name
- Proposal type / scope
- Active status
- Version

## 6.12 WorkflowStage

Important attributes:

- Stage ID
- Workflow ID
- Stage sequence
- Stage name
- Responsible role
- Permitted actions
- Mandatory flag

## 6.13 ReviewAction

Important attributes:

- Review Action ID
- Proposal ID
- Proposal Version ID
- Stage ID
- Reviewer ID
- Action type
- Comment / reason
- Action timestamp

## 6.14 StakeholderInvitation

Important attributes:

- Invitation ID
- Proposal ID
- Invitee identity / email
- Stakeholder category
- Invited by
- Valid-from date
- Expiry date
- Status

## 6.15 Feedback

Important attributes:

- Feedback ID
- Proposal ID
- Proposal Version ID
- Author / invitation ID
- Parent feedback ID (for threaded response)
- Feedback text
- Created timestamp

## 6.16 CommitteeMeeting

Important attributes:

- Meeting ID
- Committee ID
- Meeting reference / number
- Meeting date
- Notes / record reference

## 6.17 Decision

Important attributes:

- Decision ID
- Proposal ID
- Proposal Version ID
- Meeting ID
- Decision type
- Decision reason
- Conditions
- Recommendation / voting summary
- Recorded by
- Decision timestamp

## 6.18 Notification

Important attributes:

- Notification ID
- Recipient user / role
- Proposal ID
- Event type
- Message
- Created timestamp
- Read status

## 6.19 ImplementationMilestone

Important attributes:

- Milestone ID
- Proposal ID
- Milestone title
- Target date
- Completion date
- Status
- Evidence reference
- Updated by
- Updated timestamp

## 6.20 AuditEvent

Important attributes:

- Audit Event ID
- Actor ID
- Action
- Object type
- Object ID
- Result
- Timestamp
- Additional metadata

---

# 7. Major Use Cases

| Use Case ID | Use Case | Primary Actor |
|---|---|---|
| UC-001 | Authenticate User | All registered users |
| UC-002 | Manage Users and Roles | System Administrator |
| UC-003 | Manage Academic Master Data | System Administrator |
| UC-004 | Create / Save Draft Proposal | Faculty Proposer |
| UC-005 | Submit Proposal | Faculty Proposer |
| UC-006 | Upload Supporting Documents | Faculty Proposer |
| UC-007 | View Proposal Status and Pending Action | Authorized Stakeholder |
| UC-008 | Perform Department Completeness Review | Programme Coordinator / HOD |
| UC-009 | Review Proposal and Record Feedback | Authorized Reviewer / Committee Member |
| UC-010 | Return Proposal for Revision | Authorized Reviewer |
| UC-011 | Submit Revised Proposal Version | Faculty Proposer |
| UC-012 | View / Compare Proposal Versions | Authorized Reviewer / Proposer |
| UC-013 | Invite Stakeholder Feedback | Authorized Reviewer / Academic Office |
| UC-014 | Submit Invited Feedback | Invited Stakeholder |
| UC-015 | Record Committee Decision | Authorized Committee User |
| UC-016 | Record Final Institutional Decision | Senate / Academic Council |
| UC-017 | Configure Review Workflow | System Administrator |
| UC-018 | View Notifications | All registered users |
| UC-019 | Track Approved Change Implementation | Academic Office |
| UC-020 | Search and Filter Proposals | Authorized Stakeholder |
| UC-021 | View Role-Scoped Dashboard | Authorized Stakeholder |
| UC-022 | View Proposal Timeline | Authorized Stakeholder |
| UC-023 | View Audit Trail / Audit Report | Academic Office / System Administrator |
| UC-024 | Record Committee Meeting Reference | Committee User / Academic Office |
| UC-025 | View Pending Actions | Reviewer / Academic Office / Senate |

---

# 8. Detailed Use Cases

## 8.1 UC-005 — Submit Proposal

**Primary Actor:** Faculty Proposer

### Preconditions

- The Faculty Proposer is authenticated.
- The proposal exists and is owned by the Faculty Proposer.
- The proposal is in Draft or Returned for Revision status.
- The applicable workflow is configured and active.

### Main Flow

1. The proposer opens the proposal.
2. The system displays the current editable proposal data and supporting documents.
3. The proposer selects **Submit**.
4. The system validates all mandatory fields and required information for the selected proposal type.
5. The system creates an immutable proposal-version snapshot.
6. The system changes the proposal from an editable state to Submitted / Under Review.
7. The system determines the first configured review stage and responsible role.
8. The system assigns the pending action to that stage.
9. The system records submission and version events in the timeline and audit trail.
10. The system generates relevant in-application notifications.
11. The system displays confirmation and the updated current status.

### Alternative / Exception Flows

- **A1 — Mandatory data missing:** If required fields are incomplete, the system does not submit the proposal and identifies the missing or invalid fields.
- **A2 — Required document invalid:** If a supporting document violates a configured file rule, the system rejects that file and keeps the proposal editable.
- **A3 — Workflow unavailable:** If no active workflow applies, the system prevents submission and reports that workflow configuration is required.
- **A4 — Unauthorized user:** If the authenticated user does not own the editable proposal, the system denies the submission action.

### Postconditions

- A new immutable submitted proposal version exists.
- The proposal is assigned to the first configured review stage.
- The proposer can no longer alter the submitted version.
- The new status, pending action, timeline event and audit event are visible to authorized users.

---

## 8.2 UC-009 — Review Proposal and Record Feedback

**Primary Actor:** Authorized Reviewer / Committee Member

### Preconditions

- The reviewer is authenticated.
- The reviewer has a role permitted to act at the proposal's current workflow stage.
- The proposal has at least one submitted version.
- The proposal is assigned to the reviewer's role or committee.

### Main Flow

1. The reviewer opens the pending-action list.
2. The system displays proposals assigned to the reviewer's role.
3. The reviewer selects a proposal.
4. The system displays the current proposal version, supporting documents, previous review context and relevant version history.
5. The reviewer evaluates the proposal.
6. The reviewer records a comment, recommendation or requested change.
7. The reviewer selects a permitted workflow action, such as Recommend/Forward or Return for Revision.
8. The system validates that the selected action is permitted at the current stage.
9. If the action is Return for Revision, the system requires a reason.
10. The system records the review action with reviewer identity and timestamp.
11. The system updates proposal status/current owner according to the workflow.
12. The system creates timeline, audit and notification events.

### Alternative / Exception Flows

- **A1 — Reviewer no longer authorized:** The system denies the action if the reviewer's role no longer has permission at the current stage.
- **A2 — Stale proposal stage:** If another authorized action has already moved the proposal to a different stage, the system prevents the stale action and refreshes the current status.
- **A3 — Missing return reason:** The system does not allow Return for Revision until a reason is entered.
- **A4 — Comment-only review:** The reviewer may save a contextual comment without advancing the workflow if the current stage permits comment-only activity.

### Postconditions

- The review action is stored with actor and timestamp.
- The proposal remains at the current stage or moves to the configured next owner depending on the action.
- The proposer or next responsible role receives the relevant notification.
- The event appears in the proposal timeline and audit trail.

---

## 8.3 UC-015 — Record Committee Decision

**Primary Actor:** Authorized Committee User

### Preconditions

- The committee user is authenticated.
- The proposal has reached a workflow stage at which the committee is authorized to decide.
- The current submitted version is available to the committee.
- Meeting context is available when required by the configured process.

### Main Flow

1. The committee user opens the proposal assigned for decision.
2. The system displays the current version, supporting documents, prior recommendations and relevant feedback.
3. The committee user associates the proposal with a meeting reference if required.
4. The committee user selects a permitted decision: Recommendation, Conditional Approval, Return or Rejection.
5. The committee user enters the required reason, conditions or recommendation/voting summary.
6. The system validates that the decision and supporting fields satisfy the business rules.
7. The system records the decision with the proposal version, actor and timestamp.
8. The system updates the workflow to the configured next stage or final state.
9. The system creates timeline and audit events.
10. The system notifies the proposer, Academic Office and next responsible role as applicable.

### Alternative / Exception Flows

- **A1 — Missing reason:** For Return or Rejection, the system prevents saving until a reason is recorded.
- **A2 — Missing conditions:** For Conditional Approval, the system prevents saving until at least one condition is recorded.
- **A3 — Unauthorized decision type:** The system prevents a decision not permitted for the current committee/stage.
- **A4 — Higher authority required:** If the workflow requires Senate / Academic Council approval, the system records the committee outcome as a recommendation and routes the proposal onward rather than marking it finally approved.
- **A5 — Proposal already moved:** If the proposal is no longer at the committee's stage, the system prevents duplicate decision recording.

### Postconditions

- The formal committee decision is stored against the relevant proposal version.
- The decision is visible in the authorized proposal history and audit trail.
- The proposal is routed to the next configured stage or reaches the appropriate final state.

---

# 9. User Stories

**US-001**  
As a registered user, I want to log in securely so that I can access only the curriculum-revision functions permitted to my role.

**US-002**  
As a Faculty Proposer, I want to create and save a structured curriculum revision proposal as a draft so that I can complete it over multiple sessions.

**US-003**  
As a Faculty Proposer, I want to submit a complete proposal so that it enters the formal academic review workflow.

**US-004**  
As a Faculty Proposer, I want to revise a returned proposal without overwriting earlier submitted versions so that the evolution of the proposal remains traceable.

**US-005**  
As a Programme Coordinator / HOD, I want to review proposal completeness and return, recommend or forward it so that incomplete or unsuitable proposals do not bypass departmental scrutiny.

**US-006**  
As a Committee Reviewer, I want to record contextual comments and recommendations so that academic review reasoning remains attached to the proposal.

**US-007**  
As an invited Student, Alumnus, Industry representative or External Expert, I want to provide feedback on a proposal shared with me so that relevant stakeholder perspectives can inform the revision.

**US-008**  
As an Academic Office user, I want to verify process compliance and coordinate formal review records so that the institute has one authoritative record of the revision process.

**US-009**  
As an authorized Committee Member, I want to record a formal decision with reasons or conditions so that the committee outcome is documented and auditable.

**US-010**  
As a Senate / Academic Council member, I want to record the final institutional decision for proposals requiring my authority so that the formal approval process is completed.

**US-011**  
As an authorized proposer or reviewer, I want to view and compare proposal versions so that I can understand exactly what changed between submissions.

**US-012**  
As an authorized stakeholder, I want to receive notifications and see pending actions so that I know when my response is required.

**US-013**  
As an Academic Office user, I want to track implementation milestones and evidence for approved proposals so that approved curriculum changes are followed through to completion.

**US-014**  
As an authorized stakeholder, I want to search, filter and view the proposal timeline/dashboard so that I can quickly understand proposal status and history.

**US-015**  
As a System Administrator, I want to manage users, roles, academic master data and workflow configuration so that the system reflects the institute's approved structure and access rules.

**US-016**  
As an Academic Office or System Administrator user, I want to view auditable records of major actions so that accountability can be demonstrated during review.

---

# 10. Acceptance Criteria

## 10.1 US-003 — Submit a Complete Proposal

| ID | Acceptance Criterion |
|---|---|
| AC-US003-01 | The Faculty Proposer must be authenticated and must own the proposal being submitted. |
| AC-US003-02 | The proposal must be in Draft or Returned for Revision status. |
| AC-US003-03 | The system must prevent submission when mandatory structured fields are incomplete. |
| AC-US003-04 | On successful submission, the system must create a new immutable proposal-version snapshot. |
| AC-US003-05 | The submitted proposal must be assigned to the first configured review stage and responsible role. |
| AC-US003-06 | The submitted version must no longer be editable. |
| AC-US003-07 | The submission must create timeline and audit entries and notify the relevant next actor. |

## 10.2 US-004 — Revise Without Overwriting Earlier Versions

| ID | Acceptance Criterion |
|---|---|
| AC-US004-01 | Revision editing must be available only when the proposal has been returned for revision. |
| AC-US004-02 | The proposer must be able to view the reason and contextual feedback associated with the return action. |
| AC-US004-03 | Resubmission must create a new version number rather than modifying the previous submitted version. |
| AC-US004-04 | Earlier submitted versions must remain viewable to authorized users after resubmission. |
| AC-US004-05 | The version history must show author and timestamp for each submitted version. |
| AC-US004-06 | The system must allow authorized users to compare the new version with the immediately preceding submitted version. |

## 10.3 US-009 — Record a Formal Committee Decision

| ID | Acceptance Criterion |
|---|---|
| AC-US009-01 | The actor must be authenticated and authorized for the proposal's current committee workflow stage. |
| AC-US009-02 | The decision must be stored against the exact proposal version reviewed by the committee. |
| AC-US009-03 | Return or Rejection must not be saved without a reason. |
| AC-US009-04 | Conditional Approval must not be saved without recorded condition(s). |
| AC-US009-05 | When a higher approval stage is required, a committee recommendation must route the proposal to that stage rather than mark it finally approved. |
| AC-US009-06 | A successful decision must create timeline and audit entries and notify relevant stakeholders. |

---

# 11. Requirements Prioritization — MoSCoW

## Must Have

- Authentication and server-side role-based access control — FR-001 to FR-006
- Academic master data required to create valid proposals — FR-007
- Core structured proposal creation, draft saving, document upload and submission — FR-009 to FR-018
- Department/committee review, comments, return, recommendation and workflow enforcement — FR-019 to FR-024
- Immutable version history — FR-025 to FR-026
- Formal committee and final decision recording — FR-031 to FR-035
- Basic in-application event notifications — FR-036
- Implementation milestone/status tracking — FR-038 to FR-041
- Search, filtering, status dashboard and proposal timeline — FR-042 to FR-045
- Core audit event recording and authorized audit access — FR-047 to FR-048

## Should Have

- Configurable workflow stages through administration instead of code changes — FR-008
- Basic field-level comparison between successive proposal versions — FR-027
- Invited stakeholder feedback — FR-028 to FR-030
- Pending-action reminders — FR-037
- Audit-oriented report view — FR-046

## Could Have

- Email delivery in addition to mandatory in-application notifications
- Rich visual diff for uploaded documents in addition to structured-field comparison
- Advanced turnaround-time analytics beyond the basic status dashboard
- Downloadable PDF/CSV audit and proposal summary exports
- Calendar-style visualization for committee scheduling

## Won't Have in Initial Release

- Direct write-back to institute ERP, website or course-registration database
- Institutional single sign-on (SSO)
- Cross-university proposal exchange
- External government/regulatory approval workflows

---

# 12. Requirements Traceability

Initial Requirements Traceability Matrix. Testing references are intentionally marked **TBD** at this stage.

| Functional Requirement | User Story | Use Case | Test |
|---|---|---|---|
| FR-001 | US-001 | UC-001 | TBD |
| FR-002 | US-001 | UC-001 | TBD |
| FR-003 | US-001 | UC-001 | TBD |
| FR-004 | US-015 | UC-002 | TBD |
| FR-005 | US-001, US-014 | UC-021 | TBD |
| FR-006 | US-001, US-015 | UC-001, UC-002 | TBD |
| FR-007 | US-015 | UC-003 | TBD |
| FR-008 | US-015 | UC-017 | TBD |
| FR-009 | US-002 | UC-004 | TBD |
| FR-010 | US-002 | UC-004 | TBD |
| FR-011 | US-002 | UC-004 | TBD |
| FR-012 | US-002 | UC-004 | TBD |
| FR-013 | US-002 | UC-006 | TBD |
| FR-014 | US-002, US-004 | UC-004, UC-011 | TBD |
| FR-015 | US-003 | UC-005 | TBD |
| FR-016 | US-003 | UC-005 | TBD |
| FR-017 | US-003, US-014 | UC-007 | TBD |
| FR-018 | US-003 | UC-005 | TBD |
| FR-019 | US-005, US-006 | UC-008, UC-009 | TBD |
| FR-020 | US-006 | UC-009 | TBD |
| FR-021 | US-005 | UC-010 | TBD |
| FR-022 | US-005, US-006 | UC-009 | TBD |
| FR-023 | US-004 | UC-011 | TBD |
| FR-024 | US-005, US-015 | UC-009, UC-017 | TBD |
| FR-025 | US-004, US-011 | UC-011, UC-012 | TBD |
| FR-026 | US-011 | UC-012 | TBD |
| FR-027 | US-011 | UC-012 | TBD |
| FR-028 | US-006, US-008 | UC-013 | TBD |
| FR-029 | US-007 | UC-014 | TBD |
| FR-030 | US-007 | UC-014 | TBD |
| FR-031 | US-008, US-009 | UC-024 | TBD |
| FR-032 | US-009 | UC-015 | TBD |
| FR-033 | US-009 | UC-015 | TBD |
| FR-034 | US-009 | UC-015 | TBD |
| FR-035 | US-010 | UC-016 | TBD |
| FR-036 | US-012 | UC-018 | TBD |
| FR-037 | US-012 | UC-025 | TBD |
| FR-038 | US-013 | UC-019 | TBD |
| FR-039 | US-013 | UC-019 | TBD |
| FR-040 | US-013 | UC-019 | TBD |
| FR-041 | US-013 | UC-019 | TBD |
| FR-042 | US-014 | UC-020 | TBD |
| FR-043 | US-014 | UC-020 | TBD |
| FR-044 | US-014 | UC-021 | TBD |
| FR-045 | US-014 | UC-022 | TBD |
| FR-046 | US-016 | UC-023 | TBD |
| FR-047 | US-016 | UC-023 | TBD |
| FR-048 | US-016 | UC-023 | TBD |

---

# 13. Requirements Validation

The SRS v1.0 was reviewed against the required quality criteria.

| Validation Criterion | Review Result |
|---|---|
| **Correctness** | Each functional requirement is derived from the stakeholders, objectives or initial scope of Assignment 1. No initial-release requirement introduces ERP write-back, SSO, cross-university exchange or external regulatory approval. |
| **Unambiguity** | Functional requirements use a single, observable “The system shall...” behavior wherever practical. Roles, states and permitted actions are named explicitly. |
| **Completeness** | The requirements cover the full initial scope: access control, master data, proposal creation, documents, workflow, feedback, versioning, decisions, notifications, implementation tracking, search/dashboard/timeline and auditability. |
| **Consistency** | Role permissions, functional requirements and business rules were checked for contradictions. In particular, invited stakeholders can give feedback but cannot approve, and submitted versions are immutable while Draft/Returned proposals remain editable. |
| **Verifiability** | Functional requirements and selected user stories describe observable outcomes that can be checked through UI, API, database or audit-log tests. Quantified NFRs are included where practical. |
| **Feasibility** | The requirements are suitable for a student-developed web prototype using representative data and test adapters. They do not depend on unavailable production ERP, SSO or government systems. |
| **Traceability** | Every FR in this baseline is mapped to at least one user story and use case in the initial RTM. Test references are reserved as TBD for the testing phase. |
| **Prioritization** | Features are classified using MoSCoW and the Won't-Have list matches the agreed initial out-of-scope items. |
| **Modifiability** | Requirements are grouped by functional area and use stable IDs, allowing later changes to be made without renumbering unrelated requirements. |

### Validation Conclusion

The requirements are considered suitable as the **SRS v1.0 baseline** for subsequent UML analysis, system design, implementation and testing. Any later scope or requirement change should update the relevant FR/BR/NFR, affected user story and use case, MoSCoW priority and RTM entry.

---

# AI USAGE POLICY — STUDENT DECLARATION

AI tools may be used as supporting tools for this assignment. The team is responsible for the correctness, consistency and understanding of all submitted requirements.

- We have disclosed the use of AI tools, if any.
- AI-generated suggestions have been reviewed, verified and adapted by the team.
- We understand and can explain the submitted requirements, use cases and user stories.
- We have verified that the requirements are consistent with our project's scope.
- The final SRS represents our team's understanding and decisions.

**AI Tool(s) Used:** ChatGPT  
**Purpose of AI Use:** Assistance in structuring the requirements specification, drafting functional and non-functional requirements, use cases, user stories, acceptance criteria and traceability, and improving clarity of language. All project decisions and final content are to be reviewed and verified by the team.  
**Team ID:** T017  
**Team Representative:** YASH GUPTA  
**Date:** 6 September 2026

---

## GitHub Submission Structure

```text
docs/
└── requirements/
    ├── SRS-v1.0.md
    └── diagrams/
        └── System-Context.png
```

Suggested commits:

```text
docs: add initial requirements specification
docs: finalize SRS v1.0
```
