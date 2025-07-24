const mongoose = require('mongoose');
const CurrencySchema = new mongoose.Schema({
  code: String, // "USD", "INR", etc.
  name: String,
  symbol: String,
  rate: Number,
  lastUpdated: Date
});
module.exports = mongoose.model('Currency', CurrencySchema); 