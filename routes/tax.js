const express = require('express');
const router = express.Router();
const Tax = require('../schemas/Tax');
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

// Get all taxes (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search, type } = req.query;
  let query = {};
  if (search) query.$or = [
    { type: { $regex: search, $options: 'i' } },
    { hsnCode: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ];
  if (type) query.type = type;
  const taxes = await Tax.find(query);
  res.json(taxes);
});

// Get tax by ID
router.get('/:id', auth, async (req, res) => {
  const tax = await Tax.findById(req.params.id);
  if (!tax) return res.status(404).json({ message: 'Tax not found' });
  res.json(tax);
});

// Create tax
router.post('/', auth, async (req, res) => {
  const tax = new Tax(req.body);
  await tax.save();
  const io = req.app.get('io');
  if (io) io.emit('tax:created', tax);
  res.status(201).json(tax);
});

// Update tax
router.put('/:id', auth, async (req, res) => {
  const tax = await Tax.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!tax) return res.status(404).json({ message: 'Tax not found' });
  const io = req.app.get('io');
  if (io) io.emit('tax:updated', tax);
  res.json(tax);
});

// Delete tax
router.delete('/:id', auth, async (req, res) => {
  const tax = await Tax.findByIdAndDelete(req.params.id);
  if (!tax) return res.status(404).json({ message: 'Tax not found' });
  const io = req.app.get('io');
  if (io) io.emit('tax:deleted', tax);
  res.json({ message: 'Tax deleted' });
});

// Ensure demo taxes exist in DB
router.post('/ensure-demo', async (req, res) => {
  const demoTaxes = [
    { type: "GST", rate: 18, hsnCode: "1234", description: "Goods and Services Tax" },
    { type: "VAT", rate: 12, hsnCode: "5678", description: "Value Added Tax" }
  ];
  let created = 0;
  for (const demo of demoTaxes) {
    const exists = await Tax.findOne({ type: demo.type, hsnCode: demo.hsnCode });
    if (!exists) {
      await Tax.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo taxes ensured (${created} created)` });
});

module.exports = router; 