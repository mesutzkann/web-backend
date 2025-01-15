const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const bidRoutes = require('./routes/bids');
const ticketRoutes = require('./routes/tickets');
const adminRoutes = require('./routes/admin');

// Route tanımlamaları
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB bağlantısı başarılı'))
    .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Sunucu hatası!' });
});

// Route debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

const PORT = process.env.PORT || 5020;
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
});

module.exports = app; 