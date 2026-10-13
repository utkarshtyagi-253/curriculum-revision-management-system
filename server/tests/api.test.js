const request = require('supertest');
const app = require('../src/app');
const { seed } = require('../src/db/seed');

beforeAll(() => {
  seed();
});

describe('Curriculum Revision Management System API Tests', () => {
  let facultyToken;
  let hodToken;
  let dccToken;
  let senateToken;

  test('FR-001 / FR-002: Authenticate users and obscure failure reasons', async () => {
    // Valid Faculty login
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty@lnmiit.ac.in', password: 'Faculty@123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('Dr. Ananya Rao');
    facultyToken = res.body.token;

    // Valid HOD login
    const hodRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'hod@lnmiit.ac.in', password: 'Hod@123' });
    hodToken = hodRes.body.token;

    // Valid DCC login
    const dccRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dcc@lnmiit.ac.in', password: 'Dcc@123' });
    dccToken = dccRes.body.token;

    // Valid Senate login
    const senateRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'senate@lnmiit.ac.in', password: 'Senate@123' });
    senateToken = senateRes.body.token;

    // Invalid password -> Generic failure message (FR-002)
    const failRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty@lnmiit.ac.in', password: 'WrongPassword' });
    expect(failRes.statusCode).toBe(401);
    expect(failRes.body.error).toBe('Invalid email or password.');
  });

  test('FR-009 / FR-012 / BR-003: Create proposal draft and save draft content', async () => {
    const createRes = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Robotics and Cyber-Physical Systems',
        proposal_type: 'New Course',
        department_id: 'dept-cce',
        affected_programmes: 'B.Tech. CCE',
        proposed_implementation_session: 'Odd Semester 2026-27',
        academic_rationale: 'Essential for modern automation and IoT curriculum integration.',
        prerequisites: 'Signals and Systems, Microprocessors',
        credits: 4,
        syllabus_changes: 'Full course syllabus introducing ROS2, Kalman filtering, and actuators.',
        resource_implications: 'Robotics hardware kit for laboratory experiments.'
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.current_status).toBe('Draft');
    const propId = createRes.body.id;

    // Update draft
    const updateRes = await request(app)
      .put(`/api/proposals/${propId}/draft`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        academic_rationale: 'Updated: Critical interdisciplinary course required for ABET accreditation standards.',
        credits: 4
      });

    expect(updateRes.statusCode).toBe(200);
  });

  test('UC-005 / FR-015 / FR-016 / BR-004 / BR-005: Validate completeness and submit proposal', async () => {
    // 1. Attempt submitting incomplete proposal
    const incRes = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Incomplete Draft Course',
        proposal_type: 'New Course',
        department_id: 'dept-cce'
      });
    const incId = incRes.body.id;

    const subFail = await request(app)
      .post(`/api/proposals/${incId}/submit`)
      .set('Authorization', `Bearer ${facultyToken}`);
    expect(subFail.statusCode).toBe(400);
    expect(subFail.body.error).toContain('BR-004: Incomplete proposal fields');

    // 2. Submit complete proposal
    const completeRes = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Distributed Systems & Cloud Computing Architecture',
        proposal_type: 'New Course',
        department_id: 'dept-cse',
        affected_programmes: 'B.Tech. CSE',
        proposed_implementation_session: 'Odd Semester 2026-27',
        academic_rationale: 'Comprehensive coverage of distributed consensus, Raft, Paxos, and AWS cloud patterns.',
        prerequisites: 'Operating Systems, Computer Networks',
        credits: 4,
        syllabus_changes: 'Introduces consensus algorithms, gRPC, and container orchestration.',
        resource_implications: 'Cloud simulator access.'
      });
    const completeId = completeRes.body.id;

    const subSuccess = await request(app)
      .post(`/api/proposals/${completeId}/submit`)
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(subSuccess.statusCode).toBe(200);
    expect(subSuccess.body.proposal.current_status).toBe('Submitted / Under Review');
    expect(subSuccess.body.proposal.current_responsible_role).toBe('Programme Coordinator / HOD');
    expect(subSuccess.body.proposal.versions.length).toBe(1);
    expect(subSuccess.body.proposal.versions[0].version_number).toBe(1);
    expect(subSuccess.body.proposal.versions[0].is_immutable).toBe(1);
  });

  test('UC-009 / FR-020 / FR-021 / BR-008 / BR-010: Review proposal, enforce return reason, and forward', async () => {
    const propId = 'CR-2026-014'; // Currently in Department Review (Stage 1)

    // Unauthorized user attempt (Faculty cannot perform HOD review action)
    const unauthReview = await request(app)
      .post(`/api/workflow/proposals/${propId}/review`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ action_type: 'Recommend/Forward' });
    expect(unauthReview.statusCode).toBe(400);
    expect(unauthReview.body.error).toContain('BR-010 / A1');

    // Return for Revision without reason must fail (BR-008)
    const returnNoReason = await request(app)
      .post(`/api/workflow/proposals/${propId}/review`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({ action_type: 'Return for Revision', reason: '' });
    expect(returnNoReason.statusCode).toBe(400);
    expect(returnNoReason.body.error).toContain('BR-008 / A3');

    // Forward to DCC Review
    const forwardRes = await request(app)
      .post(`/api/workflow/proposals/${propId}/review`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({ action_type: 'Recommend/Forward', comment: 'Department syllabus committee approved.' });
    expect(forwardRes.statusCode).toBe(200);
    expect(forwardRes.body.proposal.current_status).toBe('Committee Review');
    expect(forwardRes.body.proposal.current_responsible_role).toBe('DCC Reviewer');
  });

  test('UC-015 / FR-032 / FR-033 / BR-009: Record committee decision with conditions', async () => {
    const propId = 'CR-2026-014'; // Now in DCC Committee Review (Stage 2)

    // Conditional approval without conditions must fail (BR-009)
    const failCond = await request(app)
      .post(`/api/workflow/proposals/${propId}/decision`)
      .set('Authorization', `Bearer ${dccToken}`)
      .send({
        decision_type: 'Conditional Approval',
        conditions: '',
        meeting_ref: 'DCC-CCE-2026-M04',
        meeting_date: '2026-10-05'
      });
    expect(failCond.statusCode).toBe(400);
    expect(failCond.body.error).toContain('BR-009 / A2');

    // Conditional approval with proper condition and meeting ref
    const passCond = await request(app)
      .post(`/api/workflow/proposals/${propId}/decision`)
      .set('Authorization', `Bearer ${dccToken}`)
      .send({
        decision_type: 'Conditional Approval',
        conditions: 'Include at least two practical industry case studies in Unit 3.',
        meeting_ref: 'DCC-CCE-2026-M04',
        meeting_date: '2026-10-05',
        voting_summary: 'Approved unanimously (5-0)'
      });
    expect(passCond.statusCode).toBe(200);
    expect(passCond.body.proposal.current_status).toBe('Under Review'); // Forwarded to stage 3 (Academic Office)
  });

  test('FR-027: Compare successive proposal versions', async () => {
    // Proposal CR-2026-014 has version 1. Let's return it and resubmit to create version 2
    // Return proposal from stage 3
    const adminToken = (await request(app).post('/api/auth/login').send({ email: 'admin@lnmiit.ac.in', password: 'Admin@123' })).body.token;
    
    await request(app)
      .post('/api/workflow/proposals/CR-2026-014/review')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action_type: 'Return for Revision', reason: 'Need updated textbook citations.' });

    // Faculty updates draft and resubmits
    await request(app)
      .put('/api/proposals/CR-2026-014/draft')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        syllabus_changes: 'Updated syllabus including 2026 textbook citations and 2 industry case studies.',
        credits: 4
      });

    const resubmitRes = await request(app)
      .post('/api/proposals/CR-2026-014/submit')
      .set('Authorization', `Bearer ${facultyToken}`);
    expect(resubmitRes.body.proposal.versions.length).toBe(2);

    // Compare versions v1 and v2
    const diffRes = await request(app)
      .get('/api/proposals/CR-2026-014/compare?v1=1&v2=2')
      .set('Authorization', `Bearer ${facultyToken}`);
    expect(diffRes.statusCode).toBe(200);
    expect(diffRes.body.diffs.syllabus_changes.isChanged).toBe(true);
  });

  test('FR-045 / FR-047 / FR-048: Retrieve chronological timeline and audit trail', async () => {
    const timelineRes = await request(app)
      .get('/api/proposals/CR-2026-014/timeline')
      .set('Authorization', `Bearer ${facultyToken}`);
    expect(timelineRes.statusCode).toBe(200);
    expect(timelineRes.body.length).toBeGreaterThan(0);

    const auditRes = await request(app)
      .get('/api/audit/trail')
      .set('Authorization', `Bearer ${hodToken}`); // Hod is not Academic Office or Admin -> 403
    expect(auditRes.statusCode).toBe(403);

    const adminToken = (await request(app).post('/api/auth/login').send({ email: 'admin@lnmiit.ac.in', password: 'Admin@123' })).body.token;
    const adminAuditRes = await request(app)
      .get('/api/audit/trail')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminAuditRes.statusCode).toBe(200);
    expect(adminAuditRes.body.length).toBeGreaterThan(0);
  });
});
