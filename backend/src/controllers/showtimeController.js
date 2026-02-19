const Showtime = require('../models/showtimeModel');
const Movie = require('../models/movieModel');
const Seat = require('../models/seatModel');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid'); // <--- เพิ่มบรรทัดนี้

// 1. สร้างรอบฉาย (Admin)
exports.createShowtime = async (req, res) => {
    try {
        const { movie_id, auditorium_id, start_time, base_price, language } = req.body;

        // 1. ไปหาข้อมูลหนังก่อน เพื่อเอาความยาว (duration_min)
        const movie = await Movie.findById(movie_id);
        if (!movie) return res.status(404).json({ message: "ไม่พบข้อมูลหนัง (Movie not found)" });

        // 2. คำนวณเวลาจบ (End Time) ** จุดสำคัญ **
        const start = new Date(start_time);
        const duration = movie.duration_min || 120; // ถ้าไม่มีความยาว ให้ Default 2 ชม.
        // เวลาจบ = เวลาเริ่ม + (นาทีหนัง + พักโรง 20 นาที)
        const end = new Date(start.getTime() + (duration + 20) * 60000);

        // 3. (Optional) เช็คเวลาชนกันที่นี่...

        // 4. สร้าง Object และยัด end_time เข้าไปให้ครบตาม Model
        const newShowtime = await Showtime.create({
            movie_id,
            auditorium_id,
            start_time: start,
            end_time: end,      // ✅ ใส่ให้แล้ว Model จะไม่ด่า
            language: language || "TH",
            base_price: base_price || 160
        });

        res.status(201).json({ success: true, data: newShowtime });

    } catch (error) {
        console.error("Create Showtime Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 1.5 สร้างรอบฉายแบบกลุ่ม (Bulk Create) - 🌟 ฟีเจอร์ใหม่
exports.createBulkShowtimes = async (req, res) => {
    try {
        // รับค่าช่วงเวลา และรอบเวลาที่เป็น Array เช่น ["10:30", "14:00", "18:00"]
        const { movie_id, auditorium_id, start_date, end_date, time_slots, base_price, language } = req.body;

        // 1. ตรวจสอบข้อมูลหนังเพื่อเอา Duration
        const movie = await Movie.findById(movie_id);
        if (!movie) return res.status(404).json({ message: "ไม่พบข้อมูลหนัง" });

        const duration = movie.duration_min || 120; // Default 2 ชม.
        const showtimesToInsert = [];
        const batchId = uuidv4(); // สร้างรหัสกลุ่ม (Batch ID) เพื่อให้รู้ว่าชุดนี้สร้างมาพร้อมกัน

        // 2. แปลงวันที่เริ่มต้นและสิ้นสุด
        let currentDate = dayjs(start_date);
        const lastDate = dayjs(end_date);

        // 3. วนลูป: ตั้งแต่วันแรก จนถึงวันสุดท้าย
        while (currentDate.isBefore(lastDate) || currentDate.isSame(lastDate, 'day')) {
            
            // 4. วนลูป: ตามเวลาที่เลือกในแต่ละวัน (Time Slots)
            for (const timeStr of time_slots) {
                // timeStr format = "HH:mm" เช่น "14:30"
                const [hour, minute] = timeStr.split(':');

                // สร้าง start_time โดยเอา วันที่ปัจจุบัน + เวลาจาก timeStr
                const start = currentDate.hour(hour).minute(minute).second(0).toDate();

                // คำนวณ end_time
                const end = new Date(start.getTime() + (duration + 20) * 60000); // หนัง + พัก 20 นาที

                // สร้าง Object เตรียมบันทึก
                showtimesToInsert.push({
                    movie_id,
                    auditorium_id,
                    start_time: start,
                    end_time: end,
                    language: language || "TH",
                    base_price: base_price || 160,
                    batch_id: batchId // ✅ เก็บ Batch ID ไว้เผื่อลบยกแก๊ง
                });
            }

            // ขยับไปวันถัดไป
            currentDate = currentDate.add(1, 'day');
        }

        // 5. บันทึกข้อมูลทั้งหมดลง Database ทีเดียว (ประสิทธิภาพสูงกว่าวน create ทีละรอบ)
        if (showtimesToInsert.length > 0) {
            await Showtime.insertMany(showtimesToInsert);
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

// 2. ดึงรอบฉายทั้งหมด (สำหรับตาราง Admin)
exports.getAllShowtimes = async (req, res) => {
    try {
        const showtimes = await Showtime.find()
            .populate('movie_id', 'title_th title_en poster_url duration_min') // ดึงข้อมูลหนัง
            .populate({
                path: 'auditorium_id',
                select: 'name cinema_id',
                populate: {
                    path: 'cinema_id',
                    select: 'name' // ดึงชื่อสาขา
                }
            })
            .sort({ start_time: -1 }); // เรียงจากใหม่ไปเก่า

        res.status(200).json({ success: true, data: showtimes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. ลบรอบฉาย (Admin) - ✅ เพิ่มส่วนนี้เพื่อให้ปุ่มถังขยะทำงาน
exports.deleteShowtime = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedShowtime = await Showtime.findByIdAndDelete(id);

        if (!deletedShowtime) {
            return res.status(404).json({ success: false, message: "ไม่พบรอบฉายที่ต้องการลบ" });
        }

        res.status(200).json({ success: true, message: "ลบรอบฉายเรียบร้อยแล้ว" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. ดึงรอบฉาย "ตามหนัง" (สำหรับหน้า Movie Details ของ User)
exports.getShowtimesByMovie = async (req, res) => {
    try {
        const { movieId } = req.params;
        
        // ✅ แก้ไข: ลบเงื่อนไข start_time ออก เพื่อให้ดึงรอบฉายทั้งหมด (รวมรอบที่ผ่านไปแล้วด้วย)
        const showtimes = await Showtime.find({ 
            movie_id: movieId 
            // start_time: { $gte: new Date() } // <-- Comment บรรทัดนี้ทิ้งไปก่อนครับ
        })
            .populate('auditorium_id')
            .sort({ start_time: 1 });

        res.status(200).json({ success: true, data: showtimes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. ดึงข้อมูลรอบฉายเดี่ยวๆ (สำหรับหน้า Booking)
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

// 6. ดึงที่นั่ง (ถ้ามี Logic แยก)
exports.getShowtimeSeats = async (req, res) => {
    try {
        const { id } = req.params;
        const showtime = await Showtime.findById(id);
        if (!showtime) return res.status(404).json({ message: "Showtime not found" });

        // ✅ แก้ตรงนี้: เพิ่ม .populate('seat_type_id')
        const seats = await Seat.find({ auditorium_id: showtime.auditorium_id })
            .populate('seat_type_id') // <--- หัวใจสำคัญ! ต้องดึงข้อมูลประเภทที่นั่ง (และราคา) มาด้วย
            .sort({ row_label: 1, seat_number: 1 });

        res.status(200).json({ success: true, data: seats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 7. ลบรอบฉายแบบกลุ่ม (Delete Batch)
exports.deleteMultipleShowtimes = async (req, res) => {
    try {
        const { ids } = req.body; // รับ Array ของ _id เช่น ["id1", "id2", "id3"]

        if (!ids || ids.length === 0) {
            return res.status(400).json({ success: false, message: "กรุณาระบุรายการที่ต้องการลบ" });
        }

        // คำสั่ง deleteMany โดยเช็คว่า _id อยู่ใน list ที่ส่งมาไหม ($in)
        const result = await Showtime.deleteMany({ _id: { $in: ids } });

        res.status(200).json({ 
            success: true, 
            message: `ลบเรียบร้อย ${result.deletedCount} รายการ` 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};