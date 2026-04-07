import mongoose, { Schema, Document } from 'mongoose';

interface IAuditorium extends Document {
  cinema_id: mongoose.Types.ObjectId;
  name: string;
  capacity: number;
  format: string;
  createdAt: Date;
  updatedAt: Date;
}

const auditoriumSchema = new Schema<IAuditorium>({
  cinema_id: { type: Schema.Types.ObjectId, ref: 'Cinema', required: true },
  name: { type: String, required: true },     // เช่น Theater 1, IMAX
  capacity: { type: Number, required: true },
  format: { type: String, default: 'Standard' } // IMAX, 4DX, Standard
}, { timestamps: true });

export default mongoose.model<IAuditorium>('Auditorium', auditoriumSchema);