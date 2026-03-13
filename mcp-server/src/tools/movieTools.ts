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
        description: "สรุปการจอง คำนวณราคา และสร้าง QR Code สแกนจ่าย",
        args: {
            userId: z.string().describe("User ID ปัจจุบันของผู้ใช้ (ดึงจาก System Prompt)"),
            showtimeId: z.string(),
            seatIds: z.array(z.string()).describe("Array ของ Seat ID ที่ผู้ใช้เลือก")
        },
        handler: async ({ userId, showtimeId, seatIds }: any) => {
            await connectDB();

            try {
                const showtime: any = await ShowtimeModel.findById(showtimeId).populate('movie_id');

                if (!showtime) {
                    return { content: [{ type: "text", text: "ไม่พบข้อมูลรอบฉายนี้" }] };
                }

                const auditorium: any = await AuditoriumModel.findById(showtime.auditorium_id);

                if (!auditorium) {
                    return {
                        content: [{
                            type: "text",
                            text: "ไม่พบข้อมูลโรงภาพยนตร์ของรอบฉายนี้ กรุณาตรวจสอบ auditorium_id"
                        }]
                    };
                }

                if (!auditorium.cinema_id) {
                    return {
                        content: [{
                            type: "text",
                            text: "ไม่พบ cinema_id ในข้อมูล auditorium กรุณาตรวจสอบ schema และข้อมูลในฐานข้อมูล"
                        }]
                    };
                }

                const cinema: any = await CinemaModel.findById(auditorium.cinema_id);

                if (!cinema) {
                    return {
                        content: [{
                            type: "text",
                            text: "ไม่พบข้อมูลสาขา (Cinema) ที่เชื่อมกับโรงภาพยนตร์นี้"
                        }]
                    };
                }

                const seats: any = await SeatModel.find({ _id: { $in: seatIds } }).populate('seat_type_id');

                if (!seats || seats.length === 0) {
                    return {
                        content: [{
                            type: "text",
                            text: "ไม่พบข้อมูลที่นั่งที่เลือก"
                        }]
                    };
                }

                let totalPrice = 0;
                const seatNames: string[] = [];

                seats.forEach((seat: any) => {
                    const seatPrice = seat.seat_type_id?.price || 0;
                    totalPrice += showtime.base_price + seatPrice;
                    seatNames.push(`${seat.row_label}${seat.seat_number}`);
                });

                const source: any = await new Promise((resolve, reject) => {
                    omiseClient.sources.create({
                        type: 'promptpay',
                        amount: totalPrice * 100,
                        currency: 'thb'
                    }, (err: any, source: any) => {
                        if (err) reject(err);
                        else resolve(source);
                    });
                });

                const qrCodeUrl =
                    source?.scannable_code?.image?.download_uri ||
                    source?.scannable_code?.download_uri ||
                    source?.download_uri ||
                    null;

                const bookingNumber = `BK-${Date.now().toString().slice(-6)}`;
                const newBooking = new BookingModel({
                    user_id: userId,
                    showtime_id: showtimeId,
                    cinema_id: auditorium.cinema_id,
                    movie_id: showtime.movie_id._id,
                    seats: seatIds,
                    booking_number: bookingNumber,
                    total_price: totalPrice,
                    status: 'pending'
                });

                await newBooking.save();

                return sendVisual("กรุณาสแกน QR Code ด้านล่างเพื่อชำระเงินครับ", "CHECKOUT_SUMMARY", {
                    bookingId: bookingNumber,
                    movieTitle: showtime.movie_id.title_th,
                    seats: seatNames.join(", "),
                    totalPrice: totalPrice,
                    qrCodeUrl
                });

            } catch (error: any) {
                console.error("❌ Error in confirm_booking:", error);
                return {
                    content: [{
                        type: "text",
                        text: `เกิดข้อผิดพลาดในการสรุปการจอง: ${error.message}`
                    }]
                };
            }
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