# Lab Assignment 06 — Test Plan, Execution, Defects and RTM

**Project:** Curriculum Revision Management System (CRMS)  
**Course:** CS314 — Software Development Laboratory  
**Team:** T017 — Utkarsh, Piyush, Yash, Mehul  
**Selected detailed use cases:** UC-005 Submit Proposal; UC-009 Review Proposal and Record Feedback; UC-015 Record Committee Decision  
**Test date:** 16 November 2026  
**Implementation under test:** React 19 client, Express API and SQLite database

## 1. Objective and scope

This test package carries forward the same three detailed use cases selected in the previous assignments. It tests their normal, negative, boundary, authorization and alternative flows against the existing SRS. It introduces no product requirements. API-level integration and system tests use an isolated in-memory SQLite database. The frontend is production-built as a separate verification step.

The configured workflow used by the cases is Department Review (HOD) → DCC/BOS Committee Review → Academic Office Scrutiny → Senate Institutional Approval. Demo users and seed proposals are reset before every automated test.

## 2. Test scenarios

| Scenario ID | Use case | Scenario and flow covered | Technique(s) | Test case IDs |
|---|---|---|---|---|
| SC-005-01 | UC-005 | Submit a complete proposal; reject an incomplete proposal | Equivalence Partitioning; Integration Testing | TC-005-01, TC-005-02 |
| SC-005-02 | UC-005 | Enforce proposal ownership and privacy for draft submission/view | Equivalence Partitioning; Integration Testing | TC-005-03, TC-005-06 |
| SC-005-03 | UC-005 | Upload supported documents at the configured size boundary | Boundary Value Analysis; Integration Testing | TC-005-04 |
| SC-005-04 | UC-005 | Return, edit and resubmit without overwriting the first immutable version | Integration Testing | TC-005-05 |
| SC-009-01 | UC-009 | Authorized HOD review forwards to the configured next stage | Equivalence Partitioning; Integration Testing | TC-009-01 |
| SC-009-02 | UC-009 | Require a reason for Return for Revision | Equivalence Partitioning; Negative Testing | TC-009-02 |
| SC-009-03 | UC-009 | Deny actions from an unauthorized role or actions not configured at the stage | Equivalence Partitioning; Negative Testing | TC-009-03, TC-009-04 |
| SC-015-01 | UC-015 | Record recommendation with meeting reference/date and voting summary | Equivalence Partitioning; Integration Testing | TC-015-01 |
| SC-015-02 | UC-015 | Require conditions for Conditional Approval and a reason for Rejection | Equivalence Partitioning; Negative Testing | TC-015-02, TC-015-03 |
| SC-015-03 | UC-015 | Prevent DCC from recording a Senate-only final approval | Equivalence Partitioning; Negative Testing | TC-015-04 |
| SC-SYS-01 | UC-005, UC-009, UC-015 | Complete a proposal lifecycle through Senate decision, then reauthenticate and verify persistence | System Testing; Integration Testing | TC-SYS-01 |
| SC-009-04 | UC-009 | Comment-only review without a workflow transition | Alternative flow | TC-009-05 (Not Executed) |

### Testing techniques used

- **Equivalence Partitioning (EP):** valid versus incomplete proposal data; owner versus non-owner; authorized versus unauthorized reviewer; configured versus unconfigured action; permitted versus missing decision fields.
- **Boundary Value Analysis (BVA):** document size at 5 MiB and one byte above 5 MiB. The supported limit is tested at its exact maximum and immediately beyond it.
- **Integration Testing:** API requests are checked together with persisted proposal versions, pending actions, review history, decisions and workflow transitions.
- **System Testing:** TC-SYS-01 follows the system across all four configured roles/stages and checks the final result after a new login.

## 3. Test cases

### UC-005 — Submit Proposal

#### TC-005-01 — Complete proposal submission

