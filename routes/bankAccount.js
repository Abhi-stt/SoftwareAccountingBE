const express = require('express');
const router = express.Router();
const BankAccount = require('../schemas/BankAccount');
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

// Get all bank accounts (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search } = req.query;
  let query = {};
  if (search) query.$or = [
    { accountName: { $regex: search, $options: 'i' } },
    { accountNumber: { $regex: search, $options: 'i' } },
    { bankName: { $regex: search, $options: 'i' } }
  ];
  const accounts = await BankAccount.find(query);
  res.json(accounts);
});

// Get bank account by ID
router.get('/:id', auth, async (req, res) => {
  const account = await BankAccount.findById(req.params.id);
  if (!account) return res.status(404).json({ message: 'Bank account not found' });
  res.json(account);
});

// Create bank account
router.post('/', auth, async (req, res) => {
  const account = new BankAccount(req.body);
  await account.save();
  res.status(201).json(account);
});

// Update bank account
router.put('/:id', auth, async (req, res) => {
  const account = await BankAccount.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!account) return res.status(404).json({ message: 'Bank account not found' });
  res.json(account);
});

// Delete bank account
router.delete('/:id', auth, async (req, res) => {
  const account = await BankAccount.findByIdAndDelete(req.params.id);
  if (!account) return res.status(404).json({ message: 'Bank account not found' });
  res.json({ message: 'Bank account deleted' });
});

// Ensure demo bank accounts exist in DB
router.post('/ensure-demo', async (req, res) => {
  const demoAccounts = [
    {
      accountName: "HDFC Main Account",
      accountNumber: "1234567890",
      bankName: "HDFC Bank",
      ifsc: "HDFC0001234",
      openingBalance: 100000,
      currentBalance: 120000
    },
    {
      accountName: "ICICI Savings",
      accountNumber: "9876543210",
      bankName: "ICICI Bank",
      ifsc: "ICIC0005678",
      openingBalance: 50000,
      currentBalance: 48000
    }
  ];
  let created = 0;
  for (const demo of demoAccounts) {
    const exists = await BankAccount.findOne({ accountNumber: demo.accountNumber });
    if (!exists) {
      await BankAccount.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo bank accounts ensured (${created} created)` });
});

module.exports = router; 