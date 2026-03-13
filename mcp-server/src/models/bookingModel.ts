import mongoose, { Schema, Document } from 'mongoose';

interface IBooking extends Document {
  user_id: mongoose.Schema.Types.ObjectId;
  showtime_id: mongoose.Schema.Types.ObjectId;
  cinema_id: mongoose.Schema.Types.ObjectId;
  movie_id: mongoose.Schema.Types.ObjectId;
  seats: mongoose.Schema.Types.ObjectId[];
  booking_number: string;
  booking_time?: Date;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    showtime_id: { type: Schema.Types.ObjectId, ref: 'Showtime', required: true },
    cinema_id: { type: Schema.Types.ObjectId, ref: 'Cinema', required: true },
    movie_id: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    seats: [{ type: Schema.Types.ObjectId, ref: 'Seat', required: true }],
    booking_number: { type: String, required: true, unique: true },
    booking_time: { type: Date, default: Date.now },
    total_price: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>('Booking', bookingSchema);