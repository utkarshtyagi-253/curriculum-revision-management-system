# The LNM Institute of Information Technology, Jaipur
## Software Development Laboratory
**Course Code:** CS314  
**Lab Assignment 3:** Scenario, Use Case and Activity Modelling  
**Project:** Curriculum Revision Management System  
**Team ID:** T017  
**Team Members:** Utkarsh, Piyush, Yash, Mehul  
**Roll Numbers:** 24UCC096, 24UCC097, 24UCC099, 24UCC100  
**Development Model:** Agile - Iterative and Incremental Development  
**Date:** 12 September 2026  

---

## 30. Scenarios

The three detailed use cases defined in Assignment 2 are carried forward without introducing new functionality:
- **UC-005:** Submit Proposal
- **UC-009:** Review Proposal and Record Feedback
- **UC-015:** Record Committee Decision

---

### Scenario: UC-005 — Submit Proposal

| Field | Description |
|---|---|
| **Actor(s) involved** | **Primary:** Faculty Proposer.<br>**Supporting:** Curriculum Revision Management System. |
| **Starting condition** | The Faculty Proposer is authenticated, owns the proposal, the proposal is in `Draft` or `Returned for Revision` status, and the applicable review workflow is configured and active. |
| **Main sequence of activities** | 1. The proposer opens the proposal.<br>2. The system displays the current editable proposal data and supporting documents.<br>3. The proposer selects **Submit**.<br>4. The system validates all mandatory fields and required information for the selected proposal type.<br>5. The system creates an immutable proposal-version snapshot (`v1`, `v2`, etc.).<br>6. The system changes the proposal status to `Submitted / Under Review`.<br>7. The system determines the first configured review stage and responsible role.<br>8. The system assigns the pending action to that stage.<br>9. The system records submission and version events in the timeline and audit trail.<br>10. The system generates relevant in-application notifications.<br>11. The system displays confirmation and the updated current status. |
| **Important alternative / exception flows** | • **Mandatory data missing:** submission is blocked and the missing or invalid fields are identified.<br>• **Invalid supporting document:** the file is rejected and the proposal remains editable.<br>• **Workflow unavailable:** submission is blocked and the system reports that workflow configuration is required.<br>• **Unauthorized user:** a user who does not own the editable proposal is denied the submission action. |
| **Expected outcome** | A new immutable submitted version exists; the proposal is assigned to the first configured review stage; the submitted version is no longer editable; and the new status, pending action, timeline/audit entries, and notifications are available to authorized users. |

#### Compact Representation: UC-005
```mermaid
flowchart TD
    A[Faculty Proposer: Open proposal] --> B[System: Display editable proposal]
    B --> C[Faculty Proposer: Select Submit]
    C --> D[System: Validate completeness]
    D --> E[System: Create immutable version]
    E --> F[System: Route to first review stage]
    F --> G[System: Log and notify]
    G --> H[Faculty Proposer: View updated status]
```

---

### Scenario: UC-009 — Review Proposal and Record Feedback

| Field | Description |
|---|---|
| **Actor(s) involved** | **Primary:** Authorized Reviewer / Committee Member.<br>**Supporting:** Curriculum Revision Management System; Faculty Proposer or next responsible role receives the resulting notification. |
| **Starting condition** | The reviewer is authenticated, is permitted to act at the proposal's current workflow stage, the proposal has at least one submitted version, and the proposal is assigned to the reviewer's role or committee. |
| **Main sequence of activities** | 1. The reviewer opens the pending-action list.<br>2. The system displays proposals assigned to the reviewer's role.<br>3. The reviewer selects a proposal.<br>4. The system displays the current proposal version, supporting documents, previous review context, and relevant version history.<br>5. The reviewer evaluates the proposal.<br>6. The reviewer records a comment, recommendation, or requested change.<br>7. The reviewer selects a permitted workflow action such as `Recommend/Forward` or `Return for Revision`.<br>8. The system validates that the selected action is permitted at the current stage.<br>9. If the action is `Return for Revision`, the system requires an explicit reason.<br>10. The system records the review action with reviewer identity and timestamp.<br>11. The system updates proposal status/current owner according to the workflow.<br>12. The system creates timeline, audit, and notification events. |
| **Important alternative / exception flows** | • **Reviewer no longer authorized:** the action is denied.<br>• **Stale proposal stage:** the action is blocked and the current status is refreshed.<br>• **Missing return reason:** Return for Revision cannot be completed until a reason is entered.<br>• **Comment-only review:** when permitted, a contextual comment may be saved without advancing the workflow. |
| **Expected outcome** | The review action is stored with actor and timestamp; the proposal remains at the current stage or moves to the configured next owner; the proposer or next responsible role is notified; and the action appears in the proposal timeline and audit trail. |

