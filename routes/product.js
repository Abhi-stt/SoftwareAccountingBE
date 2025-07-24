const express = require('express');
const router = express.Router();
const Product = require('../schemas/Product');
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

// Get all products (with search/filter)
router.get('/', auth, async (req, res) => {
  const { search } = req.query;
  let query = {};
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { sku: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ];
  const products = await Product.find(query);
  res.json(products);
});

// Get product by ID
router.get('/:id', auth, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

// Create product
router.post('/', auth, async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  const io = req.app.get('io');
  if (io) io.emit('product:created', product);
  res.status(201).json(product);
});

// Update product
router.put('/:id', auth, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const io = req.app.get('io');
  if (io) io.emit('product:updated', product);
  res.json(product);
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const io = req.app.get('io');
  if (io) io.emit('product:deleted', product?._id || req.params.id);
  res.json({ message: 'Product deleted' });
});

// Ensure demo products exist in DB
router.post('/ensure-demo', async (req, res) => {
  const demoProducts = [
    {
      name: "Software License - Premium",
      sku: "SL-PREM-001",
      category: "Software",
      currentStock: 25,
      minStock: 10,
      maxStock: 100,
      purchasePrice: 40000,
      salePrice: 50000,
      unit: "License",
      description: "Premium software license",
    },
    {
      name: "Hardware Setup Kit",
      sku: "HSK-001",
      category: "Hardware",
      currentStock: 5,
      minStock: 10,
      maxStock: 50,
      purchasePrice: 12000,
      salePrice: 15000,
      unit: "Kit",
      description: "Complete hardware setup kit",
    },
    {
      name: "Consulting Hours",
      sku: "CONS-HR",
      category: "Service",
      currentStock: 500,
      minStock: 100,
      maxStock: 1000,
      purchasePrice: 2000,
      salePrice: 2500,
      unit: "Hour",
      description: "Consulting service hours",
    },
    {
      name: "Training Materials",
      sku: "TM-001",
      category: "Materials",
      currentStock: 0,
      minStock: 20,
      maxStock: 200,
      purchasePrice: 4000,
      salePrice: 5000,
      unit: "Set",
      description: "Training material set",
    },
  ];
  let created = 0;
  for (const demo of demoProducts) {
    const exists = await Product.findOne({ sku: demo.sku });
    if (!exists) {
      await Product.create(demo);
      created++;
    }
  }
  res.json({ message: `Demo products ensured (${created} created)` });
});

module.exports = router; 