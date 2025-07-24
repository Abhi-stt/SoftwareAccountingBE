const express = require('express');
const router = express.Router();
const Quotation = require('../schemas/Quotation');
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

// Get all quotations (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search, status } = req.query;
  let query = {};
  if (search) query.$or = [
    { quotationNumber: { $regex: search, $options: 'i' } }
  ];
  if (status) query.status = status;
  const quotations = await Quotation.find(query).populate('customerId');
  res.json(quotations);
});

// Get quotation by ID
router.get('/:id', auth, async (req, res) => {
  const quotation = await Quotation.findById(req.params.id).populate('customerId');
  if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
  res.json(quotation);
});

// Create quotation
router.post('/', auth, async (req, res) => {
  const data = req.body;
  // Calculate totalAmount if not provided
  if (!data.totalAmount && Array.isArray(data.items)) {
    data.totalAmount = data.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }
  // Set default status if not provided
  if (!data.status) {
    data.status = 'Sent';
  }
  const quotation = new Quotation(data);
  await quotation.save();
  const io = req.app.get('io');
  if (io) io.emit('quotation:created', quotation);
  res.status(201).json(quotation);
});

// Update quotation
router.put('/:id', auth, async (req, res) => {
  const quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
  const io = req.app.get('io');
  if (io) io.emit('quotation:updated', quotation);
  res.json(quotation);
});

// Delete quotation
router.delete('/:id', auth, async (req, res) => {
  const quotation = await Quotation.findByIdAndDelete(req.params.id);
  if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
  const io = req.app.get('io');
  if (io) io.emit('quotation:deleted', quotation?._id || req.params.id);
  res.json({ message: 'Quotation deleted' });
});

// Ensure demo quotations exist in DB
router.post('/ensure-demo', async (req, res) => {
  const Customer = require('../schemas/Customer');
  const Product = require('../schemas/Product');
  const User = require('../schemas/User');
  const customer = await Customer.findOne({ email: "contact@acme.com" });
  const product = await Product.findOne({ sku: "SL-PREM-001" });
  const user = await User.findOne({ email: "admin@globalbooks.com" });
  const demoQuotations = [
    {
      quotationNumber: "QUO-2024-001",
      customerId: customer?._id,
      date: "2024-01-16",
      validUntil: "2024-02-15",
      items: [
        { productId: product?._id, description: "Software License - Premium", quantity: 2, rate: 50000, amount: 100000, tax: 18000 }
      ],
      totalAmount: 118000,
      status: "Sent",
      createdBy: user?._id
    },
    {
      quotationNumber: "QUO-2024-002",
      customerId: customer?._id,
      date: "2024-01-15",
      validUntil: "2024-02-14",
      items: [
        { productId: product?._id, description: "Software License - Premium", quantity: 4, rate: 45000, amount: 180000, tax: 32400 }
      ],
      totalAmount: 212400,
      status: "Accepted",
      createdBy: user?._id
    }
  ];
  let created = 0;
  for (const demo of demoQuotations) {
    const exists = await Quotation.findOne({ quotationNumber: demo.quotationNumber });
    if (!exists) {
      await Quotation.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo quotations ensured (${created} created)` });
});

module.exports = router; 