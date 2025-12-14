// ไฟล์: src/controllers/omiseController.js
const omise = require('omise')({
    'publicKey': process.env.OMISE_PUBLIC_KEY,
    'secretKey': process.env.OMISE_SECRET_KEY
});
const Payment = require('../models/paymentModel'); // Import Model
const axios = require('axios'); // ✅ เพิ่มบรรทัดนี้ด้านบนสุด

exports.createPromptPayQR = async (req, res) => {
    // 1. รับ bookingId มาด้วย (เพราะ Schema บังคับว่าต้องมี)
    const { amount, bookingId } = req.body; 

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat < 20) {
        return res.status(400).json({ message: "จำนวนเงินต้องไม่ต่ำกว่า 20 บาท" });
    }

    // ถ้าไม่มี bookingId จะบันทึกไม่ได้ (ตาม Schema required: true)
    // สำหรับการทดสอบ ถ้ายังไม่มี Booking จริงๆ อาจต้องส่ง ID มั่วๆ หรือสร้าง Booking ปลอมก่อน
    if (!bookingId) {
        return res.status(400).json({ message: "ระบุ Booking ID ด้วยครับ" });
    }

    const amountInSatang = Math.round(amountFloat * 100);

    try {
        // 2. สร้าง Charge ที่ Omise
        const charge = await omise.charges.create({
            amount: amountInSatang,
            currency: 'THB',
            source: { type: 'promptpay' },
            return_uri: 'http://localhost:5173/payment/success'
        });

        // 3. บันทึกลง MongoDB (Map ให้ตรงกับ Schema ของคุณ)
        await Payment.create({
            booking_id: bookingId,      // <--- ตรงกับ Schema
            charge_id: charge.id,       // <--- เก็บ ID จาก Omise (chrg_test_...)
            amount: amountFloat,
            method: 'PromptPay',
            status: 'pending'           // <--- เริ่มต้นเป็น pending
        });

        res.status(200).json({
            qrCodeUrl: charge.source.scannable_code.image.download_uri,
            chargeId: charge.id,
            message: "สร้าง QR Code และบันทึกรายการสำเร็จ"
        });

    } catch (error) {
        console.error("Omise Error:", error);
        res.status(500).json({ message: "สร้าง QR ไม่สำเร็จ: " + error.message });
    }
};

exports.checkChargeStatus = async (req, res) => {
    const { chargeId } = req.params;

    try {
        const charge = await omise.charges.retrieve(chargeId);

        // แปลงสถานะจาก Omise (successful) ให้ตรงกับ Schema ของคุณ (success)
        let newStatus = 'pending';
        if (charge.status === 'successful') newStatus = 'success';
        if (charge.status === 'failed') newStatus = 'failed';

        // อัปเดตสถานะใน DB โดยใช้ charge_id เป็นตัวค้นหา
        const updatedPayment = await Payment.findOneAndUpdate(
            { charge_id: chargeId }, // <--- ค้นหาด้วย charge_id
            { status: newStatus },
            { new: true }
        );

        res.status(200).json({
            status: charge.status, // ส่งกลับไปให้ Frontend (successful)
            amount: charge.amount / 100,
            dbStatus: updatedPayment ? updatedPayment.status : 'not found'
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.simulatePaymentSuccess = async (req, res) => {
    const { chargeId } = req.body;

    if (!chargeId) {
        return res.status(400).json({ message: "Charge ID is required" });
    }

    try {
        // ✅ เปลี่ยนมาใช้ axios ยิงตรงไปที่ Omise API
        // เหมือนกับการใช้คำสั่ง curl ที่คุณเคยส่งมา
        const omiseResponse = await axios.post(
            `https://api.omise.co/charges/${chargeId}/mark_as_paid`,
            {}, // body ว่างเปล่า
            {
                auth: {
                    username: process.env.OMISE_SECRET_KEY, // ใช้ Secret Key
                    password: '' // Password ปล่อยว่าง
                }
            }
        );

        // ถ้าสำเร็จ Omise จะส่ง status: 'successful' กลับมา
        if (omiseResponse.data.status === 'successful') {
            
            // อัปเดต Database ของเรา
            const updatedPayment = await Payment.findOneAndUpdate(
                { charge_id: chargeId },
                { status: 'success' }, 
                { new: true }
            );

            console.log(`[SIMULATION] Charge ${chargeId} marked as paid.`);

            return res.status(200).json({
                message: "Simulation Success",
                data: updatedPayment
            });
        } else {
            return res.status(400).json({ 
                message: "Omise status update failed", 
                omiseStatus: omiseResponse.data.status 
            });
        }

    } catch (error) {
        console.error("Simulation Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            message: "Simulation failed",
            detail: error.response ? error.response.data : error.message
        });
    }
};