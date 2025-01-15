const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Bid = require('../models/Bid');
const Vehicle = require('../models/Vehicle');

// Teklif verme
router.post('/:vehicleId', auth, async (req, res) => {
    try {
        const { amount } = req.body;
        const vehicleId = req.params.vehicleId;

        // Aracı bul
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Araç bulunamadı' });
        }

        // Yeni teklif oluştur
        const newBid = new Bid({
            vehicleId,
            userId: req.user.id,
            amount
        });

        await newBid.save();

        // Aracın mevcut teklifini güncelle
        vehicle.currentBid = amount;
        vehicle.currentBidder = req.user.id;
        await vehicle.save();

        res.json({
            message: 'Teklif başarıyla verildi',
            bid: newBid
        });

    } catch (err) {
        console.error('Teklif verme hatası:', err);
        res.status(500).json({ message: 'Teklif verirken bir hata oluştu' });
    }
});

// Araç için verilen tüm teklifleri getir
router.get('/vehicle/:vehicleId', auth, async (req, res) => {
    try {
        const bids = await Bid.find({ vehicleId: req.params.vehicleId })
            .sort({ amount: -1 })
            .populate('userId', 'name email');

        res.json(bids);
    } catch (err) {
        console.error('Teklifleri getirme hatası:', err);
        res.status(500).json({ message: 'Teklifler alınırken bir hata oluştu' });
    }
});

module.exports = router; 