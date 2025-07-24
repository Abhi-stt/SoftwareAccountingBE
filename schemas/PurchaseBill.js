const mongoose = require('mongoose');
const PurchaseBillSchema = new mongoose.Schema({
  billNumber: String,
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  date: Date,
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    description: String,
    quantity: Number,
    rate: Number,
    amount: Number,
    tax: Number
  }],
  totalAmount: Number,
  status: { type: String, enum: ['Paid', 'Unpaid', 'Partially Paid'] },
  currency: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('PurchaseBill', PurchaseBillSchema); 