import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../css/BookingPage.css';

const BookingPage = () => {
    const location = useLocation();
    const { movie } = location.state || {};
    const seatSectionRef = useRef(null);

    const [selectedDate, setSelectedDate] = useState(0);
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);

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

    const handleTimeSelect = (time) => {
        setSelectedTime(time);
        setSelectedSeats([]);
        // เลื่อนลงไปหาที่นั่งอัตโนมัติ
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
    };

    return (
        <div className="page-container">
            <Navbar />
            
            <div className="booking-content">
                
                {/* --- ส่วนที่ 1: รายละเอียดหนัง (กล่องขาวใหญ่ด้านบน) --- */}
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

                {/* --- Steps Indicator --- */}
                <div className="steps-container">
                    <div className="step active">
                        <div className="step-num">1</div>
                        <span>เลือกรอบฉาย</span>
                    </div>
                    <div className={`stepline ${selectedTime ? 'active' : ''}`}></div>
                    <div className={`step ${selectedTime ? 'active' : ''}`}>
                        <div className="step-num">2</div>
                        <span>เลือกที่นั่ง</span>
                    </div>
                    <div className="stepline"></div>
                    <div className="step">
                        <div className="step-num">3</div>
                        <span>ชำระเงิน</span>
                    </div>
                </div>

                {/* --- ส่วนที่ 2: เลือกวันและเวลา (กล่องขาว) --- */}
                <div className="selection-card">
                    {/* เลือกวันที่ */}
                    <div className="date-scroll-wrapper">
                        <button className="nav-btn">{'<'}</button>
                        <div className="dates-list">
                            {dates.map((item, index) => (
                                <div 
                                    key={index} 
                                    className={`date-item ${selectedDate === index ? 'active' : ''}`}
                                    onClick={() => setSelectedDate(index)}
                                >
                                    <span className="day-name">{item.day}</span>
                                    <span className="date-num">{item.date}</span>
                                </div>
                            ))}
                        </div>
                        <button className="nav-btn">{'>'}</button>
                    </div>

                    <hr className="divider" />

                    {/* เลือกรอบฉาย */}
                    <div className="time-selection-area">
                        <div className="cinema-label">
                            <span className="icon-popcorn">🍿</span>
                            <div>
                                <strong>Cinema สาขา 1</strong>
                                <span className="sub-text">TH | ENG</span>
                            </div>
                        </div>
                        <div className="times-list">
                            {showtimes.map((time) => (
                                <button
                                    key={time}
                                    className={`time-btn ${selectedTime === time ? 'active' : ''}`}
                                    onClick={() => handleTimeSelect(time)}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- ส่วนที่ 3: เลือกที่นั่ง (จะโผล่มาเมื่อเลือกเวลาแล้ว) --- */}
                {selectedTime && (
                    <div className="seat-section-wrapper" ref={seatSectionRef}>
                        
                        {/* ฝั่งซ้าย: ผังที่นั่ง */}
                        <div className="seat-layout-card">
                            <div className="screen-bar">จอภาพยนตร์</div>
                            
                            <div className="seats-container">
                                {rows.map((row) => (
                                    <div key={row} className="seat-row">
                                        <span className="row-name">{row}</span>
                                        {Array.from({ length: 10 }, (_, i) => {
                                            const seatId = `${row}${i + 1}`;
                                            const isSelected = selectedSeats.includes(seatId);
                                            // สมมติแถว D,E,F เป็นราคาถูก (สีเหลือง), A,B,C แพง (สีแดง)
                                            const seatType = ['A','B','C'].includes(row) ? 'executive' : 'standard';
                                            
                                            return (
                                                <div 
                                                    key={seatId}
                                                    className={`seat-icon ${seatType} ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => toggleSeat(seatId)}
                                                >
                                                </div>
                                            );
                                        })}
                                        <span className="row-name">{row}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="seat-legend">
                                <div className="legend-item"><div className="seat-icon standard"></div> <span>General 150.-</span></div>
                                <div className="legend-item"><div className="seat-icon executive"></div> <span>Executive 250.-</span></div>
                            </div>
                        </div>

                        {/* ฝั่งขวา: สรุปข้อมูล */}
                        <div className="booking-summary-card">
                            <h3>{movie.title}</h3>
                            <div className="summary-info">
                                <p>📅 {dates[selectedDate].date}</p>
                                <p>⏰ {selectedTime}</p>
                                <p>📍 Cinema สาขา 1</p>
                            </div>
                            
                            <div className="summary-box">
                                <div className="summary-row">
                                    <span>ที่นั่งที่เลือก</span>
                                    <span className="highlight-text">{selectedSeats.length > 0 ? selectedSeats.join(', ') : '-'}</span>
                                </div>
                                <div className="summary-row total">
                                    <span>ราคารวม</span>
                                    <span>{selectedSeats.length * 200} บาท</span>
                                </div>
                            </div>

                            <button className="confirm-btn" disabled={selectedSeats.length === 0}>
                                ดำเนินการต่อ
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingPage;