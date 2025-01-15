const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        // Test sorgusu
        const collections = await conn.connection.db.listCollections().toArray();
        console.log('Mevcut koleksiyonlar:', collections.map(c => c.name));

        console.log(`MongoDB Bağlantısı Başarılı: ${conn.connection.host}`);
        return conn;
    } catch (err) {
        console.error('MongoDB Bağlantı Hatası:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB; 