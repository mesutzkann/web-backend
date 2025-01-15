const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const ticketRoutes = require('./routes/tickets');
const bidRoutes = require('./routes/bids');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5020;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server ${PORT} portunda çalışıyor`);
        });
    } catch (err) {
        console.error('Sunucu başlatma hatası:', err);
        process.exit(1);
    }
};

startServer();

process.on('unhandledRejection', (err) => {
    console.error('Yakalanmamış Promise Hatası:', err);
    process.exit(1);
}); 