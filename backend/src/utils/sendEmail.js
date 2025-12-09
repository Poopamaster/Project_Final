const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. สร้าง Transporter (SMTP Setup)
    const transporter = nodemailer.createTransport({
        service: 'gmail', // ใช้ Gmail หรือเปลี่ยนเป็น SMTP Host อื่นๆ
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS,
        },
    });

    // 2. ตั้งค่า Email
    const mailOptions = {
        from: `"${process.env.EMAIL_USER}" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
    };

    // 3. ส่ง Email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;