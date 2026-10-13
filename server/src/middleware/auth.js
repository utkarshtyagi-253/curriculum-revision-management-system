const jwt = require('jsonwebtoken');
const { db } = require('../db/db');

const JWT_SECRET = process.env.JWT_SECRET || 'lnmiit-crms-secret-key-2026';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user and current roles from DB
    const user = db.prepare('SELECT id, name, email, account_status, department_id FROM users WHERE id = ?').get(decoded.id);
    if (!user || user.account_status !== 'ACTIVE') {
      return res.status(401).json({ error: 'User account is inactive or not found.' });
    }

    const roles = db.prepare(`
      SELECT r.name FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ? AND ur.active_status = 1
    `).all(user.id).map(r => r.name);

    req.user = {
      ...user,
      roles: roles
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated.' });
    }

    const hasPermission = req.user.roles.some(role => 
      allowedRoles.includes(role) || role === 'System Administrator'
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        error: `Access denied. Requires one of: ${allowedRoles.join(', ')}.` 
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  JWT_SECRET
};
