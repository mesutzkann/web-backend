const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB bağlantısı başarılı');

        // Önce mevcut admini sil
        await User.deleteOne({ userType: 'admin' });
        console.log('Mevcut admin silindi');

        // Admin şifresini hashleme
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Admin kullanıcısını oluştur
        const admin = new User({
            name: 'Admin',
            email: 'admin@ihale.com',
            password: hashedPassword,
            userType: 'admin',
            isAdmin: true
        });

        await admin.save();
        console.log('Admin kullanıcısı oluşturuldu:', {
            email: admin.email,
            userType: admin.userType,
            isAdmin: admin.isAdmin
        });

    } catch (err) {
        console.error('Admin oluşturma hatası:', err);
    } finally {
        await mongoose.disconnect();
    }
};

createAdmin(); 