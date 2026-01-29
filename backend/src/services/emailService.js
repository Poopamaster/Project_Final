// services/emailService.js
const nodemailer = require('nodemailer');

// 1. ตั้งค่า Transporter (ใช้ Gmail ตามที่คุณตั้งค่าไว้)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 2. ฟังก์ชันส่งอีเมล Confirmation
const sendBookingConfirmation = async (userEmail, bookingData) => {
    try {
        // --- ส่วนเตรียมข้อมูล (Data Preparation) ---
        const movieObj = bookingData.showtime_id.movie_id;
        const movieTitle = movieObj.title_th;
        const posterUrl = movieObj.poster_url || "https://via.placeholder.com/150x225?text=No+Poster";
        const duration = movieObj.duration_min || "-";
        
        const cinemaName = bookingData.showtime_id.auditorium_id?.name || 'MCP Cinema';
        
        const dateObj = new Date(bookingData.showtime_id.start_time);
        const showDate = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
        const showTime = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        
        // จัดการชื่อที่นั่ง
        const seatsArr = bookingData.seats.map(s => s.row_label ? `${s.row_label}${s.seat_number}` : s);
        const seatsString = seatsArr.join(', ');
        
        const totalPrice = bookingData.total_price.toLocaleString();
        const bookingRef = bookingData.booking_number;

        // QR Code API
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingRef}`;

        // --- ส่วน HTML Template (Inline CSS สำหรับ Email) ---
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-top: 20px; margin-bottom: 20px;">
                    
                    <div style="background-color: #1a1f2c; padding: 25px; text-align: center; border-bottom: 3px solid #f1c40f;">
                        <h1 style="color: #f1c40f; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">MCP CINEMA</h1>
                        <p style="color: #f1c40f; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">ยืนยันการจองตั๋วภาพยนตร์</p>
                    </div>

                    <div style="padding: 30px 20px; text-align: center; background-color: #ffffff;">
                        <div style="width: 50px; height: 50px; background-color: #27ae60; border-radius: 50%; display: inline-block; line-height: 50px; color: white; font-size: 30px; margin-bottom: 10px;">✓</div>
                        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">รหัสการจอง (Booking ID)</p>
                        <h2 style="color: #2c3e50; margin: 5px 0; font-size: 28px; letter-spacing: 1px;">${bookingRef}</h2>
                        <p style="color: #27ae60; margin: 0; font-size: 14px; font-weight: bold;">ชำระเงินเรียบร้อยแล้ว</p>
                    </div>

                    <hr style="border: 0; border-top: 1px dashed #ecf0f1; margin: 0;">

                    <div style="padding: 20px;">
                        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                            <tr>
                                <td width="120" valign="top" style="padding-right: 20px;">
                                    <img src="${posterUrl}" alt="Movie Poster" style="width: 100px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                                </td>
                                <td valign="top">
                                    <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 18px;">${movieTitle}</h3>
                                    
                                    <div style="margin-bottom: 15px;">
                                        <span style="background-color: #ecf0f1; color: #7f8c8d; padding: 3px 8px; border-radius: 4px; font-size: 10px; margin-right: 5px;">Digital</span>
                                        <span style="background-color: #ecf0f1; color: #7f8c8d; padding: 3px 8px; border-radius: 4px; font-size: 10px;">${duration} นาที</span>
                                    </div>

                                    <table width="100%" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td style="padding-bottom: 5px; color: #7f8c8d; font-size: 12px;">โรงภาพยนตร์:</td>
                                            <td style="padding-bottom: 5px; color: #2c3e50; font-size: 13px; font-weight: bold;">${cinemaName}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 5px; color: #7f8c8d; font-size: 12px;">วันที่:</td>
                                            <td style="padding-bottom: 5px; color: #2c3e50; font-size: 13px; font-weight: bold;">${showDate}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 5px; color: #7f8c8d; font-size: 12px;">รอบฉาย:</td>
                                            <td style="padding-bottom: 5px; color: #2c3e50; font-size: 13px; font-weight: bold;">${showTime} น.</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="margin: 0 20px 20px 20px; background-color: #f8f9fa; border-radius: 8px; padding: 15px;">
                        <table width="100%">
                            <tr>
                                <td align="center" style="border-right: 1px solid #ddd;">
                                    <p style="margin: 0; font-size: 12px; color: #7f8c8d;">โรงที่ (Cinema)</p>
                                    <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #2c3e50;">${cinemaName}</p> 
                                </td>
                                <td align="center">
                                    <p style="margin: 0; font-size: 12px; color: #7f8c8d;">ที่นั่ง (Seats)</p>
                                    <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #e74c3c;">${seatsString}</p>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="text-align: center; padding: 10px 20px 30px 20px;">
                        <img src="${qrCodeUrl}" alt="QR Code" style="width: 140px; height: 140px;">
                        <p style="color: #95a5a6; font-size: 11px; margin-top: 10px;">สแกน QR Code นี้ที่หน้าทางเข้าโรงภาพยนตร์เพื่อรับตั๋วหรือเข้าชม</p>
                    </div>

                    <div style="background-color: #fcfcfc; padding: 20px; border-top: 1px solid #eee;">
                        <h4 style="margin: 0 0 15px 0; color: #2c3e50; border-bottom: 2px solid #f1c40f; display: inline-block; padding-bottom: 5px;">รายละเอียดการชำระเงิน</h4>
                        
                        <table width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                                <td style="padding: 5px 0; color: #7f8c8d; font-size: 13px;">ตั๋วชมภาพยนตร์ (${seatsArr.length} ที่นั่ง)</td>
                                <td style="padding: 5px 0; text-align: right; color: #2c3e50; font-size: 13px;">${totalPrice} THB</td>
                            </tr>
                            <tr>
                                <td colspan="2"><hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;"></td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0; color: #2c3e50; font-weight: bold; font-size: 16px;">ยอดชำระสุทธิ (Total Amount)</td>
                                <td style="padding: 5px 0; text-align: right; color: #2c3e50; font-weight: bold; font-size: 18px;">${totalPrice} THB</td>
                            </tr>
                        </table>
                         <p style="color: #bdc3c7; font-size: 10px; margin-top: 15px; text-align: center;">Transaction ID: ${bookingData._id}</p>
                    </div>

                </div>
            </body>
            </html>
        `;

        // 3. สั่งส่งเมล
        const info = await transporter.sendMail({
            from: '"MCP Cinema Support" <' + process.env.EMAIL_USER + '>',
            to: userEmail,
            subject: `ยืนยันการจองตั๋วหนัง: ${movieTitle} (Booking #${bookingRef})`,
            html: htmlContent
        });

        console.log("✅ Email sent successfully: %s", info.messageId);
        return true;

    } catch (error) {
        console.error("❌ Error sending email:", error);
        return false;
    }
};

module.exports = {
    sendBookingConfirmation
};