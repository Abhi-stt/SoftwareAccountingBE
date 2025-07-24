const express = require('express');
const router = express.Router();
const Vendor = require('../schemas/Vendor');
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

// Get all vendors (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search } = req.query;
  let query = {};
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { phone: { $regex: search, $options: 'i' } }
  ];
  const vendors = await Vendor.find(query);
  res.json(vendors);
});

// Get vendor by ID
router.get('/:id', auth, async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
  res.json(vendor);
});

// Create vendor
router.post('/', auth, async (req, res) => {
  const vendor = new Vendor(req.body);
  await vendor.save();
  const io = req.app.get('io');
  if (io) io.emit('vendor:created', vendor);
  res.status(201).json(vendor);
});

// Update vendor
router.put('/:id', auth, async (req, res) => {
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
  const io = req.app.get('io');
  if (io) io.emit('vendor:updated', vendor);
  res.json(vendor);
});

// Delete vendor
router.delete('/:id', auth, async (req, res) => {
  const vendor = await Vendor.findByIdAndDelete(req.params.id);
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
  const io = req.app.get('io');
  if (io) io.emit('vendor:deleted', vendor?._id || req.params.id);
  res.json({ message: 'Vendor deleted' });
});

// Ensure demo vendors exist in DB
router.post('/ensure-demo', async (req, res) => {
  const demoVendors = [
    {
      name: "Tech Solutions Europe",
      email: "support@techsolutions.eu",
      phone: "1112223333",
      address: "12 Tech Park, Berlin, Germany",
      gstNumber: "GSTIN8888",
      currency: "EUR"
    },
    {
      name: "Asia Supplies Pvt Ltd",
      email: "contact@asiasupplies.in",
      phone: "2223334444",
      address: "55 Industrial Area, Mumbai, India",
      gstNumber: "GSTIN7777",
      currency: "INR"
    }
  ];
  let created = 0;
  for (const demo of demoVendors) {
    const exists = await Vendor.findOne({ email: demo.email });
    if (!exists) {
      await Vendor.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo vendors ensured (${created} created)` });
});

module.exports = router; 