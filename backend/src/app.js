const express = require('express');
const cors = require('cors');

const helloRoutes = require('./routes/helloRoutes');
const movieRoutes = require('./routes/movieRoutes'); // Import Route หนัง
const userRoutes = require('./routes/userRoutes');
const logger = require('./middleware/logger');
const paymentRoutes = require('./routes/paymentRoutes');
const mcpRoutes = require("./routes/mcpRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");

const app = express();

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());
app.use(express.json());
app.use(logger);



// Routes
app.use('/api/hello', helloRoutes);
app.use('/api/movies', movieRoutes); // เพิ่ม Endpoint หนัง
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);

app.use("/api/mcp", mcpRoutes);
app.use("/api/chatbot", chatbotRoutes);

module.exports = app;