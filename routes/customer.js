const express = require('express');
const router = express.Router();
const Customer = require('../schemas/Customer');
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

// Get all customers (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search } = req.query;
  let query = {};
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { phone: { $regex: search, $options: 'i' } }
  ];
  const customers = await Customer.find(query);
  res.json(customers);
});

// Get customer by ID
router.get('/:id', auth, async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json(customer);
});

// Create customer
router.post('/', auth, async (req, res) => {
  const customer = new Customer(req.body);
  await customer.save();
  const io = req.app.get('io');
  if (io) io.emit('customer:created', customer);
  res.status(201).json(customer);
});

// Update customer
router.put('/:id', auth, async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  const io = req.app.get('io');
  if (io) io.emit('customer:updated', customer);
  res.json(customer);
});

// Delete customer
router.delete('/:id', auth, async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  const io = req.app.get('io');
  if (io) io.emit('customer:deleted', customer?._id || req.params.id);
  res.json({ message: 'Customer deleted' });
});

// Ensure demo customers exist in DB
router.post('/ensure-demo', async (req, res) => {
  const demoCustomers = [
    {
      name: "Acme Corporation",
      email: "contact@acme.com",
      phone: "1234567890",
      address: "123 Main St, City",
      gstNumber: "GSTIN1234",
      currency: "INR"
    },
    {
      name: "Global Corp USA",
      email: "info@globalcorp.com",
      phone: "9876543210",
      address: "456 Market Ave, USA",
      gstNumber: "GSTIN5678",
      currency: "USD"
    },
    {
      name: "UK Industries Ltd",
      email: "sales@ukind.com",
      phone: "5551234567",
      address: "789 Business Park, UK",
      gstNumber: "GSTIN9999",
      currency: "GBP"
    }
  ];
  let created = 0;
  for (const demo of demoCustomers) {
    const exists = await Customer.findOne({ email: demo.email });
    if (!exists) {
      await Customer.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo customers ensured (${created} created)` });
});

module.exports = router; 