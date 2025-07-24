const express = require('express');
const router = express.Router();
const ForexTransaction = require('../schemas/ForexTransaction');
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

// Get all forex transactions (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search, type } = req.query;
  let query = {};
  if (search) query.$or = [
    { reference: { $regex: search, $options: 'i' } },
    { customerOrVendor: { $regex: search, $options: 'i' } }
  ];
  if (type) query.type = type;
  const transactions = await ForexTransaction.find(query);
  res.json(transactions);
});

// Get forex transaction by ID
router.get('/:id', auth, async (req, res) => {
  const transaction = await ForexTransaction.findById(req.params.id);
  if (!transaction) return res.status(404).json({ message: 'Forex transaction not found' });
  res.json(transaction);
});

// Create forex transaction
router.post('/', auth, async (req, res) => {
  const transaction = new ForexTransaction(req.body);
  await transaction.save();
  res.status(201).json(transaction);
});

// Update forex transaction
router.put('/:id', auth, async (req, res) => {
  const transaction = await ForexTransaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!transaction) return res.status(404).json({ message: 'Forex transaction not found' });
  res.json(transaction);
});

// Delete forex transaction
router.delete('/:id', auth, async (req, res) => {
  const transaction = await ForexTransaction.findByIdAndDelete(req.params.id);
  if (!transaction) return res.status(404).json({ message: 'Forex transaction not found' });
  res.json({ message: 'Forex transaction deleted' });
});

// Ensure demo forex transactions exist in DB
router.post('/ensure-demo', async (req, res) => {
  const demoTransactions = [
    {
      date: "2024-01-15",
      type: "Sales Invoice",
      reference: "INV-USD-001",
      customerOrVendor: "Global Corp USA",
      originalCurrency: "USD",
      originalAmount: 15000,
      exchangeRate: 83.25,
      inrAmount: 1248750,
      gainLoss: 0
    },
    {
      date: "2024-01-14",
      type: "Purchase Bill",
      reference: "PUR-EUR-001",
      customerOrVendor: "Tech Solutions Europe",
      originalCurrency: "EUR",
      originalAmount: 8500,
      exchangeRate: 90.45,
      inrAmount: 768825,
      gainLoss: -2500
    }
  ];
  let created = 0;
  for (const demo of demoTransactions) {
    const exists = await ForexTransaction.findOne({ reference: demo.reference });
    if (!exists) {
      await ForexTransaction.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo forex transactions ensured (${created} created)` });
});

module.exports = router; 