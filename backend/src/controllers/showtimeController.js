const Showtime = require('../models/showtimeModel');
const Movie = require('../models/movieModel');
const Seat = require('../models/seatModel');

exports.createShowtime = async (req, res) => {
    try {
        const { movie_id, auditorium_id, start_time, base_price, language } = req.body;
        const movie = await Movie.findById(movie_id);
        if (!movie) return res.status(404).json({ message: "Movie not found" });

        const start = new Date(start_time);
        const end = new Date(start.getTime() + (movie.duration_min + 20) * 60000); 

        const conflict = await Showtime.findOne({
            auditorium_id,
            $or: [
                { start_time: { $lt: end, $gte: start } },
                { end_time: { $gt: start, $lte: end } },
                { start_time: { $lte: start }, end_time: { $gte: end } }
            ]
        });

        if (conflict) return res.status(400).json({ message: "เวลานี้มีการใช้โรงฉายไปแล้ว (Time Overlap)" });

        const newShowtime = await Showtime.create({
            movie_id, auditorium_id, start_time: start, end_time: end,
            language: language || "TH", base_price
        });

        // ✅ บันทึก Log เมื่อสร้าง (ข้อ 1-8 ครบถ้วน)
        await saveLog({
            req, 
            action: 'create',               // 3. ทำอะไร
            table: 'Showtime',              // 4. ทำกับ table ไหน
            targetId: newShowtime._id,       // 5. ID ของข้อมูล
            newVal: { 
                movie: movie.title_th, 
                start: start.toLocaleString('th-TH'), 
                price: base_price 
            },                              // 6. อะไรเปลี่ยนไป (เก็บค่าใหม่)
            note: `เพิ่มรอบฉายใหม่เรื่อง ${movie.title_th}` // 8. หมายเหตุ
        });

        res.status(201).json({ success: true, data: newShowtime });
    } catch (error) { 
        console.error("Create Showtime Error:", error);
        res.status(500).json({ message: error.message }); 
    }
};

exports.getShowtimesByMovie = async (req, res) => {
    try {
        const { movieId } = req.params;
        const showtimes = await Showtime.find({ movie_id: movieId }).populate('auditorium_id').sort({ start_time: 1 });
        res.status(200).json({ success: true, data: showtimes });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getShowtimeById = async (req, res) => {
    try {
        const showtime = await Showtime.findById(req.params.id).populate('movie_id').populate('auditorium_id');
        if (!showtime) return res.status(404).json({ message: "Showtime not found" });
        res.status(200).json({ success: true, data: showtime });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getAllShowtimes = async (req, res) => {
    try {
        const showtimes = await Showtime.find()
            .populate('movie_id', 'title_th title_en poster duration_min') // แก้ให้ตรงกับโครงสร้าง Populate ของคุณ
            .populate({ path: 'auditorium_id', select: 'name cinema_id', populate: { path: 'cinema_id', select: 'name' } })
            .sort({ start_time: -1 });
        res.status(200).json({ success: true, data: showtimes });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getShowtimeSeats = async (req, res) => {
    try {
        const { id } = req.params;
        const showtime = await Showtime.findById(id);
        if (!showtime) return res.status(404).json({ message: "Showtime not found" });
        const seats = await Seat.find({ auditorium_id: showtime.auditorium_id }).populate('seat_type_id').sort({ row_label: 1, seat_number: 1 }); 
        res.status(200).json({ success: true, data: seats });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteShowtime = async (req, res) => {
    try {
        const { id } = req.params;
        // ✅ ดึงข้อมูลไว้ก่อนลบเพื่อเก็บค่า Old Value
        const target = await Showtime.findById(id).populate('movie_id', 'title_th');
        
        const result = await Showtime.findByIdAndDelete(id); 
        
        if (!result) return res.status(404).json({ success: false, message: "ไม่พบรหัสนี้ในระบบ" });

        // ✅ บันทึก Log เมื่อลบ (ข้อ 1-8 ครบถ้วน)
        await saveLog({
            req, 
            action: 'delete',               // 3. ทำอะไร
            table: 'Showtime',              // 4. ทำกับ table ไหน
            targetId: id,                    // 5. ID ของข้อมูล
            oldVal: { 
                movie: target?.movie_id?.title_th || "N/A", 
                time: target?.start_time 
            },                              // 6. อะไรเปลี่ยนไป (เก็บค่าเดิมก่อนหายไป)
            note: `ลบรอบฉายเรื่อง ${target?.movie_id?.title_th || id}` // 8. หมายเหตุ
        });
        
        res.status(200).json({ success: true, message: "ลบเรียบร้อย" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};