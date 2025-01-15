const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Vehicle = require('../models/Vehicle');
const Bid = require('../models/Bid');

// Tüm araçları getir
router.get('/', async (req, res) => {
    try {
        console.log('Araç listesi isteği alındı'); // Debug log

        // Araçları getir
        const vehicles = await Vehicle.find({ status: 'active' })
            .sort({ endDate: 1 });

        console.log('Bulunan araçlar:', vehicles); // Debug log

        // Eğer hiç araç yoksa test verilerini ekle
        if (vehicles.length === 0) {
            const testVehicles = [
                {
                    brand: "BMW",
                    model: "320i",
                    year: 2020,
                    mileage: 50000,
                    fuelType: "Benzin",
                    transmission: "Otomatik",
                    startingPrice: 800000,
                    currentBid: 800000,
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    status: 'active',
                    image: "https://example.com/bmw.jpg"
                },
                {
                    brand: "Mercedes",
                    model: "C200",
                    year: 2021,
                    mileage: 30000,
                    fuelType: "Dizel",
                    transmission: "Otomatik",
                    startingPrice: 1000000,
                    currentBid: 1000000,
                    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                    status: 'active',
                    image: "https://example.com/mercedes.jpg"
                }
            ];

            console.log('Test verileri ekleniyor...'); // Debug log
            const savedVehicles = await Vehicle.insertMany(testVehicles);
            console.log('Test verileri eklendi:', savedVehicles); // Debug log
            return res.json(savedVehicles);
        }

        res.json(vehicles);
    } catch (err) {
        console.error('Araç listesi hatası:', err);
        res.status(500).json({
            message: 'Araçlar yüklenirken bir hata oluştu',
            error: err.message
        });
    }
});

// Tek bir aracı getir
router.get('/:id', auth, async (req, res) => {
    try {
        console.log('Araç detay isteği alındı. ID:', req.params.id); // Debug log
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Araç bulunamadı' });
        }

        console.log('Bulunan araç:', vehicle); // Debug log
        res.json(vehicle);
    } catch (err) {
        console.error('Araç getirme hatası:', err);
        res.status(500).json({
            message: 'Araç bilgileri alınırken bir hata oluştu',
            error: err.message
        });
    }
});

// Araç ekleme route'u
router.post('/', auth, async (req, res) => {
    try {
        // Kullanıcı yetkisi kontrolü
        if (!req.user.isAdmin && req.user.userType !== 'corporate') {
            return res.status(403).json({
                message: 'Bu işlem için yetkiniz yok. Sadece kurumsal kullanıcılar ve admin araç ekleyebilir.'
            });
        }

        const vehicle = new Vehicle({
            ...req.body,
            status: 'active'
        });

        await vehicle.save();
        res.status(201).json(vehicle);

    } catch (err) {
        console.error('Araç ekleme hatası:', err);
        res.status(500).json({
            message: 'Araç eklenirken bir hata oluştu',
            error: err.message
        });
    }
});

// Araç silme route'u
router.delete('/:id', auth, async (req, res) => {
    try {
        // Önce aracı bul
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Araç bulunamadı' });
        }

        // Kullanıcının yetkisini kontrol et
        if (!req.user.isAdmin && req.user.userType !== 'corporate') {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
        }

        // Aracı sil
        await Vehicle.findByIdAndDelete(req.params.id);

        res.json({ message: 'Araç başarıyla silindi' });
    } catch (err) {
        console.error('Araç silme hatası:', err);
        res.status(500).json({
            message: 'Araç silinirken bir hata oluştu',
            error: err.message
        });
    }
});

// Araç güncelleme route'u
router.put('/:id', auth, async (req, res) => {
    try {
        // Önce aracı bul
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Araç bulunamadı' });
        }

        // Kullanıcının yetkisini kontrol et
        if (!req.user.isAdmin && req.user.userType !== 'corporate') {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
        }

        // Aracı güncelle
        const updatedVehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedVehicle);
    } catch (err) {
        console.error('Araç güncelleme hatası:', err);
        res.status(500).json({
            message: 'Araç güncellenirken bir hata oluştu',
            error: err.message
        });
    }
});

// İhale sonuçlandırma endpoint'i
router.post('/end-auction/:id', auth, async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({ message: 'Araç bulunamadı' });
        }

        // En yüksek teklifi bul
        const highestBid = await Bid.findOne({ vehicleId: vehicle._id })
            .sort({ amount: -1 })
            .populate('userId', 'name email');

        if (!highestBid) {
            vehicle.status = 'cancelled';
            await vehicle.save();
            return res.status(404).json({ message: 'Bu araç için hiç teklif verilmemiş' });
        }

        // Aracı kazanan kişiye ata
        vehicle.status = 'completed';
        vehicle.winner = {
            userId: highestBid.userId,
            bidAmount: highestBid.amount,
            winDate: new Date()
        };

        await vehicle.save();

        res.json({
            message: 'İhale başarıyla sonuçlandı',
            winner: {
                name: highestBid.userId.name,
                email: highestBid.userId.email,
                amount: highestBid.amount
            }
        });

    } catch (err) {
        console.error('İhale sonuçlandırma hatası:', err);
        res.status(500).json({ message: 'İhale sonuçlandırılırken bir hata oluştu' });
    }
});

module.exports = router; 