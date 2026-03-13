// src/tools/movieTools.ts
import mongoose from "mongoose";
import { z } from "zod";
import { MovieModel } from "../models/movie.js";
import { connectDB } from "../db.js";

import AuditoriumModel from "../models/auditoriumModel.js";
import ShowtimeModel from "../models/showtimeModel.js";
import CinemaModel from "../models/cinemaModel.js";
import SeatModel from "../models/seatModel.js";
import SeatTypeModel from "../models/seatTypeModel.js";
import BookingModel from "../models/bookingModel.js";

// Helper ฟังก์ชันสำหรับส่งข้อมูลแบบ Visual ไปให้ Frontend
const sendVisual = (text: string, type: string, data: any) => {
    const payload = { type, data };
    return {
        content: [{ type: "text", text: `${text}::VISUAL::${JSON.stringify(payload)}` }]
    };
};

export const movieTools = [
    // 🎬 1. ค้นหาหนัง
    {
        name: "search_movie",
        description: "ค้นหาภาพยนตร์ในฐานข้อมูลจากชื่อเรื่อง",
        args: {
            keyword: z.string().describe("ชื่อหนังที่ผู้ใช้ต้องการค้นหา เช่น 'ธี่หยด' (ห้ามส่งค่าว่างเด็ดขาด)")
        },
        handler: async ({ keyword }: { keyword: string }) => {
            await connectDB();
            const movies = await MovieModel.find({
                $or: [{ title_th: { $regex: keyword, $options: "i" } }, { title_en: { $regex: keyword, $options: "i" } }]
            }).limit(10);

            if (movies.length === 0) {
                return { content: [{ type: "text", text: `ขออภัยครับ ไม่พบหนังที่ชื่อ "${keyword}" ในระบบเลยครับ 😢` }] };
            }

            const colors = ["linear-gradient(135deg, #f97316, #b45309)", "linear-gradient(135deg, #22c55e, #047857)", "linear-gradient(135deg, #64748b, #1e293b)", "linear-gradient(135deg, #a855f7, #7e22ce)"];

            const enrichedMovies = movies.map((m: any, index: number) => ({
                ...m.toObject(),
                color: colors[index % colors.length],
                rating: (4.0 + Math.random()).toFixed(1),
                price: 160 // ตั้งเป็นราคาเริ่มต้น
            }));

            return sendVisual(`เจอหนังเรื่อง "${keyword}" ตามนี้ครับ`, "MOVIE_CAROUSEL", enrichedMovies);
        }
    },

    // 🏢 2. ดึงรายชื่อสาขา
    {
        name: "get_branches",
        description: "ดึงรายชื่อสาขาโรงภาพยนตร์ทั้งหมดในระบบ เพื่อให้ผู้ใช้เลือกเมื่อสอบถามว่ามีสาขาไหนบ้าง หรือต้องการดูรอบฉาย",
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

    // 🕒 3. เลือกรอบฉาย
    {
        name: "get_showtimes",
        description: "ดึงข้อมูลรอบฉายของภาพยนตร์",
        args: {
            movieId: z.string().describe("รหัสภาพยนตร์"),
            movieName: z.string().describe("ชื่อภาพยนตร์"),
            branchId: z.string().describe("รหัสสาขา"),
            date: z.string().describe("วันที่ YYYY-MM-DD")
        },
        handler: async ({ movieId, movieName, branchId, date }: any) => {
            await connectDB();

            try {
                const movieObjectId = new mongoose.Types.ObjectId(movieId);
                const branchObjectId = new mongoose.Types.ObjectId(branchId);

                const startOfDay = new Date(date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);

                const auditoriums = await AuditoriumModel.find({ cinema_id: branchObjectId });
                const auditoriumIds = auditoriums.map(a => a._id);

                if (auditoriumIds.length === 0) {
                    return { content: [{ type: "text", text: "ไม่พบโรงภาพยนตร์ในสาขานี้" }] };
                }

                const showtimes = await ShowtimeModel.find({
                    movie_id: movieObjectId,
                    auditorium_id: { $in: auditoriumIds },
                    start_time: { $gte: startOfDay, $lte: endOfDay }
                }).populate('auditorium_id').sort({ start_time: 1 });

                if (!showtimes || showtimes.length === 0) {
                    return sendVisual(`ไม่พบรอบฉายของเรื่อง ${movieName} ในวันที่เลือกครับ`, "SHOWTIME_SELECTOR", { movieName, date, showtimes: [] });
                }

                const formatted = showtimes.map((st: any) => ({
                    showtimeId: st._id.toString(),
                    time: new Date(st.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                    language: st.language,
                    auditorium: st.auditorium_id?.name || "โรงปกติ"
                }));

                return sendVisual(`พบรอบฉาย ${movieName} ดังนี้ครับ`, "SHOWTIME_SELECTOR", { movieName, date, showtimes: formatted });

            } catch (error: any) {
                console.error("❌ Error in get_showtimes:", error);
                return { content: [{ type: "text", text: `Error: ${error.message}` }] };
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

                const showtime = await ShowtimeModel.findById(showtimeId);
                if (!showtime) return { content: [{ type: "text", text: "ไม่พบข้อมูลรอบฉายครับ" }] };

                // ✅ 1. ดึง ID ออกมาให้เป็น String ธรรมดาเพื่อตัดปัญหา Object ซ้อน Object
                const audId = showtime.auditorium_id._id 
                    ? showtime.auditorium_id._id.toString() 
                    : showtime.auditorium_id.toString();

                console.error(`1. เลือกรอบฉาย ID: ${showtimeId}`);
                console.error(`2. โรงหนังที่ฉาย ID: ${audId}`);

                // ✅ 2. ค้นหาแบบแรก (ส่งเข้า Mongoose ตรงๆ)
                let seats = await SeatModel.find({ auditorium_id: audId as any }).populate({
                    path: 'seat_type_id',
                    model: SeatTypeModel
                });

                // ✅ 3. ถ้าไม่เจอ ลองบังคับแปลงเป็น ObjectId ค้นหาอีกรอบ (ดักปัญหา Type mismatch)
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

                // 🚨 ถ้า 2 ท่าด้านบนยังไม่เจออีก ส่งแจ้งเตือนออกไปที่หน้าจอแชทเลย!
                if (seats.length === 0) {
                    return { 
                        content: [{ 
                            type: "text", 
                            text: `พบปัญหา: ในฐานข้อมูลไม่พบเก้าอี้ที่ถูกผูกไว้กับโรงหนัง ID ${audId} เลยครับ รบกวนตรวจสอบว่ารอบฉายนี้ผูกกับโรงหนังถูกโรงหรือไม่` 
                        }] 
                    };
                }

                const bookings = await BookingModel.find({
                    showtime_id: showtimeId,
                    status: { $ne: 'cancelled' }
                });
                const bookedSeatIds = bookings.flatMap(b => b.seats.map(s => s.toString()));

                const formattedSeats = seats.map((s: any) => ({
                    id: s._id.toString(),
                    label: `${s.row_label}${s.seat_number}`,
                    row: s.row_label,
                    col: s.seat_number,
                    type: s.seat_type_id?.name || 'Normal',
                    price: showtime.base_price + (s.seat_type_id?.price || 0),
                    isBooked: bookedSeatIds.includes(s._id.toString()) || s.is_blocked
                }));

                return sendVisual(
                    `เชิญเลือกที่นั่งสำหรับเรื่อง ${movieName} รอบ ${time} ได้เลยครับ`,
                    "SEAT_PICKER",
                    { showtimeId, movieName, time, date, seatsData: formattedSeats }
                );

            } catch (error: any) {
                console.error("❌ Error in select_seat:", error);
                return { content: [{ type: "text", text: `เกิดข้อผิดพลาดในการโหลดที่นั่ง: ${error.message}` }] };
            }
        }
    },

    // 💳 5. สรุปยอดชำระเงิน (รองรับการดึง User จริง)
    {
        name: "confirm_booking",
        description: "สรุปการจอง และสร้างรายการ Booking ลงฐานข้อมูล",
        args: {
            showtimeId: z.string(),
            movieName: z.string(),
            time: z.string(),
            seats: z.string().describe("รหัสป้ายที่นั่ง เช่น A1, A2"),
            seatIds: z.string().describe("รหัส ObjectID ของที่นั่ง คั่นด้วยคอมม่า เช่น 60a...,60b..."),
            totalPrice: z.number(),
            userId: z.string().describe("รหัสประจำตัวผู้ใช้งาน (User ID) ของคนที่กำลังใช้งานอยู่ หากไม่มีให้ใช้ค่าว่าง").optional()
        },
        handler: async ({ showtimeId, movieName, time, seats, seatIds, totalPrice, userId }: any) => {
            await connectDB();

            const bookingNumber = "BK-" + Math.random().toString(36).substring(2, 7).toUpperCase();
            const showtime = await ShowtimeModel.findById(showtimeId).populate('auditorium_id');
            const seatIdArray = seatIds.split(',').map((id: string) => id.trim());

            // ✅ ตรวจสอบ userId ถ้ามีการส่งมาให้ใช้ตัวนั้น ถ้าไม่มีค่อยดึงจาก fallback/ทดสอบไปก่อน
            // (ในระบบจริง Frontend/MCP context ควรส่ง User ID ตัวจริงมาให้ AI หรือแนบมากับ System Prompt)
            const actualUserId = userId ? new mongoose.Types.ObjectId(userId) : new mongoose.Types.ObjectId();

            const newBooking = await BookingModel.create({
                user_id: actualUserId as any,
                showtime_id: showtimeId,
                cinema_id: (showtime as any).auditorium_id.cinema_id,
                movie_id: (showtime as any).movie_id,
                seats: seatIdArray,
                booking_number: bookingNumber,
                total_price: totalPrice,
                status: 'pending' // สถานะรอชำระเงิน
            });

            // ✅ 2. เติม as any ให้ newBooking ด้วย
            return sendVisual(
                `นี่คือสรุปการจองของคุณครับ รบกวนตรวจสอบความถูกต้องและชำระเงินได้เลยครับ`,
                "PAYMENT_SLIP",
                {
                    showtimeId,
                    movieName,
                    time,
                    seats,
                    price: totalPrice,
                    bookingId: (newBooking as any).booking_number
                }
            );
        }
    },

    // 🎟️ 6. ออกตั๋ว (อัปเดตสถานะสำเร็จจริง)
    {
        name: "issue_ticket",
        description: "ออกตั๋วภาพยนตร์เมื่อผู้ใช้ชำระเงินสำเร็จ พร้อมอัปเดตสถานะใน Database เป็นยืนยันแล้ว",
        args: {
            bookingId: z.string().describe("รหัสการจอง (booking_number) เช่น BK-XXXXX"),
            movieName: z.string().describe("ชื่อภาพยนตร์"),
            time: z.string().describe("เวลาฉาย"),
            seats: z.string().describe("ที่นั่ง")
        },
        handler: async ({ bookingId, movieName, time, seats }: any) => {
            await connectDB();

            // ✅ อัปเดตสถานะ Booking ในระบบจริงเป็น 'confirmed'
            const updatedBooking = await BookingModel.findOneAndUpdate(
                { booking_number: bookingId },
                { status: 'confirmed' },
                { new: true }
            );

            if (!updatedBooking) {
                return { content: [{ type: "text", text: `ไม่พบข้อมูลการจองรหัส ${bookingId} ในระบบครับ กรุณาลองใหม่อีกครั้ง` }] };
            }

            return sendVisual(
                `ชำระเงินเรียบร้อยครับ! 🎉 ข้อมูลของคุณถูกบันทึกแล้ว นี่คือตั๋วของคุณ ขอให้สนุกกับการชมภาพยนตร์นะครับ`,
                "TICKET_SLIP",
                {
                    bookingId,
                    movieName,
                    time,
                    seats,
                    status: updatedBooking.status
                }
            );
        }
    }
];