const express = require('express');
const router = express.Router();
const Currency = require('../schemas/Currency');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

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

// In-memory settings (replace with DB if needed)
let currencySettings = { baseCurrency: 'INR', rounding: 2 };
const settingsFile = path.join(__dirname, '../currencySettings.json');
// Load settings from file if exists
if (fs.existsSync(settingsFile)) {
  try {
    currencySettings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
  } catch {}
}

// GET /api/currencies/settings
router.get('/settings', auth, async (req, res) => {
  res.json(currencySettings);
});
// PUT /api/currencies/settings
router.put('/settings', auth, async (req, res) => {
  currencySettings = { ...currencySettings, ...req.body };
  fs.writeFileSync(settingsFile, JSON.stringify(currencySettings, null, 2));
  res.json(currencySettings);
});

// POST /api/currencies/update-rates
router.post('/update-rates', auth, async (req, res) => {
  // Simulate updating all rates
  const currencies = await Currency.find();
  for (const c of currencies) {
    if (c.code !== 'INR') {
      // Add a small random change to the rate
      c.rate = Math.max(0.1, c.rate + (Math.random() - 0.5) * 2);
      c.lastUpdated = new Date();
      await c.save();
    }
  }
  res.json({ message: 'Rates updated' });
});

// Get all currencies (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search } = req.query;
  let query = {};
  if (search) query.$or = [
    { code: { $regex: search, $options: 'i' } },
    { name: { $regex: search, $options: 'i' } }
  ];
  const currencies = await Currency.find(query);
  res.json(currencies);
});

// Get currency by ID
router.get('/:id', auth, async (req, res) => {
  const currency = await Currency.findById(req.params.id);
  if (!currency) return res.status(404).json({ message: 'Currency not found' });
  res.json(currency);
});

// Create currency
router.post('/', auth, async (req, res) => {
  const currency = new Currency(req.body);
  await currency.save();
  const io = req.app.get('io');
  if (io) io.emit('currency:created', currency);
  res.status(201).json(currency);
});

// Update currency
router.put('/:id', auth, async (req, res) => {
  const currency = await Currency.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!currency) return res.status(404).json({ message: 'Currency not found' });
  const io = req.app.get('io');
  if (io) io.emit('currency:updated', currency);
  res.json(currency);
});

// Delete currency
router.delete('/:id', auth, async (req, res) => {
  const currency = await Currency.findByIdAndDelete(req.params.id);
  if (!currency) return res.status(404).json({ message: 'Currency not found' });
  const io = req.app.get('io');
  if (io) io.emit('currency:deleted', currency);
  res.json({ message: 'Currency deleted' });
});

// Ensure demo currencies exist in DB
router.post('/ensure-demo', async (req, res) => {
  const demoCurrencies = [
    { code: "INR", name: "Indian Rupee", symbol: "₹", rate: 1, lastUpdated: new Date() },
    { code: "USD", name: "US Dollar", symbol: "$", rate: 83.25, lastUpdated: new Date() },
    { code: "EUR", name: "Euro", symbol: "€", rate: 90.45, lastUpdated: new Date() },
    { code: "GBP", name: "British Pound", symbol: "£", rate: 105.8, lastUpdated: new Date() }
  ];
  let created = 0;
  for (const demo of demoCurrencies) {
    const exists = await Currency.findOne({ code: demo.code });
    if (!exists) {
      await Currency.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo currencies ensured (${created} created)` });
});

module.exports = router; 