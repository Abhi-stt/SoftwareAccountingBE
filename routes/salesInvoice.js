const express = require('express');
const router = express.Router();
const SalesInvoice = require('../schemas/SalesInvoice');
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

// Get all sales invoices (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search, status } = req.query;
  let query = {};
  if (search) query.$or = [
    { invoiceNumber: { $regex: search, $options: 'i' } }
  ];
  if (status) query.status = status;
  const invoices = await SalesInvoice.find(query).populate('customerId');
  res.json(invoices);
});

// Get sales invoice by ID
router.get('/:id', auth, async (req, res) => {
  const invoice = await SalesInvoice.findById(req.params.id).populate('customerId');
  if (!invoice) return res.status(404).json({ message: 'Sales invoice not found' });
  res.json(invoice);
});

// Create sales invoice
router.post('/', auth, async (req, res) => {
  const data = req.body;
  // Calculate totalAmount if not provided
  if (!data.totalAmount && Array.isArray(data.items)) {
    data.totalAmount = data.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }
  // Set default status if not provided
  if (!data.status) {
    data.status = 'Unpaid';
  }
  const invoice = new SalesInvoice(data);
  await invoice.save();
  const io = req.app.get('io');
  if (io) io.emit('invoice:created', invoice);
  res.status(201).json(invoice);
});

// Update sales invoice
router.put('/:id', auth, async (req, res) => {
  const invoice = await SalesInvoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!invoice) return res.status(404).json({ message: 'Sales invoice not found' });
  const io = req.app.get('io');
  if (io) io.emit('invoice:updated', invoice);
  res.json(invoice);
});

// Delete sales invoice
router.delete('/:id', auth, async (req, res) => {
  const invoice = await SalesInvoice.findByIdAndDelete(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Sales invoice not found' });
  const io = req.app.get('io');
  if (io) io.emit('invoice:deleted', invoice?._id || req.params.id);
  res.json({ message: 'Sales invoice deleted' });
});

// Ensure demo sales invoices exist in DB
router.post('/ensure-demo', async (req, res) => {
  const demoInvoices = [
    {
      invoiceNumber: "INV-2024-001",
      customerId: null, // Set after customer ensure-demo
      date: "2024-01-15",
      items: [
        { productId: null, description: "Software License - Premium", quantity: 2, rate: 50000, amount: 100000, tax: 18000 }
      ],
      totalAmount: 118000,
      status: "Paid",
      currency: "INR",
      createdBy: null // Set after user ensure-demo
    },
    {
      invoiceNumber: "INV-USD-001",
      customerId: null,
      date: "2024-01-13",
      items: [
        { productId: null, description: "Consulting Hours", quantity: 10, rate: 2500, amount: 25000, tax: 0 }
      ],
      totalAmount: 25000,
      status: "Unpaid",
      currency: "USD",
      createdBy: null
    }
  ];
  // Find demo customer and product IDs
  const customer = await require('../schemas/Customer').findOne({ email: "contact@acme.com" });
  const product = await require('../schemas/Product').findOne({ sku: "SL-PREM-001" });
  const user = await require('../schemas/User').findOne({ email: "admin@globalbooks.com" });
  let created = 0;
  for (const demo of demoInvoices) {
    const exists = await SalesInvoice.findOne({ invoiceNumber: demo.invoiceNumber });
    if (!exists) {
      demo.customerId = customer?._id;
      demo.items[0].productId = product?._id;
      demo.createdBy = user?._id;
      await SalesInvoice.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo sales invoices ensured (${created} created)` });
});

module.exports = router; 