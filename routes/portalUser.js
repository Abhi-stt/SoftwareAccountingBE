const express = require('express');
const router = express.Router();
const PortalUser = require('../schemas/PortalUser');
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

// Get all portal users (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search, role } = req.query;
  let query = {};
  if (search) query.email = { $regex: search, $options: 'i' };
  if (role) query.role = role;
  const users = await PortalUser.find(query);
  res.json(users);
});

// Get portal user by ID
router.get('/:id', auth, async (req, res) => {
  const user = await PortalUser.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Portal user not found' });
  res.json(user);
});

// Create portal user
router.post('/', auth, async (req, res) => {
  const user = new PortalUser(req.body);
  await user.save();
  const io = req.app.get('io');
  if (io) io.emit('portaluser:created', user);
  res.status(201).json(user);
});

// Update portal user
router.put('/:id', auth, async (req, res) => {
  const user = await PortalUser.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!user) return res.status(404).json({ message: 'Portal user not found' });
  const io = req.app.get('io');
  if (io) io.emit('portaluser:updated', user);
  res.json(user);
});

// Delete portal user
router.delete('/:id', auth, async (req, res) => {
  const user = await PortalUser.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'Portal user not found' });
  const io = req.app.get('io');
  if (io) io.emit('portaluser:deleted', user);
  res.json({ message: 'Portal user deleted' });
});

// Ensure demo portal users exist in DB
router.post('/ensure-demo', async (req, res) => {
  const Customer = require('../schemas/Customer');
  const Vendor = require('../schemas/Vendor');
  const customer = await Customer.findOne({ email: "contact@acme.com" });
  const vendor = await Vendor.findOne({ email: "support@techsolutions.eu" });
  const demoUsers = [
    {
      email: "client@acme.com",
      role: "Client",
      linkedCustomerOrVendorId: customer?._id,
      accessLevel: "read"
    },
    {
      email: "vendor@techsolutions.eu",
      role: "Vendor",
      linkedCustomerOrVendorId: vendor?._id,
      accessLevel: "read"
    }
  ];
  let created = 0;
  for (const demo of demoUsers) {
    const exists = await PortalUser.findOne({ email: demo.email });
    if (!exists) {
      await PortalUser.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo portal users ensured (${created} created)` });
});

module.exports = router; 