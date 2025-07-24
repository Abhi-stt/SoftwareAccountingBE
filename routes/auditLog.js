const express = require('express');
const router = express.Router();
const AuditLog = require('../schemas/AuditLog');
const jwt = require('jsonwebtoken');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');

// In-memory security settings (replace with DB if needed)
let securitySettings = { passwordPolicy: 'Strong', twoFactorAuth: false };
const settingsFile = path.join(__dirname, '../securitySettings.json');
if (fs.existsSync(settingsFile)) {
  try {
    securitySettings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
  } catch {}
}

function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ message: 'No token' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Get all audit logs (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search, severity, user, module } = req.query;
  let query = {};
  if (search) query.$or = [
    { user: { $regex: search, $options: 'i' } },
    { action: { $regex: search, $options: 'i' } },
    { module: { $regex: search, $options: 'i' } },
    { details: { $regex: search, $options: 'i' } }
  ];
  if (severity) query.severity = severity;
  if (user) query.user = user;
  if (module) query.module = module;
  const logs = await AuditLog.find(query);
  res.json(logs);
});

// Get audit log by ID
router.get('/:id', auth, async (req, res) => {
  const log = await AuditLog.findById(req.params.id);
  if (!log) return res.status(404).json({ message: 'Audit log not found' });
  res.json(log);
});

// Create audit log
router.post('/', auth, async (req, res) => {
  const log = new AuditLog(req.body);
  await log.save();
  const io = req.app.get('io');
  if (io) io.emit('auditlog:created', log);
  res.status(201).json(log);
});

// Update audit log
router.put('/:id', auth, async (req, res) => {
  const log = await AuditLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!log) return res.status(404).json({ message: 'Audit log not found' });
  const io = req.app.get('io');
  if (io) io.emit('auditlog:updated', log);
  res.json(log);
});

// Delete audit log
router.delete('/:id', auth, async (req, res) => {
  const log = await AuditLog.findByIdAndDelete(req.params.id);
  if (!log) return res.status(404).json({ message: 'Audit log not found' });
  const io = req.app.get('io');
  if (io) io.emit('auditlog:deleted', log);
  res.json({ message: 'Audit log deleted' });
});

// Ensure demo audit logs exist in DB
router.post('/ensure-demo', async (req, res) => {
  const demoLogs = [
    {
      timestamp: "2024-01-15T14:30:25Z",
      user: "admin@globalbooks.com",
      userRole: "Admin",
      action: "Created",
      module: "Sales Invoice",
      recordId: "INV-2024-001",
      details: "Created new sales invoice for Acme Corporation",
      ipAddress: "192.168.1.100",
      severity: "Info"
    },
    {
      timestamp: "2024-01-15T14:10:15Z",
      user: "unknown@external.com",
      userRole: "Unknown",
      action: "Failed Login",
      module: "Authentication",
      recordId: null,
      details: "Failed login attempt with invalid credentials",
      ipAddress: "203.45.67.89",
      severity: "Critical"
    }
  ];
  let created = 0;
  for (const demo of demoLogs) {
    const exists = await AuditLog.findOne({ timestamp: demo.timestamp, user: demo.user, action: demo.action });
    if (!exists) {
      await AuditLog.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo audit logs ensured (${created} created)` });
});

// Export audit logs as CSV
router.get('/export', auth, async (req, res) => {
  let logs = await AuditLog.find();
  if (logs.length === 0) {
    // Insert demo logs if none exist
    const demoLogs = [
      {
        timestamp: new Date().toISOString(),
        user: "admin@globalbooks.com",
        userRole: "Admin",
        action: "Created",
        module: "Sales Invoice",
        recordId: "INV-2024-001",
        details: "Created new sales invoice for Acme Corporation",
        ipAddress: "192.168.1.100",
        severity: "Info"
      },
      {
        timestamp: new Date().toISOString(),
        user: "auditor@globalbooks.com",
        userRole: "Auditor",
        action: "Viewed",
        module: "Financial Reports",
        recordId: "REP-2024-002",
        details: "Viewed financial report for Q1 2024",
        ipAddress: "192.168.1.101",
        severity: "Info"
      }
    ];
    await AuditLog.insertMany(demoLogs);
    logs = await AuditLog.find();
  }
  const fields = ['timestamp', 'user', 'userRole', 'action', 'module', 'recordId', 'details', 'ipAddress', 'severity'];
  const parser = new Parser({ fields });
  const csv = parser.parse(logs.map(log => log.toObject()));
  res.header('Content-Type', 'text/csv');
  res.attachment('audit-logs.csv');
  res.send(csv);
});

// GET security settings
router.get('/security-settings', auth, async (req, res) => {
  res.json(securitySettings);
});
// PUT security settings
router.put('/security-settings', auth, async (req, res) => {
  securitySettings = { ...securitySettings, ...req.body };
  fs.writeFileSync(settingsFile, JSON.stringify(securitySettings, null, 2));
  const io = req.app.get('io');
  if (io) io.emit('securitysettings:updated', securitySettings);
  res.json(securitySettings);
});

module.exports = router; 