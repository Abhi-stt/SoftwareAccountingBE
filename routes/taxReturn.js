const express = require('express');
const router = express.Router();
const TaxReturn = require('../schemas/TaxReturn');
const jwt = require('jsonwebtoken');
const { Parser } = require('json2csv');
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

// List all tax returns
router.get('/', auth, async (req, res) => {
  const returns = await TaxReturn.find({});
  res.json(returns);
});

// Create a tax return
router.post('/', auth, async (req, res) => {
  const taxReturn = new TaxReturn(req.body);
  await taxReturn.save();
  const io = req.app.get('io');
  if (io) io.emit('taxreturn:created', taxReturn);
  res.status(201).json(taxReturn);
});

// Update a tax return
router.put('/:id', auth, async (req, res) => {
  const taxReturn = await TaxReturn.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!taxReturn) return res.status(404).json({ message: 'Tax return not found' });
  const io = req.app.get('io');
  if (io) io.emit('taxreturn:updated', taxReturn);
  res.json(taxReturn);
});

// Mark as filed
router.post('/:id/file', auth, async (req, res) => {
  const taxReturn = await TaxReturn.findByIdAndUpdate(
    req.params.id,
    { status: 'Filed', filedDate: new Date() },
    { new: true }
  );
  if (!taxReturn) return res.status(404).json({ message: 'Tax return not found' });
  const io = req.app.get('io');
  if (io) io.emit('taxreturn:updated', taxReturn);
  res.json(taxReturn);
});

// Download report (CSV)
router.get('/download-report', auth, async (req, res) => {
  const returns = await TaxReturn.find({});
  const fields = ['type', 'period', 'dueDate', 'status', 'filedDate', 'totalSales', 'totalTax'];
  const parser = new Parser({ fields });
  const csv = parser.parse(returns);
  res.header('Content-Type', 'text/csv');
  res.attachment('tax-returns-report.csv');
  res.send(csv);
});

module.exports = router; 