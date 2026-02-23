// utils/logger.js
const Log = require('../models/logSystemModel');

const systemLog = async ({ level, actor, context,content, changes, note, req }) => {
    try {
        await Log.create({
            level: level || 'INFO',
            actor: {
                user_id: actor?._id,
                email: actor?.email || 'system',
                role: actor?.role || 'system'
            },
            context,
            content,
            changes,
            note,
            ip_address: req?.ip || '127.0.0.1'
        });
    } catch (error) {
        console.error("❌ Failed to save log:", error);
    }
};

module.exports = systemLog;