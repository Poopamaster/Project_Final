const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. สร้าง Transporter (SMTP Setup) แบบ Explicit (แก้ปัญหาบน Railway)
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // ใช้ SSL สำหรับพอร์ต 465
        pool: true,   // 🚀 เพิ่ม Pool เพื่อให้รักษาการเชื่อมต่อ
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            // 🚀 บังคับให้รับ Certificate แม้จะรันบน environment ที่จำกัด
            rejectUnauthorized: false
        },
        connectionTimeout: 20000, // เพิ่มเวลาเป็น 20 วินาที (Railway บางช่วงเน็ตช้า)
        socketTimeout: 20000,
        idleTimeout: 30000
    });

    // ตรวจสอบการเชื่อมต่อทันทีที่รัน (เพื่อดู Log ใน Railway ว่าผ่านไหม)
    transporter.verify(function (error, success) {
        if (error) {
            console.log("❌ Transporter Verify Error:", error);
        } else {
            console.log("✅ Server is ready to take our messages");
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