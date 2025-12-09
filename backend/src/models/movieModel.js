const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title_th: { type: String, required: true },
    title_en: { type: String, required: true },
    genre: { type: String, required: true },
    duration_min: { type: Number, required: true },
    start_date: { type: Date, required: true },
    due_date: { type: Date, required: true }
}, { timestamps: true }); // timestamps จะสร้าง create_at, update_at ให้เอง

module.exports = mongoose.model('Movie', movieSchema);