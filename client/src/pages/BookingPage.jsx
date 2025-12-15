import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PaymentSection from '../components/PaymentSection';
import '../css/BookingPage.css';

// Import API
// ✅ อย่าลืม: คุณต้องมี getSeatsByShowtimeId ใน showtimeApi.jsx ตามที่คุยกันก่อนหน้า
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
    const [allSeats, setAllSeats] = useState([]); // เก็บ Object ที่นั่งทั้งหมดที่ได้จาก API
    const [reservedSeats, setReservedSeats] = useState([]); // เก็บ _id ของที่นั่งที่ไม่ว่าง
    const [selectedSeats, setSelectedSeats] = useState([]); // เก็บ _id ของที่นั่งที่เลือก

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
            return {
                fullDate: d.toISOString().split('T')[0],
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
        // --- เพิ่มส่วนนี้: ล้างค่าการเลือกทุกครั้งที่เปลี่ยนวัน ---
        setSelectedShowtime(null);
        setSelectedSeats([]);
        setShowPayment(false);
        setBookingId(null);
        // --------------------------------------------------

        if (dates.length > 0 && allShowtimes.length > 0) {
            const selectedDateStr = dates[selectedDateIndex].fullDate;

            // เพิ่ม Logic กรองเวลาอดีต (ตามที่คุยกันรอบที่แล้ว)
            const now = new Date();
            const filtered = allShowtimes.filter(st => {
                const isSameDate = st.start_time.startsWith(selectedDateStr);
                if (!isSameDate) return false;

                // ถ้าเป็นหนังวันนี้ ต้องไม่เอาเวลาที่ผ่านไปแล้ว
                const showtimeDate = new Date(st.start_time);
                if (showtimeDate < now) return false;

                return true;
            });

            filtered.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
            setCurrentShowtimes(filtered);
        } else {
            setCurrentShowtimes([]);
        }
    }, [selectedDateIndex, dates, allShowtimes]);

    // 3. Action: เมื่อเลือกรอบฉาย (ดึงผังที่นั่งจริงจาก DB)
    const handleTimeSelect = async (showtime) => {
        setSelectedShowtime(showtime);
        setSelectedSeats([]);
        setShowPayment(false);
        setBookingId(null);

        try {
            // 3.1 ดึงข้อมูลที่นั่งที่ถูกจองแล้ว (Reserved)
            const reservedRes = await getReservedSeats(showtime._id);
            // Backend ควรส่งกลับมาเป็น array ของ ObjectId
            const reservedIds = reservedRes.bookedSeatIds || reservedRes.reservedSeats || [];
            setReservedSeats(reservedIds);

            // 3.2 ✅ ดึงผังที่นั่งทั้งหมดของโรงนี้ (Layout)
            // ต้องมั่นใจว่า Backend มี route /api/showtimes/:id/seats ให้เรียก
            const seatsLayout = await getSeatsByShowtimeId(showtime._id);
            setAllSeats(seatsLayout); // seatsLayout คือ Array ของ Seat Object จาก DB

            setTimeout(() => {
                seatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        } catch (error) {
            console.error("Error fetching seat data:", error);
            alert("ไม่สามารถดึงข้อมูลผังที่นั่งได้");
        }
    };

    // Helper: จัดกลุ่มที่นั่งตามแถว (Group by Row) เพื่อการแสดงผล
    const getSeatsByRow = () => {
        if (!allSeats || allSeats.length === 0) return [];

        const rows = {};
        allSeats.forEach(seat => {
            // ใช้ row_label จาก model (เช่น 'A', 'B')
            if (!rows[seat.row_label]) rows[seat.row_label] = [];
            rows[seat.row_label].push(seat);
        });

        // เรียงลำดับแถว (A, B, C...) และเลขที่นั่ง (1, 2, 3...)
        return Object.keys(rows).sort().map(rowLabel => ({
            rowLabel,
            seats: rows[rowLabel].sort((a, b) => parseInt(a.seat_number) - parseInt(b.seat_number))
        }));
    };

    const seatsGrouped = getSeatsByRow();

    // 4. Action: เลือก/ยกเลิกเลือกที่นั่ง (ใช้ _id)
    const toggleSeat = (seatId) => {
        if (showPayment || reservedSeats.includes(seatId)) return;

        if (selectedSeats.includes(seatId)) {
            setSelectedSeats(prev => prev.filter(id => id !== seatId));
        } else {
            setSelectedSeats(prev => [...prev, seatId]);
        }
    };

    // คำนวณราคารวม (ดึงราคาจาก Object ที่นั่งโดยตรง)
    const totalPrice = selectedSeats.reduce((sum, seatId) => {
        const seat = allSeats.find(s => s._id === seatId);
        // เช็ค seat_type_id.price (ถ้า populate มา) หรือ default 0
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
            const bookingPayload = {
                showtime_id: selectedShowtime._id,
                seat_ids: selectedSeats, // ✅ ส่ง Array ของ ObjectId
                status: 'pending'
            };

            // Debug ดูค่าก่อนส่ง
            console.log("Creating Booking with:", bookingPayload);

            const response = await createBooking(bookingPayload);
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

    const getPriceByType = (keyword) => {
        const foundSeat = allSeats.find(s =>
            (s.seat_type_id?.name || '').toLowerCase().includes(keyword)
        );
        return foundSeat?.seat_type_id?.price || '-'; // ถ้าหาไม่เจอให้โชว์ -
    };

    const executivePrice = getPriceByType('executive');
    const normalPrice = getPriceByType('normal');

    return (
        <div className="page-container">
            <Navbar />

            <div className="booking-content">
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
                    {/* ... ส่วนเลือกวันที่ (เหมือนเดิม) ... */}
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
                            {currentShowtimes.length > 0 ? currentShowtimes.map((st) => (
                                <button
                                    key={st._id}
                                    className={`time-btn ${selectedShowtime?._id === st._id ? 'active' : ''}`}
                                    onClick={() => handleTimeSelect(st)}
                                >
                                    {formatTime(st.start_time)}
                                    <div className="sys-type">{st.system_type || "2D"}</div>
                                </button>
                            )) : (
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

                                            const typeName = (seat.seat_type_id?.name || 'Normal').toLowerCase(); // แปลงเป็นตัวเล็กให้หมดก่อน
                                            const isSpecialSeat = typeName.includes('executive') || typeName.includes('premium'); // เช็คได้แล้ว

                                            const seatClass = isSpecialSeat ? 'executive' : 'standard';

                                            return (
                                                <div
                                                    key={seat._id} // ✅ ใช้ _id เป็น key
                                                    className={`seat-icon ${seatClass} ${isSelected ? 'selected' : ''} ${isTaken ? 'taken' : ''}`}
                                                    onClick={() => toggleSeat(seat._id)}
                                                    title={`แถว ${seat.row_label} ที่ ${seat.seat_number} - ${seat.seat_type_id?.price} บาท`}
                                                >
                                                    {/* แสดงเลขที่นั่ง */}
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
                                    {/* แสดงชื่อที่นั่งที่เลือก (ต้องหาจาก allSeats) */}
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
                            onCancel={handleCancelPayment}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingPage;