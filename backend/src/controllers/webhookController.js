// src/controllers/webhookController.js
const systemLog = require('../utils/logger'); // ✅ 1. นำเข้า Logger

exports.handleOmiseWebhook = async (req, res) => {
    // Omise จะส่ง Event Object มาให้
    const event = req.body;

    // 📝 2. Log เบื้องต้นว่าได้รับ Webhook แล้ว (ใช้ INFO)
    // เราเก็บ event.key ไว้ดูว่าเป็น event ประเภทไหน (เช่น charge.complete)
    console.log("Webhook Received:", event.key);

    try {
        if (event.key === 'charge.complete') {
            const charge = event.data;
            const chargeId = charge.id;
            const amount = charge.amount / 100; // แปลงหน่วยสตางค์เป็นบาท

            if (charge.status === 'successful') {
                // ✅ กรณีชำระเงินสำเร็จ
                console.log(`Charge ID: ${chargeId} ชำระเงินสำเร็จแล้ว!`);

                // 📝 3. บันทึก Log: เงินเข้าจริงจาก Gateway
                await systemLog({
                    level: 'INFO',
                    actor: { role: 'SYSTEM', name: 'Omise Webhook' }, // ระบุว่าเป็นการกระทำโดยระบบ
                    context: { action: 'update', table: 'payments', target_id: chargeId },
                    note: `[Webhook] ชำระเงินสำเร็จแล้ว! จำนวน ${amount} THB (Charge: ${chargeId})`,
                    content: { status: charge.status, event_id: event.id },
                    req: req
                }).catch(err => console.error("Webhook Success Log Error:", err));

                // TODO: Update Database ของคุณ (เช่น Order.status = 'paid')
                // และสั่ง Emit WebSocket ไปบอกหน้าบ้าน
            } 
            else if (charge.status === 'failed') {
                // ❌ กรณีชำระเงินไม่สำเร็จ (เช่น บัตรโดนปฏิเสธ หรือ QR หมดอายุ)
                await systemLog({
                    level: 'WARN',
                    actor: { role: 'SYSTEM', name: 'Omise Webhook' },
                    context: { action: 'update', table: 'payments', target_id: chargeId },
                    note: `[Webhook] การชำระเงินล้มเหลว: ${charge.failure_message || 'Unknown reason'}`,
                    content: { charge_id: chargeId, failure_code: charge.failure_code },
                    req: req
                }).catch(() => {});
            }
        } else {
            // กรณีเป็น Event อื่นๆ ที่เรายังไม่ได้ Handle (เช่น refund.create)
            // เก็บไว้ดูเป็นข้อมูลเฉยๆ ไม่ต้องซีเรียส
            console.log(`Received unhandled event: ${event.key}`);
        }

        // 4. ต้องตอบกลับ 200 OK เสมอ เพื่อบอก Omise ว่าได้รับเรื่องแล้ว
        res.status(200).send('OK');

    } catch (error) {
        // 📝 5. บันทึก Log: กรณี Code ใน Webhook เราพังเอง (เช่น Update DB ไม่ได้)
        // จุดนี้สำคัญมาก เพราะ Omise จะไม่รู้ว่าเราพัง เขาจะส่งซ้ำมาเรื่อยๆ
        await systemLog({
            level: 'ERROR',
            actor: { role: 'SYSTEM', name: 'Omise Webhook' },
            context: { action: 'update', table: 'payments' },
            note: `[Webhook Error] เกิดข้อผิดพลาดขณะประมวลผล: ${error.message}`,
            req: req
        }).catch(() => {});

        console.error("Webhook Processing Error:", error);
        // ถึงจะ Error เราก็ควรส่ง 200 หรือ 500 ตามความเหมาะสม (แต่ส่วนใหญ่ส่ง 200 เพื่อหยุดการยิงซ้ำจาก Gateway ถ้าเราแก้เองได้)
        res.status(500).json({ message: "Internal Webhook Error" });
    }
};