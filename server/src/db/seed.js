const bcrypt = require('bcryptjs');
const { db, initSchema } = require('./db');

function seed() {
  initSchema();

  // Clear existing data for fresh clean seed
  const tables = [
    'audit_events', 'implementation_milestones', 'notifications', 'decisions',
    'committee_meetings', 'feedback', 'stakeholder_invitations', 'review_actions',
    'pending_actions', 'supporting_documents', 'proposal_versions', 'proposals',
    'workflow_stages', 'workflow_definitions', 'committees', 'courses',
    'programmes', 'departments', 'user_roles', 'roles', 'users'
  ];

  for (const table of tables) {
    db.prepare(`DELETE FROM ${table}`).run();
  }

  // 1. Roles
  const insertRole = db.prepare('INSERT INTO roles (id, name, description, permissions) VALUES (?, ?, ?, ?)');
  insertRole.run('role-admin', 'System Administrator', 'Manages users, roles, workflow configuration, master data', 'ALL');
  insertRole.run('role-faculty', 'Faculty Proposer', 'Creates and submits curriculum revision proposals', 'CREATE_PROPOSAL,EDIT_OWN_DRAFT,SUBMIT_PROPOSAL');
  insertRole.run('role-hod', 'Programme Coordinator / HOD', 'Performs departmental review and recommendation', 'REVIEW_DEPARTMENT,FORWARD,RETURN_REVISION');
  insertRole.run('role-dcc', 'DCC Reviewer', 'Reviews academic merit at committee level and records decisions', 'REVIEW_COMMITTEE,DECIDE_COMMITTEE');
  insertRole.run('role-academics', 'Academic Office', 'Manages policy compliance, records, and post-approval tracking', 'SCRUTINY_OFFICE,TRACK_IMPLEMENTATION,VIEW_AUDIT');
  insertRole.run('role-senate', 'Senate / Academic Council', 'Institutional final approval or rejection', 'FINAL_APPROVAL,REJECT');

  // 2. Departments
  const insertDept = db.prepare('INSERT INTO departments (id, name, code, active_status) VALUES (?, ?, ?, ?)');
  insertDept.run('dept-cce', 'Computer Communication Engineering', 'CCE', 1);
  insertDept.run('dept-cse', 'Computer Science and Engineering', 'CSE', 1);
  insertDept.run('dept-ece', 'Electronics and Communication Engineering', 'ECE', 1);
  insertDept.run('dept-hss', 'Humanities and Social Sciences', 'HSS', 1);
  insertDept.run('dept-math', 'Mathematics', 'MATH', 1);

  // 3. Programmes
  const insertProg = db.prepare('INSERT INTO programmes (id, name, code, department_id, degree_level, active_status) VALUES (?, ?, ?, ?, ?, ?)');
  insertProg.run('prog-btech-cce', 'B.Tech. in Communication and Computer Engineering', 'BTECH-CCE', 'dept-cce', 'Undergraduate', 1);
  insertProg.run('prog-btech-cse', 'B.Tech. in Computer Science and Engineering', 'BTECH-CSE', 'dept-cse', 'Undergraduate', 1);
  insertProg.run('prog-btech-ece', 'B.Tech. in Electronics and Communication Engineering', 'BTECH-ECE', 'dept-ece', 'Undergraduate', 1);

  // 4. Courses
  const insertCourse = db.prepare('INSERT INTO courses (id, code, title, credits, department_id, current_status) VALUES (?, ?, ?, ?, ?, ?)');
  insertCourse.run('course-cs314', 'CS314', 'Software Development Laboratory', 3, 'dept-cse', 'ACTIVE');
  insertCourse.run('course-cce302', 'CC302', 'Communication Networks', 4, 'dept-cce', 'ACTIVE');
  insertCourse.run('course-cs450', 'CS450', 'Artificial Intelligence', 4, 'dept-cse', 'ACTIVE');

  // 5. Committees
  const insertComm = db.prepare('INSERT INTO committees (id, name, committee_type, scope, active_status) VALUES (?, ?, ?, ?, ?)');
  insertComm.run('comm-dcc-cce', 'Department Curriculum Committee - CCE', 'DCC', 'Department', 1);
  insertComm.run('comm-bos', 'Board of Studies - Computing', 'BOS', 'School', 1);
  insertComm.run('comm-senate', 'Academic Senate', 'SENATE', 'Institutional', 1);

  // 6. Users
  const salt = bcrypt.genSaltSync(10);
  const insertUser = db.prepare('INSERT INTO users (id, name, email, password_hash, department_id) VALUES (?, ?, ?, ?, ?)');
  const insertUserRole = db.prepare('INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)');

  const usersData = [
    { id: 'user-admin', name: 'System Administrator', email: 'admin@lnmiit.ac.in', pass: 'Admin@123', dept: 'dept-cse', role: 'role-admin' },
    { id: 'user-faculty', name: 'Dr. Ananya Rao', email: 'faculty@lnmiit.ac.in', pass: 'Faculty@123', dept: 'dept-cce', role: 'role-faculty' },
    { id: 'user-hod', name: 'Dr. Suresh Verma', email: 'hod@lnmiit.ac.in', pass: 'Hod@123', dept: 'dept-cce', role: 'role-hod' },
    { id: 'user-dcc', name: 'Dr. Rajiv Sharma', email: 'dcc@lnmiit.ac.in', pass: 'Dcc@123', dept: 'dept-cce', role: 'role-dcc' },
    { id: 'user-academics', name: 'Ms. Sunita Joshi', email: 'academics@lnmiit.ac.in', pass: 'Academic@123', dept: null, role: 'role-academics' },
    { id: 'user-senate', name: 'Prof. Narendra Kumar', email: 'senate@lnmiit.ac.in', pass: 'Senate@123', dept: null, role: 'role-senate' }
  ];

  for (const u of usersData) {
    const hash = bcrypt.hashSync(u.pass, salt);
    insertUser.run(u.id, u.name, u.email, hash, u.dept);
    insertUserRole.run(`ur-${u.id}`, u.id, u.role);
  }

  // 7. Workflow & Stages
  const insertWf = db.prepare('INSERT INTO workflow_definitions (id, name, scope, active_status, version) VALUES (?, ?, ?, ?, ?)');
  insertWf.run('wf-01', 'Standard Curriculum Review Workflow', 'Institute-Wide', 1, 1);

  const insertStage = db.prepare('INSERT INTO workflow_stages (id, workflow_id, sequence_no, name, responsible_role, permitted_actions, is_mandatory) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertStage.run('stage-1', 'wf-01', 1, 'Department Review', 'Programme Coordinator / HOD', 'Recommend/Forward,Return for Revision', 1);
  insertStage.run('stage-2', 'wf-01', 2, 'DCC / BOS Committee Review', 'DCC Reviewer', 'Recommend/Forward,Conditional Approval,Return for Revision,Reject', 1);
  insertStage.run('stage-3', 'wf-01', 3, 'Academic Office Scrutiny', 'Academic Office', 'Forward to Senate,Return for Revision', 1);
  insertStage.run('stage-4', 'wf-01', 4, 'Senate Institutional Approval', 'Senate / Academic Council', 'Final Approval,Reject', 1);

  // 8. Proposals & Versions
  const insertProposal = db.prepare(`
    INSERT INTO proposals (
      id, proposal_type, title, owner_id, department_id, affected_programmes,
      current_status, current_stage_id, current_responsible_role, proposed_implementation_session
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVersion = db.prepare(`
    INSERT INTO proposal_versions (
      id, proposal_id, version_number, academic_rationale, prerequisites, credits,
      syllabus_changes, resource_implications, structured_fields, created_by, is_immutable
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDoc = db.prepare(`
    INSERT INTO supporting_documents (id, proposal_id, version_id, file_name, file_type, file_size, file_path, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPendingAction = db.prepare(`
    INSERT INTO pending_actions (id, proposal_id, stage_id, action_type, status, assigned_role)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertTimeline = db.prepare(`
    INSERT INTO audit_events (id, actor_id, action, object_type, object_id, result, details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Proposal 1: Under Review (Department Stage)
  insertProposal.run(
    'CR-2026-014', 'New Course', 'AI Systems & Autonomous Computing', 'user-faculty', 'dept-cce',
    'B.Tech. CCE, B.Tech. CSE', 'Submitted / Under Review', 'stage-1', 'Programme Coordinator / HOD', 'Odd Semester 2026-27'
  );
  insertVersion.run(
    'ver-014-1', 'CR-2026-014', 1,
    'Rapid emergence of edge AI acceleration and transformer models requires specialized coursework in undergraduate computing.',
    'Data Structures & Algorithms, Computer Architecture', 4,
    'Introduction to Edge AI, Tensor processing units, LLM deployment pipelines, and latency benchmarks.',
    'Access to GPU teaching cluster, 1 additional teaching lab assistant.',
    JSON.stringify({ electiveCategory: 'Program Elective', lectureHours: 3, labHours: 2 }),
    'user-faculty', 1
  );
  insertDoc.run('doc-014-1', 'CR-2026-014', 'ver-014-1', 'AI_Systems_Syllabus_2026.pdf', 'PDF', 245000, '/docs/mock/ai.pdf', 'user-faculty');
  insertPendingAction.run('pa-014-1', 'CR-2026-014', 'stage-1', 'Review Proposal', 'Pending', 'Programme Coordinator / HOD');
  insertTimeline.run('ae-014-1', 'user-faculty', 'PROPOSAL_SUBMITTED', 'Proposal', 'CR-2026-014', 'SUCCESS', 'Proposal submitted and immutable snapshot v1 created.');

  // Proposal 2: Committee Review Stage
  insertProposal.run(
    'CR-2026-020', 'Course Modification', 'Modern Software Engineering & DevOps Integration', 'user-faculty', 'dept-cse',
    'B.Tech. CSE', 'Committee Review', 'stage-2', 'DCC Reviewer', 'Even Semester 2026-27'
  );
  insertVersion.run(
    'ver-020-1', 'CR-2026-020', 1,
    'Transition course from waterfall paradigms to modern GitOps, CI/CD pipelines, and microservices testing.',
    'Object Oriented Programming', 3,
    'Updated Unit 4 to focus on Docker containerization, Kubernetes, and automated test-driven development.',
    'Cloud lab credits ($25 per student) provided through institute academic grant.',
    JSON.stringify({ electiveCategory: 'Core Course', lectureHours: 3, labHours: 0 }),
    'user-faculty', 1
  );
  insertPendingAction.run('pa-020-1', 'CR-2026-020', 'stage-2', 'Committee Evaluation', 'Pending', 'DCC Reviewer');
  insertTimeline.run('ae-020-1', 'user-faculty', 'PROPOSAL_SUBMITTED', 'Proposal', 'CR-2026-020', 'SUCCESS', 'Proposal submitted.');
  insertTimeline.run('ae-020-2', 'user-hod', 'STAGE_RECOMMENDED', 'Proposal', 'CR-2026-020', 'SUCCESS', 'HOD recommended proposal forward to DCC Review.');

  // Proposal 3: Approved with Milestones
  insertProposal.run(
    'CR-2026-005', 'Course Modification', 'Quantum Computing Fundamentals & Qiskit Lab', 'user-faculty', 'dept-cce',
    'B.Tech. CCE', 'Approved', 'stage-4', 'Academic Office', 'Odd Semester 2026-27'
  );
  insertVersion.run(
    'ver-005-1', 'CR-2026-005', 1,
    'Incorporating quantum circuits and qubit error mitigation into physics/computing cross-discipline curriculum.',
    'Linear Algebra, Discrete Mathematics', 4,
    'Added IBM Qiskit simulator lab experiments and Bernstein-Vazirani algorithm demonstration.',
    'No hardware needed; cloud IBM Quantum free tier used.',
    JSON.stringify({ electiveCategory: 'Open Elective', lectureHours: 3, labHours: 2 }),
    'user-faculty', 1
  );

  const insertMilestone = db.prepare(`
    INSERT INTO implementation_milestones (id, proposal_id, title, target_date, status, evidence_reference, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertMilestone.run('ms-1', 'CR-2026-005', 'ERP Course Code Allocation', '2026-11-15', 'Completed', 'ERP Ticket #48201', 'user-academics');
  insertMilestone.run('ms-2', 'CR-2026-005', 'Academic Calendar & Timetable Scheduling', '2026-12-01', 'In Progress', 'Draft Slot 3 Schedule', 'user-academics');
  insertMilestone.run('ms-3', 'CR-2026-005', 'Faculty Assignment & Teaching Lab Allocation', '2026-12-15', 'Not Started', null, 'user-academics');

  // Proposal 4: Draft Proposal
  insertProposal.run(
    'CR-2026-031', 'Programme Structure Change', 'Revision of Minor in Cybersecurity Regulations', 'user-faculty', 'dept-cce',
    'All Engineering Programmes', 'Draft', null, 'Faculty Proposer', 'Odd Semester 2027-28'
  );

  // Notifications
  const insertNotif = db.prepare('INSERT INTO notifications (id, recipient_id, recipient_role, proposal_id, event_type, message) VALUES (?, ?, ?, ?, ?, ?)');
  insertNotif.run('notif-1', 'user-hod', 'Programme Coordinator / HOD', 'CR-2026-014', 'PROPOSAL_SUBMITTED', 'New proposal CR-2026-014 awaiting your department review.');
  insertNotif.run('notif-2', 'user-dcc', 'DCC Reviewer', 'CR-2026-020', 'STAGE_RECOMMENDED', 'Proposal CR-2026-020 has been forwarded to DCC for committee review.');
  insertNotif.run('notif-3', 'user-faculty', 'Faculty Proposer', 'CR-2026-005', 'FINAL_APPROVED', 'Your proposal CR-2026-005 has received institutional Senate approval.');

  console.log('Database seeded successfully with all roles, users, workflows, and sample data!');
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
