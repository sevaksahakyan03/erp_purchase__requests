require('dotenv').config();
const express = require('express');

const app = express();

app.use(express.json());

app.use(express.static('public'))

const authRoutes = require('./src/routers/authRoutes');
const purchaseRequestRoutes = require('./src/routers/purchaseRequestRoutes');

app.use('/auth', authRoutes);
app.use('/purchase-requests', purchaseRequestRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ERP API-ն աշխատում է' });
});

app.use((err, req, res, next) => {
  console.error('Server error', err.message);
  
  res.status(err.status || 500).json({
    error: err.message || 'serving error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server connect on port: http://localhost:${PORT}`);
});