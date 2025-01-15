const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Bid = require('../models/Bid');
const Ticket = require('../models/Ticket');

// Admin yetkisi kontrolü
const isAdmin = (req, res, next) => {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin yetkisi gerekli' });
    }
    next();
};

// Debug için middleware ekleyelim
router.use((req, res, next) => {
    console.log('Admin route isteği:', req.method, req.path);
    next();
});

// Dashboard istatistiklerini getir
router.get('/dashboard-stats', auth, async (req, res) => {
    try {
        // Admin kontrolü
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir' });
        }

        // Tüm istatistikleri paralel olarak getir
        const [
            totalVehicles,
            totalUsers,
            totalBids,
            totalTickets,
            activeAuctions,
            completedAuctions
        ] = await Promise.all([
            Vehicle.countDocuments(),
            User.countDocuments(),
            Bid.countDocuments(),
            Ticket.countDocuments(),
            Vehicle.countDocuments({ status: 'active' }),
            Vehicle.countDocuments({ status: 'completed' })
        ]);

        const stats = {
            totalVehicles,
            totalUsers,
            totalBids,
            totalTickets,
            activeAuctions,
            completedAuctions
        };

        res.json(stats);
    } catch (err) {
        console.error('İstatistik hatası:', err);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// İstatistikleri getir
router.get('/stats', auth, isAdmin, async (req, res) => {
    try {
        const stats = {
            totalVehicles: await Vehicle.countDocuments(),
            activeAuctions: await Vehicle.countDocuments({ status: 'active' }),
            totalUsers: await User.countDocuments(),
            totalBids: await Bid.countDocuments(),
            revenue: await Ticket.aggregate([
                { $group: { _id: null, total: { $sum: "$price" } } }
            ]).then(result => result[0]?.total || 0)
        };
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Kullanıcı listesini getir
router.get('/users', auth, async (req, res) => {
    try {
        // Admin kontrolü
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir' });
        }

        // Tüm kullanıcıları getir
        const users = await User.find()
            .select('-password')
            .lean();

        // Her kullanıcı için ek bilgileri getir
        const enrichedUsers = await Promise.all(users.map(async (user) => {
            try {
                const [bidCount, wonAuctions, activeTickets] = await Promise.all([
                    Bid.countDocuments({ userId: user._id.toString() }),
                    Vehicle.countDocuments({ 'winner.userId': user._id.toString() }),
                    Ticket.countDocuments({ userId: user._id.toString(), status: 'active' })
                ]);

                return {
                    ...user,
                    bidCount,
                    wonAuctions,
                    activeTickets
                };
            } catch (error) {
                console.error(`Kullanıcı verisi zenginleştirme hatası (${user._id}):`, error);
                return user;
            }
        }));

        res.json(enrichedUsers);
    } catch (err) {
        console.error('Kullanıcı listesi hatası:', err);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Kullanıcı durumunu güncelle
router.put('/users/:id', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        console.log('Kullanıcı güncelleme isteği:', { id, isActive });

        const user = await User.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        console.log('Kullanıcı güncellendi:', user);
        res.json(user);
    } catch (err) {
        console.error('Kullanıcı güncelleme hatası:', err);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Kullanıcı sil
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Kullanıcı silme isteği:', id);

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        console.log('Kullanıcı silindi:', id);
        res.json({ message: 'Kullanıcı başarıyla silindi' });
    } catch (err) {
        console.error('Kullanıcı silme hatası:', err);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Araç yönetimi
router.get('/vehicles', auth, isAdmin, async (req, res) => {
    try {
        const vehicles = await Vehicle.find();
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// İhale yönetimi
router.get('/auctions', auth, isAdmin, async (req, res) => {
    try {
        const auctions = await Vehicle.find({ status: 'active' })
            .populate('bids');
        res.json(auctions);
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Bilet yönetimi
router.get('/tickets', auth, isAdmin, async (req, res) => {
    try {
        const tickets = await Ticket.find()
            .populate('userId', 'name email')
            .populate('vehicleId', 'brand model')
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (err) {
        console.error('Bilet listesi hatası:', err);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Raporlar
router.get('/reports', auth, isAdmin, async (req, res) => {
    try {
        const reports = {
            sales: await Ticket.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        total: { $sum: "$price" },
                        count: { $sum: 1 }
                    }
                }
            ]),
            auctions: await Vehicle.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        totalValue: { $sum: "$currentBid" }
                    }
                }
            ])
        };
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

module.exports = router; 