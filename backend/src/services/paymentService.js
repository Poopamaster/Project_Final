// src/services/omiseService.js
const axios = require('axios');
const Payment = require('../models/paymentModel'); // ตรวจสอบ path ให้ถูกต้อง
const omise = require('omise')({
    'publicKey': process.env.OMISE_PUBLIC_KEY,
    'secretKey': process.env.OMISE_SECRET_KEY
});

exports.createPromptPayQR = async (amount, bookingId) => {
    // 1. Validation Logic
    try {
        const amountFloat = parseFloat(amount);
        if (isNaN(amountFloat) || amountFloat < 20) {
            throw new Error("จำนวนเงินต้องไม่ต่ำกว่า 20 บาท");
        }
        if (!bookingId) {
            throw new Error("ระบุ Booking ID ด้วยครับ");
        }

        const amountInSatang = Math.round(amountFloat * 100);

        // 2. Omise API Logic
        const charge = await omise.charges.create({
            amount: amountInSatang,
            currency: 'THB',
            source: { type: 'promptpay' },
            // ตรวจสอบให้แน่ใจว่าค่านี้เป็น HTTPS เมื่ออยู่บน Production
            return_uri: process.env.FRONTEND_URL
                ? `${process.env.FRONTEND_URL}/payment/success`
                : 'http://localhost:5173/payment/success'
        });

        // 3. Database Logic
        const newPayment = await Payment.create({
            booking_id: bookingId,
            charge_id: charge.id,
            amount: amountFloat,
            method: 'PromptPay',
            status: 'pending'
        });

        // Return ข้อมูลที่จำเป็นกลับไป
        return {
            qrCodeUrl: charge.source.scannable_code.image.download_uri,
            chargeId: charge.id,
            paymentData: newPayment
        };
    } catch (err) {
        console.error("Omise Create Charge Error:", err);
        throw err; // ส่งต่อ error ไปให้ controller จัดการต่อ
    }
};

exports.checkChargeStatus = async (chargeId) => {
    // 1. Omise API Logic
    const charge = await omise.charges.retrieve(chargeId);

    // 2. Mapping Status
    let newStatus = 'pending';
    if (charge.status === 'successful') newStatus = 'success';
    if (charge.status === 'failed') newStatus = 'failed';

    // 3. Database Logic
    const updatedPayment = await Payment.findOneAndUpdate(
        { charge_id: chargeId },
        { status: newStatus },
        { new: true }
    );

    return {
        omiseStatus: charge.status,
        amount: charge.amount / 100,
        dbStatus: updatedPayment ? updatedPayment.status : 'not found',
        paymentData: updatedPayment
    };
};

exports.simulatePaymentSuccess = async (chargeId) => {
    if (!chargeId) throw new Error("Charge ID is required");

    // 1. Axios Logic (ยิง API Mark as Paid)
    const omiseResponse = await axios.post(
        `https://api.omise.co/charges/${chargeId}/mark_as_paid`,
        {},
        {
            auth: {
                username: process.env.OMISE_SECRET_KEY,
                password: ''
            }
        }
    );

    if (omiseResponse.data.status === 'successful') {
        // 2. Database Logic
        const updatedPayment = await Payment.findOneAndUpdate(
            { charge_id: chargeId },
            { status: 'success' },
            { new: true }
        );
        return updatedPayment;
    } else {
        throw new Error(`Omise update failed: ${omiseResponse.data.status}`);
    }
};