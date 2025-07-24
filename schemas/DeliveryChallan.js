const mongoose = require('mongoose');
const DeliveryChallanSchema = new mongoose.Schema({
  challanNumber: String,
  relatedInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesInvoice' },
  date: Date,
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    description: String
  }],
  status: { type: String, enum: ['Delivered', 'Pending'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('DeliveryChallan', DeliveryChallanSchema); 