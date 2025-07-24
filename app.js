const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Import and use all routes
app.use('/api/users', require('./routes/user'));
app.use('/api/customers', require('./routes/customer'));
app.use('/api/vendors', require('./routes/vendor'));
app.use('/api/products', require('./routes/product'));
app.use('/api/sales-invoices', require('./routes/salesInvoice'));
app.use('/api/purchase-bills', require('./routes/purchaseBill'));
app.use('/api/bank-accounts', require('./routes/bankAccount'));
app.use('/api/bank-transactions', require('./routes/bankTransaction'));
app.use('/api/audit-logs', require('./routes/auditLog'));
app.use('/api/delivery-challans', require('./routes/deliveryChallan'));
app.use('/api/chart-of-accounts', require('./routes/chartOfAccounts'));
app.use('/api/journal-entries', require('./routes/journalEntry'));
app.use('/api/taxes', require('./routes/tax'));
app.use('/api/currencies', require('./routes/currency'));
app.use('/api/forex-transactions', require('./routes/forexTransaction'));
app.use('/api/portal-users', require('./routes/portalUser'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/stock-movements', require('./routes/stockMovement'));
app.use('/api/quotations', require('./routes/quotation'));
app.use('/api/purchase-orders', require('./routes/purchaseOrder'));
app.use('/api/purchase-challans', require('./routes/purchaseChallan'));
app.use('/api/purchase-delivery-challans', require('./routes/purchaseDeliveryChallan'));
app.use('/api/tax-returns', require('./routes/taxReturn'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'GlobalBooks API is running.' });
});

module.exports = app; 