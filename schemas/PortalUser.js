const mongoose = require('mongoose');
const PortalUserSchema = new mongoose.Schema({
  email: String,
  role: { type: String, enum: ['Client', 'Vendor'] },
  linkedCustomerOrVendorId: mongoose.Schema.Types.ObjectId,
  accessLevel: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('PortalUser', PortalUserSchema); 