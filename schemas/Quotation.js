const mongoose = require('mongoose');
const QuotationSchema = new mongoose.Schema({
  quotationNumber: String,
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  date: Date,
  validUntil: Date,
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    description: String,
    quantity: Number,
    rate: Number,
    amount: Number,
    tax: Number
  }],
  totalAmount: Number,
  status: String, // "Sent", "Accepted", etc.
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Quotation', QuotationSchema); 