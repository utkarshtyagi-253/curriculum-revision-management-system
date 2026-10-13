process.env.DB_PATH = ':memory:';
const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/db/db');
const { seed } = require('../src/db/seed');
const Proposal = require('../src/services/proposalService');
const Workflow = require('../src/services/workflowService');
const Committee = require('../src/services/committeeService');
const faculty = {id:'user-faculty',name:'Faculty',roles:['Faculty Proposer']};
const hod = {id:'user-hod',name:'HOD',roles:['Programme Coordinator / HOD']};
const dcc = {id:'user-dcc',name:'DCC',roles:['DCC Reviewer']};
const office = {id:'user-academics',name:'Office',roles:['Academic Office']};
const senate = {id:'user-senate',name:'Senate',roles:['Senate / Academic Council']};
beforeEach(()=>seed());
afterAll(()=>db.close());
test('revised draft becomes a new immutable snapshot while earlier version stays unchanged',()=>{
 Workflow.reviewProposal('CR-2026-014',hod,{action_type:'Return for Revision',reason:'Update the syllabus'});
 const before=Proposal.getProposalById('CR-2026-014').versions[0].syllabus_changes;
 Proposal.saveDraftData('CR-2026-014',{syllabus_changes:'Revised syllabus with practical industry projects'},faculty.id);
 Proposal.saveDraftData('CR-2026-014',{credits:5},faculty.id);
 const p=Proposal.submitProposal('CR-2026-014',faculty.id);
 expect(p.versions[0].syllabus_changes).toBe('Revised syllabus with practical industry projects');
 expect(p.versions[0].credits).toBe(5);
 expect(p.versions[1].syllabus_changes).toBe(before);
 expect(p.pendingActions).toHaveLength(1);
});
test('invalid action and early Senate decision preserve the pending action',()=>{
 expect(()=>Workflow.reviewProposal('CR-2026-014',hod,{action_type:'bad'})).toThrow('Invalid review action');
 expect(()=>Committee.recordDecision('CR-2026-014',senate,{decision_type:'Final Approval'})).toThrow();
 expect(Proposal.getProposalById('CR-2026-014').pendingActions).toHaveLength(1);
 expect(db.prepare('SELECT * FROM review_actions WHERE proposal_id=?').all('CR-2026-014')).toHaveLength(0);
});
test('full sequential review reaches approval and blocks a repeated decision',()=>{
 Workflow.reviewProposal('CR-2026-014',hod,{action_type:'Recommend/Forward'});
 Committee.recordDecision('CR-2026-014',dcc,{decision_type:'Recommendation',meeting_ref:'DCC-01',meeting_date:'2026-10-13'});
 Workflow.reviewProposal('CR-2026-014',office,{action_type:'Forward to Senate'});
 const p=Committee.recordDecision('CR-2026-014',senate,{decision_type:'Final Approval',meeting_ref:'SEN-01',meeting_date:'2026-10-13'});
 expect(p.current_status).toBe('Approved'); expect(p.pendingActions).toHaveLength(0);
 expect(p.decisions[0].meeting_ref).toBeTruthy();
 expect(()=>Committee.recordDecision(p.id,senate,{decision_type:'Final Approval'})).toThrow('Stale');
});
test('document upload persists bytes and blocks non-owner; completed milestone needs evidence',async()=>{
 const token=(await request(app).post('/api/auth/login').send({email:'faculty@lnmiit.ac.in',password:'Faculty@123'})).body.token;
 const p=Proposal.createProposal({title:'Upload example',proposal_type:'New Course',department_id:'dept-cce'},faculty.id);
 const bytes=Buffer.from('Syllabus document');
 const doc=await request(app).post(`/api/proposals/${p.id}/documents`).set('Authorization',`Bearer ${token}`).send({file_name:'syllabus.txt',file_type:'text/plain',file_size:bytes.length,file_data:`data:text/plain;base64,${bytes.toString('base64')}`});
 expect(doc.status).toBe(200); expect(Proposal.getProposalById(p.id).documents[0].file_path).toContain(bytes.toString('base64'));
 const officeToken=(await request(app).post('/api/auth/login').send({email:'academics@lnmiit.ac.in',password:'Academic@123'})).body.token;
 const denied=await request(app).post(`/api/proposals/${p.id}/documents`).set('Authorization',`Bearer ${officeToken}`).send({}); expect(denied.status).toBe(403);
 db.prepare("UPDATE proposals SET current_status='Approved' WHERE id=?").run(p.id);
 const milestone=await request(app).post(`/api/milestones/proposal/${p.id}`).set('Authorization',`Bearer ${officeToken}`).send({title:'Publish syllabus',target_date:'2026-11-01'}); expect(milestone.status).toBe(201);
 const fail=await request(app).put(`/api/milestones/${milestone.body.id}`).set('Authorization',`Bearer ${officeToken}`).send({status:'Completed'}); expect(fail.status).toBe(400);
 const pass=await request(app).put(`/api/milestones/${milestone.body.id}`).set('Authorization',`Bearer ${officeToken}`).send({status:'Completed',evidence_reference:'Academic records updated'}); expect(pass.status).toBe(200);
});

test('dashboard returns actual proposal counts',async()=>{const token=(await request(app).post('/api/auth/login').send({email:'faculty@lnmiit.ac.in',password:'Faculty@123'})).body.token; const res=await request(app).get('/api/proposals/stats').set('Authorization',`Bearer ${token}`); expect(res.status).toBe(200);expect(res.body.total).toBe(4);expect(res.body.drafts).toBe(1);expect(res.body.underReview).toBe(2);});
