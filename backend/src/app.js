const express = require('express');
const cors = require('cors');

const helloRoutes = require('./routes/helloRoutes');
const movieRoutes = require('./routes/movieRoutes'); // Import Route หนัง
const userRoutes = require('./routes/userRoutes');
const logger = require('./middleware/logger');

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

// Routes
app.use('/api/hello', helloRoutes);
app.use('/api/movies', movieRoutes); // เพิ่ม Endpoint หนัง
app.use('/api/users', userRoutes);

module.exports = app;