const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    showtime_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
    seats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true }],
    booking_number: { type: String, required: true, unique: true },
    booking_time: { type: Date, default: Date.now },
    total_price: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);