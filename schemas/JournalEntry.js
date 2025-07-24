const mongoose = require('mongoose');
const JournalEntrySchema = new mongoose.Schema({
  date: Date,
  entries: [{
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccounts' },
    debit: Number,
    credit: Number,
    description: String
  }],
  narration: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('JournalEntry', JournalEntrySchema); 