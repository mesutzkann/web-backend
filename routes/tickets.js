const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const auth = require('../middleware/auth');

// Kullanıcının biletlerini getir
router.get('/my-tickets', auth, async (req, res) => {
    try {
        console.log('Bilet isteği alındı. User ID:', req.user.id); // Debug log

        const tickets = await Ticket.find({ userId: req.user.id })
            .sort({ createdAt: -1 });

        console.log('Bulunan biletler:', tickets); // Debug log
        res.json(tickets);
    } catch (err) {
        console.error('Bilet getirme hatası:', err);
        res.status(500).json({ message: 'Biletler getirilirken bir hata oluştu', error: err.message });
    }
});

// Bilet satın alma
router.post('/', auth, async (req, res) => {
    try {
        console.log('Bilet satın alma isteği. User ID:', req.user.id); // Debug log
        const newTicket = new Ticket({
            userId: req.user.id,
            price: 2500,
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            message: '7 gün kullanılmaması durumunda tarafınıza iade gerçekleştirilecektir.'
        });

        await newTicket.save();
        res.json(newTicket);
    } catch (err) {
        console.error('Bilet oluşturma hatası:', err); // Debug log
        res.status(500).json({ message: 'Bilet oluşturulurken bir hata oluştu' });
    }
});

// Bilet iade etme
router.delete('/refund/:id', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findOne({
            _id: req.params.id,
            userId: req.user.id,
            status: 'active'
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Bilet bulunamadı veya iade edilemez' });
        }

        await Ticket.deleteOne({ _id: req.params.id });

        res.json({ message: 'Bilet başarıyla iade edildi' });
    } catch (err) {
        console.error('Bilet iade hatası:', err);
        res.status(500).json({ message: 'Bilet iade edilirken bir hata oluştu' });
    }
});

// Bilet kullanma
router.post('/use', auth, async (req, res) => {
    try {
        const { vehicleId } = req.body;

        // Aktif bilet kontrolü
        const activeTicket = await Ticket.findOne({
            userId: req.user.id,
            status: 'active'
        });

        if (!activeTicket) {
            return res.status(400).json({
                message: 'Aktif biletiniz bulunmamaktadır. Lütfen önce bilet satın alın.'
            });
        }

        // Bileti kullanıldı olarak işaretle ve sil
        await Ticket.findByIdAndDelete(activeTicket._id);

        // Eski kullanılmış biletleri de temizle
        await Ticket.deleteMany({
            userId: req.user.id,
            status: 'used'
        });

        res.json({
            message: 'Bilet başarıyla kullanıldı',
            ticketId: activeTicket._id
        });
    } catch (err) {
        console.error('Bilet kullanma hatası:', err);
        res.status(500).json({ message: 'Bilet kullanılırken bir hata oluştu' });
    }
});

// Kullanılmış biletleri temizleme (opsiyonel - periyodik temizlik için)
router.delete('/cleanup', auth, async (req, res) => {
    try {
        const result = await Ticket.deleteMany({
            userId: req.user.id,
            status: 'used'
        });

        res.json({
            message: 'Kullanılmış biletler temizlendi',
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error('Bilet temizleme hatası:', err);
        res.status(500).json({ message: 'Biletler temizlenirken bir hata oluştu' });
    }
});

// Bilet satın alma
router.post('/purchase', auth, async (req, res) => {
    try {
        // Debug için user bilgisini logla
        console.log('Satın alma isteği yapan kullanıcı:', req.user);

        // Yeni bilet oluştur
        const newTicket = new Ticket({
            userId: req.user.id,
            price: 2500,
            status: 'active',
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            message: '7 gün kullanılmaması durumunda tarafınıza iade gerçekleştirilecektir.'
        });

        // Bileti kaydet
        const savedTicket = await newTicket.save();
        console.log('Yeni bilet oluşturuldu:', savedTicket);

        // Başarılı yanıt döndür
        res.status(201).json(savedTicket);
    } catch (err) {
        console.error('Bilet oluşturma hatası:', err);
        res.status(500).json({
            message: 'Bilet oluşturulurken bir hata oluştu',
            error: err.message
        });
    }
});

module.exports = router; 