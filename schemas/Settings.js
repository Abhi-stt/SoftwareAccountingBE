const mongoose = require('mongoose');
const SettingsSchema = new mongoose.Schema({
  companyName: String,
  address: String,
  gstNumber: String,
  financialYearStart: Date,
  financialYearEnd: Date,
  logoUrl: String,
  notificationSettings: Object,
  integrationSettings: Object,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Settings', SettingsSchema); 