const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const masterDataRoutes = require('./routes/masterDataRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const auditRoutes = require('./routes/auditRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '8mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Curriculum Revision Management System (CS314 LNMIIT)',
    team: 'T017',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

module.exports = app;
