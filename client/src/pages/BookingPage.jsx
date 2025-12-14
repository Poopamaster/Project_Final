import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createPromptPayQR, checkPaymentStatus } from '../api/paymentApi';
import { CheckCircle, RefreshCw } from 'lucide-react'; 
import '../css/BookingPage.css';

const BookingPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { movie } = location.state || {};
    
    const seatSectionRef = useRef(null);
    const paymentSectionRef = useRef(null); 

    // State การจอง
    const [selectedDate, setSelectedDate] = useState(0);
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    
    // State สำหรับการจ่ายเงิน
    const [showPayment, setShowPayment] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [chargeId, setChargeId] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, pending, successful, failed
    const [loadingQR, setLoadingQR] = useState(false);

    // ข้อมูลจำลอง
    const dates = [
        { day: 'วันนี้', date: '7 ต.ค.' },
        { day: 'พุธ', date: '8 ต.ค.' },
        { day: 'พฤหัส', date: '9 ต.ค.' },
        { day: 'ศุกร์', date: '10 ต.ค.' },
        { day: 'เสาร์', date: '11 ต.ค.' },
    ];
    const showtimes = ["18:00", "20:00", "22:00"];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];

    if (!movie) return <div className="error-msg">ไม่พบข้อมูลภาพยนตร์</div>;

    // --- Logic การเลือกที่นั่ง ---
    const handleTimeSelect = (time) => {
        setSelectedTime(time);
        setSelectedSeats([]);
        setShowPayment(false);
        setQrCode(null);
        setStatus('idle');
        setTimeout(() => {
            seatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const toggleSeat = (seatId) => {
        if (selectedSeats.includes(seatId)) {
            setSelectedSeats(selectedSeats.filter(id => id !== seatId));
        } else {
            setSelectedSeats([...selectedSeats, seatId]);
        }
        setShowPayment(false);
        setQrCode(null);
        setStatus('idle');
    };

    const getSeatPrice = (seatId) => {
        const row = seatId.charAt(0);
        return ['A', 'B', 'C'].includes(row) ? 150 : 200;
    };

    const totalPrice = selectedSeats.reduce((sum, seatId) => sum + getSeatPrice(seatId), 0);

    // --- สร้าง QR Code ---
    const handleProceed = async () => {
        setLoadingQR(true);
        setShowPayment(true);
        setStatus('pending'); 

        setTimeout(() => {
            paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

        try {
            // ใช้ ID จำลองที่ถูกต้อง (24 ตัวอักษร)
            const mockValidBookingId = "6578a9b1c2d3e4f5a6b7c8d9";
            const data = await createPromptPayQR(totalPrice, mockValidBookingId);
            setQrCode(data.qrCodeUrl);
            setChargeId(data.chargeId);
        } catch (error) {
            console.error("QR Error:", error);
            alert("สร้าง QR Code ไม่สำเร็จ");
            setShowPayment(false);
        } finally {
            setLoadingQR(false);
        }
    };

    // --- เช็คสถานะการจ่ายเงิน (Polling) ---
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
                    console.error("Error polling status:", error);
                }
            }, 5000); 
        }
        return () => clearInterval(interval);
    }, [chargeId, status]);

    const handleCancel = () => {
        setShowPayment(false);
        setQrCode(null);
        setChargeId(null);
        setStatus('idle');
        seatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    return (
        <div className="page-container">
            <Navbar />
            
            <div className="booking-content">
                {/* Header หนัง */}
                <div className="movie-header-card">
                    <div className="poster-area">
                        <img src={movie.image} alt={movie.title} className="poster-img-fixed" />
                    </div>
                    <div className="info-area">
                        <h1>{movie.title}</h1>
                        <p className="meta-text">หมวดหมู่: {movie.category} | ⏱ {movie.duration}</p>
                        <button className="btn-outline">รายละเอียดภาพยนตร์</button>
                    </div>
                </div>

                {/* Steps */}
                <div className="steps-container">
                    <div className="step active"><div className="step-num">1</div><span>เลือกรอบฉาย</span></div>
                    <div className={`stepline ${selectedTime ? 'active' : ''}`}></div>
                    <div className={`step ${selectedTime ? 'active' : ''}`}><div className="step-num">2</div><span>เลือกที่นั่ง</span></div>
                    <div className={`stepline ${showPayment ? 'active' : ''}`}></div>
                    <div className={`step ${showPayment ? 'active' : ''}`}><div className="step-num">3</div><span>ชำระเงิน</span></div>
                </div>

                {/* Date & Time Selection */}
                <div className="selection-card">
                    <div className="date-scroll-wrapper">
                        <button className="nav-btn">{'<'}</button>
                        <div className="dates-list">
                            {dates.map((item, index) => (
                                <div key={index} className={`date-item ${selectedDate === index ? 'active' : ''}`} onClick={() => setSelectedDate(index)}>
                                    <span className="day-name">{item.day}</span><span className="date-num">{item.date}</span>
                                </div>
                            ))}
                        </div>
                        <button className="nav-btn">{'>'}</button>
                    </div>
                    <hr className="divider" />
                    <div className="time-selection-area">
                         <div className="times-list">
                            {showtimes.map((time) => (
                                <button key={time} className={`time-btn ${selectedTime === time ? 'active' : ''}`} onClick={() => handleTimeSelect(time)}>{time}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Seat Selection */}
                {selectedTime && (
                    <div className="seat-section-wrapper" ref={seatSectionRef}>
                        <div className="seat-layout-card">
                            <div className="screen-bar">จอภาพยนตร์</div>
                            <div className="seats-container">
                                {rows.map((row) => (
                                    <div key={row} className="seat-row">
                                        <span className="row-name">{row}</span>
                                        {Array.from({ length: 10 }, (_, i) => {
                                            const seatId = `${row}${i + 1}`;
                                            const seatType = ['A','B','C'].includes(row) ? 'executive' : 'standard';
                                            return <div key={seatId} className={`seat-icon ${seatType} ${selectedSeats.includes(seatId) ? 'selected' : ''}`} onClick={() => toggleSeat(seatId)}></div>;
                                        })}
                                        <span className="row-name">{row}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="seat-legend">
                                <div className="legend-item"><div className="seat-icon executive"></div> <span>Executive 150.-</span></div>
                                <div className="legend-item"><div className="seat-icon standard"></div> <span>General 200.-</span></div>
                            </div>
                        </div>

                        <div className="booking-summary-card">
                            <h3>{movie.title}</h3>
                            <div className="summary-info"><p>📅 {dates[selectedDate].date}</p><p>⏰ {selectedTime}</p><p>📍 Cinema สาขา 1</p></div>
                            <div className="summary-box">
                                <div className="summary-row"><span>ที่นั่งที่เลือก</span><span className="highlight-text">{selectedSeats.length > 0 ? selectedSeats.join(', ') : '-'}</span></div>
                                <div className="summary-row total"><span>ราคารวม</span><span>{totalPrice} บาท</span></div>
                            </div>
                            
                            {!showPayment && (
                                <button className="confirm-btn" disabled={selectedSeats.length === 0} onClick={handleProceed}>
                                    ดำเนินการต่อ
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* --- 🟢 ส่วนที่แก้ไข: Payment Section --- */}
                {showPayment && (
                    <div className="payment-section-container" ref={paymentSectionRef} style={{ marginTop: '30px', animation: 'fadeIn 0.5s', width: '100%' }}>
                        <div style={{ 
                            background: 'white', 
                            padding: '30px', 
                            borderRadius: '15px', 
                            boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
                            display: 'flex',       
                            flexDirection: 'row',  
                            gap: '40px',           
                            alignItems: 'stretch',  // 🟢 1. บังคับให้ซ้ายขวาสูงเท่ากัน
                            justifyContent: 'space-between',
                            maxWidth: '100%',     
                            width: '100%',
                            minHeight: '350px',     // 🟢 2. กำหนดความสูงขั้นต่ำ เพื่อไม่ให้กล่องดูหดสั้น
                            boxSizing: 'border-box' 
                        }}>
                            
                            {/* 👈 ฝั่งซ้าย: ข้อมูล */}
                            <div style={{ flex: 1, textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                                <h2 style={{ color: '#000', marginBottom: '10px', fontSize: '1.8rem' }}>ชำระเงินผ่าน PromptPay</h2>
                                <p style={{ color: '#888', fontSize: '1rem', marginBottom: 'auto' }}>Secure Payment by Omise</p>
                                
                                <div style={{ background: '#ECFDF5', padding: '25px', borderRadius: '15px', margin: '20px 0', border: '1px solid #10B981' }}>
                                    <h3 style={{ color: '#047857', margin: 0, fontSize: '1.5rem' }}>ยอดชำระ: {totalPrice} บาท</h3>
                                </div>
                                <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                    {status === 'successful' 
                                        ? "การชำระเงินเสร็จสมบูรณ์ ขอบคุณที่ใช้บริการ"
                                        : "กรุณาสแกน QR Code ผ่านแอปพลิเคชันธนาคาร\nระบบจะทำการตรวจสอบยอดเงินโดยอัตโนมัติ"}
                                </p>
                            </div>

                            {/* 👉 ฝั่งขวา: QR หรือ Success */}
                            <div style={{ 
                                flex: 1, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center', // จัดกึ่งกลางแนวตั้งเสมอ
                                borderLeft: '1px solid #eee', 
                                paddingLeft: '40px'
                            }}>
                                
                                {loadingQR && (
                                    <div style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <RefreshCw size={24} className="spin-animation" /> กำลังสร้าง QR Code...
                                    </div>
                                )}

                                {/* แสดง QR Code */}
                                {!loadingQR && status === 'pending' && qrCode && (
                                    <div style={{ textAlign: 'center', width: '100%' }}>
                                        <div style={{ 
                                            padding: '10px', 
                                            background: 'white', 
                                            borderRadius: '15px', 
                                            border: '1px solid #eee', 
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                            marginBottom: '15px',
                                            display: 'inline-block'
                                        }}>
                                            <img src={qrCode} alt="PromptPay QR" style={{ width: '200px', display: 'block', borderRadius: '10px' }} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#2563EB', fontSize: '0.9rem', marginBottom: '15px' }}>
                                            <RefreshCw size={16} className="spin-animation" /> กำลังรอการชำระเงิน...
                                        </div>
                                        <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#EF4444', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            ยกเลิกรายการ
                                        </button>
                                    </div>
                                )}

                                {/* แสดงผลสำเร็จ */}
                                {status === 'successful' && (
                                    <div style={{ animation: 'popIn 0.5s ease-out', textAlign: 'center' }}>
                                        <div style={{ marginBottom: '20px' }}>
                                            <CheckCircle size={90} color="#10B981" fill="#D1FAE5" /> 
                                        </div>
                                        <h3 style={{ color: '#10B981', fontSize: '1.6rem', marginBottom: '10px' }}>ชำระเงินสำเร็จ!</h3>
                                        <p style={{ color: '#6B7280', marginBottom: '25px' }}>รายการจองได้รับการยืนยัน</p>
                                        
                                        <button 
                                            onClick={() => navigate('/history')}
                                            style={{ 
                                                padding: '12px 30px', 
                                                background: '#2563EB', 
                                                color: 'white', 
                                                border: 'none', 
                                                borderRadius: '10px', 
                                                fontWeight: 'bold', 
                                                fontSize: '1rem',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
                                                transition: 'transform 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            ไปที่ประวัติการจอง
                                        </button>
                                    </div>
                                )}

                                {status === 'failed' && (
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ color: '#EF4444', marginBottom: '15px', fontSize: '1.1rem' }}>รายการหมดอายุ</p>
                                        <button onClick={handleProceed} style={{ padding: '10px 25px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                            ลองใหม่อีกครั้ง
                                        </button>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingPage;