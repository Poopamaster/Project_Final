const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. สร้าง Transporter (SMTP Setup) แบบ Explicit (แก้ปัญหาบน Railway)
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', // 🚨 เปลี่ยนจาก service: 'gmail' มากำหนด host ชัดเจน
        port: 465,              // 🚨 ใช้ Port 465 สำหรับการเชื่อมต่อที่ปลอดภัย (SSL)
        secure: true,           // 🚨 บังคับใช้ SSL
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS, // 🚨 ต้องเป็น "App Password 16 หลัก" ของ Gmail เท่านั้นนะครับ รหัสผ่านปกติใช้ไม่ได้แล้ว
        },
        // 🚨 ทริคเสริมสำหรับรันบน Cloud/Railway เพื่อป้องกันการโดนเตะออกเพราะ SSL/TLS
        tls: {
            rejectUnauthorized: false 
        }
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