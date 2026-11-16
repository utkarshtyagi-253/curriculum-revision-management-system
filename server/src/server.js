require('dotenv').config();
const app = require('./app');

const { db } = require('./db/db');
if (!db.prepare('SELECT id FROM users LIMIT 1').get()) require('./db/seed').seed();

const PORT = process.env.PORT || 8000;

const { createPendingActionReminders } = require('./services/reminderService');
const reminderTimer = setInterval(() => {
  try { createPendingActionReminders(); }
  catch (error) { console.error('Unable to create pending-action reminders:', error.message); }
}, 6 * 60 * 60 * 1000);
reminderTimer.unref();
try { createPendingActionReminders(); }
catch (error) { console.error('Unable to create initial pending-action reminders:', error.message); }

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CRMS Backend API Server running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
