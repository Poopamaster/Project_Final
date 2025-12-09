// src/controllers/webhookController.js

exports.handleOmiseWebhook = async (req, res) => {
    // Omise จะส่ง Event Object มาให้
    const event = req.body;

    console.log("Webhook Received:", event.key);

    if (event.key === 'charge.complete') {
        const charge = event.data;
        
        if (charge.status === 'successful') {
            // ✅ เงินเข้าแล้ว! 
            // TODO: Update Database ของคุณ (เช่น Order.status = 'paid')
            console.log(`Charge ID: ${charge.id} ชำระเงินสำเร็จแล้ว!`);
            
            // ถ้าทำ WebSocket ก็ emit event บอก Frontend ตรงนี้ได้เลย
        }
    }

    // ต้องตอบกลับ 200 OK เสมอ เพื่อบอก Omise ว่าได้รับเรื่องแล้ว
    res.status(200).send('OK');
};