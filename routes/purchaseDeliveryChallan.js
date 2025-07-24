const express = require('express');
const router = express.Router();
const PurchaseDeliveryChallan = require('../schemas/PurchaseDeliveryChallan');
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

// Get all purchase delivery challans
router.get('/', auth, async (req, res) => {
  const { search, status } = req.query;
  let query = {};
  if (search) query.$or = [
    { challanNumber: { $regex: search, $options: 'i' } }
  ];
  if (status) query.status = status;
  const challans = await PurchaseDeliveryChallan.find(query).populate('vendorId');
  res.json(challans);
});

// Get purchase delivery challan by ID
router.get('/:id', auth, async (req, res) => {
  const challan = await PurchaseDeliveryChallan.findById(req.params.id).populate('vendorId');
  if (!challan) return res.status(404).json({ message: 'Purchase delivery challan not found' });
  res.json(challan);
});

// Create purchase delivery challan
router.post('/', auth, async (req, res) => {
  const challan = new PurchaseDeliveryChallan(req.body);
  await challan.save();
  const io = req.app.get('io');
  if (io) io.emit('purchasedeliverychallan:created', challan);
  res.status(201).json(challan);
});

// Update purchase delivery challan
router.put('/:id', auth, async (req, res) => {
  const challan = await PurchaseDeliveryChallan.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!challan) return res.status(404).json({ message: 'Purchase delivery challan not found' });
  const io = req.app.get('io');
  if (io) io.emit('purchasedeliverychallan:updated', challan);
  res.json(challan);
});

// Delete purchase delivery challan
router.delete('/:id', auth, async (req, res) => {
  const challan = await PurchaseDeliveryChallan.findByIdAndDelete(req.params.id);
  if (!challan) return res.status(404).json({ message: 'Purchase delivery challan not found' });
  const io = req.app.get('io');
  if (io) io.emit('purchasedeliverychallan:deleted', challan);
  res.json({ message: 'Purchase delivery challan deleted' });
});

module.exports = router; 