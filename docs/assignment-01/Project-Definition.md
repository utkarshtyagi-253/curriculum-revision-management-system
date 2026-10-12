# The LNM Institute of Information Technology, Jaipur

## Software Development Laboratory
**Course Code:** CS314  
**Lab Assignment 1:** Project Identification and Initial Project Definition  
**Project:** Curriculum Revision Management System  
**Team ID:** T017  
**Team Members:** Utkarsh, Piyush, Yash, Mehul  
**Roll Numbers:** 24UCC096, 24UCC097, 24UCC099, 24UCC100  
**Development Model:** Agile - Iterative and Incremental Development  
**Date:** 30 August 2026  

---

## 1. Project Identification

| Item | Details |
|---|---|
| **Project Name** | Curriculum Revision Management System |
| **Project Type** | Web-based Workflow, Document and Approval Management System |
| **Team ID** | T017 |
| **Team Members** | Utkarsh, Piyush, Yash, Mehul |
| **Roll Numbers** | 24UCC096, 24UCC097, 24UCC099, 24UCC100 |
| **Development Model** | Agile - Iterative and Incremental Development |
| **Primary Users** | Faculty proposers, Department Curriculum Committee, Board of Studies, Academic Office, Senate/Academic Council and System Administrator |
| **Development Team** | Team T017 - student software development team |
| **Course** | Software Development Laboratory (CS314) |
| **Project Objective** | To provide a controlled, transparent and role-based platform for proposing, reviewing, approving, versioning and implementing curriculum changes across academic units. |
| **Expected Outcome** | A working web application that maintains the complete lifecycle and audit trail of every curriculum revision request, from initial proposal to approved implementation. |

---

## 2. Project Background

### Current Problem
Current curriculum revision processes are commonly distributed across email threads, meeting minutes, spreadsheets, shared documents and physical records. A faculty member may submit a proposal in one format, reviewers may provide feedback through several channels, and committees may record decisions separately. As a result, participants cannot easily determine the latest proposal version, pending action, decision rationale or implementation status.

### Proposed Solution
The proposed Curriculum Revision Management System will centralize this process. It will provide structured revision proposals, role-based review workflows, stakeholder feedback, committee decisions, version history, notifications, implementation tracking and a complete audit trail. The platform will support transparency and accountability without replacing the academic authority of curriculum committees.

---

## 3. Project Vision

To create a reliable and transparent digital platform through which every authorized stakeholder can propose, review, decide upon and track curriculum revisions using one authoritative record from initial idea to academic implementation.

---

## 4. Problem Statement

Curriculum revisions involve multiple stakeholders, documents, review stages and formal approvals. When these activities are handled through disconnected files and communication channels, proposals may be delayed, feedback can be overlooked, outdated versions may be reviewed, and decision ownership becomes unclear. The institution therefore needs a role-based software system that preserves proposal context, enforces the approved workflow, records every revision and decision, and provides timely visibility into implementation progress.

---

## 5. Project Objectives

The initial objectives are to:

1. **Role-Based Access:** Provide authenticated, role-based access for proposers, reviewers, committee members, academic administrators and system administrators.
2. **Structured Proposal Creation:** Enable faculty members and departments to create structured proposals for adding, modifying or discontinuing courses, regulations and programme components.
3. **Comprehensive Proposal Data Capture:** Capture the academic rationale, affected programmes, prerequisites, credits, syllabus changes, resource implications and proposed implementation session for each revision.
4. **Configurable Workflow Routing:** Route proposals through configurable review and approval stages while clearly showing the current owner, status and pending action.
5. **Contextual Stakeholder Feedback:** Collect stakeholder comments, recommendations, requested changes and supporting documents without losing their context.
6. **Immutable Version History:** Maintain immutable version history and allow authorized users to compare successive versions of a proposal.
7. **Committee Decision Tracking:** Record committee meetings, decisions, conditions, voting or recommendation summaries and final approval or rejection reasons.
8. **Stakeholder Notifications:** Notify relevant stakeholders when a proposal is submitted, returned, revised, scheduled, approved, rejected or awaiting action.
9. **Implementation Milestones:** Track approved changes through implementation milestones and maintain evidence that academic records have been updated.
10. **Dashboards & Auditing:** Provide search, filters, dashboards and auditable reports for pending proposals, decision turnaround and revision history.

---

## 6. Stakeholders

| Stakeholder | Interest / Role |
|---|---|
| **Faculty Proposer** | Creates curriculum revision proposals, supplies academic justification, responds to feedback and submits revised versions. |
| **Programme Coordinator / HOD** | Performs departmental review, checks completeness and recommends, returns or forwards proposals. |
| **Department Curriculum Committee / Board of Studies** | Reviews academic merit, records feedback and recommendations, and makes committee-level decisions. |
| **Students and Alumni** | May provide invited stakeholder feedback on curriculum relevance and learning experience when permitted. |
| **Industry / External Expert** | Provides invited feedback about professional relevance, emerging skills and employability requirements. |
| **Academic Office** | Checks policy compliance, schedules formal review, maintains official records and tracks implementation. |
| **Senate / Academic Council** | Provides final institutional approval or rejection for revisions requiring the highest authority. |
| **System Administrator** | Manages users, roles, workflow configuration, master data, access control and system availability. |
| **Development Team T017** | Elicits requirements and designs, implements, tests, documents and maintains the software prototype. |

