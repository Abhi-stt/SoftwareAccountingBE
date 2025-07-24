const mongoose = require('mongoose');
const ChartOfAccountsSchema = new mongoose.Schema({
  name: String,
  code: String,
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccounts' },
  type: { type: String, enum: ['Asset', 'Liability', 'Income', 'Expense', 'Equity'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ChartOfAccounts', ChartOfAccountsSchema); 