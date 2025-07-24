const mongoose = require('mongoose');
const ForexTransactionSchema = new mongoose.Schema({
  date: Date,
  type: String, // "Sales Invoice", "Purchase Bill", etc.
  reference: String,
  customerOrVendor: String,
  originalCurrency: String,
  originalAmount: Number,
  exchangeRate: Number,
  inrAmount: Number,
  gainLoss: Number
});
module.exports = mongoose.model('ForexTransaction', ForexTransactionSchema); 