---

## 7. Initial Scope

The Curriculum Revision Management System will initially cover:

- Secure login and role-based access control.
- Academic programme, department, course and committee master data required by proposals.
- Proposal creation for new courses, course modifications, course discontinuation and programme-structure changes.
- Structured proposal fields, supporting-document upload and draft saving.
- Submission, completeness checking, review, return-for-revision, recommendation, approval and rejection workflow.
- Threaded stakeholder feedback and proposer responses.
- Version history with timestamps, authorship and basic comparison of changed proposal fields.
- Committee meeting reference, decision, conditions and reason recording.
- Email or in-application notifications and pending-action reminders.
- Implementation-status tracking after approval.
- Search, filters, status dashboard, proposal timeline and audit reports.

### Initially Out of Scope
To keep the project manageable, the initial release excludes:

- Direct write-back to the institute ERP, website, or course-registration database — requires production API credentials and a formal integration agreement.
- Institutional single sign-on (SSO) — will be simulated via a test authentication adapter until IT grants access.
- Cross-university proposal exchange — requires an inter-institutional data-sharing policy that does not yet exist.
- External government/regulatory approval workflows — outside the institute's internal process and not required for the initial demonstration.

---

## 8. Initial Assumptions

- Users will have reliable internet access and an institute-supported web browser.
- Authorized users will receive valid institutional accounts and one or more approved roles.
- The institute will provide an agreed curriculum revision workflow, proposal templates and role hierarchy for configuration.
- Committee decisions entered into the system will be authorized and verified by the designated Academic Office or committee secretary.
- The initial prototype will use representative sample data instead of complete confidential institutional records.
- Uploaded documents will follow supported formats and configured file-size limits.
- A centralized relational database will be available for proposal, workflow and audit data.
- Stakeholders will review notifications and perform assigned actions within the expected academic schedule.

---

## 9. Initial Constraints

- The project must be completed within the CS314 laboratory schedule by a student development team.
- Access to real confidential curriculum proposals, committee records and institutional identity systems may be limited.
- The first release must use a manageable workflow and cannot model every exceptional academic policy case.
- Requirements may evolve after consultations with faculty, committee members and the Academic Office.
- The system must protect unpublished proposals, reviewer comments and decision records through role-based authorization.
- Development and deployment will rely on the computing infrastructure and software services available to the team.
- External email, institutional single sign-on and ERP integrations may need to be demonstrated through test adapters.
- Testing with every stakeholder category may not be possible; representative users and test accounts will be used.

---

## 10. Initial Success Criteria

The project will be considered successful if the team can demonstrate that:

1. An authorized faculty user can create, save, edit and submit a complete curriculum revision proposal.
2. The submitted proposal follows the configured review sequence and is visible only to users with appropriate roles.
3. Reviewers can provide feedback and the proposer can submit a revised version without overwriting earlier versions.
4. Authorized committee users can record a recommendation, approval, conditional approval, return or rejection with reasons.
5. The system displays an accurate timeline containing submissions, feedback, versions, decisions and responsible actors.
6. Approved proposals can be assigned implementation milestones and tracked to a completed or delayed status.
7. Search, filters and dashboards correctly report proposals by department, type, stage, owner and implementation status.
8. Unauthorized users are prevented from viewing or modifying restricted proposals and committee decisions.
9. All major workflows pass documented functional tests and the repository contains consistent requirements, design and test artifacts.
10. The project is maintained in the team GitHub repository with meaningful commits and contributions from all team members.

---

## AI USAGE POLICY — STUDENT DECLARATION

AI tools may be used as supporting tools for this assignment, but the submitted work must represent the team's own understanding and contribution.

| Item | Details |
|---|---|
| **AI Tool Used** | ChatGPT |
| **Purpose of AI Use** | AI tools were used for language refinement, content organization, and completeness checking while all project decisions and final content were reviewed and prepared by the team. |
| **Team ID** | T017 |
| **Team Member Names** | Utkarsh, Piyush, Yash, Mehul |
| **Date** | 30 Aug 2026 |
| **Team Declaration** | We confirm that the information provided above is accurate and that we accept responsibility for the submitted work. |
| **Team Representative Signature / Confirmation** | YASH GUPTA |

---

> **Submission Note:** This part establishes the initial project baseline for subsequent requirements engineering, SRS preparation, UML modelling, system design, implementation and testing activities.
