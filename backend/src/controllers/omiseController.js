const omise = require('omise')({
    'publicKey': process.env.OMISE_PUBLIC_KEY,
    'secretKey': process.env.OMISE_SECRET_KEY
});

exports.createPromptPayQR = async (req, res) => {
    // ใช้ parseFloat เพื่อให้มั่นใจว่าเป็นตัวเลขเสมอ
    const amountFloat = parseFloat(req.body.amount); 

    // 💡 การตรวจสอบความถูกต้องเบื้องต้น
    if (isNaN(amountFloat) || amountFloat < 20) {
         return res.status(400).json({ 
             message: "กรุณาใส่จำนวนเงินที่ถูกต้อง (ขั้นต่ำ 20 บาท)" 
         });
    }

    // แปลงเป็นหน่วยสตางค์ (Integer)
    const amountInSatang = Math.round(amountFloat * 100); 

    try {
        // *** 1. สร้าง Charge โดยระบุ Source Type เป็น PromptPay ทันที ***
        // Omise Library จะสร้าง Source และ Charge ให้ใน API Call เดียว
        const charge = await omise.charges.create({
            amount: amountInSatang, // ต้องเป็น Integer (สตางค์)
            currency: 'THB',
            // *** ส่ง Source Object เข้าไปใน Charge API เลย (วิธีที่ถูกต้องสำหรับ PromptPay) ***
            source: {
                type: 'promptpay'
            },
            return_uri: 'http://localhost:5173/payment/success' 
        });
        
        // ตรวจสอบสถานะการสร้าง
        if (!charge.source || !charge.source.scannable_code) {
             console.error("Omise Response Missing QR Data:", charge);
             return res.status(500).json({ message: "Omise สร้าง Charge แต่ไม่พบ QR Code" });
        }

        // 2. ส่ง QR Code URL กลับไปให้ Frontend
        // charge.source.scannable_code.image.download_uri คือรูป QR Code
        res.status(200).json({
            qrCodeUrl: charge.source.scannable_code.image.download_uri,
            chargeId: charge.id, // เก็บไว้เช็คสถานะ
            message: "สร้าง QR Code สำเร็จ"
        });

    } catch (error) {
        // เพิ่ม Log ตรงนี้เพื่อดูปัญหา (Block นี้ถูกต้องแล้ว)
        console.error("================ OMISE ERROR ================");
        console.error("Message:", error.message);
        if (error.response) {
            // Error Code ที่มาจาก Omise โดยตรง
            console.error("Omise Detail:", error.response.data); 
            
            // ส่งข้อความ Error ที่ชัดเจนให้ Frontend (เช่น 'authentication_failure')
             return res.status(400).json({ 
                message: error.response.data.message || "Omise API Error" 
             });
        }
        console.error("============================================");

        res.status(500).json({ message: "สร้าง QR ไม่สำเร็จ: " + error.message });
    }
};

exports.checkChargeStatus = async (req, res) => {
    const { chargeId } = req.params;

    try {
        // เรียก Omise API เพื่อดูสถานะล่าสุดของ Charge นี้
        const charge = await omise.charges.retrieve(chargeId);

        // ส่งสถานะกลับไป (pending, successful, failed)
        res.status(200).json({
            status: charge.status,
            amount: charge.amount / 100 // แปลงกลับเป็นบาท
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};