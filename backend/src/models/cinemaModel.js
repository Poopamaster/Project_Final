const mongoose = require('mongoose');

const cinemaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String },
    province: { type: String },
    phone: { type: String }
});

module.exports = mongoose.model('Cinema', cinemaSchema);