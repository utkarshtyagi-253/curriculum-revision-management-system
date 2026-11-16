process.env.DB_PATH = ':memory:';
const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/db/db');
const { seed } = require('../src/db/seed');

beforeEach(() => seed());
afterAll(() => db.close());

const completeDraft = {
  title: 'Assignment 06 Test Course', proposal_type: 'New Course', department_id: 'dept-cce',
  affected_programmes: 'B.Tech. CCE', proposed_implementation_session: 'Odd Semester 2027-28',
  academic_rationale: 'A complete rationale describing the curriculum need and expected student outcomes.',
  prerequisites: 'Data Structures', credits: 4,
  syllabus_changes: 'A complete syllabus outline with learning units and assessment plan.',
  resource_implications: 'Existing laboratory resources are sufficient.'
};

async function token(email,password) {
  const res=await request(app).post('/api/auth/login').send({email,password});
  expect(res.status).toBe(200);
  return res.body.token;
}

async function createDraft(auth,data=completeDraft) {
  const res=await request(app).post('/api/proposals').set('Authorization',`Bearer ${auth}`).send(data);
  expect(res.status).toBe(201);
  return res.body.id;
}

test('TC-005-01 UC-005 valid complete proposal is submitted and routed',async()=>{
  const auth=await token('faculty@lnmiit.ac.in','Faculty@123');
  const id=await createDraft(auth);
  const res=await request(app).post(`/api/proposals/${id}/submit`).set('Authorization',`Bearer ${auth}`);
  expect(res.status).toBe(200);
  expect(res.body.proposal.current_responsible_role).toBe('Programme Coordinator / HOD');
  expect(res.body.proposal.versions.filter(v=>v.is_immutable)).toHaveLength(1);
  expect(res.body.proposal.pendingActions).toHaveLength(1);
});

test('TC-005-02 UC-005 missing mandatory fields block submission without sealing a version',async()=>{
  const auth=await token('faculty@lnmiit.ac.in','Faculty@123');
  const id=await createDraft(auth,{title:'Incomplete test',proposal_type:'New Course',department_id:'dept-cce'});
  const res=await request(app).post(`/api/proposals/${id}/submit`).set('Authorization',`Bearer ${auth}`);
  expect(res.status).toBe(400);
  expect(res.body.error).toContain('Incomplete proposal fields');
  expect(db.prepare('SELECT count(*) n FROM proposal_versions WHERE proposal_id=? AND is_immutable=1').get(id).n).toBe(0);
  expect(db.prepare('SELECT current_status FROM proposals WHERE id=?').get(id).current_status).toBe('Draft');
});

test('TC-005-03 UC-005 non-owner cannot submit another proposer\'s draft',async()=>{
  const auth=await token('hod@lnmiit.ac.in','Hod@123');
  const res=await request(app).post('/api/proposals/CR-2026-031/submit').set('Authorization',`Bearer ${auth}`);
  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/owner|authorized/i);
  expect(db.prepare("SELECT current_status FROM proposals WHERE id='CR-2026-031'").get().current_status).toBe('Draft');
});

test('TC-005-04 UC-005 document upload boundary accepts 5 MiB and rejects 5 MiB plus one byte',async()=>{
  const auth=await token('faculty@lnmiit.ac.in','Faculty@123');
  const id=await createDraft(auth);
  const upload=async size=>{
    const bytes=Buffer.alloc(size,65);
    return request(app).post(`/api/proposals/${id}/documents`).set('Authorization',`Bearer ${auth}`).send({file_name:'boundary.txt',file_type:'text/plain',file_size:size,file_data:`data:text/plain;base64,${bytes.toString('base64')}`});
  };
  const atLimit=await upload(5*1024*1024);
  expect(atLimit.status).toBe(200);
  const above=await upload(5*1024*1024+1);
  expect(above.status).toBe(400);
  expect(db.prepare('SELECT count(*) n FROM supporting_documents WHERE proposal_id=?').get(id).n).toBe(1);
});

