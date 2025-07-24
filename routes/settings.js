const express = require('express');
const router = express.Router();
const Settings = require('../schemas/Settings');
const jwt = require('jsonwebtoken');

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

// Get all settings (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search } = req.query;
  let query = {};
  if (search) query.companyName = { $regex: search, $options: 'i' };
  const settings = await Settings.find(query);
  res.json(settings);
});

// Get settings by ID
router.get('/:id', auth, async (req, res) => {
  const setting = await Settings.findById(req.params.id);
  if (!setting) return res.status(404).json({ message: 'Settings not found' });
  res.json(setting);
});

// Create settings
router.post('/', auth, async (req, res) => {
  const setting = new Settings(req.body);
  await setting.save();
  res.status(201).json(setting);
});

// Update settings
router.put('/:id', auth, async (req, res) => {
  const setting = await Settings.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!setting) return res.status(404).json({ message: 'Settings not found' });
  res.json(setting);
});

// Delete settings
router.delete('/:id', auth, async (req, res) => {
  const setting = await Settings.findByIdAndDelete(req.params.id);
  if (!setting) return res.status(404).json({ message: 'Settings not found' });
  res.json({ message: 'Settings deleted' });
});

// Ensure demo settings exist in DB
router.post('/ensure-demo', async (req, res) => {
  const demoSettings = [
    {
      companyName: "GlobalBooks Pvt Ltd",
      address: "789 Business Park, City",
      gstNumber: "GSTIN9999",
      financialYearStart: "2024-04-01",
      financialYearEnd: "2025-03-31",
      logoUrl: "https://example.com/logo.png",
      notificationSettings: {},
      integrationSettings: {}
    }
  ];
  let created = 0;
  for (const demo of demoSettings) {
    const exists = await Settings.findOne({ companyName: demo.companyName });
    if (!exists) {
      await Settings.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo settings ensured (${created} created)` });
});

module.exports = router; 