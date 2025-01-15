const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    price: {
        type: Number,
        required: true,
        default: 2500.11
    },
    status: {
        type: String,
        enum: ['active', 'used', 'refunded'],
        default: 'active'
    },
    expiryDate: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    message: {
        type: String,
        default: '7 gün kullanılmaması durumunda tarafınıza iade gerçekleştirilecektir.'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Ticket', ticketSchema); 