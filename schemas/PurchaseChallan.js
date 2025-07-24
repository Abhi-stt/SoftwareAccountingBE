const mongoose = require('mongoose');
const PurchaseChallanSchema = new mongoose.Schema({
  challanNumber: String,
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  date: Date,
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    description: String
  }],
  status: { type: String, enum: ['Received', 'Pending'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('PurchaseChallan', PurchaseChallanSchema); 