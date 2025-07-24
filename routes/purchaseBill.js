const express = require('express');
const router = express.Router();
const PurchaseBill = require('../schemas/PurchaseBill');
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

// Get all purchase bills (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search, status } = req.query;
  let query = {};
  if (search) query.$or = [
    { billNumber: { $regex: search, $options: 'i' } }
  ];
  if (status) query.status = status;
  const bills = await PurchaseBill.find(query).populate('vendorId');
  res.json(bills);
});

// Get purchase bill by ID
router.get('/:id', auth, async (req, res) => {
  const bill = await PurchaseBill.findById(req.params.id).populate('vendorId');
  if (!bill) return res.status(404).json({ message: 'Purchase bill not found' });
  res.json(bill);
});

// Create purchase bill
router.post('/', auth, async (req, res) => {
  const bill = new PurchaseBill(req.body);
  await bill.save();
  const io = req.app.get('io');
  if (io) io.emit('purchasebill:created', bill);
  res.status(201).json(bill);
});

// Update purchase bill
router.put('/:id', auth, async (req, res) => {
  const bill = await PurchaseBill.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!bill) return res.status(404).json({ message: 'Purchase bill not found' });
  const io = req.app.get('io');
  if (io) io.emit('purchasebill:updated', bill);
  res.json(bill);
});

// Delete purchase bill
router.delete('/:id', auth, async (req, res) => {
  const bill = await PurchaseBill.findByIdAndDelete(req.params.id);
  if (!bill) return res.status(404).json({ message: 'Purchase bill not found' });
  const io = req.app.get('io');
  if (io) io.emit('purchasebill:deleted', bill?._id || req.params.id);
  res.json({ message: 'Purchase bill deleted' });
});

// Ensure demo purchase bills exist in DB
router.post('/ensure-demo', async (req, res) => {
  const demoBills = [
    {
      billNumber: "PUR-2024-002",
      vendorId: null, // Set after vendor ensure-demo
      date: "2024-01-14",
      items: [
        { productId: null, description: "Hardware Setup Kit", quantity: 10, rate: 15000, amount: 150000, tax: 27000 }
      ],
      totalAmount: 177000,
      status: "Paid",
      currency: "INR",
      createdBy: null // Set after user ensure-demo
    }
  ];
  // Find demo vendor and product IDs
  const vendor = await require('../schemas/Vendor').findOne({ email: "support@techsolutions.eu" });
  const product = await require('../schemas/Product').findOne({ sku: "HSK-001" });
  const user = await require('../schemas/User').findOne({ email: "admin@globalbooks.com" });
  let created = 0;
  for (const demo of demoBills) {
    const exists = await PurchaseBill.findOne({ billNumber: demo.billNumber });
    if (!exists) {
      demo.vendorId = vendor?._id;
      demo.items[0].productId = product?._id;
      demo.createdBy = user?._id;
      await PurchaseBill.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo purchase bills ensured (${created} created)` });
});

module.exports = router; 