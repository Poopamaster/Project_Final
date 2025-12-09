const mongoose = require('mongoose');

const auditoriumSchema = new mongoose.Schema({
    cinema_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true },
    name: { type: String, required: true },
    capacity: { type: Number },
    format: { type: String } // เช่น IMAX, 4DX, Standard
});

module.exports = mongoose.model('Auditorium', auditoriumSchema);