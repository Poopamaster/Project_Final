import mongoose, { Schema, Document } from 'mongoose';

interface ISeat extends Document {
  auditorium_id: mongoose.Schema.Types.ObjectId;
  seat_type_id: mongoose.Schema.Types.ObjectId;
  row_label: string;        // A, B, C
  seat_number: string;      // 1, 2, 3 (ใช้ String เผื่อมี 1A)
  is_blocked?: boolean;     // เผื่อเก้าอี้เสีย
  createdAt?: Date;
  updatedAt?: Date;
}

const seatSchema = new Schema<ISeat>(
  {
    auditorium_id: { type: Schema.Types.ObjectId, ref: 'Auditorium', required: true },
    seat_type_id: { type: Schema.Types.ObjectId, ref: 'SeatType', required: true },
    row_label: { type: String, required: true },
    seat_number: { type: String, required: true },
    is_blocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// สร้าง Index เพื่อป้องกันที่นั่งซ้ำในโรงเดียวกัน
seatSchema.index({ auditorium_id: 1, row_label: 1, seat_number: 1 }, { unique: true });

export default mongoose.model<ISeat>('Seat', seatSchema);