| Field | Definition |
|---|---|
| Related requirement / use case | FR-015, FR-016, FR-018; BR-004, BR-005 / UC-005 |
| Description / technique | Submit a complete new-course proposal; EP valid-complete partition; Integration Testing |
| Preconditions | Faculty user is authenticated; active workflow and department exist. |
| Input / test data | Title `Assignment 06 Test Course`; type `New Course`; CCE department; affected programme; implementation session; rationale, prerequisite, 4 credits, syllabus changes and resource implications populated. |
| Execution steps | 1. Create a draft using the faculty account. 2. Submit it. 3. Inspect response status, immutable versions and pending action. |
| Expected result | Submission succeeds; exactly one immutable version is created; status is submitted/under review; responsible role is HOD; one pending action is assigned to the first stage. |

#### TC-005-02 — Incomplete proposal is blocked

| Field | Definition |
|---|---|
| Related requirement / use case | FR-015; BR-004 / UC-005 |
| Description / technique | Attempt submission with mandatory academic fields missing; EP invalid-incomplete partition; Negative Testing |
| Preconditions | Authenticated faculty user; active workflow. |
| Input / test data | New-course draft with title, type and department only; no rationale, programme, prerequisites, credits, syllabus, implementation session or resource implications. |
| Execution steps | 1. Create the incomplete draft. 2. Submit it. 3. Inspect status and immutable version count. |
| Expected result | API reports incomplete fields; proposal remains Draft; no immutable submission version or workflow action is created. |

#### TC-005-03 — Non-owner cannot submit another proposer’s draft

| Field | Definition |
|---|---|
| Related requirement / use case | FR-016; BR-010, BR-015; NFR-005, NFR-008 / UC-005 |
| Description / technique | HOD attempts to submit a faculty-owned draft; EP authorized-owner versus non-owner partition; Negative Testing |
| Preconditions | Seed proposal `CR-2026-031` is a Draft owned by the faculty demo account; HOD is authenticated. |
| Input / test data | `POST /api/proposals/CR-2026-031/submit` with HOD token. |
| Execution steps | 1. Authenticate as HOD. 2. Submit the other user’s draft. 3. Inspect status and proposal state. |
| Expected result | Request is denied; proposal remains Draft and unchanged. |

#### TC-005-04 — Document upload size boundary

| Field | Definition |
|---|---|
| Related requirement / use case | FR-013; NFR-015 / UC-005 |
| Description / technique | Test accepted maximum and the first rejected value; BVA; Integration Testing |
| Preconditions | Authenticated owner has a Draft proposal. |
| Input / test data | Supported `text/plain`; one 5 MiB file and one 5 MiB + 1 byte file. |
| Execution steps | 1. Upload 5 MiB. 2. Upload 5 MiB + 1 byte. 3. Count documents attached to the proposal. |
| Expected result | 5 MiB upload succeeds; 5 MiB + 1 byte is rejected; only the valid file is persisted. |

#### TC-005-05 — Resubmission preserves earlier version

| Field | Definition |
|---|---|
| Related requirement / use case | FR-023, FR-025; BR-005, BR-006; NFR-016 / UC-005 |
| Description / technique | Return, edit and resubmit a submitted proposal; Integration Testing |
| Preconditions | `CR-2026-014` is submitted with immutable version 1; faculty and HOD are authenticated. |
| Input / test data | Return reason `Please clarify the learning outcomes.`; revised syllabus text. |
| Execution steps | 1. HOD returns the proposal with a reason. 2. Faculty updates the draft. 3. Faculty resubmits. 4. Compare v1 and v2 and reread stored v1. |
| Expected result | Resubmission succeeds and creates v2; v1 remains immutable and unchanged. |

#### TC-005-06 — Unauthorized role cannot read unpublished draft

