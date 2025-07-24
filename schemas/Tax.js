const mongoose = require('mongoose');
const TaxSchema = new mongoose.Schema({
  type: String, // "GST", "VAT", etc.
  rate: Number,
  hsnCode: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Tax', TaxSchema); 