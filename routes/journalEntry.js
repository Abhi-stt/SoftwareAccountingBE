const express = require('express');
const router = express.Router();
const JournalEntry = require('../schemas/JournalEntry');
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

// Get all journal entries (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search } = req.query;
  let query = {};
  if (search) query.narration = { $regex: search, $options: 'i' };
  const entries = await JournalEntry.find(query);
  res.json(entries);
});

// Get journal entry by ID
router.get('/:id', auth, async (req, res) => {
  const entry = await JournalEntry.findById(req.params.id);
  if (!entry) return res.status(404).json({ message: 'Journal entry not found' });
  res.json(entry);
});

// Create journal entry
router.post('/', auth, async (req, res) => {
  const entry = new JournalEntry(req.body);
  await entry.save();
  res.status(201).json(entry);
});

// Update journal entry
router.put('/:id', auth, async (req, res) => {
  const entry = await JournalEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!entry) return res.status(404).json({ message: 'Journal entry not found' });
  res.json(entry);
});

// Delete journal entry
router.delete('/:id', auth, async (req, res) => {
  const entry = await JournalEntry.findByIdAndDelete(req.params.id);
  if (!entry) return res.status(404).json({ message: 'Journal entry not found' });
  res.json({ message: 'Journal entry deleted' });
});

// Ensure demo journal entries exist in DB
router.post('/ensure-demo', async (req, res) => {
  const ChartOfAccounts = require('../schemas/ChartOfAccounts');
  const cash = await ChartOfAccounts.findOne({ code: "1001" });
  const sales = await ChartOfAccounts.findOne({ code: "4001" });
  const user = await require('../schemas/User').findOne({ email: "admin@globalbooks.com" });
  const demoEntries = [
    {
      date: "2024-01-15",
      entries: [
        { accountId: cash?._id, debit: 100000, credit: 0, description: "Cash received" },
        { accountId: sales?._id, debit: 0, credit: 100000, description: "Sales income" }
      ],
      narration: "Cash sales entry",
      createdBy: user?._id
    }
  ];
  let created = 0;
  for (const demo of demoEntries) {
    const exists = await JournalEntry.findOne({ date: demo.date, narration: demo.narration });
    if (!exists) {
      await JournalEntry.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo journal entries ensured (${created} created)` });
});

module.exports = router; 