| Field | Definition |
|---|---|
| Related requirement / use case | BR-015; NFR-005, NFR-008, NFR-022 / UC-005 |
| Description / technique | HOD attempts to read a faculty-owned unpublished draft; EP owner versus other role; Negative Testing |
| Preconditions | `CR-2026-031` is Draft and not assigned to HOD; HOD is authenticated. |
| Input / test data | `GET /api/proposals/CR-2026-031` with HOD token. |
| Execution steps | 1. Authenticate as HOD. 2. Request the draft detail. |
| Expected result | Access is denied without exposing the unpublished proposal. |

### UC-009 — Review Proposal and Record Feedback

#### TC-009-01 — Authorized HOD forwards proposal

| Field | Definition |
|---|---|
| Related requirement / use case | FR-019, FR-020, FR-022, FR-024; BR-007, BR-010 / UC-009 |
| Description / technique | HOD adds a comment and forwards to the configured next stage; EP authorized/permitted partition; Integration Testing |
| Preconditions | `CR-2026-014` is pending at Department Review; HOD is authenticated. |
| Input / test data | Action `Recommend/Forward`; comment `Department review is complete.` |
| Execution steps | 1. Submit the review action as HOD. 2. Inspect current stage, status and review history. |
| Expected result | Action is recorded; proposal moves to DCC Reviewer / Committee Review; pending action is routed to DCC. |

#### TC-009-02 — Return without reason is rejected

| Field | Definition |
|---|---|
| Related requirement / use case | FR-021; BR-008; NFR-011, NFR-015 / UC-009 |
| Description / technique | Submit Return for Revision with an empty reason; EP reason-present/reason-absent; Negative Testing |
| Preconditions | `CR-2026-014` is pending at Department Review; HOD is authenticated. |
| Input / test data | Action `Return for Revision`; empty reason. |
| Execution steps | 1. Submit the return action. 2. Inspect review history and pending actions. |
| Expected result | Request is rejected with a correction message; no review action is recorded and existing pending action remains open. |

#### TC-009-03 — Unauthorized reviewer is denied

| Field | Definition |
|---|---|
| Related requirement / use case | FR-019; BR-010; NFR-005, NFR-008 / UC-009 |
| Description / technique | Faculty attempts HOD’s pending review action; EP authorized/unauthorized role; Negative Testing |
| Preconditions | `CR-2026-014` is pending at Department Review; faculty is authenticated. |
| Input / test data | Action `Recommend/Forward`; comment `Attempted unauthorized review.` |
| Execution steps | 1. Submit a review request as faculty. 2. Inspect stage and review history. |
| Expected result | Request is denied; stage and review history are unchanged. |

#### TC-009-04 — Unconfigured review action is rejected

| Field | Definition |
|---|---|
| Related requirement / use case | FR-024; BR-007, BR-010 / UC-009 |
| Description / technique | HOD tries `Reject` at a stage permitting forward or return only; EP configured/unconfigured action; Negative Testing |
| Preconditions | `CR-2026-014` is at Department Review; HOD is authenticated. |
| Input / test data | Action `Reject`; reason text supplied. |
| Execution steps | 1. Submit the unconfigured action. 2. Inspect stage. |
| Expected result | Request is rejected and proposal remains at Department Review. |

#### TC-009-05 — Comment-only review without transition (Not Executed)

| Field | Definition |
|---|---|
| Related requirement / use case | FR-020; UC-009 alternative flow A4 |
| Description / technique | Save a contextual comment while keeping the proposal at the same stage; alternative flow |
| Preconditions | A configured stage explicitly permits comment-only activity. |
| Input / test data | Comment text; no transition action. |
| Execution steps | 1. Open an assigned proposal. 2. Submit the comment without a forwarding/return action. |
| Expected result | Comment is saved with reviewer and timestamp; proposal stage and pending action remain unchanged. |
| Execution status / reason | **Not Executed.** The current React/API workflow has no comment-only action, and no configured stage permits one. Executing it would require inventing a product behavior outside the existing implementation. |

