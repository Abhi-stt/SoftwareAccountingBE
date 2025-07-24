const mongoose = require('mongoose');
const TaxReturnSchema = new mongoose.Schema({
  type: String,
  period: String,
  dueDate: Date,
  status: { type: String, enum: ['Filed', 'Pending', 'Overdue'], default: 'Pending' },
  filedDate: Date,
  totalSales: Number,
  totalTax: Number,
  reportUrl: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('TaxReturn', TaxReturnSchema); 