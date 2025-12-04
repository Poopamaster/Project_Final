const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5173;

app.use(cors());
app.use(express.json());

app.get('/api/hello', (req, res) => {
    res.json({ message: "Hello from Node Backend!" });
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});