### UC-015 — Record Committee Decision

#### TC-015-01 — Recommendation records meeting and voting context

| Field | Definition |
|---|---|
| Related requirement / use case | FR-031, FR-032, FR-034; BR-014 / UC-015 |
| Description / technique | DCC records a recommendation with meeting reference/date and vote summary; EP valid decision data; Integration Testing |
| Preconditions | `CR-2026-020` is at DCC/BOS Committee Review; DCC user is authenticated. |
| Input / test data | Recommendation; meeting `DCC-TEST-01`; date `2026-11-16`; summary `5 in favour, 0 against`. |
| Execution steps | 1. Submit the decision as DCC. 2. Inspect decision and next stage. |
| Expected result | Decision is persisted with meeting and voting data; proposal routes to Academic Office. |

#### TC-015-02 — Conditional approval requires conditions

| Field | Definition |
|---|---|
| Related requirement / use case | FR-032, FR-033; BR-009; NFR-015 / UC-015 |
| Description / technique | Submit Conditional Approval without conditions; EP conditions-present/conditions-absent; Negative Testing |
| Preconditions | `CR-2026-020` is at DCC/BOS Committee Review; DCC user is authenticated. |
| Input / test data | Conditional Approval; meeting reference/date supplied; conditions empty. |
| Execution steps | 1. Submit the decision. 2. Inspect decisions and proposal status. |
| Expected result | Request is rejected with a condition validation message; no decision is persisted and proposal remains at DCC. |

#### TC-015-03 — Rejection requires a reason

| Field | Definition |
|---|---|
| Related requirement / use case | FR-032, FR-033; BR-008; NFR-015 / UC-015 |
| Description / technique | Submit Rejection without a decision reason; EP reason-present/reason-absent; Negative Testing |
| Preconditions | `CR-2026-020` is at DCC/BOS Committee Review; DCC user is authenticated. |
| Input / test data | Rejection; meeting reference/date supplied; empty reason. |
| Execution steps | 1. Submit the decision. 2. Inspect decisions and proposal status. |
| Expected result | Request is rejected with a reason validation message; no decision is persisted and proposal remains at DCC. |

#### TC-015-04 — DCC cannot record final institutional approval

| Field | Definition |
|---|---|
| Related requirement / use case | FR-035; BR-012, BR-014; NFR-005 / UC-015 |
| Description / technique | DCC attempts Senate-only Final Approval; EP authorized/unauthorized decision authority; Negative Testing |
| Preconditions | `CR-2026-020` is at DCC/BOS Committee Review; DCC user is authenticated. |
| Input / test data | Final Approval; DCC meeting reference/date. |
| Execution steps | 1. Submit Final Approval as DCC. 2. Inspect decision records and proposal status. |
| Expected result | Request is denied because Final Approval is not permitted at DCC; proposal remains at DCC and no decision is stored. |

### Cross-use-case system case

#### TC-SYS-01 — Full lifecycle and persistence after reauthentication

| Field | Definition |
|---|---|
| Related requirement / use case | FR-015, FR-016, FR-018, FR-019, FR-020, FR-022, FR-024, FR-031, FR-032, FR-034, FR-035; NFR-014 / UC-005, UC-009, UC-015 |
| Description / technique | Complete a new proposal through all review stages and final Senate approval; System Testing; Integration Testing |
| Preconditions | Fresh seeded database; all five demo roles are active; configured four-stage workflow exists. |
| Input / test data | Complete proposal data; HOD forward comment; DCC recommendation with meeting ref/date/vote; Academic Office forward comment; Senate Final Approval with meeting ref/date/reason. |
| Execution steps | 1. Faculty creates and submits. 2. HOD forwards. 3. DCC records recommendation. 4. Academic Office forwards to Senate. 5. Senate records Final Approval. 6. Faculty logs in again and reads proposal, decision and timeline. |
| Expected result | Each action routes to the next configured stage; Senate decision sets Approved; after new login the approval and history remain persisted. |

