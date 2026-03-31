const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema({
    movie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    auditorium_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Auditorium', required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    language: { type: String, required: true },
    base_price: { type: Number, required: true },
    batch_id: { type: String, default: null },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Showtime', showtimeSchema);