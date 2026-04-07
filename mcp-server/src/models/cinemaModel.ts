import mongoose, { Schema, Document } from 'mongoose';

interface ICinema extends Document {
  name: string;
  address: string;
  province: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

const cinemaSchema = new Schema<ICinema>({
  name: { type: String, required: true },     // เช่น MCP Cinema Central World
  address: { type: String, required: true },
  province: { type: String, required: true },
  phone: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<ICinema>('Cinema', cinemaSchema);