## 4. Test execution results

Execution used the automated regression cases in `server/tests/assignment06.test.js`. All cases use a fresh in-memory database and seeded demo roles. The 5 MiB boundary case sends real encoded payloads through Express and verifies database persistence.

| Test Case ID | Actual Result | Status | Remarks |
|---|---|---|---|
| TC-005-01 | Submission returned 200; v1 sealed; HOD assigned as first reviewer. | Pass | Integration checks confirmed version and pending action. |
| TC-005-02 | Submission returned 400; draft stayed Draft; no immutable version created. | Pass | Incomplete equivalence class. |
| TC-005-03 | Non-owner submission was denied; draft stayed Draft. | Pass | Authorization negative case. |
| TC-005-04 | 5 MiB upload returned 200; 5 MiB + 1 byte returned 400; one document persisted. | Pass | Boundary values tested exactly. |
| TC-005-05 | Resubmission created v2; v1 syllabus remained unchanged. | Pass | Immutable history verified from DB. |
| TC-005-06 | HOD GET of unpublished faculty draft returned 404. | Pass | No proposal details exposed. |
| TC-009-01 | HOD action returned 200 and moved proposal to DCC Committee Review. | Pass | Comment, role and route verified. |
| TC-009-02 | Empty return reason returned 400; no review action; pending action remained open. | Pass | Negative path had no partial write. |
| TC-009-03 | Faculty review attempt was denied; proposal remained at Department Review. | Pass | Role authorization verified. |
| TC-009-04 | Unconfigured Reject action returned 400; stage unchanged. | Pass | Configured-action validation verified. |
| TC-009-05 | No execution performed. | Not Executed | Comment-only behavior is unavailable in the implementation and no current stage permits it. |
| TC-015-01 | DCC recommendation persisted with meeting/vote data and routed to Academic Office. | Pass | Decision fields and next stage verified. |
| TC-015-02 | Conditional Approval without conditions returned 400; no decision persisted. | Pass | Validation and rollback verified. |
| TC-015-03 | Rejection without reason returned 400; proposal remained at DCC. | Pass | Validation and state verified. |
| TC-015-04 | DCC Final Approval returned 400; no decision persisted. | Pass | Senate authority restriction verified. |
| TC-SYS-01 | Complete lifecycle reached Approved; new faculty login could read final decision and timeline. | Pass | End-to-end role/stage integration and persistence verified. |

## 5. Defect reports

No test case failed in the final execution. **Defects identified during this test run: 0.** TC-009-05 is Not Executed, not Failed, because its required product behavior is not available in the current implementation.

## 6. Requirements Traceability Matrix

The coverage denominator below is limited to the selected use cases and associated requirements exercised by this assignment; it is not a claim of coverage for the full SRS.

