// src/components/admin/VerifyTicketPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../../css/VerifyTicketPage.css';

const VerifyTicketPage = () => {
    const { bookingNumber: urlBookingNumber } = useParams();
    const [searchInput, setSearchInput] = useState(urlBookingNumber || '');
    const [loading, setLoading] = useState(false);
    const [verifyResult, setVerifyResult] = useState(null);
    const [error, setError] = useState(null);

    const checkTicket = async (bookingRef) => {
        if (!bookingRef) return;

        setLoading(true);
        setError(null);
        setVerifyResult(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

            // ✅ 1. ดึง Token จาก localStorage โดยใช้ Key 'jwtToken' ตามรูปภาพ
            const token = localStorage.getItem('jwtToken');

            // (ตัวเลือกเพิ่มเติม) หากต้องการใช้ข้อมูล user เพื่อแสดงผลชื่อพนักงานที่กำลังตรวจสอบ
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                console.log("พนักงานที่กำลังตรวจสอบ:", userData.name);
            }

            // 2. ตรวจสอบว่ามี Token หรือไม่
            if (!token) {
                setError("❌ ไม่พบ Token ในระบบ กรุณา Login ใหม่ (พนักงานต้อง Login ก่อนสแกน)");
                setLoading(false);
                return;
            }

            // 3. ส่ง Request ไปยัง API พร้อมกับ Authorization Header
            const response = await axios.get(`${apiUrl}/api/bookings/verify/${bookingRef}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setVerifyResult(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Verify Error:", err.response || err);

            if (err.response && err.response.status === 401) {
                setError("เซสชันหมดอายุ หรือคุณไม่มีสิทธิ์เข้าถึง (ต้องเป็น Admin เท่านั้น)");
            } else if (err.response && err.response.data) {
                setVerifyResult(err.response.data);
            } else {
                setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        if (urlBookingNumber) {
            checkTicket(urlBookingNumber);
        }
    }, [urlBookingNumber]);

    const handleSearch = (e) => {
        e.preventDefault();
        checkTicket(searchInput);
    };

    const formatTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="vf-verify-container" style={{ padding: '20px', color: '#fff' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '2rem' }}>ตรวจสอบสถานะตั๋ว</h2>

            {/* ซ่อนช่อง Search ถ้าสแกน QR มา (มี URL param) แต่โชว์ถ้ากดผ่านเมนู Admin */}
            {!urlBookingNumber && (
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '30px', maxWidth: '500px' }}>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="กรอกเลข Booking ID เช่น BK-123456"
                        style={{
                            flex: 1,
                            padding: '12px 15px',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            background: '#1e293b',
                            color: 'white',
                            outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            padding: '12px 25px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#8b5cf6',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                        disabled={loading || !searchInput}
                    >
                        {loading ? 'ตรวจสอบ...' : 'ค้นหา'}
                    </button>
                </form>
            )}

            {error && (
                <div style={{ background: '#ef4444', padding: '15px', borderRadius: '8px', marginBottom: '20px', maxWidth: '500px' }}>
                    <p style={{ margin: 0 }}>❌ {error}</p>
                </div>
            )}

            {verifyResult && verifyResult.status && (
                <div className={`vf-ticket-card vf-status-${verifyResult.status.toLowerCase()}`} style={{ maxWidth: '500px' }}>
                    <div className="vf-ticket-header">
                        <div className="vf-status-icon">
                            {verifyResult.status === 'VALID' && '✅'}
                            {verifyResult.status === 'EXPIRED' && '⚠️'}
                            {(verifyResult.status === 'NOT_FOUND' || verifyResult.status === 'CANCELLED') && '❌'}
                        </div>
                        <h1 className="vf-status-title">{verifyResult.message}</h1>
                        <p className="vf-booking-ref">Ref: {searchInput}</p>
                    </div>

                    {verifyResult.bookingInfo && (
                        <div className="vf-ticket-body">
                            <div className="vf-movie-info">
                                <h2 className="vf-movie-title">{verifyResult.bookingInfo.movieTitle}</h2>
                                <p className="vf-cinema-name">{verifyResult.bookingInfo.cinema} | {verifyResult.bookingInfo.auditorium}</p>
                            </div>

                            <div className="vf-time-info">
                                <div className="vf-time-box">
                                    <span className="vf-time-label">เวลาเริ่มฉาย</span>
                                    <span className="vf-time-value">{formatTime(verifyResult.bookingInfo.startTime)} น.</span>
                                </div>
                                <div className="vf-time-divider">-</div>
                                <div className="vf-time-box">
                                    <span className="vf-time-label">เวลาสิ้นสุด</span>
                                    <span className="vf-time-value">{formatTime(verifyResult.bookingInfo.endTime)} น.</span>
                                </div>
                            </div>

                            <div className="vf-seat-info">
                                <span className="vf-seat-label">ที่นั่ง ({verifyResult.bookingInfo.totalSeats || '-'} ที่นั่ง):</span>
                                <span className="vf-seat-value">{verifyResult.bookingInfo.seats || '-'}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VerifyTicketPage;