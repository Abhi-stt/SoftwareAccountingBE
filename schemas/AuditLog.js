const mongoose = require('mongoose');
const AuditLogSchema = new mongoose.Schema({
  timestamp: Date,
  user: String,
  userRole: String,
  action: String,
  module: String,
  recordId: String,
  details: String,
  ipAddress: String,
  severity: { type: String, enum: ['Info', 'Warning', 'Critical'] }
});
module.exports = mongoose.model('AuditLog', AuditLogSchema); 