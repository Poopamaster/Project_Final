const helloService = require('../services/helloService');

exports.getHello = (req, res) => {
    const message = helloService.getHelloMessage();
    res.json({ message });
};
