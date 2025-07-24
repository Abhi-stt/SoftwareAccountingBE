const mongoose = require('mongoose');
const SalesInvoiceSchema = new mongoose.Schema({
  invoiceNumber: String,
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
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
module.exports = mongoose.model('SalesInvoice', SalesInvoiceSchema); 