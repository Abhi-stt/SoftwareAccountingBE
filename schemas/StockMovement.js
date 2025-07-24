const mongoose = require('mongoose');
const StockMovementSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  type: String, // "Sale", "Purchase", "Adjustment"
  quantity: Number,
  date: Date,
  reference: String,
  balance: Number
});
module.exports = mongoose.model('StockMovement', StockMovementSchema); 