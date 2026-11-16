const express = require('express');
const router = express.Router();
const { db } = require('../db/db');
const { authenticate, requireRole } = require('../middleware/auth');
const WorkflowService = require('../services/workflowService');
const CommitteeService = require('../services/committeeService');
const crypto = require('crypto');
const ProposalService = require('../services/proposalService');

// GET /api/workflow/pending (Get pending actions for the logged-in user's roles)
router.get('/pending', authenticate, (req, res) => {
  const placeholders = req.user.roles.map(() => '?').join(',');
  const query = `
    SELECT pa.*, p.title as proposal_title, p.proposal_type, p.current_status,
           ws.name as stage_name, d.name as department_name, u.name as owner_name
    FROM pending_actions pa
    JOIN proposals p ON pa.proposal_id = p.id
    JOIN workflow_stages ws ON pa.stage_id = ws.id
    LEFT JOIN departments d ON p.department_id = d.id
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE pa.status = 'Pending' AND (pa.assigned_role IN (${placeholders}) OR ? = 1) AND (pa.assigned_role != 'Faculty Proposer' OR p.owner_id = ? OR ? = 1)
    ORDER BY pa.created_at DESC
  `;

  const isAdmin = req.user.roles.includes('System Administrator') ? 1 : 0;
  const actions = db.prepare(query).all(...req.user.roles, isAdmin, req.user.id, isAdmin);
  res.json(actions);
});

