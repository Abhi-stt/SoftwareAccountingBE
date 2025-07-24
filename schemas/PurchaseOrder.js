const mongoose = require('mongoose');
const PurchaseOrderSchema = new mongoose.Schema({
  orderNumber: String,
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  date: Date,
  expectedDate: Date,
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    description: String,
    quantity: Number,
    rate: Number,
    amount: Number,
    tax: Number
  }],
  totalAmount: Number,
  status: { type: String, enum: ['Draft', 'Sent', 'Accepted', 'Cancelled'] },
  currency: String,
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema); 