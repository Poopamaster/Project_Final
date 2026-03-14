import mongoose, { Schema, Document, Types } from 'mongoose';

// 1. สร้าง Interface เพื่อกำหนด Type ให้กับฟิลด์ต่างๆ
export interface IPayment extends Document {
    booking_id: Types.ObjectId;
    charge_id: string;
    amount: number;
    method: string;
    payment_time: Date;
    status: 'pending' | 'success' | 'failed' | 'refunded';
    createdAt?: Date; // ได้มาอัตโนมัติจาก timestamps: true
    updatedAt?: Date; // ได้มาอัตโนมัติจาก timestamps: true
}

// 2. สร้าง Schema โดยระบุ Generic Type <IPayment>
const paymentSchema = new Schema<IPayment>({
    booking_id: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    charge_id: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true, default: 'PromptPay' }, 
    payment_time: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: ['pending', 'success', 'failed', 'refunded'], 
        default: 'pending' 
    }
}, { timestamps: true });

// 3. Export เป็น ES Module
const PaymentModel = mongoose.model<IPayment>('Payment', paymentSchema);
export default PaymentModel;