import mongoose, { Schema, Document } from 'mongoose';

interface ISeatType extends Document {
  name: string;           // Normal, Honeymoon, Sofa
  price: number;          // ราคาบวกเพิ่ม หรือ ราคาตั้งต้น
  createdAt?: Date;
  updatedAt?: Date;
}

const seatTypeSchema = new Schema<ISeatType>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISeatType>('SeatType', seatTypeSchema);