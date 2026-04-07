const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    
    charge_id: { type: String, required: true },

    amount: { type: Number, required: true },
    method: { type: String, required: true, default: 'PromptPay' }, 
    payment_time: { type: Date, default: Date.now },
    
    status: { 
        type: String, 
        enum: ['pending', 'success', 'failed', 'refunded'], 
        default: 'pending' // เริ่มต้นให้เป็น pending เสมอ
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);