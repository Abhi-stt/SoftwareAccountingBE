const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema({
  name: String,
  category: String,
  sku: String,
  description: String,
  hsnCode: String,
  unit: String,
  openingStock: Number,
  currentStock: Number,
  purchasePrice: Number,
  salePrice: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Product', ProductSchema); 