test('TC-005-05 UC-005 resubmission creates a new immutable version and preserves v1',async()=>{
  const faculty=await token('faculty@lnmiit.ac.in','Faculty@123');
  const hod=await token('hod@lnmiit.ac.in','Hod@123');
  const firstVersion=db.prepare("SELECT id,syllabus_changes FROM proposal_versions WHERE proposal_id='CR-2026-014' AND is_immutable=1").get();
  const returned=await request(app).post('/api/workflow/proposals/CR-2026-014/review').set('Authorization',`Bearer ${hod}`).send({action_type:'Return for Revision',reason:'Please clarify the learning outcomes.'});
  expect(returned.status).toBe(200);
  const edit=await request(app).put('/api/proposals/CR-2026-014/draft').set('Authorization',`Bearer ${faculty}`).send({syllabus_changes:'Revised syllabus with explicit learning outcomes and assessment alignment.'});
  expect(edit.status).toBe(200);
  const submitted=await request(app).post('/api/proposals/CR-2026-014/submit').set('Authorization',`Bearer ${faculty}`);
  expect(submitted.status).toBe(200);
  expect(submitted.body.proposal.versions.filter(v=>v.is_immutable)).toHaveLength(2);
  expect(db.prepare('SELECT syllabus_changes FROM proposal_versions WHERE id=?').get(firstVersion.id).syllabus_changes).toBe(firstVersion.syllabus_changes);
});

test('TC-005-06 UC-005 unauthorized role cannot read another proposer\'s unpublished draft',async()=>{
  const auth=await token('hod@lnmiit.ac.in','Hod@123');
  const res=await request(app).get('/api/proposals/CR-2026-031').set('Authorization',`Bearer ${auth}`);
  expect(res.status).toBe(404);
});

test('TC-009-01 UC-009 authorized HOD forwards to configured next stage',async()=>{
  const auth=await token('hod@lnmiit.ac.in','Hod@123');
  const res=await request(app).post('/api/workflow/proposals/CR-2026-014/review').set('Authorization',`Bearer ${auth}`).send({action_type:'Recommend/Forward',comment:'Department review is complete.'});
  expect(res.status).toBe(200);
  expect(res.body.proposal.current_responsible_role).toBe('DCC Reviewer');
  expect(res.body.proposal.current_status).toBe('Committee Review');
});

test('TC-009-02 UC-009 return without a reason is rejected and leaves the pending action open',async()=>{
  const auth=await token('hod@lnmiit.ac.in','Hod@123');
  const res=await request(app).post('/api/workflow/proposals/CR-2026-014/review').set('Authorization',`Bearer ${auth}`).send({action_type:'Return for Revision',reason:''});
  expect(res.status).toBe(400);
  expect(res.body.error).toContain('requires a valid recorded reason');
  expect(db.prepare("SELECT count(*) n FROM review_actions WHERE proposal_id='CR-2026-014'").get().n).toBe(0);
  expect(db.prepare("SELECT count(*) n FROM pending_actions WHERE proposal_id='CR-2026-014' AND status='Pending'").get().n).toBe(1);
});

test('TC-009-03 UC-009 user without the assigned review role cannot act',async()=>{
  const auth=await token('faculty@lnmiit.ac.in','Faculty@123');
  const res=await request(app).post('/api/workflow/proposals/CR-2026-014/review').set('Authorization',`Bearer ${auth}`).send({action_type:'Recommend/Forward',comment:'Attempted unauthorized review.'});
  expect(res.status).toBe(400);
  expect(res.body.error).toContain('not authorized');
  expect(db.prepare("SELECT current_stage_id FROM proposals WHERE id='CR-2026-014'").get().current_stage_id).toBe('stage-1');
});

test('TC-009-04 UC-009 action not configured for current stage is rejected',async()=>{
  const auth=await token('hod@lnmiit.ac.in','Hod@123');
  const res=await request(app).post('/api/workflow/proposals/CR-2026-014/review').set('Authorization',`Bearer ${auth}`).send({action_type:'Reject',reason:'Not permitted at this stage.'});
  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/Invalid review action|not permitted/i);
  expect(db.prepare("SELECT current_stage_id FROM proposals WHERE id='CR-2026-014'").get().current_stage_id).toBe('stage-1');
});

test('TC-015-01 UC-015 committee recommendation records meeting and voting summary',async()=>{
  const auth=await token('dcc@lnmiit.ac.in','Dcc@123');
  const res=await request(app).post('/api/workflow/proposals/CR-2026-020/decision').set('Authorization',`Bearer ${auth}`).send({decision_type:'Recommendation',meeting_ref:'DCC-TEST-01',meeting_date:'2026-11-16',voting_summary:'5 in favour, 0 against'});
  expect(res.status).toBe(200);
  expect(res.body.proposal.current_responsible_role).toBe('Academic Office');
  expect(res.body.proposal.decisions[0].voting_summary).toContain('5 in favour');
});

