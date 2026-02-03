const Booking = require('../models/bookingModel');
const Seat = require('../models/seatModel');
const saveLog = require('../utils/logger'); // ✅ นำเข้าตัวช่วยบันทึก Log

// ✅ Import Email Service ที่เราแยกไว้
const emailService = require('../services/emailService'); 

// 1. ฟังก์ชันดึงที่นั่งที่ถูกจองแล้ว
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

// 2. ฟังก์ชันจองตั๋ว (ตัวหลัก)
exports.createBooking = async (req, res) => {
    try {
        const { showtime_id, seat_ids } = req.body;
        const user_id = req.user._id;

        if (!seat_ids || seat_ids.length === 0) {
            return res.status(400).json({ message: "กรุณาเลือกที่นั่ง" });
        }

        // --- STEP 1: ตรวจสอบที่นั่งว่าง (Race Condition Check) ---
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

        // Gen เลข Booking ID
        const timestamp = Date.now().toString().slice(-6);
        const randomNum = Math.floor(100 + Math.random() * 900);
        const bookingNumber = `BK-${timestamp}${randomNum}`;

        // --- STEP 3: บันทึกลง Database ---
        const newBooking = await Booking.create({
            user_id,
            showtime_id,
            seats: seat_ids,
            booking_number: bookingNumber,
            total_price: totalPrice,
            status: 'confirmed'
        });

        // --- STEP 4: Populate Data (สำคัญมาก! เพื่อเอาข้อมูลไปส่งเมลและบันทึก Log) ---
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

        // ✅ STEP 4.5: บันทึก Log เมื่อจองตั๋วสำเร็จ
        await saveLog({
            req,
            action: 'create',
            table: 'Booking',
            targetId: newBooking._id,
            newVal: {
                movie: fullBooking.showtime_id?.movie_id?.title_th || "Unknown Movie",
                seats: fullBooking.seats.map(s => `${s.row_label}${s.seat_number}`).join(', '),
                total_price: totalPrice
            },
            note: `จองตั๋วสำเร็จ หมายเลข ${bookingNumber} โดย ${fullBooking.user_id?.email}` //
        });

        // --- STEP 5: ส่งอีเมล (เรียกใช้ Service) ---
        if (fullBooking.user_id && fullBooking.user_id.email) {
            emailService.sendBookingConfirmation(fullBooking.user_id.email, fullBooking); 
        }

        // --- STEP 6: ตอบกลับ Client ---
        res.status(201).json({
            success: true,
            message: "จองตั๋วสำเร็จ!",
            booking: fullBooking
        });

    } catch (error) {
        console.error("Create Booking Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการจอง" });
    }
};

// 3. ดึงประวัติการจองของ User
exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user_id: req.user._id })
            .populate({
                path: 'showtime_id',
                populate: { path: 'movie_id' }
            })
            .populate('seats')
            .sort({ createdAt: -1 });

        res.status(200).json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// 4. ดึงข้อมูล Booking ตาม ID
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

        // Security Check: ห้ามดูตั๋วคนอื่น
        if (booking.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
        }

        res.status(200).json(booking);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};