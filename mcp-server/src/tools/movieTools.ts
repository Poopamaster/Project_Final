// src/tools/movieTools.ts
import mongoose from "mongoose";
import { z } from "zod";
import { MovieModel } from "../models/movie.js";
import { connectDB } from "../db.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import AuditoriumModel from "../models/auditoriumModel.js";
import ShowtimeModel from "../models/showtimeModel.js";
import CinemaModel from "../models/cinemaModel.js";
import SeatModel from "../models/seatModel.js";
import SeatTypeModel from "../models/seatTypeModel.js";
import BookingModel from "../models/bookingModel.js";
const { sendBookingConfirmation } = require('../../../backend/src/services/emailService');
import User from '../models/userModel.js';

import omise from 'omise';
const omiseClient = (omise as any)({
    secretKey: process.env.OMISE_SECRET_KEY as string,
    publicKey: process.env.OMISE_PUBLIC_KEY as string
});

// Helper ฟังก์ชันสำหรับส่งข้อมูลแบบ Visual ไปให้ Frontend
const sendVisual = (text: string, type: string, data: any) => {
    const payload = { type, data };
    return {
        content: [{ type: "text", text: `${text}::VISUAL::${JSON.stringify(payload)}` }]
    };
};

export const movieTools = [
    // 🎬 1. ค้นหาหนัง (อัปเดตให้รองรับหมวดหมู่ภาษาไทยแบบยืดหยุ่น)
    {
        name: "search_movie",
        description: "ค้นหาภาพยนตร์ในฐานข้อมูลจากชื่อเรื่อง หมวดหมู่(เช่น การ์ตูน ผี แอคชั่น) หรือดึงรายชื่อหนังทั้งหมดเมื่อผู้ใช้ขอดูหนังเข้าใหม่",
        args: {
            keyword: z.string().optional().describe("ชื่อหนังหรือหมวดหมู่ที่ต้องการค้นหา")
        },
        handler: async ({ keyword }: { keyword?: string }) => {
            await connectDB();
            const now = new Date();
            let query: any = {
                start_date: { $lte: now },
                due_date: { $gte: now }
            };

            if (keyword && keyword.trim() !== "") {
                let searchKeyword = keyword.trim();
                const kw = searchKeyword.toLowerCase();

                // ดักจับคำที่แปลว่า "ขอดูหนังทั้งหมด"
                const isRequestingAll = kw.includes("หนังเข้าใหม่") ||
                    kw.includes("แนะนำ") ||
                    kw.includes("ทั้งหมด") ||
                    kw.includes("กำลังฉาย") ||
                    kw.includes("มีหนังอะไร") ||
                    kw.includes("ทุกเรื่อง") ||  // 👈 เพิ่มคำนี้เข้าไปดัก AI!
                    kw === "";

                if (!isRequestingAll) {
                    // ถ้าไม่ใช่การขอดูทั้งหมด ค่อยทำ Mapping หมวดหมู่ปกติ
                    let mappedGenre = searchKeyword;
                    if (kw.includes("การ์ตูน") || kw.includes("animation")) mappedGenre = "Animation";
                    else if (kw.includes("ผี") || kw.includes("สยองขวัญ") || kw.includes("horror")) mappedGenre = "Horror";
                    else if (kw.includes("ตลก") || kw.includes("comedy")) mappedGenre = "Comedy";
                    else if (kw.includes("บู๊") || kw.includes("แอคชั่น") || kw.includes("action")) mappedGenre = "Action";
                    else if (kw.includes("รัก") || kw.includes("โรแมนติก") || kw.includes("romance")) mappedGenre = "Romance";
                    else if (kw.includes("ไซไฟ") || kw.includes("sci-fi")) mappedGenre = "Sci-Fi";

                    // ค้นหาจากชื่อไทย, ชื่ออังกฤษ หรือ หมวดหมู่
                    query.$or = [
                        { title_th: { $regex: searchKeyword, $options: "i" } },
                        { title_en: { $regex: searchKeyword, $options: "i" } },
                        { genre: { $regex: mappedGenre, $options: "i" } }
                    ];
                } else {
                    // 🚨 จุดที่แก้: ล้างค่า keyword ทิ้งไปเลย เวลามันเด้ง Error จะได้พูดว่า "ตอนนี้ยังไม่มีภาพยนตร์เข้าใหม่..." แทน
                    keyword = "";
                }
            }

            const movies = await MovieModel.find(query).sort({ start_date: -1 }).limit(10);

            if (movies.length === 0) {
                const errorMsg = keyword ? `ขออภัยครับ ไม่พบภาพยนตร์ในหมวดหมู่หรือชื่อเรื่อง "${keyword}" ในขณะนี้ครับ 😢` : `ตอนนี้ยังไม่มีภาพยนตร์เข้าใหม่ที่เปิดให้จองครับ 😢`;
                return { content: [{ type: "text", text: errorMsg }] };
            }

            const colors = ["linear-gradient(135deg, #f97316, #b45309)", "linear-gradient(135deg, #22c55e, #047857)", "linear-gradient(135deg, #64748b, #1e293b)", "linear-gradient(135deg, #a855f7, #7e22ce)"];

            const enrichedMovies = movies.map((m: any, index: number) => ({
                ...m.toObject(),
                color: colors[index % colors.length],
                rating: (4.0 + Math.random()).toFixed(1),
                price: 160
            }));

            // เช็คอีกรอบเพื่อการตอบกลับที่เนียนขึ้น
            const isAllMovies = !query.$or;
            const replyMessage = isAllMovies
                ? `นี่คือภาพยนตร์ที่กำลังเข้าฉายในตอนนี้ครับ เลือกชมได้เลยครับ 🍿`
                : `เจอภาพยนตร์เกี่ยวกับ "${keyword}" ที่กำลังฉายอยู่ตามนี้ครับ 🍿`;

            return sendVisual(replyMessage, "MOVIE_CAROUSEL", enrichedMovies);
        }
    },

    // 🏢 2. ดึงรายชื่อสาขา
    {
        name: "get_branches",
        description: "ดึงรายชื่อสาขาโรงภาพยนตร์ทั้งหมด 🚨 สำคัญมาก: ผลลัพธ์จาก Tool นี้จะมีโครงสร้าง ::VISUAL:: อยู่ คุณต้อง Copy ข้อความที่ได้จาก Tool นี้ไปตอบกลับผู้ใช้แบบ 100% ห้ามสรุปความ ห้ามตัดทอนข้อความ และห้ามพิมพ์รายชื่อสาขาออกมาเป็นข้อความธรรมดาเด็ดขาด",
        args: {},
        handler: async () => {
            console.error(`\n========================================`);
            console.error(`[TOOL: get_branches] AI กำลังดึงรายชื่อสาขา...`);
            console.error(`========================================\n`);

            await connectDB();

            try {
                const branches = await CinemaModel.find();

                if (!branches || branches.length === 0) {
                    return { content: [{ type: "text", text: `ขออภัยครับ ตอนนี้ยังไม่มีสาขาในระบบเลยครับ 😥` }] };
                }

                const formattedBranches = branches.map(b => ({
                    _id: b._id.toString(),
                    id: b._id.toString(),
                    name: b.name,
                    province: b.province
                }));

                return sendVisual(
                    `นี่คือสาขาโรงภาพยนตร์ทั้งหมดของเราครับ เลือกสาขาที่ต้องการได้เลยครับ 👇`,
                    "BRANCH_LIST",
                    { branches: formattedBranches }
                );

            } catch (error: any) {
                console.error("\n❌ [get_branches] Error:", error.message);
                return { content: [{ type: "text", text: `เกิดข้อผิดพลาดในการดึงข้อมูลสาขาครับ` }] };
            }
        }
    },

    {
        name: "get_available_dates",
        description: "ดึงวันที่ทั้งหมดที่มีรอบฉาย สำหรับหนังและสาขาที่ผู้ใช้เลือก เพื่อส่งเป็นปุ่มเลือกวันให้ผู้ใช้",
        args: {
            movieId: z.string().describe("รหัสภาพยนตร์"),
            movieName: z.string().describe("ชื่อภาพยนตร์"),
            branchId: z.string().describe("รหัสสาขา (ต้องรับจากผู้ใช้เท่านั้น)")
        },
        handler: async ({ movieId, movieName, branchId }: any) => {
            await connectDB();
            try {
                // 1. ตรวจสอบความถูกต้องของ ID เหมือนใน get_showtimes
                const movieObjectId = new mongoose.Types.ObjectId(movieId);
                const branchObjectId = new mongoose.Types.ObjectId(branchId);

                // 2. หาโรงหนังทั้งหมดในสาขานี้
                const auditoriums = await AuditoriumModel.find({ cinema_id: branchObjectId })
                    .setOptions({ strictPopulate: false });
                const auditoriumIds = auditoriums.map(a => a._id);

                if (auditoriumIds.length === 0) {
                    return { content: [{ type: "text", text: `ไม่พบข้อมูลโรงภาพยนตร์ในสาขานี้ครับ` }] };
                }

                // 3. หาวันที่ปัจจุบัน (เอาเวลา 00:00:00 เพื่อรวมรอบฉายของวันนี้ทั้งหมด)
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // 4. ดึงรอบฉายทั้งหมดตั้งแต่วันนี้เป็นต้นไป
                const showtimes = await ShowtimeModel.find({
                    movie_id: movieObjectId,
                    auditorium_id: { $in: auditoriumIds },
                    start_time: { $gte: today }
                }).select('start_time'); // ดึงมาแค่เวลาเพื่อประหยัดทรัพยากร

                if (showtimes.length === 0) {
                    return { content: [{ type: "text", text: `ขออภัยครับ ตอนนี้ยังไม่มีรอบฉายสำหรับเรื่อง ${movieName} ในสาขานี้เลยครับ 😥` }] };
                }

                // 5. สกัดเอาเฉพาะ "วันที่" แบบไม่ซ้ำกัน (Format: YYYY-MM-DD โซนไทย)
                const uniqueDates = [...new Set(showtimes.map((st: any) => {
                    const d = new Date(st.start_time);

                    // ✨ วิธีที่ปลอดภัยที่สุด: แปลงตามโซนเวลา Asia/Bangkok
                    const formatter = new Intl.DateTimeFormat('en-CA', {
                        timeZone: 'Asia/Bangkok',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });

                    return formatter.format(d); // จะได้ออกมาเป็น "2024-03-18" เป๊ะๆ
                }))].sort(); // เรียงจากวันที่น้อยไปมาก

                // 6. ส่งเป็น Visual ออกไป
                return sendVisual(`กรุณาเลือกวันที่ต้องการชมภาพยนตร์เรื่อง ${movieName} ได้เลยครับ 📅`, "DATE_SELECTOR", {
                    movieId,
                    movieName,
                    branchId,
                    availableDates: uniqueDates // ส่ง Array ของวันที่ไปให้ Frontend สร้างปุ่ม
                });

            } catch (error: any) {
                console.error("❌ Error in get_available_dates:", error);
                return { content: [{ type: "text", text: `เกิดข้อผิดพลาดในการดึงข้อมูลวันที่: ${error.message}` }] };
            }
        }
    },

    // 🕒 3. เลือกรอบฉาย
    {
        name: "get_showtimes",
        description: "ค้นหารอบฉายภาพยนตร์ 🚨 คำเตือน: ห้ามเรียกใช้เครื่องมือนี้เด็ดขาด หากยังไม่ได้รับ ID สาขา (branchId) จากผู้ใช้! หากยังไม่มีสาขาให้เรียก get_branches แทน ห้ามเดาเองเด็ดขาด!",
        args: {
            movieId: z.string().describe("รหัสภาพยนตร์"),
            movieName: z.string().describe("ชื่อภาพยนตร์"),
            branchId: z.string().describe("รหัสสาขา (ต้องเป็น ID ที่ผู้ใช้เลือกจากหน้าจอเท่านั้น ห้ามเดาหรือสร้างขึ้นมาเอง)"),
            date: z.string().describe("วันที่ YYYY-MM-DD")
        },
        handler: async ({ movieId, movieName, branchId, date }: any) => {
            await connectDB();

            try {
                // 🔥 1. Guard: ตรวจสอบความถูกต้องของ ID เพื่อกัน AI มโน
                if (!mongoose.Types.ObjectId.isValid(branchId) || !mongoose.Types.ObjectId.isValid(movieId)) {
                    console.error("🚨 AI มโน ID มา:", { branchId, movieId });
                    return { content: [{ type: "text", text: "🚨 ระบบแจ้งเตือน AI: ข้อมูล ID ไม่ถูกต้อง กรุณาหยุดและเรียกใช้ 'get_branches' เพื่อให้ผู้ใช้เลือกสาขาก่อน!" }] };
                }

                const movieObjectId = new mongoose.Types.ObjectId(movieId);
                const branchObjectId = new mongoose.Types.ObjectId(branchId);

                // 🔥 2. Guard: เช็คว่ามีสาขานี้จริงไหม
                const cinemaExists = await CinemaModel.findById(branchObjectId);
                if (!cinemaExists) {
                    return { content: [{ type: "text", text: "🚨 ระบบแจ้งเตือน AI: ไม่พบ ID สาขานี้ในระบบ กรุณาเรียกใช้ 'get_branches' เพื่อดึงข้อมูลจริง!" }] };
                }

                const startOfDay = new Date(date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);

                // 🔥 3. ค้นหาโรงหนังที่สังกัดสาขานี้ (เพิ่ม strictPopulate: false เพื่อแก้ Error ที่คุณเจอ)
                const auditoriums = await AuditoriumModel.find({ cinema_id: branchObjectId })
                    .setOptions({ strictPopulate: false });

                const auditoriumIds = auditoriums.map(a => a._id);

                if (auditoriumIds.length === 0) {
                    return { content: [{ type: "text", text: `ไม่พบข้อมูลโรงภาพยนตร์ในสาขา ${cinemaExists.name} กรุณาตรวจสอบการผูกข้อมูลใน Database` }] };
                }


                // 🔥 4. ค้นหารอบฉายและดึงข้อมูลโรงหนังพ่วงมาด้วย
                const showtimes = await ShowtimeModel.find({
                    movie_id: movieObjectId,
                    auditorium_id: { $in: auditoriumIds },
                    start_time: { $gte: startOfDay, $lte: endOfDay }
                }).populate({
                    path: 'auditorium_id',
                    options: { strictPopulate: false }
                }).sort({ start_time: 1 });

                if (!showtimes || showtimes.length === 0) {
                    return sendVisual(`ไม่พบรอบฉายของเรื่อง ${movieName} ในวันที่เลือกครับ`, "SHOWTIME_SELECTOR", { movieName, date, showtimes: [] });
                }

                const formatted = showtimes.map((st: any) => ({
                    showtimeId: st._id.toString(),
                    time: new Date(st.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    language: st.language,
                    auditorium: st.auditorium_id?.name || "โรงปกติ"
                }));

                return sendVisual(`พบรอบฉาย ${movieName} ที่สาขา ${cinemaExists.name} ดังนี้ครับ`, "SHOWTIME_SELECTOR", { movieName, date, showtimes: formatted });

            } catch (error: any) {
                console.error("❌ Error in get_showtimes:", error);
                return { content: [{ type: "text", text: `เกิดข้อผิดพลาดเทคนิค: ${error.message}` }] };
            }
        }
    },

    // 💺 4. เลือกที่นั่ง
    {
        name: "select_seat",
        description: "แสดงผังที่นั่งให้ผู้ใช้เลือกหลังจากเลือกรอบฉายแล้ว",
        args: {
            showtimeId: z.string().describe("ID ของรอบฉายที่ผู้ใช้เลือก"),
            movieName: z.string(),
            time: z.string(),
            date: z.string().optional()
        },
        handler: async ({ showtimeId, movieName, time, date }: any) => {
            console.error(`\n--- 🕵️ DEBUG เริ่มค้นหาที่นั่ง ---`);
            try {
                await connectDB();

                // ✨ 1. ใส่ Guard ป้องกัน ID ปลอม/ข้อมูล Mock ทำให้ระบบพัง
                if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
                    console.error(`🚨 ตรวจพบ ID ไม่ถูกต้อง: ${showtimeId}`);
                    return {
                        content: [{
                            type: "text",
                            text: `ขออภัยครับ รหัสรอบฉายไม่ถูกต้อง (${showtimeId}) น่าจะเป็นข้อมูลจำลอง รบกวนกดเลือกรอบฉายจากปุ่มด้านบนใหม่อีกครั้งนะครับ 😅`
                        }]
                    };
                }

                const showtime = await ShowtimeModel.findById(showtimeId);
                if (!showtime) {
                    return { content: [{ type: "text", text: "ไม่พบข้อมูลรอบฉายครับ" }] };
                }

                const audId = (showtime as any)?.auditorium_id?._id
                    ? (showtime as any).auditorium_id._id.toString()
                    : showtime.auditorium_id.toString();

                console.error(`1. เลือกรอบฉาย ID: ${showtimeId}`);
                console.error(`2. โรงหนังที่ฉาย ID: ${audId}`);

                let seats = await SeatModel.find({ auditorium_id: audId as any }).populate({
                    path: 'seat_type_id',
                    model: SeatTypeModel
                });

                if (seats.length === 0) {
                    console.error(`⚠️ ไม่พบที่นั่งด้วย String ID... ลองค้นหาด้วย ObjectId ล้วนๆ`);
                    const objectId = new mongoose.Types.ObjectId(audId);
                    seats = await SeatModel.find({ auditorium_id: objectId as any }).populate({
                        path: 'seat_type_id',
                        model: SeatTypeModel
                    });
                }

                console.error(`3. สรุปเจอที่นั่งทั้งหมด: ${seats.length} ตัว`);
                console.error(`--------------------------------\n`);

                if (seats.length === 0) {
                    return {
                        content: [{
                            type: "text",
                            text: `พบปัญหา: ในฐานข้อมูลไม่พบเก้าอี้ที่ถูกผูกไว้กับโรงหนัง ID ${audId} เลยครับ รบกวนตรวจสอบว่ารอบฉายนี้ผูกกับโรงหนังถูกโรงหรือไม่`
                        }]
                    };
                }

                // ✨ 2. เติม as any ตรงนี้ ป้องกัน TypeScript build error 
                const bookings = await BookingModel.find({
                    showtime_id: showtimeId,
                    status: { $ne: 'cancelled' }
                } as any);

                const bookedSeatIds = bookings.flatMap((b: any) => (b.seats || []).map((s: any) => s.toString()));

                const formattedSeats = seats.map((s: any) => {
                    const seatTypeName = s.seat_type_id?.name || 'Normal';
                    const seatTypePrice = Number(s.seat_type_id?.price || 0);

                    return {
                        id: s._id.toString(),
                        label: `${s.row_label}${s.seat_number}`,
                        row: s.row_label,
                        col: s.seat_number,
                        type: seatTypeName,
                        price: seatTypePrice,
                        isBooked: bookedSeatIds.includes(s._id.toString()) || s.is_blocked === true
                    };
                });

                const groupedRows = formattedSeats.reduce((acc: any, seat: any) => {
                    if (!acc[seat.row]) acc[seat.row] = [];
                    acc[seat.row].push(seat);
                    return acc;
                }, {});

                const rowLabels = Object.keys(groupedRows).sort();
                const seatTypesSummary = Array.from(
                    new Map(
                        formattedSeats.map((seat: any) => [seat.type, { name: seat.type, price: seat.price }])
                    ).values()
                ).sort((a: any, b: any) => a.price - b.price);

                return sendVisual(
                    `เชิญเลือกที่นั่งสำหรับเรื่อง ${movieName} รอบ ${time} ได้เลยครับ`,
                    "SEAT_PICKER",
                    {
                        showtimeId,
                        movieName,
                        time,
                        date,
                        seatsData: formattedSeats,
                        layout: {
                            rowLabels,
                            totalColumns: Math.max(...rowLabels.map((row) => groupedRows[row].length), 0)
                        },
                        pricing: seatTypesSummary
                    }
                );
            } catch (error: any) {
                console.error("❌ Error in select_seat:", error);
                return { content: [{ type: "text", text: `เกิดข้อผิดพลาดในการโหลดที่นั่ง: ${error.message}` }] };
            }
        }
    },

    // 🎟️ 5. สรุปการจอง (ปรับปรุงความปลอดภัยและการเช็คที่นั่งซ้ำ)
    {
        name: "confirm_booking",
        description: "สรุปการจองและส่งข้อมูลไปให้ระบบ Payment ของ Frontend จัดการชำระเงิน",
        args: {
            userId: z.string().describe("User ID ปัจจุบันของผู้ใช้"),
            showtimeId: z.string().describe("ID ของรอบฉาย"),
            seatIds: z.array(z.string()).describe("Array ของ Seat ID ที่ผู้ใช้เลือก")
        },
        handler: async ({ userId, showtimeId, seatIds }: any) => {
            await connectDB();
            try {
                // 🛡️ 1. Security Check: ป้องกันการจองแทนกัน (IDOR)
                // หมายเหตุ: userId นี้ควรถูก override มาจาก backend controller แล้ว
                if (!userId) {
                    return { content: [{ type: "text", text: "ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบก่อนจองครับ" }] };
                }

                // 🔍 2. ดึงข้อมูลรอบฉายมาตรวจสอบ
                const showtime: any = await ShowtimeModel.findById(showtimeId)
                    .populate('movie_id')
                    .lean();

                if (!showtime) throw new Error("ไม่พบข้อมูลรอบฉายที่ระบุ");

                const movieInfo = showtime.movie_id;
                const movieTitle = movieInfo.title_th || "ไม่ระบุชื่อเรื่อง";
                const posterUrl = movieInfo.poster_url || "";

                // 🛡️ 3. Double Booking Check: ตรวจสอบว่าที่นั่งยังว่างอยู่จริงๆ ไหม
                // เช็คใน BookingModel ว่ามีใครจองที่นั่งเหล่านี้ในรอบนี้ไปหรือยัง (ยกเว้นสถานะ cancelled)
                const existingBooking = await BookingModel.findOne({
                    showtime_id: showtimeId,
                    seats: { $in: seatIds },
                    status: { $ne: 'cancelled' }
                });

                if (existingBooking) {
                    return {
                        content: [{
                            type: "text",
                            text: `ขออภัยครับ ที่นั่งบางส่วนที่คุณเลือกถูกจองไปเมื่อสักครู่นี้เอง 😥 รบกวนเลือกที่นั่งใหม่อีกครั้งครับ`
                        }]
                    };
                }

                // 💺 4. ดึงข้อมูลโรงและที่นั่งเพื่อคำนวณราคา
                const auditorium: any = await AuditoriumModel.findById(showtime.auditorium_id).lean();
                const seats: any = await SeatModel.find({ _id: { $in: seatIds } }).populate('seat_type_id').lean();

                if (seats.length === 0) throw new Error("ข้อมูลที่นั่งไม่ถูกต้อง");

                let totalPrice = 0;
                const seatNames: string[] = [];

                seats.forEach((seat: any) => {
                    const seatPrice = seat.seat_type_id?.price || showtime.base_price || 0;
                    totalPrice += seatPrice;
                    seatNames.push(`${seat.row_label}${seat.seat_number}`);
                });

                // 🆔 5. สร้างเลขที่การจอง
                const bookingNumber = `BK-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;

                // 💾 6. บันทึกลงฐานข้อมูลสถานะ pending
                const newBooking = new BookingModel({
                    user_id: userId === "guest_user" ? null : userId,
                    showtime_id: showtimeId,
                    cinema_id: auditorium.cinema_id,
                    movie_id: movieInfo._id,
                    seats: seatIds,
                    booking_number: bookingNumber,
                    total_price: totalPrice,
                    status: 'pending'
                });

                const savedBooking = await newBooking.save();

                // 🎨 7. ส่ง Visual กลับไปโชว์บิลชำระเงิน
                return sendVisual(
                    `สรุปรายการจองเรื่อง ${movieTitle} เรียบร้อยครับ กรุณาดำเนินการชำระเงินด้านล่างได้เลยครับ`,
                    "CHECKOUT_SUMMARY",
                    {
                        bookingId: savedBooking._id.toString(),
                        bookingNumber: bookingNumber,
                        movieName: movieTitle,
                        poster_url: posterUrl,
                        time: new Date(showtime.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }),
                        seats: seatNames.join(", "),
                        totalPrice: totalPrice,
                        price: totalPrice // ส่งไปทั้งสองชื่อเพื่อความยืดหยุ่นของ Frontend
                    }
                );
            } catch (error: any) {
                console.error("❌ Error confirm_booking:", error);
                return { content: [{ type: "text", text: `เกิดข้อผิดพลาดทางเทคนิค: ${error.message}` }] };
            }
        }
    },

    // 🎟️ 6. ออกตั๋ว (ทำหน้าที่แค่อัปเดตสถานะ Booking เป็น Confirmed และโชว์ตั๋ว)
    {
        name: "issue_ticket",
        description: "เปลี่ยนสถานะเป็น confirmed และออกตั๋วให้ผู้ใช้ พร้อมส่งอีเมลยืนยัน",
        args: {
            userId: z.string().describe("User ID ปัจจุบันของผู้ใช้ (ระบบจะส่งมาให้เอง)"), // ✨ 1. เพิ่ม userId
            bookingId: z.string().describe("รหัสการจอง ObjectId หรือ BK-XXXXX"),
            movieName: z.string().describe("ชื่อภาพยนตร์").optional(),
            time: z.string().describe("เวลาฉาย").optional(),
            seats: z.string().describe("ที่นั่ง").optional()
        },
        // ✨ 2. รับ userId เข้ามาใน handler
        handler: async ({ userId, bookingId, movieName, time, seats }: any) => {
            await connectDB();

            try {
                const isObjectId = mongoose.Types.ObjectId.isValid(bookingId);
                const query = isObjectId ? { _id: bookingId } : { booking_number: bookingId };

                const booking: any = await BookingModel.findOne(query)
                    .populate({
                        path: 'showtime_id',
                        populate: [
                            { path: 'movie_id' },
                            { path: 'auditorium_id' }
                        ]
                    })
                    .populate('seats');

                if (!booking) {
                    return { content: [{ type: "text", text: `ไม่พบข้อมูลการจองรหัส ${bookingId}` }] };
                }

                // 🛡️ 2. ตรวจสอบความเป็นเจ้าของ (Ownership Validation)
                // ถ้ามีการส่ง userId มา (ซึ่งควรถูก Override จาก Backend) และตั๋วนี้ผูกกับ User
                if (userId !== "guest_user" && booking.user_id && booking.user_id.toString() !== userId) {
                    console.error(`🚨 ตรวจพบการพยายามเข้าถึงตั๋วข้ามสิทธิ์! User: ${userId} พยายามเปิดตั๋วของ User: ${booking.user_id}`);
                    return {
                        content: [{
                            type: "text",
                            text: `🚨 ขออภัยครับ คุณไม่มีสิทธิ์จัดการข้อมูลการจองรหัส ${bookingId} นี้ครับ (Permission Denied)`
                        }]
                    };
                }

                const posterUrl = booking.showtime_id?.movie_id?.poster_url || "";

                // 3. เปลี่ยนสถานะเป็น Confirmed
                booking.status = 'confirmed';
                await booking.save();

                // 4. ดึงอีเมลลูกค้าและส่งตั๋ว
                let emailStatusMsg = "";
                if (booking.user_id) {
                    const user = await User.findById(booking.user_id);
                    if (user && user.email) {
                        try {
                            const emailSent = await sendBookingConfirmation(user.email, booking);
                            if (emailSent) {
                                emailStatusMsg = ` และจัดส่งตั๋วอิเล็กทรอนิกส์ไปยังอีเมล ${user.email} เรียบร้อยแล้วครับ 📧`;
                            }
                        } catch (emailErr) {
                            console.error("Mail Error:", emailErr);
                            emailStatusMsg = ` (ระบบส่งอีเมลขัดข้องชั่วคราว แต่การจองสำเร็จแล้วครับ)`;
                        }
                    }
                }

                // 5. ส่ง Visual กลับไปโชว์ในแชท
                return sendVisual(
                    `ขอบคุณที่ชำระเงินครับ! 🎉 สถานะการจองได้รับการยืนยัน${emailStatusMsg} นี่คือตั๋วของคุณ ขอให้สนุกกับการชมภาพยนตร์นะครับ 🍿`,
                    "TICKET_SLIP",
                    {
                        bookingId: booking.booking_number,
                        movieName: movieName || booking.showtime_id?.movie_id?.title_th,
                        time: time || new Date(booking.showtime_id?.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                        seats: seats || "ตามที่เลือกไว้",
                        poster_url: posterUrl,
                        status: booking.status
                    }
                );
            } catch (error: any) {
                console.error("❌ Error in issue_ticket:", error);
                return { content: [{ type: "text", text: `เกิดข้อผิดพลาดในการออกตั๋ว: ${error.message}` }] };
            }
        }
    },

    {
        name: "fast_track_booking",
        description: "ใช้เมื่อผู้ใช้บอกข้อมูลครบถ้วนในครั้งเดียว (ชื่อหนัง, สาขา, วันที่, เวลา) เพื่อค้นหารอบฉาย แล้วแสดงผังที่นั่งให้ทันที",
        args: {
            movieName: z.string().describe("ชื่อหนัง (เช่น ดาบพิฆาตอสูร)"),
            branchName: z.string().describe("ชื่อสาขาแบบสั้นๆ (ตัดคำว่าสาขาออก เช่น รังสิต)"),
            date: z.string().describe("วันที่ในรูปแบบ YYYY-MM-DD"),
            time: z.string().describe("เวลาที่ต้องการดู (เช่น 10:00)")
        },
        handler: async ({ movieName, branchName, date, time }: any) => {
            await connectDB();
            try {
                // 1. ค้นหาภาพยนตร์
                const movie = await MovieModel.findOne({
                    $or: [
                        { title_th: { $regex: movieName, $options: "i" } },
                        { title_en: { $regex: movieName, $options: "i" } }
                    ]
                });
                if (!movie) return { content: [{ type: "text", text: `ไม่พบภาพยนตร์ชื่อ "${movieName}" ครับ` }] };

                // 2. ค้นหาสาขา
                const cleanBranchName = branchName.replace(/สาขา/g, '').trim();
                const branch = await CinemaModel.findOne({
                    $or: [
                        { name: { $regex: cleanBranchName, $options: "i" } },
                        { province: { $regex: cleanBranchName, $options: "i" } }
                    ]
                });
                if (!branch) return { content: [{ type: "text", text: `ไม่พบสาขา "${branchName}" ครับ รบกวนระบุชื่อสาขาให้ชัดเจนอีกครั้งนะ` }] };

                // 3. ดึงโรงหนังในสาขา
                const auditoriums = await AuditoriumModel.find({ cinema_id: branch._id as any });
                if (auditoriums.length === 0) return { content: [{ type: "text", text: `สาขา ${branch.name} ยังไม่เปิดให้บริการโรงภาพยนตร์ในขณะนี้ครับ` }] };
                const audIds = auditoriums.map(a => a._id);

                // 🕒 4. จัดการเรื่องวันที่และเวลา (Lock Timezone ไทย UTC+7)
                const formattedTime = time.replace('.', ':');
                const targetTimeISO = `${date}T${formattedTime}:00.000+07:00`;
                const targetTime = new Date(targetTimeISO);

                // 🔍 5. สร้างช่วงเวลาค้นหา
                const startRange = new Date(targetTime.getTime() - (30 * 60 * 1000));
                const endRange = new Date(targetTime.getTime() + (150 * 60 * 1000));

                const showtimes = await ShowtimeModel.find({
                    movie_id: movie._id as any,
                    auditorium_id: { $in: audIds as any },
                    start_time: { $gte: startRange, $lte: endRange }
                }).sort({ start_time: 1 }).lean();

                if (!showtimes || showtimes.length === 0) {
                    return { content: [{ type: "text", text: `ขออภัยครับ ไม่พบรอบฉายเรื่อง ${movie.title_th} ที่สาขา ${branch.name} ในช่วงเวลาประมาณ ${time} ของวันที่ ${date} ครับ` }] };
                }

                // 6. เลือกรอบที่ใกล้เคียงที่สุด
                const selectedShowtime: any = showtimes[0];
                const showtimeId = selectedShowtime._id.toString();

                // 💺 7. ดึงข้อมูลที่นั่งและสถานะการจอง (ใส่ as any เพื่อแก้ Error TS2769)
                const seats = await SeatModel.find({
                    auditorium_id: selectedShowtime.auditorium_id as any
                }).populate('seat_type_id').lean();

                const bookings = await BookingModel.find({
                    showtime_id: selectedShowtime._id as any,
                    status: { $ne: 'cancelled' }
                }).lean();

                const bookedSeatIds = bookings.flatMap((b: any) => (b.seats || []).map((s: any) => s.toString()));

                const formattedSeats = seats.map((s: any) => ({
                    id: s._id.toString(),
                    label: `${s.row_label}${s.seat_number}`,
                    row: s.row_label,
                    col: s.seat_number,
                    type: s.seat_type_id?.name || 'Normal',
                    price: Number(s.seat_type_id?.price || 0),
                    isBooked: bookedSeatIds.includes(s._id.toString()) || s.is_blocked === true
                }));

                // 8. จัดกลุ่มผังที่นั่ง
                const groupedRows = formattedSeats.reduce((acc: any, seat: any) => {
                    if (!acc[seat.row]) acc[seat.row] = [];
                    acc[seat.row].push(seat);
                    return acc;
                }, {});

                const rowLabels = Object.keys(groupedRows).sort();
                const seatTypesSummary = Array.from(new Map(formattedSeats.map((seat: any) => [seat.type, { name: seat.type, price: seat.price }])).values()).sort((a: any, b: any) => a.price - b.price);

                const actualTime = new Date(selectedShowtime.start_time).toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'Asia/Bangkok'
                });

                // 🎨 9. ส่ง Visual SEAT_PICKER
                // @ts-ignore
                return sendVisual(
                    `จัดให้ครับ! พบรอบฉายเวลา ${actualTime} น. ที่สาขา ${branch.name} เชิญเลือกที่นั่งเรื่อง ${movie.title_th} ได้เลยครับ 🎟️`,
                    "SEAT_PICKER",
                    {
                        showtimeId,
                        movieName: movie.title_th,
                        time: actualTime,
                        date,
                        cinemaName: branch.name,
                        seatsData: formattedSeats,
                        layout: {
                            rowLabels,
                            totalColumns: Math.max(...rowLabels.map((row) => groupedRows[row].length), 0)
                        },
                        pricing: seatTypesSummary
                    }
                );

            } catch (error: any) {
                console.error("❌ Error in fast_track_booking:", error);
                return { content: [{ type: "text", text: `ระบบขัดข้องชั่วคราว: ${error.message}` }] };
            }
        }
        }
];