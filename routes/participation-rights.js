const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

router.post('/purchase', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        const { amount } = req.body;
        user.participationRights += amount;
        await user.save();

        res.json({ message: 'Katılım hakkı başarıyla satın alındı', newRights: user.participationRights });
    } catch (err) {
        res.status(500).send('Sunucu hatası');
    }
});

module.exports = router; 