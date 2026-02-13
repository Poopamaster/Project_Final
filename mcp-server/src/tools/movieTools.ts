// src/tools/movieTools.ts
import { z } from "zod";
import { MovieModel } from "../models/movie.js";
import { connectDB } from "../db.js";

const sendVisual = (text: string, type: string, data: any) => {
    const payload = { type, data };
    return { 
        content: [{ type: "text", text: `${text}::VISUAL::${JSON.stringify(payload)}` }] 
    };
};

export const movieTools = [
  // 1. ค้นหาหนัง
  {
    name: "search_movies",
    args: { keyword: z.string() },
    handler: async ({ keyword }: { keyword: string }) => {
      await connectDB();
      const movies = await MovieModel.find({
        $or: [{ title_th: { $regex: keyword, $options: "i" } }, { title_en: { $regex: keyword, $options: "i" } }]
      }).limit(10);
      
      // แปลงข้อมูลให้มีสีสวยๆ เหมือน Design
      const colors = ["linear-gradient(135deg, #f97316, #b45309)", "linear-gradient(135deg, #22c55e, #047857)", "linear-gradient(135deg, #64748b, #1e293b)", "linear-gradient(135deg, #a855f7, #7e22ce)"];
      
      const enrichedMovies = movies.map((m: any, index: number) => ({
          ...m.toObject(),
          color: colors[index % colors.length], // สุ่มสีให้เหมือน Design
          rating: (4.0 + Math.random()).toFixed(1), // สุ่ม rating (ถ้าใน DB ไม่มี)
          price: 220
      }));

      return sendVisual(`เจอหนังเรื่อง "${keyword}" ตามนี้ครับ`, "MOVIE_CAROUSEL", enrichedMovies);
    }
  },

  // 2. เลือกรอบฉาย
  {
    name: "get_showtimes",
    args: { movieName: z.string() },
    handler: async ({ movieName }: { movieName: string }) => {
        const showtimes = ["10:30", "13:45", "16:20", "19:00", "21:30"];
        return sendVisual(
            `เลือกรอบฉายของ ${movieName}`, 
            "SHOWTIME_SELECTOR", 
            { movieName, times: showtimes }
        );
    }
  },

  // 3. เลือกที่นั่ง
  {
      name: "get_seats",
      args: { movieName: z.string(), time: z.string() },
      handler: async ({ movieName, time }: any) => {
          return sendVisual(
              `เลือกที่นั่งรอบ ${time} ได้เลยครับ`, 
              "SEAT_SELECTOR", 
              { movieName, time, bookedSeats: ["A3", "A4"] }
          );
      }
  },

  // 4. สรุปยอดชำระเงิน
  {
      name: "confirm_booking",
      args: { movieName: z.string(), time: z.string(), seats: z.string() },
      handler: async ({ movieName, time, seats }: any) => {
          const seatCount = seats.split(',').length;
          const price = seatCount * 220;
          const bookingId = "BK-" + Math.random().toString(36).substr(2, 5).toUpperCase();

          return sendVisual(
              `ยืนยันข้อมูลการจองครับ`, 
              "PAYMENT_SLIP", 
              { movieName, time, seats, price, bookingId }
          );
      }
  },

  // 5. ออกตั๋ว
  {
      name: "issue_ticket",
      args: { bookingId: z.string() },
      handler: async ({ bookingId }: any) => {
          // ในระบบจริงต้องดึงข้อมูลจาก bookingId
          return sendVisual(
              `เรียบร้อยครับ! นี่คือตั๋วของคุณ`, 
              "TICKET_SLIP", 
              { 
                bookingId, 
                movieName: "Sample Movie", 
                time: "10:30", 
                seats: "C1, C2"
              }
          );
      }
  }
];