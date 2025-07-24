const mongoose = require('mongoose');
const BankAccountSchema = new mongoose.Schema({
  accountName: String,
  accountNumber: String,
  bankName: String,
  ifsc: String,
  openingBalance: Number,
  currentBalance: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('BankAccount', BankAccountSchema); 