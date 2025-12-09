import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <<< นำเข้า useNavigate
import { createPromptPayQR, checkPaymentStatus } from '../api/paymentApi';
import Navbar from '../components/Navbar'; 
import { CheckCircle, RefreshCw, ArrowRight, XCircle, Clock } from 'lucide-react'; // เพิ่ม Clock icon
import '../css/paymentPage.css'; 

const PaymentPage = () => {
    const navigate = useNavigate();

    const [amount, setAmount] = useState('');
    const [qrCode, setQrCode] = useState(null);
    const [chargeId, setChargeId] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, pending, successful, failed
    const [loading, setLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(false); // สถานะสำหรับปุ่มตรวจสอบ

    const handleGenerateQR = async () => {
        if (!amount || amount <= 0) return alert("กรุณาระบุจำนวนเงิน");
        
        setLoading(true);
        setStatus('idle');
        try {
            const data = await createPromptPayQR(parseFloat(amount));
            setQrCode(data.qrCodeUrl); 
            setChargeId(data.chargeId);
            setStatus('pending'); 
        } catch (error) {
            console.error("Error creating QR:", error);
            alert("ไม่สามารถสร้าง QR Code ได้: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };
    
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
                    console.error("Error checking status via Polling", error);
                }
            }, 5000); 
        }
        return () => clearInterval(interval); 
    }, [chargeId, status]);

    const handleCheckAndProceed = async () => {
        if (!chargeId) return;
        
        if (status === 'successful') {
            navigate('/history'); // 🚀 นำทางไปที่ /history
            return;
        }

        setIsChecking(true);
        try {
            const data = await checkPaymentStatus(chargeId);
            
            if (data.status === 'successful') {
                setStatus('successful'); 
            } else {
                alert("⚠️ กรุณาชำระเงินตาม QR Code ก่อนดำเนินการต่อ!");
            }
        } catch (error) {
            console.error("Error checking status via Proceed Button:", error);
            alert("เกิดข้อผิดพลาดในการตรวจสอบสถานะ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsChecking(false);
        }
    };


    return (
        <div className="payment-page-container">
            
            <div className="payment-card-wrapper">
                <div className="payment-card">
                    
                    <div className="card-header">
                        <h2>ชำระเงินผ่าน PromptPay</h2>
                        <p>Secure Payment by Omise</p>
                    </div>
                    
                    <hr className="card-separator" />

                    {status === 'successful' ? (
                        <div className="success-state">
                            <CheckCircle size={80} color="#10B981" style={{ margin: '0 auto 20px' }} />
                            <h3>ชำระเงินสำเร็จ!</h3>
                            <p className="state-message">รายการจองของคุณได้รับการยืนยันแล้ว</p>
                            
                            <button 
                                onClick={handleCheckAndProceed} // จะนำทางไปที่ /history
                                className="btn-proceed"
                            >
                                ไปที่ประวัติการจอง <Clock size={20} style={{ marginLeft: '5px' }} />
                            </button>
                            
                        </div>
                    ) : status === 'failed' ? (
                        <div className="failed-state">
                            <XCircle size={80} color="#EF4444" style={{ margin: '0 auto 20px' }} />
                            <h3>ชำระเงินไม่สำเร็จ</h3>
                            <p className="state-message">รายการอาจหมดอายุหรือถูกยกเลิก กรุณาลองสร้างรายการใหม่</p>
                            <button 
                                onClick={() => window.location.reload()}
                                className="btn-proceed"
                                style={{ background: '#EF4444' }}
                            >
                                ลองอีกครั้ง
                            </button>
                        </div>
                    ) : (
                        <>
                            {!qrCode ? (
                                <div className="input-group">
                                    <div style={{ textAlign: 'left' }}>
                                        <label className="input-label">จำนวนเงิน (THB)</label>
                                        <input 
                                            type="number" 
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="input-field"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleGenerateQR}
                                        disabled={loading}
                                        className="btn-primary"
                                    >
                                        {loading ? "กำลังสร้าง..." : "สร้าง QR Code"}
                                    </button>
                                </div>
                            ) : (
                                <div className="qr-display-area">
                                    <div className="payment-summary">
                                        <p>ยอดชำระ: {amount} บาท</p>
                                    </div>

                                    <div className="qr-image-wrapper">
                                        <img src={qrCode} alt="PromptPay QR" className="qr-image" />
                                        
                                        <div className="polling-indicator">
                                            <RefreshCw size={20} color="#2563EB" className="spin-animation" />
                                        </div>
                                    </div>

                                    <p className="scan-instruction">
                                        กรุณาสแกนผ่านแอปธนาคาร<br/>
                                        ระบบจะตรวจสอบยอดเงินอัตโนมัติ...
                                    </p>

                                    <button 
                                        onClick={handleCheckAndProceed}
                                        className="btn-proceed" 
                                        disabled={isChecking}
                                        style={{ marginTop: '20px' }}
                                    >
                                        {isChecking ? (
                                            <>กำลังตรวจสอบสถานะ... <RefreshCw size={18} className="spin-animation" /></>
                                        ) : (
                                            <>ดำเนินการต่อ <ArrowRight size={20} style={{ marginLeft: '5px' }} /></>
                                        )}
                                    </button>
                                    
                                    <button 
                                        onClick={() => { setQrCode(null); setStatus('idle'); }}
                                        className="btn-cancel"
                                    >
                                        ยกเลิกรายการ
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;