#### Compact Representation: UC-009
```mermaid
flowchart TD
    A[Reviewer: Open pending actions] --> B[System: Display assigned proposals]
    B --> C[Reviewer: Select and evaluate proposal]
    C --> D[Reviewer: Record feedback and action]
    D --> E[System: Validate action]
    E --> F[System: Update owner/status]
    F --> G[System: Log and notify]
```

---

### Scenario: UC-015 — Record Committee Decision

| Field | Description |
|---|---|
| **Actor(s) involved** | **Primary:** Authorized Committee User.<br>**Supporting:** Curriculum Revision Management System; Academic Office and next responsible authority are downstream recipients when applicable. |
| **Starting condition** | The committee user is authenticated; the proposal has reached a workflow stage at which the committee is authorized to decide; the current submitted version is available; and meeting context is available when required by the configured process. |
| **Main sequence of activities** | 1. The committee user opens the proposal assigned for decision.<br>2. The system displays the current version, supporting documents, prior recommendations, and relevant feedback.<br>3. The committee user associates the proposal with a meeting reference if required.<br>4. The committee user selects a permitted decision: `Recommendation`, `Conditional Approval`, `Return`, or `Rejection`.<br>5. The committee user enters the required reason, conditions, or recommendation/voting summary.<br>6. The system validates that the decision and supporting fields satisfy the business rules.<br>7. The system records the decision with the proposal version, actor, and timestamp.<br>8. The system updates the workflow to the configured next stage or final state.<br>9. The system creates timeline and audit events.<br>10. The system notifies the proposer, Academic Office, and next responsible role as applicable. |
| **Important alternative / exception flows** | • **Missing reason:** Return or Rejection cannot be saved until a reason is recorded.<br>• **Missing conditions:** Conditional Approval cannot be saved until at least one condition is recorded.<br>• **Unauthorized decision type:** a decision not permitted for the current committee/stage is blocked.<br>• **Higher authority required:** the committee outcome is recorded as a recommendation and routed onward instead of being marked finally approved.<br>• **Proposal already moved:** duplicate decision recording is prevented. |
| **Expected outcome** | The formal committee decision is stored against the relevant proposal version, is visible in authorized proposal history and audit records, and the proposal is routed to the next configured stage or reaches the appropriate final state. |

#### Compact Representation: UC-015
```mermaid
flowchart TD
    A[Committee User: Open assigned proposal] --> B[System: Display decision package]
    B --> C[Committee User: Select permitted decision]
    C --> D[Committee User: Enter reason/conditions/summary]
    D --> E[System: Validate business rules]
    E --> F[System: Record decision and route]
    F --> G[System: Log and notify]
```

---

## 31. UML Use Case Diagram — Complete System

The complete use-case model contains the 25 use cases defined in Assignment 2. The three carried-forward detailed use cases are highlighted with specialized stereotyping.

