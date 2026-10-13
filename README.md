# Curriculum Revision Management System (CRMS)

[![CI Test Suite](https://github.com/utkarshtyagi-253/curriculum-revision-management-system/actions/workflows/ci.yml/badge.svg)](https://github.com/utkarshtyagi-253/curriculum-revision-management-system/actions/workflows/ci.yml)
[![Course](https://img.shields.io/badge/Course-CS314%20Software%20Development%20Laboratory-blue.svg)](https://lnmiit.ac.in)
[![Institution](https://img.shields.io/badge/Institution-LNMIIT%20Jaipur-orange.svg)](https://lnmiit.ac.in)
[![Team ID](https://img.shields.io/badge/Team-T017-green.svg)](#team-details)
[![Release](https://img.shields.io/badge/Release-Assignment%2001%20%26%2002%20Baseline-purple.svg)](#assignments-deliverables)

> A controlled, transparent, role-based platform for proposing, reviewing, approving, versioning, and implementing curriculum changes across academic units.

---

## 👥 Team Details (Team T017)

| Name | Roll Number | Primary Assignment 1 & 2 Responsibilities |
|---|---|---|
| **Utkarsh** | **24UCC096** | **Requirements & Analysis Lead** — User classes, core proposal, review and access-control functional requirements, business rules, validation review. |
| **Piyush** | **24UCC097** | **Workflow & Architecture Lead** — System-context and proposal-lifecycle modeling, workflow, versioning, data requirements, detailed use-case behavior. |
| **Yash** | **24UCC099** | **Documentation & Traceability Lead** — Major use-case catalogue, user stories, acceptance criteria, MoSCoW prioritization, traceability mapping, SRS baseline/versioning. |
| **Mehul** | **24UCC100** | **Quality & NFR Lead** — Performance, security, usability, reliability, auditability requirements, quality examples, change-management rules, quality checks. |

* **Development Model:** Agile — Iterative and Incremental Development
* **Course:** CS314: Software Development Laboratory, The LNM Institute of Information Technology, Jaipur

---

## 📑 Assignments Deliverables (Up to Assignment 02)

| Deliverable | Path / Document | Status |
|---|---|---|
| **Lab Assignment 1: Project Identification & Initial Definition** | [docs/assignment-01/Project-Definition.md](docs/assignment-01/Project-Definition.md) | ✅ Complete |
| **Lab Assignment 2: Requirements Specification (SRS v1.0)** | [docs/requirements/SRS-v1.0.md](docs/requirements/SRS-v1.0.md) | ✅ Complete |
| **System Context Model** | [docs/requirements/diagrams/System-Context.png](docs/requirements/diagrams/System-Context.png) | ✅ Complete |
| **Official Assignment 1 PDF** | [docs/pdf/T017_Assignment01.pdf](docs/pdf/T017_Assignment01.pdf) | ✅ Archived |
| **Official Assignment 2 PDF** | [docs/pdf/T017_ASSIGNMENT02.pdf](docs/pdf/T017_ASSIGNMENT02.pdf) | ✅ Archived |
| **Official Combined Assignment 1 & 2 PDF** | [docs/pdf/T017_CS314_Assignment_01_02_Complete.pdf](docs/pdf/T017_CS314_Assignment_01_02_Complete.pdf) | ✅ Archived |
| **Functional Prototype Implementation & Test Suite** | [src/](src/) & [	ests/](tests/) | ✅ Verified |

---

## 🎯 Executive Summary & Problem Context

Academic curriculum revisions involve multiple stakeholders, documents, review stages, and formal committee approvals. In legacy setups, these activities rely on fragmented email threads, meeting minutes, spreadsheets, and physical paperwork. This causes:
- Ambiguity regarding the latest active proposal version.
- Overlooked reviewer comments and lost academic rationale.
- Lack of auditability and unclear decision ownership.
- Implementation delays after formal approval.

**The Curriculum Revision Management System (CRMS)** centralizes the entire lifecycle into an authoritative, role-based workflow platform. It preserves proposal context, enforces sequential committee reviews, ensures immutable version snapshotting, and tracks post-approval academic records.

---

## 🏛️ System Context & Stakeholder Matrix

![System Context](docs/requirements/diagrams/System-Context.png)

### Key Stakeholders & Permissions

1. **Faculty Proposer:** Creates, drafts, edits, submits proposals (new course, course modification, discontinuation, program structure changes), and resubmits returned revisions.
2. **Programme Coordinator / HOD:** Conducts initial department-level scrutiny, validates completeness, records recommendations, or returns proposals for revision with mandatory reasons.
3. **Department Curriculum Committee (DCC) / Board of Studies (BOS):** Evaluates academic merit, attaches meeting references, records committee feedback, conditional approvals, or recommendations.
4. **Invited Stakeholders (Students, Alumni, Industry):** Submit invited contextual feedback on syllabus relevance without decision authority.
5. **Academic Office:** Verifies institutional compliance, schedules formal review bodies, records official decisions, and tracks post-approval implementation milestones.
6. **Senate / Academic Council:** Highest institutional authority granting final approval or rejection.
7. **System Administrator:** Configures workflow stages, manages academic master data (departments, programs, courses), and audits platform operations.

---

## ⚙️ Core System Architecture & Features

### 1. Functional Requirements Coverage (FR-001 to FR-048)
- **Authentication & RBAC (FR-001 — FR-006):** JWT-based secure sessions, server-side permission validation, obscured credential error messaging.
- **Academic Master Data & Workflows (FR-007 — FR-008):** Configurable stages, responsible roles, and department structures.
- **Proposal Lifecycle & Drafts (FR-009 — FR-017):** Draft saving, comprehensive field validation (rationale, prerequisites, credits, syllabus changes, resource needs, implementation session).
- **Review & Routing (FR-018 — FR-024):** Sequential review routing, non-bypassable workflow enforcement, reason-required returns.
- **Immutable Version History (FR-025 — FR-027):** Automated version snapshotting on submission and resubmission; automated field-by-field diff comparison.
- **Committee Decisions (FR-031 — FR-035):** Formal decisions (Recommendation, Conditional Approval, Return, Rejection, Final Approval) with meeting context and conditions.
- **Auditing & Timelines (FR-045 — FR-048):** Immutable audit event logging with actor, timestamp, action type, and status.

### 2. Business Rules Enforced
- **BR-001 / BR-002:** Strict role-based permissions; admin-only configuration.
- **BR-003:** Proposal owner can modify content **only** in Draft or Returned for Revision status.
- **BR-004:** Incomplete proposals are rejected at submission; all mandatory fields must be validated.
- **BR-005 / BR-006:** Every submission/resubmission seals an immutable snapshot (ersionNo), preserving all earlier versions.
- **BR-007 / BR-010:** Review actions restricted to the designated role for the active stage.
- **BR-008:** Return for Revision and Rejection require an explicit written reason.
- **BR-009:** Conditional Approval requires explicitly recorded condition(s).
- **BR-017:** Audit entries are immutable and system-generated.

---

## 🗄️ Domain Data Model (20 Core Entities)

`
User (16.1) <--- UserRole (16.3) ---> Role (16.2)
   |
Department (16.4) <--- Programme (16.5) / Course (16.6)
   |
CurriculumProposal (16.8)
   ├── ProposalVersion (16.9) [1..*] (Immutable Snapshots)
   ├── SupportingDocument (16.10) [0..*]
   ├── ReviewAction (16.13) [0..*]
   ├── Decision (16.17) [0..*] <--- CommitteeMeeting (16.16)
   └── ImplementationMilestone (16.19) [0..*]

WorkflowDefinition (16.11) ---> WorkflowStage (16.12) ---> PendingAction (16.13)
Notification (16.18) | AuditEvent (16.20) | Feedback (16.15)
`

---

## 🚀 Prototype Quick Start & Installation

### 1. Prerequisites
- Python 3.10+ (Tested on Python 3.11, 3.12, 3.13)
- Git

### 2. Installation
`ash
git clone https://github.com/utkarshtyagi-253/curriculum-revision-management-system.git
cd curriculum-revision-management-system

# Install dependencies
pip install -r requirements.txt
`

### 3. Initialize & Seed Database
`ash
python scripts/seed_data.py
`

### 4. Run the API Server
`ash
uvicorn src.main:app --reload --port 8000
`
- Interactive Swagger UI: **http://127.0.0.1:8000/docs**
- OpenAPI Specification: **http://127.0.0.1:8000/openapi.json**

### 5. Run Automated Tests
`ash
pytest -v
`

---

## 🧪 Pre-Configured Test Accounts (Seed Data)

| Role | Email | Password | Responsible Workflow Stage |
|---|---|---|---|
| **System Administrator** | dmin@lnmiit.ac.in | Admin@123 | Master Data & Configuration |
| **Faculty Proposer** | aculty@lnmiit.ac.in | Faculty@123 | Proposal Drafting & Submission |
| **Programme Coordinator / HOD** | hod@lnmiit.ac.in | Hod@123 | Department Review |
| **DCC Reviewer** | dcc@lnmiit.ac.in | Dcc@123 | DCC / BOS Review |
| **Academic Office** | cademics@lnmiit.ac.in | Academic@123 | Academic Scrutiny & Milestones |
| **Senate Member** | senate@lnmiit.ac.in | Senate@123 | Institutional Final Approval |

---

## 📂 Repository Directory Structure

`	ext
curriculum-revision-management-system/
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI automated testing pipeline
├── docs/
│   ├── assignment-01/
│   │   └── Project-Definition.md      # Lab Assignment 1: Project Identification & Definition
│   ├── requirements/
│   │   ├── SRS-v1.0.md                # Lab Assignment 2: Requirements Specification (SRS v1.0)
│   │   └── diagrams/
│   │       └── System-Context.png     # Official System Context Diagram
│   └── pdf/                           # Archival PDF submission documents
│       ├── T017_Assignment01.pdf
│       ├── T017_ASSIGNMENT02.pdf
│       └── T017_CS314_Assignment_01_02_Complete.pdf
├── src/
│   ├── api/                           # REST API Endpoints (Auth, Master Data, Proposals)
│   │   ├── auth.py
│   │   ├── master_data.py
│   │   └── proposals.py
│   ├── models/                        # 20 SQLAlchemy domain entities matching SRS §16
│   ├── schemas/                       # Pydantic validation schemas
│   ├── services/                      # Business rules & workflow lifecycle engine
│   │   ├── auth_service.py
│   │   ├── audit_service.py
│   │   ├── proposal_service.py
│   │   └── workflow_service.py
│   ├── config.py
│   ├── database.py
│   └── main.py                        # FastAPI web application entrypoint
├── tests/                             # Pytest automated test suite
│   ├── test_auth.py
│   ├── test_proposals.py
│   └── test_workflow.py
├── scripts/
│   └── seed_data.py                   # Master seed data script
├── requirements.txt
├── .gitignore
└── README.md                          # Repository documentation
`

---

## 📜 AI Usage Declaration

AI tools (specifically ChatGPT) were utilized in supporting capacities for formatting assistance, language refinement, and completeness verification in accordance with the course policy. All system requirements, workflows, architectural designs, and implementations were prepared, reviewed, and verified by Team T017.

**Team Representative:** YASH GUPTA  
**Date:** September 2026

## React application
See [REACT-README.md](REACT-README.md) for the Assignment 05 React implementation, startup commands, demo accounts, workflow and validation.
