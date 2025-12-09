const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema({
    movie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    auditorium_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Auditorium', required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    language: { type: String, required: true }, // TH, EN
    base_price: { type: Number, required: true }
});

module.exports = mongoose.model('Showtime', showtimeSchema);