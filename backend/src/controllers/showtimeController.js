const Showtime = require('../models/showtimeModel');
const Movie = require('../models/movieModel');
const Seat = require('../models/seatModel');
const Booking = require('../models/bookingModel');
const dayjs = require('dayjs');
const crypto = require('crypto');
const systemLog = require('../utils/logger'); // 🌟 1. นำเข้า systemLog

// 1. สร้างรอบฉาย (Admin)
exports.createShowtime = async (req, res) => {
    try {
        const { movie_id, auditorium_id, start_time, base_price, language } = req.body;

        const movie = await Movie.findById(movie_id);
        if (!movie) return res.status(404).json({ message: "ไม่พบข้อมูลหนัง (Movie not found)" });

        const start = new Date(start_time);
        const duration = movie.duration_min || 120;
        const end = new Date(start.getTime() + (duration + 20) * 60000);

        const newShowtime = await Showtime.create({
            movie_id,
            auditorium_id,
            start_time: start,
            end_time: end,
            language: language || "TH",
            base_price: base_price || 160
        });

        // 📝 บันทึก Log แบบปลอดภัย (ไม่ให้กระทบการทำงานหลักถ้า Log พัง)
        if (typeof systemLog === 'function') {
            systemLog({
                level: 'INFO',
                actor: req.user || { id: 'unknown', name: 'System' }, // เผื่อ req.user เป็น undefined
                context: { action: 'create', table: 'showtimes', target_id: newShowtime._id },
                note: `สร้างรอบฉายใหม่ หนัง ID: ${movie_id}`,
                req: req
            }).catch(err => console.error("Log Error:", err));
        }

        res.status(201).json({ success: true, data: newShowtime });

    } catch (error) {
        console.error("Create Showtime Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 1.5 สร้างรอบฉายแบบกลุ่ม (Bulk Create)
exports.createBulkShowtimes = async (req, res) => {
    try {
        const { movie_id, auditorium_id, start_date, end_date, time_slots, base_price, language } = req.body;

        // 🛡️ ป้องกันบั๊ก 'length': เช็คให้ชัวร์ว่า time_slots มีค่า และเป็น Array แน่นอน
        if (!time_slots || !Array.isArray(time_slots) || time_slots.length === 0) {
            return res.status(400).json({ success: false, message: "กรุณาระบุเวลาฉาย (time_slots) ให้ถูกต้อง" });
        }

        const movie = await Movie.findById(movie_id);
        if (!movie) return res.status(404).json({ message: "ไม่พบข้อมูลหนัง" });

        const duration = movie.duration_min || 120;
        const showtimesToInsert = [];
        const batchId = crypto.randomUUID(); 

        let currentDate = dayjs(start_date);
        const lastDate = dayjs(end_date);

        while (currentDate.isBefore(lastDate) || currentDate.isSame(lastDate, 'day')) {
            for (const timeStr of time_slots) {
                const [hour, minute] = timeStr.split(':');
                const start = currentDate.hour(hour).minute(minute).second(0).toDate();
                const end = new Date(start.getTime() + (duration + 20) * 60000);

                showtimesToInsert.push({
                    movie_id,
                    auditorium_id,
                    start_time: start,
                    end_time: end,
                    language: language || "TH",
                    base_price: base_price || 160,
                    batch_id: batchId 
                });
            }
            currentDate = currentDate.add(1, 'day');
        }

        if (showtimesToInsert.length > 0) {
            await Showtime.insertMany(showtimesToInsert);

            // 📝 บันทึก Log สร้างแบบกลุ่ม
            if (typeof systemLog === 'function') {
                systemLog({
                    level: 'INFO',
                    actor: req.user || { id: 'unknown' },
                    context: { action: 'create', table: 'showtimes', target_id: batchId },
                    note: `สร้างรอบฉายแบบกลุ่มสำเร็จ ${showtimesToInsert.length} รอบ`,
                    req: req
                }).catch(err => console.error("Log Error:", err));
            }

            res.status(201).json({ 
                success: true, 
                message: `สร้างรอบฉายสำเร็จทั้งหมด ${showtimesToInsert.length} รอบ`,
                data: showtimesToInsert,
                batch_id: batchId
            });
        } else {
            res.status(400).json({ success: false, message: "ไม่มีการสร้างรอบฉาย (โปรดตรวจสอบวันที่และเวลา)" });
        }

    } catch (error) {
        console.error("Bulk Create Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. ดึงรอบฉายทั้งหมด
exports.getAllShowtimes = async (req, res) => {
    try {
        const showtimes = await Showtime.find()
            .populate('movie_id', 'title_th title_en poster_url duration_min')
            .populate({
                path: 'auditorium_id',
                select: 'name cinema_id',
                populate: { path: 'cinema_id', select: 'name' }
            })
            .sort({ start_time: -1 });

        res.status(200).json({ success: true, data: showtimes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. ลบรอบฉาย (Admin)
exports.deleteShowtime = async (req, res) => {
    try {
        const { id } = req.params;

        // 🛡️ 1. เช็คก่อนว่ารอบฉายนี้มีคนจองตั๋วไปหรือยัง?
        const hasBookings = await Booking.findOne({ showtime_id: id });
        if (hasBookings) {
            return res.status(400).json({ 
                success: false, 
                message: "ไม่สามารถยกเลิกรอบฉายได้ เนื่องจากมีลูกค้าจองตั๋วแล้ว กรุณาจัดการคืนเงินก่อน" 
            });
        }

        // 🌟 2. เปลี่ยนจากการลบทิ้ง เป็นการอัปเดตสถานะ (Soft Delete)
        const cancelledShowtime = await Showtime.findByIdAndUpdate(
            id, 
            { status: 'cancelled' }, 
            { new: true }
        );

        if (!cancelledShowtime) {
            return res.status(404).json({ success: false, message: "ไม่พบรอบฉายที่ต้องการยกเลิก" });
        }

        // 📝 บันทึก Log การยกเลิก
        if (typeof systemLog === 'function') {
            systemLog({
                level: 'WARN',
                actor: req.user || { id: 'unknown' },
                context: { action: 'cancel', table: 'showtimes', target_id: id },
                note: `ยกเลิกรอบฉาย ID: ${id}`,
                req: req
            }).catch(err => console.error("Log Error:", err));
        }

        res.status(200).json({ success: true, message: "ยกเลิกรอบฉายเรียบร้อยแล้ว" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. ดึงรอบฉาย "ตามหนัง"
exports.getShowtimesByMovie = async (req, res) => {
    try {
        const { movieId } = req.params;
        
        // 🌟 ดึงเฉพาะรอบที่สถานะเป็น 'active' เท่านั้น (ซ่อน cancelled จากสายตาลูกค้า)
        const showtimes = await Showtime.find({ 
            movie_id: movieId, 
            status: { $ne: 'cancelled' } // 👈 เปลี่ยนเป็นแบบนี้: ดึงทุกอย่างที่ไม่ได้ถูกยกเลิก
        })
            .populate('auditorium_id')
            .sort({ start_time: 1 });

        res.status(200).json({ success: true, data: showtimes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. ดึงข้อมูลรอบฉายเดี่ยวๆ
exports.getShowtimeById = async (req, res) => {
    try {
        const showtime = await Showtime.findById(req.params.id)
            .populate('movie_id')
            .populate({
                path: 'auditorium_id',
                populate: { path: 'cinema_id' }
            });

        if (!showtime) return res.status(404).json({ message: "Showtime not found" });

        res.status(200).json({ success: true, data: showtime });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. ดึงที่นั่ง
exports.getShowtimeSeats = async (req, res) => {
    try {
        const { id } = req.params;
        const showtime = await Showtime.findById(id);
        if (!showtime) return res.status(404).json({ message: "Showtime not found" });

        const seats = await Seat.find({ auditorium_id: showtime.auditorium_id })
            .populate('seat_type_id')
            .sort({ row_label: 1, seat_number: 1 });

        res.status(200).json({ success: true, data: seats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 7. ลบรอบฉายแบบกลุ่ม (Delete Batch)
exports.deleteMultipleShowtimes = async (req, res) => {
    try {
        const { ids } = req.body; 

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "กรุณาระบุรายการที่ต้องการลบให้ถูกต้อง" });
        }

        // 🛡️ เช็คว่าในกลุ่มนี้ มีรอบไหนโดนจองไปแล้วบ้างไหม
        const hasBookings = await Booking.findOne({ showtime_id: { $in: ids } });
        if (hasBookings) {
            return res.status(400).json({ 
                success: false, 
                message: "บางรอบฉายมีการจองตั๋วแล้ว ไม่สามารถยกเลิกแบบกลุ่มได้ โปรดตรวจสอบทีละรายการ" 
            });
        }

        // 🌟 อัปเดตสถานะเป็น cancelled แทนการลบ 
        // (ใช้ modifiedCount แทน deletedCount เพราะเราใช้ updateMany)
        const result = await Showtime.updateMany(
            { _id: { $in: ids } },
            { $set: { status: 'cancelled' } }
        );

        if (typeof systemLog === 'function') {
            systemLog({
                level: 'WARN',
                actor: req.user || { id: 'unknown' },
                context: { action: 'cancel_bulk', table: 'showtimes' },
                note: `ยกเลิกรอบฉายแบบกลุ่มจำนวน ${result.modifiedCount} รายการ`,
                req: req
            }).catch(err => console.error("Log Error:", err));
        }

        res.status(200).json({ 
            success: true, 
            message: `ยกเลิกเรียบร้อย ${result.modifiedCount} รายการ` 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ใน showtimeController.js (เพิ่มฟังก์ชันนี้เข้าไป)
exports.deleteShowtimesByBatch = async (req, res) => {
    try {
        const { batchId } = req.params;

        // 🛡️ เช็คคนจองตั๋วใน Batch นี้
        const hasBookings = await Booking.findOne({ 
            showtime_id: { $in: await Showtime.find({ batch_id: batchId }).distinct('_id') } 
        });
        
        if (hasBookings) {
            return res.status(400).json({ 
                success: false, 
                message: "บางรอบฉายในกลุ่มนี้มีการจองตั๋วแล้ว ไม่สามารถยกเลิกทั้งกลุ่มได้" 
            });
        }

        // 🌟 เปลี่ยนสถานะเป็น cancelled
        const result = await Showtime.updateMany(
            { batch_id: batchId },
            { $set: { status: 'cancelled' } }
        ); 

        res.status(200).json({ 
            success: true, 
            message: `ยกเลิกรอบฉายกลุ่มนี้เรียบร้อย ${result.modifiedCount} รายการ` 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};