```mermaid
flowchart LR
    subgraph CRMS["Curriculum Revision Management System"]
        UC001([UC-001: Login])
        UC002([UC-002: View Guidelines])
        UC003([UC-003: Search Existing Proposals])
        UC005(["UC-005: Submit Proposal [Core]"])
        UC006([UC-006: Upload Supporting Documents])
        UC007([UC-007: View Submission Status])
        UC008([UC-008: Withdraw Proposal])
        UC011([UC-011: Submit Revised Proposal Version])
        
        UC012([UC-012: Login])
        UC009(["UC-009: Review Proposal & Record Feedback [Core]"])
        UC010([UC-010: Return Proposal for Revision])
        UC013([UC-013: Recommend Proposal for Approval])
        UC014([UC-014: View Proposal History])

        UC015(["UC-015: Record Committee Decision [Core]"])
        UC024([UC-024: Record Committee Meeting Reference])
        UC016([UC-016: Approve Proposal])
        UC017([UC-017: Reject Proposal])
        UC018([UC-018: Request Further Information])
        UC019([UC-019: View Committee Reports])
        UC020([UC-020: Notify Outcome to Initiator])

        UC021([UC-021: Login])
        UC022([UC-022: Manage User Accounts])
        UC023([UC-023: Manage Roles and Permissions])
        UC025([UC-025: Maintain System Settings])
    end

    ActorFaculty["Academic Staff / Proposal Initiator"]
    ActorCommittee["Programme Committee Member"]
    ActorChair["Department Chair / HOD"]
    ActorAdmin["System Administrator"]

    ActorFaculty --> UC001
    ActorFaculty --> UC002
    ActorFaculty --> UC003
    ActorFaculty --> UC005
    ActorFaculty --> UC007
    ActorFaculty --> UC008
    ActorFaculty --> UC011

    UC005 -.->|&lt;&lt;include&gt;&gt;| UC006
    UC011 -.->|&lt;&lt;specializes&gt;&gt;| UC005

    ActorCommittee --> UC012
    ActorCommittee --> UC009
    ActorCommittee --> UC013
    ActorCommittee --> UC014
    UC010 -.->|&lt;&lt;extend&gt;&gt;| UC009

    ActorChair --> UC015
    ActorChair --> UC016
    ActorChair --> UC017
    ActorChair --> UC018
    ActorChair --> UC019
    ActorChair --> UC020
    UC024 -.->|&lt;&lt;extend&gt;&gt;| UC015

    ActorAdmin --> UC021
    ActorAdmin --> UC022
    ActorAdmin --> UC023
    ActorAdmin --> UC025
```

**Relationship Notes:**
- `UC-006 Upload Supporting Documents` is included (`<<include>>`) in `UC-005 Submit Proposal`.
- `UC-010 Return Proposal for Revision` extends (`<<extend>>`) `UC-009 Review Proposal and Record Feedback`.
- `UC-024 Record Committee Meeting Reference` extends (`<<extend>>`) `UC-015 Record Committee Decision` when meeting context is required.
- `UC-011 Submit Revised Proposal Version` specializes the core submission behavior represented by `UC-005`.

---

## 32. Activity Diagrams

### 32.1 UC-005 — Submit Proposal
```mermaid
flowchart TD
    subgraph FacultyProposer["Faculty Proposer"]
        startNode(( )) --> openP[Open proposal]
        openP --> clickSub[Select Submit]
        viewStatus[View status] --> endNode((( )))
    end

    subgraph System["System"]
        openP --> dispP[Display proposal and documents]
        clickSub --> valF{Valid?}
        valF -->|No| showErr[Show validation errors; keep editable]
        showErr --> endErr1((( )))
        valF -->|Yes| chkWf{Workflow active?}
        chkWf -->|No| showWfErr[Show workflow error; block submission]
        showWfErr --> endErr2((( )))
        chkWf -->|Yes| createSnap[Create immutable version snapshot]
        createSnap --> setStatus[Set status: Submitted / Under Review]
        setStatus --> detStage[Determine first review stage]
        detStage --> assignAction[Assign pending action]
        assignAction --> forkNode{" "}
        forkNode --> recAudit[Record timeline / audit events]
        forkNode --> genNotif[Generate notifications]
        recAudit --> joinNode{" "}
        genNotif --> joinNode
        joinNode --> dispUpdated[Display updated status]
        dispUpdated --> viewStatus
    end
```

---

### 32.2 UC-009 — Review Proposal and Record Feedback
```mermaid
flowchart TD
    subgraph Reviewer["Authorized Reviewer / Committee Member"]
        startRev(( )) --> openPend[Open pending actions]
        selProp[Select proposal] --> evalProp[Evaluate proposal]
        evalProp --> recFeed[Record feedback / requested change]
        recFeed --> selAct[Select workflow action]
        revDone[Review complete] --> endRev((( )))
    end

    subgraph System["System"]
        openPend --> dispAssigned[Display assigned proposals]
        dispAssigned --> selProp
        selProp --> dispCur[Display current version and review context]
        dispCur --> evalProp
        selAct --> authChk{Authorized / concur?}
        authChk -->|No| blockStale[Block action; refresh status]
        blockStale --> endBlock((( )))
        authChk -->|Yes| retChk{Return?}
        retChk -->|No| recAct[Record review action]
        retChk -->|Yes| reasonChk{Reason present?}
        reasonChk -->|No| promptReason[Prompt for reason; keep action pending]
        promptReason --> endPrompt((( )))
        reasonChk -->|Yes| recAct
        recAct --> updStatus[Update status / current stage]
        updStatus --> forkR{" "}
        forkR --> logEv[Create timeline / audit events]
        forkR --> sendNot[Generate notification]
        logEv --> joinR{" "}
        sendNot --> joinR
        joinR --> revDone
    end
```

