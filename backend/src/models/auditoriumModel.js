const mongoose = require('mongoose');

const auditoriumSchema = new mongoose.Schema({
    cinema_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true },
    name: { type: String, required: true },     // เช่น Theater 1, IMAX
    capacity: { type: Number, required: true },
    format: { type: String, default: 'Standard' } // IMAX, 4DX, Standard
}, { timestamps: true });

module.exports = mongoose.model('Auditorium', auditoriumSchema);