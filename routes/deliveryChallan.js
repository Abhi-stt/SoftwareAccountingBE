const express = require('express');
const router = express.Router();
const DeliveryChallan = require('../schemas/DeliveryChallan');
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

// Get all delivery challans (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search, status } = req.query;
  let query = {};
  if (search) query.$or = [
    { challanNumber: { $regex: search, $options: 'i' } }
  ];
  if (status) query.status = status;
  const challans = await DeliveryChallan.find(query);
  res.json(challans);
});

// Get delivery challan by ID
router.get('/:id', auth, async (req, res) => {
  const challan = await DeliveryChallan.findById(req.params.id);
  if (!challan) return res.status(404).json({ message: 'Delivery challan not found' });
  res.json(challan);
});

// Create delivery challan
router.post('/', auth, async (req, res) => {
  const challan = new DeliveryChallan(req.body);
  await challan.save();
  const io = req.app.get('io');
  if (io) io.emit('deliverychallan:created', challan);
  res.status(201).json(challan);
});

// Update delivery challan
router.put('/:id', auth, async (req, res) => {
  const challan = await DeliveryChallan.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!challan) return res.status(404).json({ message: 'Delivery challan not found' });
  const io = req.app.get('io');
  if (io) io.emit('deliverychallan:updated', challan);
  res.json(challan);
});

// Delete delivery challan
router.delete('/:id', auth, async (req, res) => {
  const challan = await DeliveryChallan.findByIdAndDelete(req.params.id);
  if (!challan) return res.status(404).json({ message: 'Delivery challan not found' });
  const io = req.app.get('io');
  if (io) io.emit('deliverychallan:deleted', challan);
  res.json({ message: 'Delivery challan deleted' });
});

// Ensure demo delivery challans exist in DB
router.post('/ensure-demo', async (req, res) => {
  const SalesInvoice = require('../schemas/SalesInvoice');
  const invoice = await SalesInvoice.findOne({ invoiceNumber: "INV-2024-001" });
  const demoChallans = [
    {
      challanNumber: "CH-001",
      relatedInvoiceId: invoice?._id,
      date: "2024-01-16",
      items: [
        { productId: null, quantity: 2, description: "Software License - Premium" }
      ],
      status: "Delivered"
    }
  ];
  let created = 0;
  for (const demo of demoChallans) {
    const exists = await DeliveryChallan.findOne({ challanNumber: demo.challanNumber });
    if (!exists) {
      await DeliveryChallan.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo delivery challans ensured (${created} created)` });
});

module.exports = router; 