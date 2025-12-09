const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title_th: { type: String, required: true },
    title_en: { type: String, required: true },
    poster_url: { type: String }, 
    genre: { type: String, required: true },
    duration_min: { type: Number, required: true },
    start_date: { type: Date, required: true },
    due_date: { type: Date, required: true },
    
    language: { 
        type: String, 
        required: true, 
        default: "TH/EN"
    } 

}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);