const express = require('express');
const router = express.Router();
const ChartOfAccounts = require('../schemas/ChartOfAccounts');
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

// Get all accounts (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search, type } = req.query;
  let query = {};
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { code: { $regex: search, $options: 'i' } }
  ];
  if (type) query.type = type;
  const accounts = await ChartOfAccounts.find(query);
  res.json(accounts);
});

// Get account by ID
router.get('/:id', auth, async (req, res) => {
  const account = await ChartOfAccounts.findById(req.params.id);
  if (!account) return res.status(404).json({ message: 'Account not found' });
  res.json(account);
});

// Create account
router.post('/', auth, async (req, res) => {
  const account = new ChartOfAccounts(req.body);
  await account.save();
  res.status(201).json(account);
});

// Update account
router.put('/:id', auth, async (req, res) => {
  const account = await ChartOfAccounts.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!account) return res.status(404).json({ message: 'Account not found' });
  res.json(account);
});

// Delete account
router.delete('/:id', auth, async (req, res) => {
  const account = await ChartOfAccounts.findByIdAndDelete(req.params.id);
  if (!account) return res.status(404).json({ message: 'Account not found' });
  res.json({ message: 'Account deleted' });
});

// Ensure demo chart of accounts exist in DB
router.post('/ensure-demo', async (req, res) => {
  const demoAccounts = [
    { name: "Cash", code: "1001", parentId: null, type: "Asset" },
    { name: "Bank", code: "1002", parentId: null, type: "Asset" },
    { name: "Sales", code: "4001", parentId: null, type: "Income" },
    { name: "Purchases", code: "5001", parentId: null, type: "Expense" }
  ];
  let created = 0;
  for (const demo of demoAccounts) {
    const exists = await ChartOfAccounts.findOne({ code: demo.code });
    if (!exists) {
      await ChartOfAccounts.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo chart of accounts ensured (${created} created)` });
});

module.exports = router; 