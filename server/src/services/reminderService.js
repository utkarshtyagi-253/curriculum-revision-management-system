const crypto=require('crypto');
const {db}=require('../db/db');

function createPendingActionReminders() {
  const due=db.prepare(`SELECT pa.id,pa.proposal_id,pa.assigned_role,p.title
    FROM pending_actions pa JOIN proposals p ON p.id=pa.proposal_id
    WHERE pa.status='Pending' AND pa.created_at<=datetime('now','-3 days')`).all();
  const insert=db.prepare('INSERT INTO notifications(id,recipient_role,proposal_id,event_type,message) VALUES(?,?,?,?,?)');
  return db.transaction(()=>{
    let count=0;
    for(const action of due){
      const message=`Reminder: proposal ${action.proposal_id} (${action.title}) has been awaiting action for at least 3 days.`;
      const exists=db.prepare("SELECT 1 FROM notifications WHERE recipient_role=? AND proposal_id=? AND event_type='PENDING_ACTION_REMINDER' AND created_at>=datetime('now','-1 day')").get(action.assigned_role,action.proposal_id);
      if(!exists){insert.run(crypto.randomUUID(),action.assigned_role,action.proposal_id,'PENDING_ACTION_REMINDER',message);count++;}
    }
    return count;
  })();
}

module.exports={createPendingActionReminders};
