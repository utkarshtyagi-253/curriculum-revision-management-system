# React application (Assignment 05)

The implementation uses React 19 and Vite, an Express API and SQLite. The API implements the submission, review, decision and pending-action interactions in Assignment 05. The Python prototype remains available separately.

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
9. Administrator views workflow configuration and manages department/course master data.

## Validation

```powershell
npm run build --prefix client
npm test --prefix server
```

Tests use an in-memory database and never reset the development database. Regression coverage includes snapshot preservation on resubmission, partial draft saves, invalid action rollback, authority/stage checks, final approval, actual document bytes and milestone evidence validation.

## Architecture and scope

React calls `/api` through Vite's proxy. API routes delegate to ProposalService, WorkflowService and CommitteeService. Transaction boundaries keep snapshots, decisions, pending actions, notifications and audits consistent when a transition fails. SQLite stores document data URLs for this small demonstration.

Institutional SSO, email delivery, ERP write-back and production file storage are external integrations and are not connected. Workflow configuration is shown read-only; master-data editing covers departments and courses. Invited external-stakeholder onboarding and user/role administration remain outside this implementation.

Dependency audit: compatible npm audit fixes were applied. Remaining advisories require major dependency upgrades; review them before a public deployment.
