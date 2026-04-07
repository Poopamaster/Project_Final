import mongoose, { Schema, Document } from 'mongoose';

// 🌟 1. เพิ่ม status เข้าไปใน Interface
interface IShowtime extends Document {
  movie_id: mongoose.Types.ObjectId;
  auditorium_id: mongoose.Types.ObjectId;
  start_time: Date;
  end_time: Date;
  language: string;
  base_price: number;
  batch_id: string | null;
  status: 'active' | 'cancelled'; // 👈 บังคับให้เป็น 2 ค่านี้เท่านั้น
  createdAt: Date;
  updatedAt: Date;
}

const showtimeSchema = new Schema<IShowtime>({
  movie_id: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
  auditorium_id: { type: Schema.Types.ObjectId, ref: 'Auditorium', required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  language: { type: String, required: true },
  base_price: { type: Number, required: true },
  batch_id: { type: String, default: null },
  // 🌟 2. เพิ่ม status เข้าไปใน Schema ให้ตรงกับ Backend
  status: { type: String, enum: ['active', 'cancelled'], default: 'active' }
}, { timestamps: true });

export default mongoose.model<IShowtime>('Showtime', showtimeSchema);