---

### 32.3 UC-015 — Record Committee Decision
```mermaid
flowchart TD
    subgraph CommitteeUser["Authorized Committee User"]
        startComm(( )) --> openCommProp[Open assigned proposal]
        selDecision[Select decision] --> enterFields[Enter reason / conditions / summary]
        decSaved[Decision recorded] --> endComm((( )))
    end

    subgraph System["System"]
        openCommProp --> dispPkg[Display version, documents and feedback]
        dispPkg --> hasMeeting{Meeting reference exists?}
        hasMeeting -->|No| selDecision
        hasMeeting -->|Yes| assocMeet[Associate meeting reference]
        assocMeet --> selDecision
        enterFields --> chkValid{Decision valid?}
        chkValid -->|No| dispDecErr[Show validation error; do not save]
        dispDecErr --> endDecErr((( )))
        chkValid -->|Yes| recDec[Record decision]
        recDec --> chkHigher{Higher authority?}
        chkHigher -->|Yes| routeHigh[Route recommendation to next stage]
        chkHigher -->|No| updFinal[Update configured final state]
        routeHigh --> forkD{" "}
        updFinal --> forkD
        forkD --> recAuditD[Create timeline / audit events]
        forkD --> notifD[Notify stakeholders / next role]
        recAuditD --> joinD{" "}
        notifD --> joinD
        joinD --> decSaved
    end
```

---

## 33. Consistency and Traceability Check

The models preserve the required chain:  
**Assignment 2 requirements $\rightarrow$ the same 3 detailed use cases $\rightarrow$ scenarios $\rightarrow$ complete-system use case diagram $\rightarrow$ activity diagrams.**  
No new system functionality has been introduced.

| Detailed Use Case | Assignment 2 Source | Requirement Basis | Scenario | Activity Diagram |
|---|---|---|---|---|
| **UC-005 Submit Proposal** | Section 19.1 | FR-015, FR-016, FR-018; versioning, notification, and audit behavior defined in SRS | Scenario 1 | 32.1 |
| **UC-009 Review Proposal and Record Feedback** | Section 19.2 | FR-019 to FR-024; notification and audit behavior defined in SRS | Scenario 2 | 32.2 |
| **UC-015 Record Committee Decision** | Section 19.3 | FR-031 to FR-034; notification and audit behavior defined in SRS | Scenario 3 | 32.3 |

---

## 35. Individual Contribution

- **Utkarsh (24UCC096):** Prepared and verified the three scenarios against the detailed use cases and checked requirements-to-model consistency.
- **Piyush (24UCC097):** Designed the complete-system UML use case model and reviewed actor/use-case associations and UML relationships.
- **Yash (24UCC099):** Prepared the UC-005 and UC-009 activity models and organized the assignment documentation and traceability presentation.
- **Mehul (24UCC100):** Prepared the UC-015 activity model, reviewed alternative/exception paths, and performed final UML and document quality checks.

---

## AI Usage Policy — Student Declaration

AI tools may be used as supporting tools for this assignment. The team is responsible for the correctness, consistency, and understanding of all submitted scenarios and UML models.
- We have disclosed the use of AI tools, if any.
- AI-generated suggestions have been reviewed, verified, and adapted by the team.
- We understand and can explain the submitted scenarios, use case diagram, and activity diagrams.
- We have verified that the UML models are consistent with our project's requirements, use cases, and scope.
- The final submission represents our team's understanding and modeling decisions.

| Item | Details |
|---|---|
| **AI Tool(s) Used** | ChatGPT / AI Assistant |
| **Purpose of AI Use** | Assistance in structuring scenarios and UML models, checking consistency with Assignment 2, and improving clarity. All final modeling decisions and content were reviewed by the team. |
| **Team ID** | T017 |
| **Team Representative** | YASH GUPTA |
| **Date** | 12 September 2026 |
