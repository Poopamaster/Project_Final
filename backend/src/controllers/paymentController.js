// src/controllers/omiseController.js
const omiseService = require('../services/paymentService'); // เรียกใช้ Service
const systemLog = require('../utils/logger'); // ✅ 1. นำเข้า Logger

exports.createPromptPayQR = async (req, res) => {
    try {
        const { amount, bookingId } = req.body;
        
        // เรียกใช้ Service
        const result = await omiseService.createPromptPayQR(amount, bookingId);

        // 📝 2. บันทึก Log: สร้าง QR Code สำหรับชำระเงิน
        systemLog({
            level: 'INFO',
            actor: req.user, // User ที่กำลังจะจ่ายเงิน
            context: { action: 'create', table: 'payments', target_id: bookingId },
            note: `สร้าง QR Code PromptPay สำหรับการจอง ID: ${bookingId}`,
            content: { amount, chargeId: result.chargeId },
            req: req
        }).catch(err => console.error("Create QR Log Error:", err));

        res.status(200).json({
            message: "สร้าง QR Code และบันทึกรายการสำเร็จ",
            qrCodeUrl: result.qrCodeUrl,
            chargeId: result.chargeId
        });

    } catch (error) {
        // 📝 3. บันทึก Log: สร้าง QR Code พลาด
        systemLog({
            level: 'ERROR',
            actor: req.user,
            context: { action: 'create', table: 'payments' },
            note: `สร้าง QR Code ไม่สำเร็จ: ${error.message}`,
            req: req
        }).catch(() => {});

        console.error("Create QR Error:", error.message);
        res.status(400).json({ message: error.message });
    }
};

exports.checkChargeStatus = async (req, res) => {
    try {
        const { chargeId } = req.params;

        // เรียกใช้ Service
        const result = await omiseService.checkChargeStatus(chargeId);

        // 💡 เราไม่เก็บ Log ตรงนี้ เพราะ Frontend อาจจะยิง API นี้รัวๆ ทุกๆ 3 วินาทีเพื่อรอสถานะ
        // ถ้าเก็บ Log DB จะบวมมหาศาลครับ

        res.status(200).json({
            status: result.omiseStatus,
            amount: result.amount,
            dbStatus: result.dbStatus
        });

    } catch (error) {
        console.error("Check Status Error:", error.message);
        res.status(500).json({ message: error.message });
    }
};

exports.simulatePaymentSuccess = async (req, res) => {
    try {
        const { chargeId } = req.body;

        // เรียกใช้ Service
        const updatedPayment = await omiseService.simulatePaymentSuccess(chargeId);

        console.log(`[SIMULATION] Charge ${chargeId} marked as paid.`);

        // 📝 4. บันทึก Log: การจำลองจ่ายเงิน (สำคัญมาก ต้องใช้ระดับ WARN)
        systemLog({
            level: 'WARN', // ใช้ WARN เพราะเป็นการ Bypass ระบบจ่ายเงินจริง
            actor: req.user,
            context: { action: 'update', table: 'payments', target_id: chargeId },
            note: `[SIMULATION] จำลองการชำระเงินสำเร็จ Charge ID: ${chargeId}`,
            req: req
        }).catch(err => console.error("Simulation Log Error:", err));
        
        res.status(200).json({
            message: "Simulation Success",
            data: updatedPayment
        });

    } catch (error) {
        // 📝 5. บันทึก Log: Simulation พลาด
        systemLog({
            level: 'ERROR',
            actor: req.user,
            context: { action: 'update', table: 'payments', target_id: req.body.chargeId },
            note: `[SIMULATION] จำลองการชำระเงินขัดข้อง: ${error.message}`,
            req: req
        }).catch(() => {});

        console.error("Simulation Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            message: "Simulation failed",
            detail: error.message
        });
    }
};