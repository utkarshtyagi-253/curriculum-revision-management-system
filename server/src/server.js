require('dotenv').config();
const app = require('./app');

const { db } = require('./db/db');
if (!db.prepare('SELECT id FROM users LIMIT 1').get()) require('./db/seed').seed();

const PORT = process.env.PORT || 8000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CRMS Backend API Server running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
