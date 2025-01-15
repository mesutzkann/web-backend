const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Kullanıcı bilgilerini getir
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Sunucu hatası');
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password, loginType } = req.body;

        // Kullanıcıyı bul
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Bu kullanıcı bulunmuyor' });
        }

        // Şifreyi kontrol et
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Yanlış şifre girdiniz' });
        }

        // Admin kontrolü
        if (loginType === 'admin' && !user.isAdmin) {
            return res.status(403).json({
                message: 'Admin yetkisine sahip değilsiniz'
            });
        }

        // Normal kullanıcı tipi kontrolü
        if (loginType !== 'admin' && loginType !== user.userType) {
            return res.status(403).json({
                message: `Bu giriş sayfası sadece ${loginType === 'corporate' ? 'kurumsal' : 'bireysel'} kullanıcılar içindir`
            });
        }

        // Token oluştur
        const token = jwt.sign(
            {
                id: user._id,
                userType: user.userType,
                isAdmin: user.isAdmin // Token'a admin bilgisini ekle
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Kullanıcı bilgilerini gönder
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                isAdmin: user.isAdmin // Admin bilgisini ekle
            }
        });

    } catch (err) {
        console.error('Login hatası:', err);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Token doğrulama
router.get('/verify', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }
        res.json(user);
    } catch (err) {
        console.error('Token doğrulama hatası:', err);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Register route'u
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, userType } = req.body;

        // Email kontrolü
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Bu email adresi zaten kullanımda' });
        }

        // Yeni kullanıcı oluştur
        user = new User({
            name,
            email,
            password,
            userType
        });

        // Şifreyi hashle
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Kullanıcıyı kaydet
        await user.save();

        res.status(201).json({ message: 'Kayıt başarılı' });
    } catch (err) {
        console.error('Kayıt hatası:', err);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

module.exports = router; 