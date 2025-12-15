import React, { useState, useEffect } from 'react';
import { createPromptPayQR, checkPaymentStatus, simulatePaymentSuccess } from '../api/paymentApi';
import { CheckCircle, RefreshCw, CheckSquare } from 'lucide-react';
import '../css/PaymentSection.css'; // ✅ Import CSS ที่นี่

const PaymentSection = ({ amount, bookingId, onComplete, onCancel }) => {
    const [qrCode, setQrCode] = useState(null);
    const [chargeId, setChargeId] = useState(null);
    const [status, setStatus] = useState('pending'); // pending, successful, failed
    const [loadingQR, setLoadingQR] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);

    // 1. เริ่มสร้าง QR Code
    useEffect(() => {
        // ✅ เช็คก่อนว่ามี bookingId หรือไม่ ถ้าไม่มีให้หยุดและแจ้ง Error
        if (!bookingId) {
            console.error("❌ Missing bookingId in PaymentSection");
            return;
        }

        const generateQR = async () => {
            try {
                setLoadingQR(true);
                
                // ✅ ส่ง bookingId ของจริงไปที่ API
                const data = await createPromptPayQR(amount, bookingId);
                
                setQrCode(data.qrCodeUrl);
                setChargeId(data.chargeId);
                setLoadingQR(false);
            } catch (error) {
                console.error("QR Error:", error);
                alert("สร้าง QR Code ไม่สำเร็จ: " + (error.response?.data?.message || error.message));
                onCancel();
            }
        };

        generateQR();
    }, [amount, bookingId, onCancel]); // ✅ เพิ่ม bookingId ใน Dependency array

    // 2. Polling Check Status
    useEffect(() => {
        let interval;
        if (chargeId && status === 'pending') {
            interval = setInterval(async () => {
                try {
                    const data = await checkPaymentStatus(chargeId);
                    if (data.status === 'successful') {
                        setStatus('successful');
                        clearInterval(interval);
                    } else if (data.status === 'failed' || data.status === 'expired') {
                        setStatus('failed');
                        clearInterval(interval);
                    }
                } catch (error) {
                    console.error("Polling Error:", error);
                }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [chargeId, status]);

    // 3. Demo Manual Complete
    const handleManualComplete = async () => {
        if (!chargeId) return;
        setIsSimulating(true);
        try {
            await simulatePaymentSuccess(chargeId);
            setStatus('successful');
        } catch (error) {
            console.warn("Simulation Error:", error);
            setStatus('successful'); // Fallback ในกรณี Demo
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <div className="payment-card">
            
            {/* 👈 ฝั่งซ้าย: ข้อมูล */}
            <div className="payment-info-side">
                <h2 className="payment-title">ชำระเงินผ่าน PromptPay</h2>
                <p className="payment-subtitle">Secure Payment by Omise</p>
                
                <div className="amount-box">
                    <h3 className="amount-text">ยอดชำระ: {amount} บาท</h3>
                </div>
                <p className="instruction-text">
                    {status === 'successful' 
                        ? "การชำระเงินเสร็จสมบูรณ์ ขอบคุณที่ใช้บริการ"
                        : "กรุณาสแกน QR Code ผ่านแอปพลิเคชันธนาคาร\nระบบจะทำการตรวจสอบยอดเงินโดยอัตโนมัติ"}
                </p>
            </div>

            {/* 👉 ฝั่งขวา: QR หรือ Success */}
            <div className="payment-action-side">
                
                {loadingQR && (
                    <div className="loading-state">
                        <RefreshCw size={24} className="spin-animation" /> กำลังสร้าง QR Code...
                    </div>
                )}

                {/* แสดง QR Code */}
                {!loadingQR && status === 'pending' && qrCode && (
                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <div className="qr-wrapper">
                            <img src={qrCode} alt="PromptPay QR" className="qr-image" />
                        </div>
                        <div className="waiting-text">
                            <RefreshCw size={16} className="spin-animation" /> กำลังรอการชำระเงิน...
                        </div>

                        {/* ✅ ปุ่ม Demo */}
                        <button 
                            className="btn-demo"
                            onClick={handleManualComplete}
                            disabled={isSimulating}
                        >
                            {isSimulating ? "กำลังบันทึก..." : <>ดำเนินการต่อ<CheckSquare size={16} /></>}
                        </button>

                        <button onClick={onCancel} className="btn-cancel">
                            ยกเลิกรายการ
                        </button>
                    </div>
                )}

                {/* แสดงผลสำเร็จ */}
                {status === 'successful' && (
                    <div className="success-container">
                        <div style={{ marginBottom: '20px' }}>
                            <CheckCircle size={90} color="#10B981" fill="#D1FAE5" /> 
                        </div>
                        <h3 className="success-title">ชำระเงินสำเร็จ!</h3>
                        <p className="success-desc">รายการจองได้รับการยืนยัน</p>
                        
                        <button className="btn-history" onClick={onComplete}>
                            ไปที่ประวัติการจอง
                        </button>
                    </div>
                )}

                {/* แสดงผลล้มเหลว */}
                {status === 'failed' && (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#EF4444', marginBottom: '15px', fontSize: '1.1rem' }}>รายการหมดอายุ</p>
                        <button onClick={() => window.location.reload()} className="btn-retry">
                            ลองใหม่อีกครั้ง
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSection;