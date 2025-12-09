const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true }, // Credit Card, PromptPay
    payment_time: { type: Date, default: Date.now },
    status: { type: String, enum: ['success', 'failed', 'refunded'], default: 'success' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);