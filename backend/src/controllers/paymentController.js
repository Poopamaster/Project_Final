const omiseService = require('../services/paymentService'); // เรียกใช้ Service
const saveLog = require('../utils/logger'); // ✅ นำเข้า logger มาใช้งาน

exports.createPromptPayQR = async (req, res) => {
    try {
        const { amount, bookingId } = req.body;
        
        // เรียกใช้ Service
        const result = await omiseService.createPromptPayQR(amount, bookingId);

        // ✅ บันทึก Log: เมื่อลูกค้าขอสร้าง QR Code เพื่อจ่ายเงิน
        await saveLog({
            req,
            action: 'create',
            table: 'Payment',
            targetId: bookingId,
            newVal: { amount: amount, method: 'PromptPay' },
            note: `ลูกค้าสร้าง QR Code สำหรับชำระเงินยอด ${amount} บาท (Booking: ${bookingId})`
        });

        res.status(200).json({
            message: "สร้าง QR Code และบันทึกรายการสำเร็จ",
            qrCodeUrl: result.qrCodeUrl,
            chargeId: result.chargeId
        });

    } catch (error) {
        console.error("Create QR Error:", error.message);
        res.status(400).json({ message: error.message });
    }
};

exports.checkChargeStatus = async (req, res) => {
    try {
        const { chargeId } = req.params;

        // เรียกใช้ Service
        const result = await omiseService.checkChargeStatus(chargeId);

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

        // ✅ บันทึก Log: เมื่อระบบจำลองการจ่ายเงินสำเร็จ
        await saveLog({
            req: { user: { email: 'Payment_Simulator', role: 'ai' } }, // ระบุว่าเป็น AI/System Action
            action: 'update',
            table: 'Payment',
            targetId: chargeId,
            newVal: { status: 'successful' },
            note: `ระบบจำลองสถานะชำระเงินสำเร็จ (Charge ID: ${chargeId})`
        });

        console.log(`[SIMULATION] Charge ${chargeId} marked as paid.`);
        
        res.status(200).json({
            message: "Simulation Success",
            data: updatedPayment
        });

    } catch (error) {
        console.error("Simulation Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            message: "Simulation failed",
            detail: error.message
        });
    }
};