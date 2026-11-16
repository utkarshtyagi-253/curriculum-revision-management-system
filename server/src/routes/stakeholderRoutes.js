const express = require('express');
const crypto = require('crypto');
const { db } = require('../db/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { requireProposalAccess } = require('../middleware/proposalAccess');
const ProposalService = require('../services/proposalService');

const router=express.Router();

router.post('/proposals/:id/invitations',authenticate,requireRole(['Programme Coordinator / HOD','DCC Reviewer','Academic Office']),requireProposalAccess,(req,res)=>{
  const {email,category,expiry_days=7}=req.body;
  const allowed=['Student','Alumni','Industry / External Expert'];
  const days=Number(expiry_days);
  if(typeof email!=='string'||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())||!allowed.includes(category)||!Number.isInteger(days)||days<1||days>30) return res.status(400).json({error:'Provide a valid email, permitted stakeholder category, and expiry between 1 and 30 days.'});
  const proposal=db.prepare('SELECT id,current_status FROM proposals WHERE id=?').get(req.params.id);
  if(!proposal||['Draft','Rejected'].includes(proposal.current_status)) return res.status(400).json({error:'Feedback invitations are available for proposals in review or approved status.'});
  const id=crypto.randomUUID(),token=crypto.randomBytes(32).toString('hex'),emailNorm=email.trim().toLowerCase();
  const expires=new Date(Date.now()+days*86400000).toISOString();
  const create=db.transaction(()=>{
    db.prepare('INSERT INTO stakeholder_invitations(id,proposal_id,invitee_email,category,invited_by,expiry_date) VALUES(?,?,?,?,?,?)').run(id,req.params.id,emailNorm,category,req.user.id,expires);
    db.prepare('INSERT INTO stakeholder_invitation_tokens(invitation_id,token_hash) VALUES(?,?)').run(id,crypto.createHash('sha256').update(token).digest('hex'));
  });
  create();
  ProposalService.recordAudit(req.user.id,'STAKEHOLDER_INVITED','Proposal',req.params.id,'SUCCESS',`Invited ${category} stakeholder for feedback; invitation expires ${expires}.`);
  // Email delivery is intentionally not configured; the authorized inviter can copy this one-time secret link.
  res.status(201).json({id,email:emailNorm,category,expiry_date:expires,feedback_url:`/?invite=${token}`});
});

function invitationForToken(token) {
  if(typeof token!=='string'||token.length!==64) return null;
  const hash=crypto.createHash('sha256').update(token).digest('hex');
  const invitation=db.prepare(`SELECT si.*,p.title,p.proposal_type,p.affected_programmes,p.current_status,
    pv.academic_rationale FROM stakeholder_invitation_tokens sit
    JOIN stakeholder_invitations si ON si.id=sit.invitation_id
    JOIN proposals p ON p.id=si.proposal_id
    LEFT JOIN proposal_versions pv ON pv.id=(SELECT id FROM proposal_versions WHERE proposal_id=p.id AND is_immutable=1 ORDER BY version_number DESC LIMIT 1)
    WHERE sit.token_hash=? AND si.status='ACTIVE'`).get(hash);
  if (invitation && invitation.expiry_date && new Date(invitation.expiry_date).getTime() <= Date.now()) return null;
  return invitation;
}

router.get('/invitation', (req,res)=>{
  const invitation=invitationForToken(req.query.token);
  if(!invitation) return res.status(404).json({error:'This feedback invitation is invalid, expired, or already used.'});
  res.json({email:invitation.invitee_email,category:invitation.category,title:invitation.title,proposal_type:invitation.proposal_type,affected_programmes:invitation.affected_programmes,academic_rationale:invitation.academic_rationale,expiry_date:invitation.expiry_date});
});

router.post('/invitation/feedback',(req,res)=>{
  const {token,email,feedback_text}=req.body;
  const invitation=invitationForToken(token);
  if(!invitation) return res.status(404).json({error:'This feedback invitation is invalid, expired, or already used.'});
  if(typeof email!=='string'||email.trim().toLowerCase()!==invitation.invitee_email) return res.status(403).json({error:'The email does not match this invitation.'});
  if(typeof feedback_text!=='string'||feedback_text.trim().length<20||feedback_text.trim().length>5000) return res.status(400).json({error:'Feedback must contain 20 to 5,000 characters.'});
  let author=db.prepare('SELECT id FROM users WHERE email=?').get(invitation.invitee_email);
  const tx=db.transaction(()=>{
    if(!author){
      const userId=crypto.randomUUID();
      db.prepare("INSERT INTO users(id,name,email,password_hash,account_status) VALUES(?,?,?,'!invited-feedback!','INACTIVE')").run(userId,invitation.invitee_email,invitation.invitee_email);
      author={id:userId};
    }
    const version=db.prepare('SELECT id FROM proposal_versions WHERE proposal_id=? AND is_immutable=1 ORDER BY version_number DESC LIMIT 1').get(invitation.proposal_id);
    db.prepare('INSERT INTO feedback(id,proposal_id,version_id,author_id,feedback_text) VALUES(?,?,?,?,?)').run(crypto.randomUUID(),invitation.proposal_id,version?.id||null,author.id,feedback_text.trim());
    db.prepare("UPDATE stakeholder_invitations SET status='COMPLETED' WHERE id=?").run(invitation.id);
    db.prepare('DELETE FROM stakeholder_invitation_tokens WHERE invitation_id=?').run(invitation.id);
  });
  tx();
  ProposalService.recordAudit(author.id,'STAKEHOLDER_FEEDBACK_SUBMITTED','Proposal',invitation.proposal_id,'SUCCESS',`Feedback submitted by invited ${invitation.category} stakeholder.`);
  res.status(201).json({success:true,message:'Thank you. Your feedback has been recorded.'});
});

module.exports=router;
