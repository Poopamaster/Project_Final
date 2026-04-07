const Movie = require('../models/movieModel');

// ดึงหนังทั้งหมด
exports.getAllMovies = async () => {
    return await Movie.find();
};

// สร้างหนังใหม่
exports.createMovie = async (movieData) => {
    const movie = new Movie(movieData);
    return await movie.save();
};