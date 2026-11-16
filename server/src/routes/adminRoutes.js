const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('../db/db');
const { authenticate, requireRole } = require('../middleware/auth');
const ProposalService = require('../services/proposalService');

const router = express.Router();
router.use(authenticate, requireRole(['System Administrator']));

router.get('/users', (req, res) => {
  const users = db.prepare(`SELECT u.id,u.name,u.email,u.account_status,u.department_id,d.name department_name,
    GROUP_CONCAT(r.name, ', ') roles FROM users u LEFT JOIN departments d ON d.id=u.department_id
    LEFT JOIN user_roles ur ON ur.user_id=u.id AND ur.active_status=1 LEFT JOIN roles r ON r.id=ur.role_id
    GROUP BY u.id ORDER BY u.name`).all();
  res.json({ users, roles: db.prepare('SELECT id,name,description FROM roles ORDER BY name').all(), departments: db.prepare('SELECT id,name,code FROM departments WHERE active_status=1 ORDER BY name').all() });
});

router.post('/users', (req, res) => {
  const { name, email, password, department_id, role_ids } = req.body;
  if (typeof name !== 'string' || name.trim().length < 2 || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 10 || !Array.isArray(role_ids) || !role_ids.length) return res.status(400).json({ error: 'Name, valid email, password (10+ characters), and at least one role are required.' });
  if (department_id && !db.prepare('SELECT id FROM departments WHERE id=? AND active_status=1').get(department_id)) return res.status(400).json({ error: 'Select an active department.' });
  const normalizedEmail = email.trim().toLowerCase();
  if (db.prepare('SELECT id FROM users WHERE email=?').get(normalizedEmail)) return res.status(409).json({ error: 'A user with this email already exists.' });
  const knownRoles = db.prepare(`SELECT id FROM roles WHERE id IN (${role_ids.map(()=>'?').join(',')})`).all(...role_ids);
  if (knownRoles.length !== new Set(role_ids).size) return res.status(400).json({ error: 'One or more selected roles are invalid.' });
  const userId = crypto.randomUUID();
  const create = db.transaction(() => {
    db.prepare('INSERT INTO users(id,name,email,password_hash,department_id) VALUES(?,?,?,?,?)').run(userId,name.trim(),normalizedEmail,bcrypt.hashSync(password,10),department_id || null);
    const addRole = db.prepare('INSERT INTO user_roles(id,user_id,role_id,assigned_by) VALUES(?,?,?,?)');
    role_ids.forEach(roleId => addRole.run(crypto.randomUUID(),userId,roleId,req.user.id));
  });
  try { create(); } catch (error) { return res.status(400).json({ error: 'Could not create user.' }); }
  ProposalService.recordAudit(req.user.id,'USER_CREATED','User',userId,'SUCCESS',`Created account ${normalizedEmail}`);
  res.status(201).json({ id:userId,name:name.trim(),email:normalizedEmail });
});

router.put('/users/:id', (req, res) => {
  const { role_ids, account_status } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error:'User not found.' });
  if (account_status !== undefined && !['ACTIVE','INACTIVE'].includes(account_status)) return res.status(400).json({ error:'Invalid account status.' });
  if (role_ids !== undefined && (!Array.isArray(role_ids) || !role_ids.length)) return res.status(400).json({ error:'At least one role must remain assigned.' });
  if (role_ids) {
    const known = db.prepare(`SELECT id FROM roles WHERE id IN (${role_ids.map(()=>'?').join(',')})`).all(...role_ids);
    if (known.length !== new Set(role_ids).size) return res.status(400).json({ error:'One or more selected roles are invalid.' });
    const wasAdmin = Boolean(db.prepare(`SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? AND ur.active_status=1 AND r.name='System Administrator'`).get(user.id));
    const remainsAdmin = role_ids.some(id => db.prepare("SELECT 1 FROM roles WHERE id=? AND name='System Administrator'").get(id));
    if (wasAdmin && !remainsAdmin && db.prepare(`SELECT count(*) n FROM user_roles ur JOIN roles r ON r.id=ur.role_id JOIN users u ON u.id=ur.user_id WHERE r.name='System Administrator' AND ur.active_status=1 AND u.account_status='ACTIVE'`).get().n <= 1) return res.status(400).json({ error:'The last active administrator cannot be removed.' });
  }
  if (account_status === 'INACTIVE') {
    const hasAdmin=Boolean(db.prepare("SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? AND ur.active_status=1 AND r.name='System Administrator'").get(user.id));
    if (hasAdmin && db.prepare("SELECT count(*) n FROM user_roles ur JOIN roles r ON r.id=ur.role_id JOIN users u ON u.id=ur.user_id WHERE r.name='System Administrator' AND ur.active_status=1 AND u.account_status='ACTIVE'").get().n <= 1) return res.status(400).json({error:'The last active administrator cannot be deactivated.'});
  }
  const update = db.transaction(() => {
    if (role_ids) {
      db.prepare('UPDATE user_roles SET active_status=0 WHERE user_id=?').run(user.id);
      const add = db.prepare('INSERT INTO user_roles(id,user_id,role_id,assigned_by) VALUES(?,?,?,?)');
      role_ids.forEach(roleId => add.run(crypto.randomUUID(),user.id,roleId,req.user.id));
    }
    if (account_status) db.prepare('UPDATE users SET account_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(account_status,user.id);
  });
  update();
  ProposalService.recordAudit(req.user.id,'USER_ACCESS_UPDATED','User',user.id,'SUCCESS','Updated user roles or account status.');
  res.json({ success:true });
});

module.exports = router;
