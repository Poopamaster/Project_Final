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

                const bookings = await BookingModel.find({
                    showtime_id: showtimeId,
                    status: { $ne: 'cancelled' }
                });

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
                        // ใช้ราคา seat type ตรงๆ ไม่บวก base_price
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
    // 🎟️ 5. สรุปการจอง (ตัด Omise ออก ให้ Frontend จัดการแทน)
    {
        name: "confirm_booking",
        description: "สรุปการจองและส่งข้อมูลไปให้ระบบ Payment ของ Frontend จัดการชำระเงิน",
        args: {
            userId: z.string().describe("User ID ปัจจุบันของผู้ใช้"),
            showtimeId: z.string().describe("ID ของรอบฉาย"),
            seatIds: z.array(z.string()).describe("Array ของ Seat ID ที่ผู้ใช้เลือก")
        },
        handler: async ({ userId, showtimeId, seatIds }: any) => {
            await connectDB(); // 1. ต้องต่อ DB ก่อน
            try {
                // 2. ใช้ .lean() เพื่อให้ได้ plain JS object ที่ส่งออกไปง่ายๆ
                const showtime: any = await ShowtimeModel.findById(showtimeId)
                    .populate('movie_id')
                    .lean();

                if (!showtime) throw new Error("ไม่พบรอบฉาย");

                // 3. ดึงค่าออกมาพักไว้ในตัวแปรแยก (เพื่อความชัวร์)
                const posterUrl = showtime.movie_id?.poster_url || "";

                // 2. ดึงค่าออกมาเก็บในตัวแปรแยกชัดๆ กันพลาด
                const movieInfo = showtime.movie_id;
                const movieTitle = movieInfo.title_th || "ไม่ระบุชื่อเรื่อง";
                const moviePoster = movieInfo.poster_url || ""; // ตรวจสอบชื่อฟิลด์ใน Schema ว่าเป็น poster_url เป๊ะๆ นะครับ

                const auditorium: any = await AuditoriumModel.findById(showtime.auditorium_id).lean();
                const seats: any = await SeatModel.find({ _id: { $in: seatIds } }).populate('seat_type_id').lean();

                let totalPrice = 0;
                const seatNames: string[] = [];

                seats.forEach((seat: any) => {
                    const seatPrice = seat.seat_type_id?.price || showtime.base_price || 0;
                    totalPrice += seatPrice;
                    seatNames.push(`${seat.row_label}${seat.seat_number}`);
                });

                const bookingNumber = `BK-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;

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

                // 3. ส่งข้อมูลกลับโดยใช้ตัวแปรที่เราดึงมาพักไว้
                return sendVisual(
                    `สรุปรายการจองเรื่อง ${movieTitle} เรียบร้อยครับ กรุณาดำเนินการชำระเงินด้านล่างได้เลยครับ`,
                    "CHECKOUT_SUMMARY",
                    {
                        bookingId: savedBooking._id.toString(),
                        bookingNumber: bookingNumber,
                        movieName: movieTitle,
                        poster_url: posterUrl,
                        time: new Date(showtime.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                        seats: seatNames.join(", "),
                        totalPrice: totalPrice,
                        price: totalPrice
                    }
                );
            } catch (error: any) {
                console.error("❌ Error confirm_booking:", error);
                return { content: [{ type: "text", text: `เกิดข้อผิดพลาด: ${error.message}` }] };
            }
        }
    },

    // 🎟️ 6. ออกตั๋ว (ทำหน้าที่แค่อัปเดตสถานะ Booking เป็น Confirmed และโชว์ตั๋ว)
    {
        name: "issue_ticket",
        description: "เปลี่ยนสถานะเป็น confirmed และออกตั๋วให้ผู้ใช้ พร้อมส่งอีเมลยืนยัน",
        args: {
            bookingId: z.string().describe("รหัสการจอง ObjectId (จากที่ PaymentCard ส่งมา) หรือ BK-XXXXX"),
            movieName: z.string().describe("ชื่อภาพยนตร์").optional(),
            time: z.string().describe("เวลาฉาย").optional(),
            seats: z.string().describe("ที่นั่ง").optional()
        },
        handler: async ({ bookingId, movieName, time, seats }: any) => {
            await connectDB();

            try {
                const isObjectId = mongoose.Types.ObjectId.isValid(bookingId);
                const query = isObjectId ? { _id: bookingId } : { booking_number: bookingId };


                // 1. ดึง Booking และ Populate ข้อมูลให้ลึกพอที่ emailService.js ต้องการ
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

                const posterUrl = booking.showtime_id?.movie_id?.poster_url || "";
                // 2. เปลี่ยนสถานะเป็น Confirmed
                booking.status = 'confirmed';
                await booking.save();

                // 3. ดึงอีเมลลูกค้าและส่งตั๋ว
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

                // 4. ส่ง Visual กลับไปโชว์ในแชท
                return sendVisual(
                    `ขอบคุณที่ชำระเงินครับ! 🎉 สถานะการจองได้รับการยืนยัน${emailStatusMsg} นี่คือตั๋วของคุณ ขอให้สนุกกับการชมภาพยนตร์นะครับ 🍿`,
                    "TICKET_SLIP",
                    {
                        bookingId: booking.booking_number,
                        movieName: movieName || booking.showtime_id.movie_id.title_th,
                        time: time || new Date(booking.showtime_id.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
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
    }
];