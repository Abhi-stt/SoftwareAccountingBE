const express = require('express');
const router = express.Router();
const StockMovement = require('../schemas/StockMovement');
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

// Get all stock movements (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search, type } = req.query;
  let query = {};
  if (search) query.reference = { $regex: search, $options: 'i' };
  if (type) query.type = type;
  const movements = await StockMovement.find(query).populate('productId');
  res.json(movements);
});

// Get stock movement by ID
router.get('/:id', auth, async (req, res) => {
  const movement = await StockMovement.findById(req.params.id).populate('productId');
  if (!movement) return res.status(404).json({ message: 'Stock movement not found' });
  res.json(movement);
});

// Create stock movement
router.post('/', auth, async (req, res) => {
  const movement = new StockMovement(req.body);
  await movement.save();
  res.status(201).json(movement);
});

// Update stock movement
router.put('/:id', auth, async (req, res) => {
  const movement = await StockMovement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!movement) return res.status(404).json({ message: 'Stock movement not found' });
  const io = req.app.get('io');
  if (io) io.emit('stockmovement:updated', movement);
  res.json(movement);
});

// Delete stock movement
router.delete('/:id', auth, async (req, res) => {
  const movement = await StockMovement.findByIdAndDelete(req.params.id);
  if (!movement) return res.status(404).json({ message: 'Stock movement not found' });
  const io = req.app.get('io');
  if (io) io.emit('stockmovement:deleted', movement?._id || req.params.id);
  res.json({ message: 'Stock movement deleted' });
});

// Ensure demo stock movements exist in DB
router.post('/ensure-demo', async (req, res) => {
  const Product = require('../schemas/Product');
  const product1 = await Product.findOne({ sku: "SL-PREM-001" });
  const product2 = await Product.findOne({ sku: "HSK-001" });
  const product3 = await Product.findOne({ sku: "CONS-HR" });
  const demoMovements = [
    {
      productId: product1?._id,
      type: "Sale",
      quantity: -5,
      date: "2024-01-15",
      reference: "INV-2024-001",
      balance: 25
    },
    {
      productId: product2?._id,
      type: "Purchase",
      quantity: 10,
      date: "2024-01-14",
      reference: "PUR-2024-002",
      balance: 15
    },
    {
      productId: product3?._id,
      type: "Sale",
      quantity: -50,
      date: "2024-01-13",
      reference: "INV-2024-003",
      balance: 500
    }
  ];
  let created = 0;
  for (const demo of demoMovements) {
    const exists = await StockMovement.findOne({ reference: demo.reference, productId: demo.productId });
    if (!exists) {
      await StockMovement.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo stock movements ensured (${created} created)` });
});

module.exports = router; 