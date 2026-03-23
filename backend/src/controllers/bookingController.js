// controllers/bookingController.js
const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');
const Seat = require('../models/seatModel');
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
    // 🌟 2. เริ่มระบบ Transaction (มัดรวมคำสั่ง ถ้าพังให้ยกเลิกทั้งหมด)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { showtime_id, seat_ids, movie_id, cinema_id } = req.body;
        const user_id = req.user._id;

        if (!seat_ids || seat_ids.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "กรุณาเลือกที่นั่ง" });
        }

        // --- STEP 1: ตรวจสอบที่นั่งว่าง พร้อมผูกกับ Session (Lock) ---
        const existingBooking = await Booking.findOne({
            showtime_id: showtime_id,
            seats: { $in: seat_ids },
            status: { $ne: 'cancelled' },
            movie_id: movie_id,
            cinema_id: cinema_id
        }).session(session); // 👈 ล็อกไว้ใน Session

        if (existingBooking) {
            await session.abortTransaction(); // ยกเลิกการจองนี้ทันที!
            session.endSession();
            return res.status(409).json({ message: "เสียใจด้วย! ที่นั่งบางที่ถูกจองตัดหน้าไปแล้ว" });
        }

        // --- STEP 2: คำนวณราคา ---
        let totalPrice = 0;
        const selectedSeats = await Seat.find({ _id: { $in: seat_ids } }).populate('seat_type_id').session(session);

        if (selectedSeats.length !== seat_ids.length) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "ข้อมูลที่นั่งไม่ถูกต้อง" });
        }

        for (const seat of selectedSeats) {
            totalPrice += seat.seat_type_id ? seat.seat_type_id.price : 0;
        }

        const timestamp = Date.now().toString().slice(-6);
        const randomNum = Math.floor(100 + Math.random() * 900);
        const bookingNumber = `BK-${timestamp}${randomNum}`;

        // --- STEP 3: บันทึกลง Database (อยู่ใน Transaction) ---
        const [newBooking] = await Booking.create([{
            user_id,
            showtime_id,
            seats: seat_ids,
            booking_number: bookingNumber,
            total_price: totalPrice,
            status: 'confirmed',
            movie_id: movie_id,
            cinema_id: cinema_id
        }], { session }); // 👈 สร้างเอกสารผ่าน Session

        // 🌟 3. ทุกอย่างสมบูรณ์แบบ กดยืนยันการเซฟลง DB ได้!
        await session.commitTransaction();
        session.endSession();

        // --- STEP 4: Populate Data (ทำหลังจากเซฟลง DB แล้ว) ---
        const fullBooking = await Booking.findById(newBooking._id)
            .populate('user_id')
            .populate({
                path: 'showtime_id',
                populate: [
                    { path: 'movie_id' },
                    { path: 'auditorium_id', populate: { path: 'cinema_id' } }
                ]
            })
            .populate({ path: 'seats', populate: { path: 'seat_type_id' } });

        // --- STEP 5: ส่งอีเมล ---
        if (fullBooking.user_id && fullBooking.user_id.email) {
            emailService.sendBookingConfirmation(fullBooking.user_id.email, fullBooking);
        }

        res.status(201).json({
            success: true,
            message: "จองตั๋วสำเร็จ!",
            booking: fullBooking
        });

    } catch (error) {
        // 🌟 ถ้าเกิดพังกลางทาง (เน็ตหลุด, หาตัวแปรไม่เจอ) ให้ Rollback ทุกอย่างกลับสู่สภาพเดิม!
        await session.abortTransaction();
        session.endSession();
        console.error("Create Booking Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการจอง" });
    }
};

