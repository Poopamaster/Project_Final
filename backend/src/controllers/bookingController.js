const Booking = require('../models/bookingModel');
const Seat = require('../models/seatModel');
const SeatType = require('../models/seatTypeModel');
const Showtime = require('../models/showtimeModel'); // ถ้าต้องเช็คว่ารอบฉายมีจริงไหม

// --- 1. ดึงข้อมูลว่ารอบฉายนี้ มีที่นั่งไหนไม่ว่างบ้าง (Booked Seats) ---
// Frontend จะยิงมาถามตอนโหลดผังที่นั่ง เพื่อทำเป็นสีแดง (ห้ามกด)
exports.getBookedSeatsByShowtime = async (req, res) => {
    try {
        const { showtimeId } = req.params;

        // ค้นหา Booking ทั้งหมดของรอบนี้ ที่สถานะไม่ใช่ 'cancelled'
        const bookings = await Booking.find({
            showtime_id: showtimeId,
            status: { $ne: 'cancelled' } // เอาทั้ง pending และ confirmed
        }).select('seats'); // เอามาแค่ field seats พอ

        // ยุบรวม Array ของ seats จากทุก booking ให้เป็น Array เดียว
        // เช่น [[A1, A2], [B1]] -> [A1, A2, B1]
        const bookedSeatIds = bookings.map(b => b.seats).flat();

        res.status(200).json({
            success: true,
            bookedSeatIds // ส่ง ID ของเก้าอี้ที่ไม่ว่างกลับไป
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// --- 2. สร้างการจอง (Create Booking) ---
exports.createBooking = async (req, res) => {
    try {
        const { showtime_id, seat_ids } = req.body; // รับ ID รอบฉาย และ Array ของ ID ที่นั่ง
        const user_id = req.user._id; // ได้มาจาก Middleware (AuthGuard)

        if (!seat_ids || seat_ids.length === 0) {
            return res.status(400).json({ message: "กรุณาเลือกที่นั่ง" });
        }

        // --- STEP 1: ตรวจสอบว่าที่นั่งว่างจริงไหม (สำคัญมาก!) ---
        // เช็คว่ามี Booking ไหนในรอบนี้ ที่จองที่นั่งเหล่านี้ไปแล้วหรือยัง (กันชนกันวินาทีสุดท้าย)
        const existingBooking = await Booking.findOne({
            showtime_id: showtime_id,
            seats: { $in: seat_ids }, // เช็คว่ามี seat_ids ใดๆ อยู่ใน booking อื่นไหม
            status: { $ne: 'cancelled' }
        });

        if (existingBooking) {
            return res.status(409).json({ message: "เสียใจด้วย! ที่นั่งบางที่ถูกจองตัดหน้าไปแล้ว" });
        }

        // --- STEP 2: คำนวณราคา (Backend ต้องคิดเอง อย่าเชื่อ Frontend) ---
        let totalPrice = 0;
        
        // ดึงข้อมูล Seat เพื่อเอา seat_type_id ไปหาราคา
        const selectedSeats = await Seat.find({ _id: { $in: seat_ids } }).populate('seat_type_id');
        
        if (selectedSeats.length !== seat_ids.length) {
             return res.status(400).json({ message: "ข้อมูลที่นั่งไม่ถูกต้อง" });
        }

        for (const seat of selectedSeats) {
            if (seat.seat_type_id) {
                totalPrice += seat.seat_type_id.price;
            } else {
                // กรณี Data ผิดพลาด (เผื่อไว้)
                totalPrice += 0; 
            }
        }

        // --- STEP 3: บันทึกลง Database ---
        const newBooking = await Booking.create({
            user_id,
            showtime_id,
            seats: seat_ids,
            total_price: totalPrice,
            status: 'confirmed' // หรือจะเป็น 'pending' ถ้ารอจ่ายเงิน
        });

        // Populate ข้อมูลกลับไปให้สวยงาม (เผื่อ Frontend จะเอาไปโชว์ใบเสร็จ)
        const populatedBooking = await Booking.findById(newBooking._id)
            .populate('showtime_id')
            .populate({
                path: 'seats',
                populate: { path: 'seat_type_id' }
            });

        res.status(201).json({
            success: true,
            message: "จองตั๋วสำเร็จ!",
            booking: populatedBooking
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการจอง" });
    }
};

// --- 3. ดูประวัติการจองของ User (My Ticket) ---
exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user_id: req.user._id })
            .populate('showtime_id') // เพื่อให้เห็นชื่อหนัง เวลาฉาย
            .populate('seats')       // เพื่อให้เห็นเลขที่นั่ง
            .sort({ createdAt: -1 }); // เรียงจากใหม่ไปเก่า

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// --- 4. ดูรายละเอียด Booking รายตัว (Booking Detail) ---
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('showtime_id')
            .populate({
                path: 'seats',
                populate: { path: 'seat_type_id' }
            });

        if (!booking) return res.status(404).json({ message: "ไม่พบข้อมูลการจอง" });

        // เช็คว่าเป็นของ User คนนี้จริงไหม (Security)
        if (booking.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
        }

        res.status(200).json(booking);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};