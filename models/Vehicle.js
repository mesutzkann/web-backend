const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    mileage: {
        type: Number,
        required: true
    },
    fuelType: {
        type: String,
        required: true
    },
    transmission: {
        type: String,
        required: true
    },
    startingPrice: {
        type: Number,
        required: true
    },
    currentBid: {
        type: Number,
        default: function () {
            return this.startingPrice;
        }
    },
    currentBidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    winner: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        bidAmount: Number,
        winDate: Date
    },
    image: {
        type: String,
        default: 'https://example.com/default-car.jpg'
    }
}, {
    timestamps: true,
    collection: 'vehicles'
});

module.exports = mongoose.model('Vehicle', vehicleSchema); 