// 3. ดึงประวัติการจองของ User
exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user_id: req.user._id })
            .populate('cinema_id') // 🌟 เพิ่มบรรทัดนี้: เพื่อให้มันดึงข้อมูลของสาขามาด้วย!
            .populate('movie_id')  // 🌟 เพิ่มบรรทัดนี้เผื่อไว้ด้วย (ถ้าหน้าเว็บเรียกใช้ตรงๆ)
            .populate({
                path: 'showtime_id',
                populate: [
                    { path: 'movie_id' },
                    {
                        path: 'auditorium_id',
                        populate: { path: 'cinema_id' }
                    }
                ]
            })
            .populate({
                path: 'seats',
                populate: { path: 'seat_type_id' }
            })
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
        // 🌟 อุด IDOR: ใช้ findOne ค้นหาด้วย _id ของตั๋ว และ user_id พร้อมกันเลย!
        const booking = await Booking.findOne({ 
            _id: req.params.id, 
            user_id: req.user._id // 👈 ถ้าไอดีคนล็อกอิน ไม่ตรงกับไอดีเจ้าของตั๋ว มันจะหาไม่เจอ!
        })
            .populate({
                path: 'showtime_id',
                populate: [
                    { path: 'movie_id' },
                    { path: 'auditorium_id', populate: { path: 'cinema_id' } }
                ]
            })
            .populate({ path: 'seats', populate: { path: 'seat_type_id' } });

        // 🌟 ไม่ต้องเขียนเช็ค if ซ้ำซ้อนแล้ว ถ้ามัน null แปลว่าโดนแฮ็กเกอร์มั่ว ID หรือไม่ใช่เจ้าของ
        if (!booking) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการจอง หรือคุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
        }

        res.status(200).json(booking);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

exports.verifyTicket = async (req, res) => {
    try {
        const { bookingNumber } = req.params;

        // 1. หาข้อมูล Booking
        const booking = await Booking.findOne({ booking_number: bookingNumber })
            .populate('user_id')
            .populate({
                path: 'showtime_id',
                populate: [
                    { path: 'movie_id' },
                    {
                        path: 'auditorium_id',
                        populate: { path: 'cinema_id' }
                    }
                ]
            })
            .populate('seats');

        if (!booking) {
            return res.status(404).json({ success: false, status: 'NOT_FOUND', message: "ไม่พบข้อมูลตั๋วใบนี้ในระบบ" });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ success: false, status: 'CANCELLED', message: "ตั๋วใบนี้ถูกยกเลิกไปแล้ว" });
        }

        // 2. จัดการข้อมูลที่นั่งอย่างปลอดภัย
        const seatsArr = (booking.seats || []).map(s => s.row_label ? `${s.row_label}${s.seat_number}` : 'N/A');

        // 3. ดึงตัวแปร showtime และ movie ออกมา
        const showtime = booking.showtime_id;
        const movie = showtime?.movie_id; // 👈 ใช้ ?. ป้องกันกรณีหา showtime ไม่เจอ

        // 4. เริ่มคำนวณเวลา (ใช้ ?. ป้องกัน Error พังทลาย)
        const startTimeStr = showtime?.start_time || new Date();
        const startTime = new Date(startTimeStr);
        // 🌟 แก้ Error ที่บรรทัดนี้: ใส่ ?. หลัง movie
        const durationMin = movie?.duration_min || 120;
        const endTime = new Date(startTime.getTime() + durationMin * 60000);
        const currentTime = new Date();

        // 5. เตรียม Object ข้อมูลที่จะส่งกลับ (เขียนครั้งเดียว ใช้ได้ทั้งตั๋ว VALID และ EXPIRED)
        const bookingInfoResponse = {
            bookingNumber: booking.booking_number,
            user: booking.user_id?.username || booking.user_id?.name || booking.user_id?.first_name || 'ไม่ระบุชื่อผู้จอง',
            movieTitle: movie?.title_th || 'ไม่ระบุชื่อหนัง', // 👈 ใส่ ?. เพื่อดัก Error
            posterUrl: movie?.poster_url || '',
            cinema: showtime?.auditorium_id?.cinema_id?.name || 'ไม่ระบุสาขา', // 👈 ใส่ ?. เพื่อดัก Error
            auditorium: showtime?.auditorium_id?.name || 'ไม่ระบุโรง',
            startTime: startTime,
            endTime: endTime,
            seats: seatsArr.length > 0 ? seatsArr.join(', ') : '-',
            totalSeats: seatsArr.length || 0
        };

        // 6. กรณีหมดอายุ (เลยเวลาหนังเลิก)
        if (currentTime > endTime) {
            return res.status(200).json({
                success: true,
                status: 'EXPIRED',
                message: "ตั๋วหมดอายุ (รอบฉายสิ้นสุดแล้ว)",
                bookingInfo: bookingInfoResponse // โยน object ที่เตรียมไว้เข้ามได้เลย
            });
        }

        // 7. กรณีใช้งานได้
        return res.status(200).json({
            success: true,
            status: 'VALID',
            message: "ตั๋วสามารถใช้งานได้",
            bookingInfo: bookingInfoResponse
        });

    } catch (error) {
        console.error("Verify Ticket Error:", error);
        res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการตรวจสอบตั๋ว"
        });
    }
};