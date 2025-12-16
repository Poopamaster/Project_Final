const Booking = require('../models/bookingModel');
const Seat = require('../models/seatModel');
const SeatType = require('../models/seatTypeModel');
const Showtime = require('../models/showtimeModel');
const User = require('../models/userModel');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ✅ 1. ประกาศฟังก์ชันส่งอีเมลเป็น const (Local Function) เพื่อให้เรียกใช้ภายในไฟล์ได้
// ✅ ฟังก์ชันส่งอีเมลฉบับปรับปรุง (UI ตาม Reference รูปที่ 2)
const sendBookingConfirmation = async (userEmail, bookingData) => {
    try {
        // 1. ดึงข้อมูลตัวแปร
        const movieObj = bookingData.showtime_id.movie_id;
        const movieTitle = movieObj.title_th;
        const posterUrl = movieObj.poster_url || "https://via.placeholder.com/150x225?text=No+Poster"; // ใส่รูป Default กันไว้
        const duration = movieObj.duration_min || "-";
        
        const cinemaName = bookingData.showtime_id.auditorium_id?.name || 'MCP Cinema';
        
        // Format วันที่และเวลา
        const dateObj = new Date(bookingData.showtime_id.start_time);
        const showDate = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
        const showTime = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        
        // จัดการที่นั่ง
        const seatsArr = bookingData.seats.map(s => s.row_label ? `${s.row_label}${s.seat_number}` : s);
        const seatsString = seatsArr.join(', ');
        
        const totalPrice = bookingData.total_price.toLocaleString();
        const bookingRef = bookingData.booking_number;

        // สร้าง QR Code Link (ใช้ API ฟรี เพื่อ Gen รูป QR จาก Booking ID)
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingRef}`;

        // 2. HTML Template (Inline CSS)
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

        // ส่งอีเมล
        const info = await transporter.sendMail({
            from: '"MCP Cinema Support" <' + process.env.EMAIL_USER + '>',
            to: userEmail,
            subject: `ยืนยันการจองตั๋วหนัง: ${movieTitle} (Booking #${bookingRef})`,
            html: htmlContent
        });

        console.log("Email sent: %s", info.messageId);
        return true;

    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};


// --- Controller Functions ---

exports.getBookedSeatsByShowtime = async (req, res) => {
    try {
        const { showtimeId } = req.params;

        const bookings = await Booking.find({
            showtime_id: showtimeId,
            status: { $ne: 'cancelled' }
        }).select('seats');

        const bookedSeatIds = bookings.map(b => b.seats).flat();

        res.status(200).json({
            success: true,
            bookedSeatIds
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.createBooking = async (req, res) => {
    try {
        const { showtime_id, seat_ids } = req.body;
        const user_id = req.user._id;

        if (!seat_ids || seat_ids.length === 0) {
            return res.status(400).json({ message: "กรุณาเลือกที่นั่ง" });
        }

        // --- STEP 1: ตรวจสอบที่นั่งว่าง ---
        const existingBooking = await Booking.findOne({
            showtime_id: showtime_id,
            seats: { $in: seat_ids },
            status: { $ne: 'cancelled' }
        });

        if (existingBooking) {
            return res.status(409).json({ message: "เสียใจด้วย! ที่นั่งบางที่ถูกจองตัดหน้าไปแล้ว" });
        }

        // --- STEP 2: คำนวณราคา ---
        let totalPrice = 0;
        const selectedSeats = await Seat.find({ _id: { $in: seat_ids } }).populate('seat_type_id');

        if (selectedSeats.length !== seat_ids.length) {
            return res.status(400).json({ message: "ข้อมูลที่นั่งไม่ถูกต้อง" });
        }

        for (const seat of selectedSeats) {
            totalPrice += seat.seat_type_id ? seat.seat_type_id.price : 0;
        }

        const timestamp = Date.now().toString().slice(-6);
        const randomNum = Math.floor(100 + Math.random() * 900);
        const bookingNumber = `BK-${timestamp}${randomNum}`;

        // --- STEP 3: บันทึก ---
        const newBooking = await Booking.create({
            user_id,
            showtime_id,
            seats: seat_ids,
            booking_number: bookingNumber,
            total_price: totalPrice,
            status: 'confirmed'
        });

        // --- STEP 4: Populate Data ---
        const fullBooking = await Booking.findById(newBooking._id)
            .populate('user_id')
            .populate({
                path: 'showtime_id',
                populate: [
                    { path: 'movie_id' },
                    { path: 'auditorium_id' }
                ]
            })
            .populate({
                path: 'seats',
                populate: { path: 'seat_type_id' }
            });

        // --- STEP 5: ส่งเมล (เรียกใช้ฟังก์ชัน const ที่ประกาศไว้ด้านบน) ---
        if (fullBooking.user_id && fullBooking.user_id.email) {
            console.log("Sending email to:", fullBooking.user_id.email);
            // ✅ เรียกใช้ได้แล้ว เพราะมันคือตัวแปรในไฟล์เดียวกัน
            sendBookingConfirmation(fullBooking.user_id.email, fullBooking); 
        }

        res.status(201).json({
            success: true,
            message: "จองตั๋วสำเร็จ!",
            booking: fullBooking
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการจอง" });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user_id: req.user._id })
            .populate({
                path: 'showtime_id',
                populate: { path: 'movie_id' } // Populate หนังด้วย จะได้เอาชื่อมาโชว์หน้า MyTicket
            })
            .populate('seats')
            .sort({ createdAt: -1 });

        res.status(200).json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate({
                path: 'showtime_id',
                populate: [
                    { path: 'movie_id' },
                    { path: 'auditorium_id' }
                ]
            })
            .populate({
                path: 'seats',
                populate: { path: 'seat_type_id' }
            });

        if (!booking) return res.status(404).json({ message: "ไม่พบข้อมูลการจอง" });

        if (booking.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
        }

        res.status(200).json(booking);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

exports.sendBookingConfirmation = sendBookingConfirmation;