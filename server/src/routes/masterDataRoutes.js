const express = require('express');
const router = express.Router();
const { db } = require('../db/db');
const { authenticate, requireRole } = require('../middleware/auth');

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
  if (typeof name !== 'string' || !name.trim() || typeof code !== 'string' || !/^[A-Za-z0-9-]+$/.test(code)) return res.status(400).json({error:'Valid name and code are required.'});
  if (db.prepare('SELECT id FROM departments WHERE code=?').get(code)) return res.status(409).json({error:'Department code already exists.'});
  const id = `dept-${code.toLowerCase()}`;
  db.prepare('INSERT INTO departments (id, name, code) VALUES (?, ?, ?)').run(id, name, code);
  res.status(201).json({ id, name, code });
});

router.post('/courses', authenticate, requireRole(['System Administrator']), (req, res) => {
  const { code, title, credits, department_id } = req.body;
  if (typeof code !== 'string' || !/^[A-Za-z0-9-]+$/.test(code) || !title?.trim() || !Number.isInteger(credits) || credits<1 || credits>30 || !db.prepare('SELECT id FROM departments WHERE id=?').get(department_id)) return res.status(400).json({error:'Valid code, title, credits and department are required.'});
  if (db.prepare('SELECT id FROM courses WHERE code=?').get(code)) return res.status(409).json({error:'Course code already exists.'});
  const id = `course-${code.toLowerCase()}`;
  db.prepare('INSERT INTO courses (id, code, title, credits, department_id) VALUES (?, ?, ?, ?, ?)').run(id, code, title, credits, department_id);
  res.status(201).json({ id, code, title, credits, department_id });
});

module.exports = router;
