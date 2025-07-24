const express = require('express');
const router = express.Router();
const User = require('../schemas/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, name } = req.body;
    if (!email || !password || !role) return res.status(400).json({ message: 'Missing required fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'User already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ email, passwordHash, role, name });
    await user.save();
    res.status(201).json({ message: 'User registered', user: { email, role, name } });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { email: user.email, role: user.role, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// Middleware for protected routes
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

// Get all users (admin only, with search/filter)
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Forbidden' });
  const { search, role } = req.query;
  let query = {};
  if (search) query.$or = [
    { email: { $regex: search, $options: 'i' } },
    { name: { $regex: search, $options: 'i' } }
  ];
  if (role) query.role = role;
  const users = await User.find(query);
  res.json(users);
});

// Get user by ID (self or admin)
router.get('/:id', auth, async (req, res) => {
  if (req.user.role !== 'Admin' && req.user.id !== req.params.id) return res.status(403).json({ message: 'Forbidden' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Update user (self or admin)
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'Admin' && req.user.id !== req.params.id) return res.status(403).json({ message: 'Forbidden' });
  const update = { ...req.body };
  if (update.password) {
    update.passwordHash = await bcrypt.hash(update.password, 10);
    delete update.password;
  }
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Delete user (admin only)
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Forbidden' });
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted' });
});

// Ensure demo credentials exist in DB
router.post('/ensure-demo', async (req, res) => {
  const demoUsers = [
    { email: 'admin@globalbooks.com', password: 'admin123', role: 'Admin', name: 'Admin' },
    { email: 'accountant@globalbooks.com', password: 'acc123', role: 'Accountant', name: 'Accountant' },
    { email: 'auditor@globalbooks.com', password: 'audit123', role: 'Auditor', name: 'Auditor' }
  ];
  for (const demo of demoUsers) {
    let user = await User.findOne({ email: demo.email });
    if (!user) {
      const passwordHash = await bcrypt.hash(demo.password, 10);
      user = new User({ email: demo.email, passwordHash, role: demo.role, name: demo.name });
      await user.save();
    }
  }
  res.json({ message: 'Demo users ensured' });
});

module.exports = router; 