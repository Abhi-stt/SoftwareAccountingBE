const express = require('express');
const router = express.Router();
const BankTransaction = require('../schemas/BankTransaction');
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

// Get all bank transactions (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search, type } = req.query;
  let query = {};
  if (search) query.$or = [
    { description: { $regex: search, $options: 'i' } },
    { reference: { $regex: search, $options: 'i' } }
  ];
  if (type) query.type = type;
  const transactions = await BankTransaction.find(query);
  res.json(transactions);
});

// Get bank transaction by ID
router.get('/:id', auth, async (req, res) => {
  const transaction = await BankTransaction.findById(req.params.id);
  if (!transaction) return res.status(404).json({ message: 'Bank transaction not found' });
  res.json(transaction);
});

// Create bank transaction
router.post('/', auth, async (req, res) => {
  const transaction = new BankTransaction(req.body);
  await transaction.save();
  res.status(201).json(transaction);
});

// Update bank transaction
router.put('/:id', auth, async (req, res) => {
  const transaction = await BankTransaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!transaction) return res.status(404).json({ message: 'Bank transaction not found' });
  res.json(transaction);
});

// Delete bank transaction
router.delete('/:id', auth, async (req, res) => {
  const transaction = await BankTransaction.findByIdAndDelete(req.params.id);
  if (!transaction) return res.status(404).json({ message: 'Bank transaction not found' });
  res.json({ message: 'Bank transaction deleted' });
});

// Ensure demo bank transactions exist in DB
router.post('/ensure-demo', async (req, res) => {
  const BankAccount = require('../schemas/BankAccount');
  const demoAccount = await BankAccount.findOne({ accountNumber: "1234567890" });
  const demoTransactions = [
    {
      bankAccountId: demoAccount?._id,
      date: "2024-01-10",
      type: "Deposit",
      amount: 20000,
      description: "Initial deposit",
      reference: "DEP-001"
    },
    {
      bankAccountId: demoAccount?._id,
      date: "2024-01-12",
      type: "Withdrawal",
      amount: 5000,
      description: "ATM withdrawal",
      reference: "WDL-001"
    }
  ];
  let created = 0;
  for (const demo of demoTransactions) {
    const exists = await BankTransaction.findOne({ reference: demo.reference });
    if (!exists) {
      await BankTransaction.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo bank transactions ensured (${created} created)` });
});

module.exports = router; 