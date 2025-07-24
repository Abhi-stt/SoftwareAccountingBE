const mongoose = require('mongoose');
const BankTransactionSchema = new mongoose.Schema({
  bankAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  date: Date,
  type: { type: String, enum: ['Deposit', 'Withdrawal', 'Transfer'] },
  amount: Number,
  description: String,
  reference: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('BankTransaction', BankTransactionSchema); 