| Requirement ID | Requirement summary | Use case | Scenario | Test case(s) | Result |
|---|---|---|---|---|---|
| FR-013 | Attach supported document | UC-005 | SC-005-03 | TC-005-04 | Pass |
| FR-015 | Validate proposal completeness | UC-005 | SC-005-01 | TC-005-01, TC-005-02, TC-SYS-01 | Pass |
| FR-016 | Submit proposal | UC-005 | SC-005-01, SC-005-04 | TC-005-01, TC-005-03, TC-005-05, TC-SYS-01 | Pass |
| FR-018 | Route submitted proposal | UC-005 | SC-005-01 | TC-005-01, TC-SYS-01 | Pass |
| FR-019 | Review assigned proposal | UC-009 | SC-009-01, SC-009-03 | TC-009-01, TC-009-03, TC-SYS-01 | Pass |
| FR-020 | Record review comment | UC-009 | SC-009-01, SC-009-04 | TC-009-01, TC-009-05 | Pass / Not Executed |
| FR-021 | Return for revision | UC-009 | SC-009-02 | TC-009-02, TC-005-05 | Pass |
| FR-022 | Recommend/forward proposal | UC-009 | SC-009-01 | TC-009-01, TC-SYS-01 | Pass |
| FR-023 | Resubmit revised proposal | UC-005 | SC-005-04 | TC-005-05 | Pass |
| FR-024 | Enforce workflow sequence/actions | UC-009 | SC-009-03 | TC-009-04, TC-SYS-01 | Pass |
| FR-031 | Record meeting reference/date | UC-015 | SC-015-01 | TC-015-01, TC-SYS-01 | Pass |
| FR-032 | Record committee decision | UC-015 | SC-015-01, SC-015-02 | TC-015-01–04, TC-SYS-01 | Pass |
| FR-033 | Record required reasons/conditions | UC-015 | SC-015-02 | TC-015-02, TC-015-03 | Pass |
| FR-034 | Record recommendation/voting summary | UC-015 | SC-015-01 | TC-015-01, TC-SYS-01 | Pass |
| FR-035 | Record Senate final decision | UC-015 | SC-015-03, SC-SYS-01 | TC-015-04, TC-SYS-01 | Pass |
| NFR-005 | Enforce authorization server-side | UC-005, UC-009, UC-015 | SC-005-02, SC-009-03, SC-015-03 | TC-005-03, TC-005-06, TC-009-03, TC-015-04 | Pass |
| NFR-008 | Deny out-of-scope data access | UC-005 | SC-005-02 | TC-005-06 | Pass |
| NFR-014 | Confirmed actions persist after re-login | UC-005, UC-009, UC-015 | SC-SYS-01 | TC-SYS-01 | Pass |
| NFR-015 | Failed actions do not create partial records | UC-005, UC-009, UC-015 | SC-005-01, SC-009-02, SC-015-02 | TC-005-02, TC-005-04, TC-009-02, TC-015-02, TC-015-03 | Pass |
| NFR-016 | Preserve earlier submitted versions | UC-005 | SC-005-04 | TC-005-05 | Pass |

**Requirement coverage:** 20 of 20 selected requirements have at least one executed test = **100%**. FR-020 also has an unexecuted alternative path (TC-009-05); its primary comment-on-forward path passed in TC-009-01.

## 7. Test summary

| Measure | Result |
|---|---:|
| Total test cases designed | 16 |
| Test cases executed | 15 |
| Passed | 15 |
| Failed | 0 |
| Not Executed | 1 |
| Defects identified | 0 |
| Selected requirement coverage | 100% (20 / 20) |
| Test Pass Percentage | 100% (15 passed / 15 executed × 100) |
| Test Execution Percentage | 93.75% (15 executed / 16 designed × 100) |

The Node/Express regression suite contains 43 tests across four suites after the domain-validation checks were added. The React production build also completed successfully. These broader checks supplement, but do not replace, the 15 assignment-specific executed cases above.

## 8. Execution environment and evidence

- Windows development environment; Node.js v22.16.0; npm 11.11.1.
- API tests: Jest + Supertest; isolated SQLite `:memory:` database; demo seed reset before each case.
- Client verification: Vite production build.
- Evidence logs: [`server-test-results.txt`](evidence/server-test-results.txt) and [`client-build-results.txt`](evidence/client-build-results.txt).
- Automated test implementation: [`assignment06.test.js`](../../server/tests/assignment06.test.js).
- No screenshots were needed for the API assertions; the test command output and assertions are the execution evidence.

## 9. AI usage declaration

| Item | Declaration |
|---|---|
| AI tool used | ChatGPT |
| Purpose | Helped organize test scenarios, draft test cases/RTM, and implement automated API regression checks. |
| Team ID | T017 |
| Team representative | Yash Gupta |
| Date | 16 November 2026 |
| Team responsibility | The team must review, understand and verify the submitted cases and results before submission. |
