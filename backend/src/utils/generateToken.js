const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallbacksecret'; 

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: '1h', // Token จะหมดอายุใน 30 วัน
    });
};

module.exports = generateToken;