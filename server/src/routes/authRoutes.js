const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const ProposalService = require('../services/proposalService');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // FR-002: notify user without revealing whether account, password, or role was incorrect
  const genericError = 'Invalid email or password.';

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: genericError });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: genericError });
  }

  if (user.account_status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Account is deactivated. Contact Administrator.' });
  }

  const roles = db.prepare(`
    SELECT r.name FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = ? AND ur.active_status = 1
  `).all(user.id).map(r => r.name);

  const token = jwt.sign(
    { id: user.id, email: user.email, roles },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  ProposalService.recordAudit(user.id, 'USER_LOGIN', 'User', user.id, 'SUCCESS', 'User logged in successfully.');

  res.json({
    message: 'Authentication successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      department_id: user.department_id,
      roles
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/demo-users (For easy role testing/evaluation)
router.get('/demo-users', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, d.name as department_name,
           GROUP_CONCAT(r.name, ', ') as roles
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    GROUP BY u.id
  `).all();
  res.json(users);
});

module.exports = router;
