const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../schemas/PurchaseOrder');
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

// Get all purchase orders (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search, status } = req.query;
  let query = {};
  if (search) query.$or = [
    { orderNumber: { $regex: search, $options: 'i' } }
  ];
  if (status) query.status = status;
  const orders = await PurchaseOrder.find(query).populate('vendorId');
  res.json(orders);
});

// Get purchase order by ID
router.get('/:id', auth, async (req, res) => {
  const order = await PurchaseOrder.findById(req.params.id).populate('vendorId');
  if (!order) return res.status(404).json({ message: 'Purchase order not found' });
  res.json(order);
});

// Create purchase order
router.post('/', auth, async (req, res) => {
  const order = new PurchaseOrder(req.body);
  await order.save();
  res.status(201).json(order);
});

// Update purchase order
router.put('/:id', auth, async (req, res) => {
  const order = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!order) return res.status(404).json({ message: 'Purchase order not found' });
  res.json(order);
});

// Delete purchase order
router.delete('/:id', auth, async (req, res) => {
  const order = await PurchaseOrder.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ message: 'Purchase order not found' });
  res.json({ message: 'Purchase order deleted' });
});

module.exports = router; 