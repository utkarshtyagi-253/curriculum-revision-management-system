const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'curriculum_revision.db');

// Ensure directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    -- 16.1 Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      account_status TEXT DEFAULT 'ACTIVE',
      department_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 16.2 Roles
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      permissions TEXT
    );

    -- 16.3 UserRoles
    CREATE TABLE IF NOT EXISTS user_roles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      assigned_by TEXT,
      assigned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      active_status INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );

    -- 16.4 Departments
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      active_status INTEGER DEFAULT 1
    );

    -- 16.5 Programmes
    CREATE TABLE IF NOT EXISTS programmes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      department_id TEXT NOT NULL,
      degree_level TEXT NOT NULL,
      active_status INTEGER DEFAULT 1,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    -- 16.6 Courses
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      credits INTEGER NOT NULL,
      department_id TEXT NOT NULL,
      current_status TEXT DEFAULT 'ACTIVE',
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    -- 16.7 Committees
    CREATE TABLE IF NOT EXISTS committees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      committee_type TEXT NOT NULL,
      scope TEXT NOT NULL,
      active_status INTEGER DEFAULT 1
    );

    -- 16.11 WorkflowDefinition
    CREATE TABLE IF NOT EXISTS workflow_definitions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      scope TEXT NOT NULL,
      active_status INTEGER DEFAULT 1,
      version INTEGER DEFAULT 1
    );

    -- 16.12 WorkflowStage
    CREATE TABLE IF NOT EXISTS workflow_stages (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      sequence_no INTEGER NOT NULL,
      name TEXT NOT NULL,
      responsible_role TEXT NOT NULL,
      permitted_actions TEXT NOT NULL,
      is_mandatory INTEGER DEFAULT 1,
      FOREIGN KEY (workflow_id) REFERENCES workflow_definitions(id) ON DELETE CASCADE
    );

    -- 16.8 CurriculumProposal
    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      proposal_type TEXT NOT NULL,
      title TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      affected_programmes TEXT,
      current_status TEXT NOT NULL DEFAULT 'Draft',
      current_stage_id TEXT,
      current_responsible_role TEXT,
      proposed_implementation_session TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (current_stage_id) REFERENCES workflow_stages(id)
    );

    -- 16.9 ProposalVersion
    CREATE TABLE IF NOT EXISTS proposal_versions (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      academic_rationale TEXT,
      prerequisites TEXT,
      credits INTEGER,
      syllabus_changes TEXT,
      resource_implications TEXT,
      structured_fields TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submission_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_immutable INTEGER DEFAULT 1,
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- 16.10 SupportingDocument
    CREATE TABLE IF NOT EXISTS supporting_documents (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      version_id TEXT,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_path TEXT,
      uploaded_by TEXT NOT NULL,
      uploaded_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
      FOREIGN KEY (version_id) REFERENCES proposal_versions(id) ON DELETE SET NULL,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    -- PendingAction (Assignment 4 & 5)
    CREATE TABLE IF NOT EXISTS pending_actions (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      stage_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      assigned_role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
      FOREIGN KEY (stage_id) REFERENCES workflow_stages(id)
    );

    -- 16.13 ReviewAction
    CREATE TABLE IF NOT EXISTS review_actions (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      version_id TEXT NOT NULL,
      stage_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      comment TEXT,
      reason TEXT,
      action_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
      FOREIGN KEY (version_id) REFERENCES proposal_versions(id),
      FOREIGN KEY (stage_id) REFERENCES workflow_stages(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    -- 16.14 StakeholderInvitation
    CREATE TABLE IF NOT EXISTS stakeholder_invitations (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      invitee_email TEXT NOT NULL,
      category TEXT NOT NULL,
      invited_by TEXT NOT NULL,
      valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiry_date DATETIME,
      status TEXT DEFAULT 'ACTIVE',
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
      FOREIGN KEY (invited_by) REFERENCES users(id)
    );

    -- 16.15 Feedback
    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      version_id TEXT,
      author_id TEXT NOT NULL,
      parent_feedback_id TEXT,
      feedback_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id),
      FOREIGN KEY (parent_feedback_id) REFERENCES feedback(id)
    );

    -- 16.16 CommitteeMeeting
    CREATE TABLE IF NOT EXISTS committee_meetings (
      id TEXT PRIMARY KEY,
      committee_id TEXT NOT NULL,
      meeting_ref TEXT NOT NULL,
      meeting_date DATE NOT NULL,
      notes TEXT,
      FOREIGN KEY (committee_id) REFERENCES committees(id)
    );

    -- 16.17 Decision
    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      version_id TEXT NOT NULL,
      meeting_id TEXT,
      decision_type TEXT NOT NULL,
      decision_reason TEXT,
      conditions TEXT,
      voting_summary TEXT,
      recorded_by TEXT NOT NULL,
      decision_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
      FOREIGN KEY (version_id) REFERENCES proposal_versions(id),
      FOREIGN KEY (meeting_id) REFERENCES committee_meetings(id),
      FOREIGN KEY (recorded_by) REFERENCES users(id)
    );

    -- 16.18 Notification
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_id TEXT,
      recipient_role TEXT,
      proposal_id TEXT,
      event_type TEXT NOT NULL,
      message TEXT NOT NULL,
      read_status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 16.19 ImplementationMilestone
    CREATE TABLE IF NOT EXISTS implementation_milestones (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      title TEXT NOT NULL,
      target_date DATE,
      completion_date DATE,
      status TEXT DEFAULT 'Not Started',
      evidence_reference TEXT,
      updated_by TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
      FOREIGN KEY (updated_by) REFERENCES users(id)
    );

    -- 16.20 AuditEvent & TimelineEvent
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      object_type TEXT NOT NULL,
      object_id TEXT NOT NULL,
      result TEXT DEFAULT 'SUCCESS',
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

initSchema();

module.exports = { db, initSchema };