test('TC-015-02 UC-015 conditional approval without conditions is rejected',async()=>{
  const auth=await token('dcc@lnmiit.ac.in','Dcc@123');
  const res=await request(app).post('/api/workflow/proposals/CR-2026-020/decision').set('Authorization',`Bearer ${auth}`).send({decision_type:'Conditional Approval',meeting_ref:'DCC-TEST-02',meeting_date:'2026-11-16',conditions:''});
  expect(res.status).toBe(400);
  expect(res.body.error).toContain('cannot be saved without recorded condition');
  expect(db.prepare("SELECT count(*) n FROM decisions WHERE proposal_id='CR-2026-020'").get().n).toBe(0);
});

test('TC-015-03 UC-015 rejection without a reason is rejected',async()=>{
  const auth=await token('dcc@lnmiit.ac.in','Dcc@123');
  const res=await request(app).post('/api/workflow/proposals/CR-2026-020/decision').set('Authorization',`Bearer ${auth}`).send({decision_type:'Rejection',meeting_ref:'DCC-TEST-03',meeting_date:'2026-11-16',decision_reason:''});
  expect(res.status).toBe(400);
  expect(res.body.error).toContain('requires an explicit recorded reason');
  expect(db.prepare("SELECT current_status FROM proposals WHERE id='CR-2026-020'").get().current_status).toBe('Committee Review');
});

test('TC-015-04 UC-015 DCC cannot record final Senate approval',async()=>{
  const auth=await token('dcc@lnmiit.ac.in','Dcc@123');
  const res=await request(app).post('/api/workflow/proposals/CR-2026-020/decision').set('Authorization',`Bearer ${auth}`).send({decision_type:'Final Approval',meeting_ref:'DCC-TEST-04',meeting_date:'2026-11-16'});
  expect(res.status).toBe(400);
  expect(res.body.error).toContain('not permitted at stage');
  expect(db.prepare("SELECT count(*) n FROM decisions WHERE proposal_id='CR-2026-020'").get().n).toBe(0);
});

test('TC-SYS-01 UC-005/UC-009/UC-015 full proposal lifecycle persists through final approval',async()=>{
  const faculty=await token('faculty@lnmiit.ac.in','Faculty@123');
  const hod=await token('hod@lnmiit.ac.in','Hod@123');
  const dcc=await token('dcc@lnmiit.ac.in','Dcc@123');
  const office=await token('academics@lnmiit.ac.in','Academic@123');
  const senate=await token('senate@lnmiit.ac.in','Senate@123');
  const id=await createDraft(faculty);
  const submitted=await request(app).post(`/api/proposals/${id}/submit`).set('Authorization',`Bearer ${faculty}`);
  expect(submitted.status).toBe(200);
  const forwarded=await request(app).post(`/api/workflow/proposals/${id}/review`).set('Authorization',`Bearer ${hod}`).send({action_type:'Recommend/Forward',comment:'Department review complete.'});
  expect(forwarded.status).toBe(200);
  const committee=await request(app).post(`/api/workflow/proposals/${id}/decision`).set('Authorization',`Bearer ${dcc}`).send({decision_type:'Recommendation',meeting_ref:'DCC-SYS-01',meeting_date:'2026-11-16',voting_summary:'5 in favour, 0 against'});
  expect(committee.status).toBe(200);
  const officeForward=await request(app).post(`/api/workflow/proposals/${id}/review`).set('Authorization',`Bearer ${office}`).send({action_type:'Forward to Senate',comment:'Academic scrutiny complete.'});
  expect(officeForward.status).toBe(200);
  const final=await request(app).post(`/api/workflow/proposals/${id}/decision`).set('Authorization',`Bearer ${senate}`).send({decision_type:'Final Approval',meeting_ref:'SENATE-SYS-01',meeting_date:'2026-11-16',decision_reason:'Approved for implementation.'});
  expect(final.status).toBe(200);
  expect(final.body.proposal.current_status).toBe('Approved');
  const reauthenticatedFaculty=await token('faculty@lnmiit.ac.in','Faculty@123');
  const persisted=await request(app).get(`/api/proposals/${id}`).set('Authorization',`Bearer ${reauthenticatedFaculty}`);
  expect(persisted.status).toBe(200);
  expect(persisted.body.decisions.some(decision=>decision.decision_type==='Final Approval')).toBe(true);
  expect((await request(app).get(`/api/proposals/${id}/timeline`).set('Authorization',`Bearer ${reauthenticatedFaculty}`)).body.length).toBeGreaterThan(0);
});
