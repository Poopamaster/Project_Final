import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PaymentSection from '../components/PaymentSection';
import '../css/BookingPage.css'; // ✅ ใช้ CSS เดิมของคุณ

// Import API
import { getShowtimesByMovieId, getReservedSeats, getSeatsByShowtimeId } from '../api/showtimeApi';
import { createBooking } from '../api/bookingApi';

const BookingPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { movie } = location.state || {};

    const seatSectionRef = useRef(null);
    const paymentSectionRef = useRef(null);

    // --- State ---
    const [dates, setDates] = useState([]);
    const [selectedDateIndex, setSelectedDateIndex] = useState(0);

    const [allShowtimes, setAllShowtimes] = useState([]);
    const [currentShowtimes, setCurrentShowtimes] = useState([]);
    const [selectedShowtime, setSelectedShowtime] = useState(null);

    // ✅ State สำหรับระบบที่นั่ง Database Driven
    const [allSeats, setAllSeats] = useState([]);
    const [reservedSeats, setReservedSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);

    const [bookingId, setBookingId] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // 0. Redirect ถ้าไม่มีข้อมูลหนัง
    useEffect(() => {
        if (!movie) navigate('/');
    }, [movie, navigate]);

    // 1. Init: Generate วันที่ & Fetch Showtimes
    useEffect(() => {
        if (!movie) return;

        const today = new Date();
        const next7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + i);

            // ✅ แก้ไข: ประกอบ YYYY-MM-DD เองตามเวลาเครื่อง (Local Time) ป้องกันปัญหา Timezone
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');

            return {
                fullDate: `${year}-${month}-${day}`, // ได้สตริงที่ตรงกับตาเห็น 100%
                day: d.toLocaleDateString('th-TH', { weekday: 'short' }),
                date: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
            };
        });
        setDates(next7Days);

        const fetchShowtimes = async () => {
            try {
                const showtimes = await getShowtimesByMovieId(movie._id);
                setAllShowtimes(showtimes);
            } catch (error) {
                console.error("Error fetching showtimes:", error);
            }
        };
        fetchShowtimes();
    }, [movie]);

    // 2. Filter รอบฉายตามวันที่
    useEffect(() => {
        // Reset ค่าเมื่อเปลี่ยนวัน
        setSelectedShowtime(null);
        setSelectedSeats([]);
        setShowPayment(false);
        setBookingId(null);

        if (dates.length > 0 && allShowtimes.length > 0) {
            // ดึง "YYYY-MM-DD" ของวันที่เรากดเลือก
            const selectedFullDateStr = dates[selectedDateIndex].fullDate;

            const filtered = allShowtimes.filter(st => {
                const showtimeDate = new Date(st.start_time);

                // ✅ แก้ไข: แปลงเวลาฉายให้เป็นสตริง YYYY-MM-DD รูปแบบเดียวกัน
                const stYear = showtimeDate.getFullYear();
                const stMonth = String(showtimeDate.getMonth() + 1).padStart(2, '0');
                const stDay = String(showtimeDate.getDate()).padStart(2, '0');
                const showtimeFullDateStr = `${stYear}-${stMonth}-${stDay}`;

                // เทียบสตริงข้อความตรงๆ ไปเลย ปลอดภัยที่สุด
                const isSameDate = showtimeFullDateStr === selectedFullDateStr;

                // ตรวจสอบว่าต้องไม่ใช่รอบที่ถูกยกเลิกไปแล้ว
                const isActive = st.status !== 'cancelled';

                return isSameDate && isActive;
            });

            // เรียงเวลาจากเช้าไปดึก
            filtered.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
            setCurrentShowtimes(filtered);
        } else {
            setCurrentShowtimes([]);
        }
    }, [selectedDateIndex, dates, allShowtimes]);

    // 3. Action: เมื่อเลือกรอบฉาย
    const handleTimeSelect = async (showtime) => {
        setSelectedShowtime(showtime);
        setSelectedSeats([]);
        setShowPayment(false);
        setBookingId(null);

        try {
            // 3.1 ดึงข้อมูลที่นั่งที่ถูกจองแล้ว
            const reservedRes = await getReservedSeats(showtime._id);
            const reservedIds = reservedRes.bookedSeatIds || reservedRes.reservedSeats || [];
            setReservedSeats(reservedIds);

            // 3.2 ดึงผังที่นั่งทั้งหมด
            const seatsLayout = await getSeatsByShowtimeId(showtime._id);
            setAllSeats(seatsLayout);

            setTimeout(() => {
                seatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        } catch (error) {
            console.error("Error fetching seat data:", error);
            alert("ไม่สามารถดึงข้อมูลผังที่นั่งได้");
        }
    };

    // Helper: จัดกลุ่มที่นั่งตามแถว
    const getSeatsByRow = () => {
        if (!allSeats || allSeats.length === 0) return [];

        const rows = {};
        allSeats.forEach(seat => {
            if (!rows[seat.row_label]) rows[seat.row_label] = [];
            rows[seat.row_label].push(seat);
        });

        return Object.keys(rows).sort().map(rowLabel => ({
            rowLabel,
            seats: rows[rowLabel].sort((a, b) => parseInt(a.seat_number) - parseInt(b.seat_number))
        }));
    };

    const seatsGrouped = getSeatsByRow();

    // 4. Action: เลือก/ยกเลิกเลือกที่นั่ง
    const toggleSeat = (seatId) => {
        if (showPayment || reservedSeats.includes(seatId)) return;

        if (selectedSeats.includes(seatId)) {
            setSelectedSeats(prev => prev.filter(id => id !== seatId));
        } else {
            setSelectedSeats(prev => [...prev, seatId]);
        }
    };

    // คำนวณราคารวม
    const totalPrice = selectedSeats.reduce((sum, seatId) => {
        const seat = allSeats.find(s => s._id === seatId);
        return sum + (seat?.seat_type_id?.price || 0);
    }, 0);

    // 5. Action: ยืนยันการจอง (Create Booking)
    const handleProceed = async () => {
        if (selectedSeats.length === 0) return;

        const token = localStorage.getItem('jwtToken');
        if (!token) {
            alert('กรุณาเข้าสู่ระบบก่อนทำการจอง');
            navigate('/login');
            return;
        }

        setIsProcessing(true);

        try {
            // ✅ 1. ดึงค่า cinema_id ออกมาจากตัวรอบฉาย (รองรับทั้ง Object และ String)
            const currentCinemaId = selectedShowtime.auditorium_id?.cinema_id?._id ||
                selectedShowtime.auditorium_id?.cinema_id ||
                selectedShowtime.cinema_id;

            // ✅ 2. เพิ่ม movie_id และ cinema_id เข้าไปใน Payload
            const bookingPayload = {
                showtime_id: selectedShowtime._id,
                movie_id: movie._id,       // <--- เพิ่มบรรทัดนี้
                cinema_id: currentCinemaId, // <--- เพิ่มบรรทัดนี้
                seat_ids: selectedSeats,
                status: 'pending'
            };

            const response = await createBooking(bookingPayload);
            // รองรับ response หลายรูปแบบ
            const newBookingId = response._id || response.data?._id || response.booking?._id;

            if (!newBookingId) throw new Error("ไม่ได้รับ Booking ID จากระบบ");

            setBookingId(newBookingId);
            setShowPayment(true);

            setTimeout(() => {
                paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);

        } catch (err) {
            console.error(err);
            alert("จองไม่สำเร็จ: " + (err.response?.data?.message || err.message));
        } finally {
            setIsProcessing(false);
        }
    };

    // ✅ ฟังก์ชันนี้มีอยู่แล้ว ใช้ตัวนี้แทน setCurrentStep
    const handleCancelPayment = () => {
        setShowPayment(false);
        setBookingId(null);
        seatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handlePaymentComplete = () => {
        alert("การชำระเงินเสร็จสมบูรณ์!");
        navigate('/history');
    };

    if (!movie) return null;

    const formatTime = (isoDateString) => {
        const date = new Date(isoDateString);
        return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    };

    // Helper หาค่าราคาเพื่อแสดงใน Legend
    const getPriceByType = (keyword) => {
        const foundSeat = allSeats.find(s =>
            (s.seat_type_id?.name || '').toLowerCase().includes(keyword)
        );
        return foundSeat?.seat_type_id?.price || '-';
    };

    const executivePrice = getPriceByType('executive');
    const normalPrice = getPriceByType('normal');

    return (
        <div className="page-container">
            <Navbar />

            <div className="booking-content">

                <div className="back-btn-container">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
                        </svg>
                        ย้อนกลับ
                    </button>
                </div>
                {/* Header หนัง */}
                <div className="movie-header-card">
                    <div className="poster-area">
                        <img src={movie.poster_url} alt={movie.title_th} className="poster-img-fixed" />
                    </div>
                    <div className="info-area">
                        <h1>{movie.title_th}</h1>
                        <p className="meta-text">หมวดหมู่: {movie.genre} | ⏱ {movie.duration_min} นาที</p>
                    </div>
                </div>

                {/* Steps Indicator */}
                <div className="steps-container">
                    <div className="step active"><div className="step-num">1</div><span>เลือกรอบฉาย</span></div>
                    <div className={`stepline ${selectedShowtime ? 'active' : ''}`}></div>
                    <div className={`step ${selectedShowtime ? 'active' : ''}`}><div className="step-num">2</div><span>เลือกที่นั่ง</span></div>
                    <div className={`stepline ${showPayment ? 'active' : ''}`}></div>
                    <div className={`step ${showPayment ? 'active' : ''}`}><div className="step-num">3</div><span>ชำระเงิน</span></div>
                </div>

                {/* Date & Time Selection */}
                <div className={`selection-card ${showPayment ? 'disabled-section' : ''}`}>
                    <div className="date-scroll-wrapper">
                        {dates.map((item, index) => (
                            <div key={index}
                                className={`date-item ${selectedDateIndex === index ? 'active' : ''}`}
                                onClick={() => !showPayment && setSelectedDateIndex(index)}
                            >
                                <span className="day-name">{item.day}</span>
                                <span className="date-num">{item.date}</span>
                            </div>
                        ))}
                    </div>
                    <hr className="divider" />

                    <div className="time-selection-area">
                        <div className="times-list">
                            {currentShowtimes.length > 0 ? currentShowtimes.map((st) => {
                                // 🌟 เช็คว่ารอบฉายนี้ "น้อยกว่าเวลาปัจจุบัน" (เลยเวลาแล้ว) หรือไม่
                                const isPast = new Date(st.start_time) < new Date();

                                return (
                                    <button
                                        key={st._id}
                                        className={`time-btn ${selectedShowtime?._id === st._id ? 'active' : ''} ${isPast ? 'past-time' : ''}`}
                                        onClick={() => !isPast && handleTimeSelect(st)} // 👈 ถ้าเป็นอดีต สั่งห้ามกด!
                                        disabled={isPast} // 👈 ปิดการใช้งานปุ่มในระดับ HTML ด้วยเพื่อความชัวร์
                                        title={isPast ? "รอบฉายนี้จบลงแล้ว" : ""}
                                    >
                                        {formatTime(st.start_time)}
                                        <div className="sys-type">{st.system_type || "2D"}</div>
                                    </button>
                                );
                            }) : (
                                <div className="no-showtime">ไม่มีรอบฉายในวันนี้</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Seat Selection */}
                {selectedShowtime && (
                    <div className="seat-section-wrapper" ref={seatSectionRef}>
                        <div className={`seat-layout-card ${showPayment ? 'disabled-section' : ''}`}>
                            <div className="screen-bar">จอภาพยนตร์</div>

                            <div className="seats-container">
                                {seatsGrouped.length > 0 ? seatsGrouped.map((group) => (
                                    <div key={group.rowLabel} className="seat-row">
                                        <span className="row-name">{group.rowLabel}</span>
                                        {group.seats.map((seat) => {
                                            const isTaken = reservedSeats.includes(seat._id);
                                            const isSelected = selectedSeats.includes(seat._id);

                                            const typeName = (seat.seat_type_id?.name || 'Normal').toLowerCase();
                                            const isSpecialSeat = typeName.includes('executive') || typeName.includes('premium');
                                            const seatClass = isSpecialSeat ? 'executive' : 'standard';

                                            return (
                                                <div
                                                    key={seat._id}
                                                    className={`seat-icon ${seatClass} ${isSelected ? 'selected' : ''} ${isTaken ? 'taken' : ''}`}
                                                    onClick={() => toggleSeat(seat._id)}
                                                    title={`แถว ${seat.row_label} ที่ ${seat.seat_number} - ${seat.seat_type_id?.price} บาท`}
                                                >
                                                    <span style={{ fontSize: '10px', color: isSelected || isTaken ? 'white' : 'transparent' }}>
                                                        {seat.seat_number}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        <span className="row-name">{group.rowLabel}</span>
                                    </div>
                                )) : (
                                    <div className="no-seats-msg">
                                        กำลังโหลดข้อมูลที่นั่ง... หรือยังไม่ได้สร้างผังที่นั่งในระบบ
                                    </div>
                                )}
                            </div>

                            <div className="seat-legend">
                                <div className="legend-item">
                                    <div className="seat-icon executive"></div>
                                    <span>Executive {executivePrice}.-</span>
                                </div>
                                <div className="legend-item">
                                    <div className="seat-icon standard"></div>
                                    <span>Normal {normalPrice}.-</span>
                                </div>
                                <div className="legend-item">
                                    <div className="seat-icon taken"></div>
                                    <span>ไม่ว่าง</span>
                                </div>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="booking-summary-card">
                            <h3>{movie.title_th}</h3>
                            <div className="summary-info">
                                <p>📅 {dates[selectedDateIndex]?.date}</p>
                                <p>⏰ {formatTime(selectedShowtime.start_time)}</p>
                                <p>📍 {selectedShowtime.auditorium_id?.name || selectedShowtime.cinema?.name || "Cinema"}</p>
                            </div>
                            <div className="summary-box">
                                <div className="summary-row">
                                    <span>ที่นั่ง:</span>
                                    <span className="highlight-text">
                                        {selectedSeats.length > 0
                                            ? selectedSeats.map(id => {
                                                const s = allSeats.find(seat => seat._id === id);
                                                return `${s?.row_label}${s?.seat_number}`;
                                            }).join(', ')
                                            : '-'
                                        }
                                    </span>
                                </div>
                                <div className="summary-row total"><span>รวมเงิน:</span> <span>{totalPrice.toLocaleString()} บาท</span></div>
                            </div>

                            {!showPayment && (
                                <button
                                    className="confirm-btn"
                                    disabled={selectedSeats.length === 0 || isProcessing}
                                    onClick={handleProceed}
                                >
                                    {isProcessing ? 'กำลังสร้างรายการ...' : 'ยืนยันและชำระเงิน'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* --- Payment Section --- */}
                {showPayment && bookingId && (
                    <div className="payment-section-container" ref={paymentSectionRef}>
                        <PaymentSection
                            amount={totalPrice}
                            bookingId={bookingId}
                            onComplete={handlePaymentComplete}
                            onCancel={handleCancelPayment}  /* ✅ แก้ไข: ใช้ฟังก์ชันที่มีอยู่แล้วแทน */
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingPage;