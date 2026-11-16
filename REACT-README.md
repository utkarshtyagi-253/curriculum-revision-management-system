# React application

The project application uses React 19 and Vite, an Express API and SQLite to support proposal submission, review, committee decisions, implementation tracking and pending actions. The earlier Python prototype remains available separately.

## Run locally

Use Node.js 22 or newer. From the repository root:

```powershell
npm install --prefix server
npm install --prefix client
npm start --prefix server
```

In a second terminal:

```powershell
npm run dev --prefix client
```

Open http://localhost:5173. The API runs on port 8000, so stop any Python server using that port first. On an empty database, the Node server creates sample accounts and data automatically. Existing data is preserved. `npm run seed --prefix server` resets ALL data to the demo baseline; use only when you intend to reset it.

## Demonstration accounts

| Role | Email | Password |
| --- | --- | --- |
| Faculty | faculty@lnmiit.ac.in | Faculty@123 |
| HOD | hod@lnmiit.ac.in | Hod@123 |
| DCC | dcc@lnmiit.ac.in | Dcc@123 |
| Academic Office | academics@lnmiit.ac.in | Academic@123 |
| Senate | senate@lnmiit.ac.in | Senate@123 |
| Administrator | admin@lnmiit.ac.in | Admin@123 |

Quick-login buttons use these seeded credentials. This is an academic demonstration; remove demo login and configure a deployment JWT secret before deploying publicly.

## Demonstrate the workflow

1. Faculty creates a proposal, saves a draft, attaches a PDF/text/DOCX document (maximum 5 MB), fills academic fields and submits.
2. HOD opens Pending Reviews and recommends or returns with a reason.
3. Faculty edits and resubmits returned proposals. Each submission seals an immutable version; Versions compares the changed fields.
4. DCC records a recommendation or conditional approval with meeting reference, date and any conditions; it can also return or reject with reasons.
5. Academic Office reviews and forwards to Senate.
6. Senate records final approval or rejection. Earlier stages cannot grant final approval, and repeated or stale decisions are blocked.
7. Academic Office creates implementation milestones and updates their status, with evidence required for completion.
8. Notifications preserve read status. Proposal timelines, review/decision history and administrator/Academic Office audit views retain the actor and timestamp.
9. Administrator manages workflow stages, departments/courses, local user accounts and role assignments.

## Validation

```powershell
npm run build --prefix client
npm test --prefix server
```

Tests use an in-memory database and never reset the development database. Regression coverage includes snapshot preservation on resubmission, partial draft saves, invalid action rollback, authority/stage checks, final approval, actual document bytes and milestone evidence validation.

Assignment 06 test cases, execution results, traceability matrix and evidence are documented in [Testing Plan, Execution, RTM and Summary](docs/assignment-06/Testing-Plan-Execution-RTM.md).

## Architecture and scope

React calls `/api` through Vite's proxy. API routes delegate to ProposalService, WorkflowService and CommitteeService. Transaction boundaries keep snapshots, decisions, pending actions, notifications and audits consistent when a transition fails. SQLite stores document data URLs for this small demonstration.

Proposal lists and details are scoped to the owner, responsible review role, administrators and previous review/decision participants. Local user and role management is available to administrators; workflow stages can be added and unused stages removed. External feedback invitations are email-bound, expire, and expose only limited proposal context; because email delivery is not connected, inviters share the generated link manually. In-app reminders are created for pending actions older than three days. Institutional SSO, ERP write-back and production file storage remain external integrations.

Dependency audit: compatible npm audit fixes were applied. Remaining advisories require major dependency upgrades; review them before a public deployment.
