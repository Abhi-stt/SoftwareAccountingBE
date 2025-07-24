const mongoose = require('mongoose');
const VendorSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  gstNumber: String,
  currency: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Vendor', VendorSchema); 