// POST /api/workflow/proposals/:id/review (UC-009: Review Proposal & Record Feedback)
router.post('/proposals/:id/review', authenticate, (req, res) => {
  try {
    const updated = WorkflowService.reviewProposal(req.params.id, req.user, req.body);
    res.json({
      message: 'Review action recorded successfully.',
      proposal: updated
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/workflow/proposals/:id/decision (UC-015: Record Committee Decision)
router.post('/proposals/:id/decision', authenticate, (req, res) => {
  try {
    const updated = CommitteeService.recordDecision(req.params.id, req.user, req.body);
    res.json({
      message: 'Committee decision recorded and workflow updated.',
      proposal: updated
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/workflow/stages (Get stages of active workflow)
router.get('/stages', authenticate, (req, res) => {
  const stages = db.prepare(`
    SELECT ws.*, wd.name as workflow_name
    FROM workflow_stages ws
    JOIN workflow_definitions wd ON ws.workflow_id = wd.id
    WHERE wd.active_status = 1
    ORDER BY ws.sequence_no ASC
  `).all();
  res.json(stages);
});

// Administrators can maintain the ordered workflow. A stage currently used by a proposal cannot be removed.
router.post('/stages', authenticate, requireRole(['System Administrator']), (req, res) => {
  const { name, responsible_role, permitted_actions, is_mandatory = true } = req.body;
  if (typeof name !== 'string' || !name.trim() || !db.prepare('SELECT id FROM roles WHERE name=?').get(responsible_role) || typeof permitted_actions !== 'string' || !permitted_actions.trim()) return res.status(400).json({error:'Stage name, valid responsible role, and permitted actions are required.'});
  const workflow=db.prepare('SELECT id FROM workflow_definitions WHERE active_status=1 ORDER BY version DESC LIMIT 1').get();
  if (!workflow) return res.status(400).json({error:'No active workflow is configured.'});
  const sequence=db.prepare('SELECT COALESCE(MAX(sequence_no),0)+1 n FROM workflow_stages WHERE workflow_id=?').get(workflow.id).n;
  const id=crypto.randomUUID();
  db.prepare('INSERT INTO workflow_stages(id,workflow_id,sequence_no,name,responsible_role,permitted_actions,is_mandatory) VALUES(?,?,?,?,?,?,?)').run(id,workflow.id,sequence,name.trim(),responsible_role,permitted_actions.trim(),is_mandatory?1:0);
  ProposalService.recordAudit(req.user.id,'WORKFLOW_STAGE_CREATED','WorkflowStage',id,'SUCCESS',`Added stage ${name.trim()} at position ${sequence}.`);
  res.status(201).json({id,sequence_no:sequence,name:name.trim(),responsible_role,permitted_actions,is_mandatory:is_mandatory?1:0});
});

router.put('/stages/:id', authenticate, requireRole(['System Administrator']), (req, res) => {
  const {name,responsible_role,permitted_actions,sequence_no,is_mandatory}=req.body;
  const stage=db.prepare('SELECT * FROM workflow_stages WHERE id=?').get(req.params.id);
  if (!stage) return res.status(404).json({error:'Workflow stage not found.'});
  if (typeof name!=='string'||!name.trim()||!db.prepare('SELECT id FROM roles WHERE name=?').get(responsible_role)||typeof permitted_actions!=='string'||!permitted_actions.trim()||!Number.isInteger(Number(sequence_no))||Number(sequence_no)<1) return res.status(400).json({error:'Valid stage name, role, actions and sequence number are required.'});
  const inUse=db.prepare("SELECT count(*) n FROM proposals WHERE current_stage_id=? AND current_status NOT IN ('Approved','Rejected','Implemented')").get(stage.id).n;
  if (inUse && responsible_role!==stage.responsible_role) return res.status(409).json({error:'Cannot change the responsible role of a stage with active proposals.'});
  const stages=db.prepare('SELECT id FROM workflow_stages WHERE workflow_id=? ORDER BY sequence_no,id').all(stage.workflow_id);
  if (Number(sequence_no)>stages.length) return res.status(400).json({error:`Sequence must be between 1 and ${stages.length}.`});
  let reordered=stages;
  if(Number(sequence_no)!==stage.sequence_no){
    if(db.prepare("SELECT 1 FROM proposals p JOIN workflow_stages ws ON ws.id=p.current_stage_id WHERE ws.workflow_id=? AND p.current_status NOT IN ('Approved','Rejected','Implemented') LIMIT 1").get(stage.workflow_id)) return res.status(409).json({error:'Cannot reorder workflow stages while proposals are in progress.'});
    reordered=stages.filter(item=>item.id!==stage.id);reordered.splice(Number(sequence_no)-1,0,{id:stage.id});
  }
  db.transaction(()=>{
    db.prepare('UPDATE workflow_stages SET name=?,responsible_role=?,permitted_actions=?,is_mandatory=? WHERE id=?').run(name.trim(),responsible_role,permitted_actions.trim(),is_mandatory?1:0,stage.id);
    const setSequence=db.prepare('UPDATE workflow_stages SET sequence_no=? WHERE id=?');
    reordered.forEach((item,index)=>setSequence.run(index+1,item.id));
  })();
  ProposalService.recordAudit(req.user.id,'WORKFLOW_STAGE_UPDATED','WorkflowStage',stage.id,'SUCCESS',`Updated workflow stage ${name.trim()}.`);
  res.json({success:true});
});

router.delete('/stages/:id', authenticate, requireRole(['System Administrator']), (req, res) => {
  const stage=db.prepare('SELECT * FROM workflow_stages WHERE id=?').get(req.params.id);
  if (!stage) return res.status(404).json({error:'Workflow stage not found.'});
  if (db.prepare('SELECT 1 FROM proposals WHERE current_stage_id=? LIMIT 1').get(stage.id) || db.prepare('SELECT 1 FROM pending_actions WHERE stage_id=? LIMIT 1').get(stage.id) || db.prepare('SELECT 1 FROM review_actions WHERE stage_id=? LIMIT 1').get(stage.id)) return res.status(409).json({error:'Cannot remove a stage referenced by proposal or workflow history.'});
  db.prepare('DELETE FROM workflow_stages WHERE id=?').run(stage.id);
  const rest=db.prepare('SELECT id FROM workflow_stages WHERE workflow_id=? ORDER BY sequence_no,id').all(stage.workflow_id);
  const renumber=db.prepare('UPDATE workflow_stages SET sequence_no=? WHERE id=?');
  db.transaction(()=>rest.forEach((row,index)=>renumber.run(index+1,row.id)))();
  ProposalService.recordAudit(req.user.id,'WORKFLOW_STAGE_REMOVED','WorkflowStage',stage.id,'SUCCESS',`Removed workflow stage ${stage.name}.`);
  res.json({success:true});
});

module.exports = router;
