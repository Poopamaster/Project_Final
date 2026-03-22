const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. สร้าง Transporter (SMTP Setup) แบบ Explicit (แก้ปัญหาบน Railway)
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,             // ✨ เปลี่ยนจาก 465 เป็น 587
        secure: false,        // ✨ ต้องเป็น false สำหรับพอร์ต 587
        requireTLS: true,     // ✨ บังคับใช้ TLS เพื่อความปลอดภัย
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            // ✨ สำคัญมาก: ป้องกัน Error เรื่อง Certificate บน Server Cloud
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        },
        connectionTimeout: 10000, // เพิ่มเวลารอเชื่อมต่อเป็น 10 วินาที
        greetingTimeout: 10000,
    });

    // 2. ตั้งค่า Email
    const mailOptions = {
        from: `"${process.env.EMAIL_USER}" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
    };

    // 3. ส่ง Email
    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully to:', options.to);
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw error; // โยน error กลับไปให้ตัวที่เรียกใช้ฟังก์ชันนี้จัดการ
    }
};

module.exports = sendEmail;