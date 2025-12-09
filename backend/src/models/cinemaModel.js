const mongoose = require('mongoose');

const cinemaSchema = new mongoose.Schema({
    name: { type: String, required: true },     // เช่น MCP Cinema Central World
    address: { type: String, required: true },
    province: { type: String, required: true },
    phone: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Cinema', cinemaSchema);