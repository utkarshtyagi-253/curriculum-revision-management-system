const express = require('express');
const router = express.Router();
const { db } = require('../db/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { MAX_COURSE_CREDITS, parseCourseCredits } = require('../domain/credits');

// GET /api/master-data/summary
router.get('/summary', authenticate, (req, res) => {
  const departments = db.prepare('SELECT * FROM departments WHERE active_status = 1').all();
  const programmes = db.prepare('SELECT p.*, d.name as department_name FROM programmes p JOIN departments d ON p.department_id = d.id WHERE p.active_status = 1').all();
  const courses = db.prepare('SELECT c.*, d.name as department_name FROM courses c JOIN departments d ON c.department_id = d.id').all();
  const committees = db.prepare('SELECT * FROM committees WHERE active_status = 1').all();
  const roles = db.prepare('SELECT * FROM roles').all();

  res.json({
    departments,
    programmes,
    courses,
    committees,
    roles
  });
});

// GET /api/master-data/departments
router.get('/departments', authenticate, (req, res) => {
  const departments = db.prepare('SELECT * FROM departments WHERE active_status = 1').all();
  res.json(departments);
});

// GET /api/master-data/programmes
router.get('/programmes', authenticate, (req, res) => {
  const programmes = db.prepare('SELECT p.*, d.name as department_name FROM programmes p JOIN departments d ON p.department_id = d.id WHERE p.active_status = 1').all();
  res.json(programmes);
});

// GET /api/master-data/courses
router.get('/courses', authenticate, (req, res) => {
  const courses = db.prepare('SELECT c.*, d.name as department_name FROM courses c JOIN departments d ON c.department_id = d.id').all();
  res.json(courses);
});

// Admin-only management endpoints (FR-007, BR-001)
router.post('/departments', authenticate, requireRole(['System Administrator']), (req, res) => {
  const { name, code } = req.body;
  const normalizedCode=typeof code==='string'?code.trim().toUpperCase():'';
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100 || !/^[A-Z][A-Z0-9]{1,7}$/.test(normalizedCode)) return res.status(400).json({error:'Provide a department name (2–100 characters) and a valid department code.'});
  if (db.prepare('SELECT id FROM departments WHERE code=? COLLATE NOCASE').get(normalizedCode)) return res.status(409).json({error:'Department code already exists.'});
  const id = `dept-${normalizedCode.toLowerCase()}`;
  db.prepare('INSERT INTO departments (id, name, code) VALUES (?, ?, ?)').run(id, name.trim(), normalizedCode);
  res.status(201).json({ id, name:name.trim(), code:normalizedCode });
});

router.post('/courses', authenticate, requireRole(['System Administrator']), (req, res) => {
  const { code, title, credits, department_id } = req.body;
  const normalizedCode = typeof code === 'string' ? code.trim().toUpperCase() : '';
  const creditValue = parseCourseCredits(credits);
  if (!/^[A-Z][A-Z0-9]{1,7}(?:-[A-Z0-9]{1,4})?$/.test(normalizedCode) || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 120 || creditValue === null || !db.prepare('SELECT id FROM departments WHERE id=?').get(department_id)) return res.status(400).json({error:`Valid course code, title (3–120 characters), department and credit value (0.5 to ${MAX_COURSE_CREDITS} in 0.5 increments) are required.`});
  if (db.prepare('SELECT id FROM courses WHERE code=? COLLATE NOCASE').get(normalizedCode)) return res.status(409).json({error:'Course code already exists.'});
  const id = `course-${normalizedCode.toLowerCase()}`;
  db.prepare('INSERT INTO courses (id, code, title, credits, department_id) VALUES (?, ?, ?, ?, ?)').run(id, normalizedCode, title.trim(), creditValue, department_id);
  res.status(201).json({ id, code:normalizedCode, title:title.trim(), credits:creditValue, department_id });
});

module.exports = router;
