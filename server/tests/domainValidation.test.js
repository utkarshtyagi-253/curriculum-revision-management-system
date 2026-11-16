process.env.DB_PATH=':memory:';
const request=require('supertest');
const app=require('../src/app');
const {db}=require('../src/db/db');
const {seed}=require('../src/db/seed');
beforeEach(()=>seed());
afterAll(()=>db.close());

async function auth(email,password){return (await request(app).post('/api/auth/login').send({email,password})).body.token;}

test('course master data accepts positive half-credit values and canonicalizes course codes',async()=>{
 const token=await auth('admin@lnmiit.ac.in','Admin@123');
 const res=await request(app).post('/api/master-data/courses').set('Authorization',`Bearer ${token}`).send({code:' cs499 ',title:'Advanced Robotics',credits:4.5,department_id:'dept-cce'});
 expect(res.status).toBe(201); expect(res.body.code).toBe('CS499'); expect(res.body.credits).toBe(4.5);
 expect(db.prepare('SELECT typeof(credits) type FROM courses WHERE id=?').get(res.body.id).type).toBe('real');
});

test.each([0.5,12])('course credit boundary %s is accepted',async credits=>{
 const token=await auth('admin@lnmiit.ac.in','Admin@123');
 const res=await request(app).post('/api/master-data/courses').set('Authorization',`Bearer ${token}`).send({code:'CS499',title:'Advanced Robotics',credits,department_id:'dept-cce'});
 expect(res.status).toBe(201); expect(res.body.credits).toBe(credits);
});

test.each([0,-0.5,0.1,12.5,'not-a-number'])('course credit value %s is rejected by the API',async credits=>{
 const token=await auth('admin@lnmiit.ac.in','Admin@123');
 const res=await request(app).post('/api/master-data/courses').set('Authorization',`Bearer ${token}`).send({code:'CS499',title:'Advanced Robotics',credits,department_id:'dept-cce'});
 expect(res.status).toBe(400);
 expect(db.prepare("SELECT count(*) n FROM courses WHERE code='CS499'").get().n).toBe(0);
});

test('proposal credits accept 1.5 and reject invalid or out-of-range updates',async()=>{
 const token=await auth('faculty@lnmiit.ac.in','Faculty@123');
 const res=await request(app).post('/api/proposals').set('Authorization',`Bearer ${token}`).send({proposal_type:'New Course',title:'Fractional Credit Course',department_id:'dept-cce',credits:1.5});
 expect(res.status).toBe(201); expect(res.body.versions[0].credits).toBe(1.5);
 for(const credits of [0,-0.5,0.1,12.5,'bad']){
   const update=await request(app).put(`/api/proposals/${res.body.id}/draft`).set('Authorization',`Bearer ${token}`).send({credits});
   expect(update.status).toBe(400);
 }
 expect(db.prepare('SELECT credits FROM proposal_versions WHERE proposal_id=? AND is_immutable=0').get(res.body.id).credits).toBe(1.5);
});

test('case-insensitive duplicate course codes are rejected',async()=>{
 const token=await auth('admin@lnmiit.ac.in','Admin@123');
 const res=await request(app).post('/api/master-data/courses').set('Authorization',`Bearer ${token}`).send({code:'cs314',title:'Duplicate Code',credits:3,department_id:'dept-cce'});
 expect(res.status).toBe(409);
});

test('committee meeting reference and date must be paired and calendar-valid',async()=>{
 const token=await auth('dcc@lnmiit.ac.in','Dcc@123');
 const endpoint='/api/workflow/proposals/CR-2026-020/decision';
 const payload={decision_type:'Recommendation',voting_summary:'5 in favour'};
 const partial=await request(app).post(endpoint).set('Authorization',`Bearer ${token}`).send({...payload,meeting_ref:'DCC-2026-02'});
 expect(partial.status).toBe(400);
 const invalid=await request(app).post(endpoint).set('Authorization',`Bearer ${token}`).send({...payload,meeting_ref:'DCC-2026-02',meeting_date:'2026-02-30'});
 expect(invalid.status).toBe(400); expect(invalid.body.error).toContain('valid calendar date');
 expect(db.prepare("SELECT count(*) n FROM decisions WHERE proposal_id='CR-2026-020'").get().n).toBe(0);
});

test('milestones reject impossible target and completion dates',async()=>{
 const token=await auth('academics@lnmiit.ac.in','Academic@123');
 const invalid=await request(app).post('/api/milestones/proposal/CR-2026-005').set('Authorization',`Bearer ${token}`).send({title:'Publish course',target_date:'2026-02-30'});
 expect(invalid.status).toBe(400);
 const valid=await request(app).post('/api/milestones/proposal/CR-2026-005').set('Authorization',`Bearer ${token}`).send({title:'Publish course',target_date:'2027-01-15'});
 expect(valid.status).toBe(201);
 const badCompletion=await request(app).put(`/api/milestones/${valid.body.id}`).set('Authorization',`Bearer ${token}`).send({status:'Completed',evidence_reference:'Course catalogue updated',completion_date:'2026-13-01'});
 expect(badCompletion.status).toBe(400);
 expect(db.prepare('SELECT status FROM implementation_milestones WHERE id=?').get(valid.body.id).status).toBe('Not Started');
});
