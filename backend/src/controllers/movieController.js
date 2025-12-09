const movieService = require('../services/movieService');

exports.getMovies = async (req, res) => {
    try {
        const movies = await movieService.getAllMovies();
        res.status(200).json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createMovie = async (req, res) => {
    try {
        // รับข้อมูลจาก Body
        const newMovie = await movieService.createMovie(req.body);
        res.status(201).json(newMovie);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};