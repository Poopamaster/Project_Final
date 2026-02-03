const Log = require('../models/logModel');

exports.getAllLogs = async (req, res) => {
    try {
        const logs = await Log.find().sort({ timestamp: -1 }); // เรียงจากล่าสุดขึ้นก่อน
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};