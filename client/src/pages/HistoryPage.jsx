import React, { useState, useEffect, useRef } from 'react';
import { MapPin, CreditCard, CheckCircle, Download, Clock, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import '../css/HistoryPage.css';
import { getMyBookings } from '../api/bookingApi';
import TicketTemplate from '../components/TicketTemplate';

const HistoryPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State และ Ref สำหรับการ Download Ticket
    const ticketRef = useRef(null);
    const [ticketData, setTicketData] = useState(null);

    // Helper Functions
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        // ✅ ระบุ Timezone ให้ชัดเจนตอนจัดฟอร์แมต
        return new Date(dateString).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Bangkok' // 👈 เพิ่มบรรทัดนี้!
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Bangkok' // 👈 เพิ่มบรรทัดนี้!
        });
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const data = await getMyBookings();

                const mappedData = data.map(item => {
                    const movie = item.showtime_id?.movie_id || {};
                    const showtime = item.showtime_id || {};
                    const auditorium = showtime.auditorium_id || {};

                    const seatsArr = item.seats && item.seats.length > 0
                        ? item.seats.map(s => s.row_label ? `${s.row_label}${s.seat_number}` : 'No Seat')
                        : ['-'];
                    const seatsStr = seatsArr.join(', ');

                    return {
                        id: item.booking_number,
                        dbId: item._id,
                        movieTitle: movie.title_th || "ไม่ระบุชื่อภาพยนตร์",
                        duration: movie.duration_min || "-",
                        cinema: auditorium.name || "MCP Cinema",
                        date: showtime.start_time,
                        seats: seatsStr,
                        seatsCount: item.seats?.length || 0,
                        totalPrice: item.total_price,
                        paymentMethod: 'PromptPay',
                        status: item.status || 'confirmed',
                        poster: movie.poster_url || "https://placehold.co/100x150?text=No+Poster"
                    };
                });
                setBookings(mappedData);
            } catch (err) {
                console.error("Failed to fetch bookings:", err);
                setError(err.message || "ไม่สามารถดึงข้อมูลประวัติการจองได้");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const handleDownloadTicket = async (booking) => {
        setTicketData(booking);

        setTimeout(async () => {
            if (ticketRef.current) {
                try {
                    const canvas = await html2canvas(ticketRef.current, {
                        useCORS: true,
                        scale: 2,
                        backgroundColor: '#ffffff',
                    });

                    const image = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.href = image;
                    link.download = `E-Ticket-${booking.id}.png`;
                    link.click();

                    setTicketData(null);
                } catch (err) {
                    console.error("Error generating ticket:", err);
                    alert("เกิดข้อผิดพลาดในการสร้างตั๋ว");
                    setTicketData(null);
                }
            }
        }, 800);
    };

    // 🚨🚀 จัดกลุ่มตามวันที่
    const groupedBookings = bookings.reduce((groups, booking) => {
        const dateKey = formatDate(booking.date);
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(booking);
        return groups;
    }, {});

    if (loading) return <div style={{ textAlign: 'center', paddingTop: '50px' }}>⏳ กำลังโหลดข้อมูล...</div>;
    if (error) return <div style={{ textAlign: 'center', color: 'red', paddingTop: '50px' }}>{error}</div>;

    return (
        <div className="history-page-container">
            {/* ✅ ส่วน Ticket Template ซ่อนไว้ รอ render อย่างเดียว */}
            <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1 }}>
                <TicketTemplate ref={ticketRef} ticketData={ticketData} />
            </div>

            {/* Content หน้าเว็บปกติ */}
            <div className="history-content">
                <h1 className="page-title">ประวัติการจองของฉัน</h1>

                {Object.keys(groupedBookings).length === 0 ? (
                    <div className="empty-state">
                        <AlertCircle size={64} style={{ marginBottom: '10px', color: '#888' }} />
                        <h3>คุณยังไม่มีประวัติการจอง</h3>
                    </div>
                ) : (
                    Object.keys(groupedBookings).map((dateKey, index) => (
                        <div key={index} className="history-date-section" style={{ marginBottom: '40px' }}>

                            {/* 📅 หัวข้อกลุ่มวันที่ */}
                            <h3 style={{
                                borderBottom: '2px solid #334155',
                                paddingBottom: '10px',
                                marginBottom: '20px',
                                color: '#f8fafc',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                📅 รอบฉายวันที่: {dateKey}
                            </h3>

                            {/* 📱 Grid Layout (จัดเรียงการ์ด) */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '20px'
                            }}>
                                {groupedBookings[dateKey].map((booking, bIndex) => (
                                    <div key={bIndex} className="ticket-card" style={{
                                        background: '#1E293B',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        border: '1px solid #334155',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '15px',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                    }}>
                                        {/* 🎬 ส่วนหัว: รูปหนัง + ชื่อ + สถานะ */}
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                                            <img src={booking.poster} alt="poster" style={{ width: '60px', height: '90px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #334155' }} />
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                    {booking.movieTitle}
                                                </h3>
                                                <span className={`status-badge ${booking.status}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px' }}>
                                                    <CheckCircle size={14} /> {booking.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 📋 รายละเอียดแบบ Receipt Style (ครบทุกฟิลด์ตามของเดิมเป๊ะ) */}
                                        <div style={{
                                            background: '#0F172A',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            fontSize: '0.85rem',
                                            color: '#cbd5e1',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#94a3b8' }}>Booking Ref:</span>
                                                <span style={{ color: '#fff', fontWeight: 'bold' }}>{booking.id}</span>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#94a3b8' }}>โรงภาพยนตร์:</span>
                                                <span style={{ color: '#3b82f6', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <MapPin size={14} /> {booking.cinema}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#94a3b8' }}>รอบเวลา:</span>
                                                <span style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={14} /> {formatTime(booking.date)}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#94a3b8' }}>ที่นั่ง:</span>
                                                <span style={{ color: '#fff', fontWeight: 'bold' }}>{booking.seats}</span>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#94a3b8' }}>ชำระผ่าน:</span>
                                                <span style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <CreditCard size={14} /> {booking.paymentMethod}
                                                </span>
                                            </div>

                                            {/* เส้นคั่นก่อนยอดรวม */}
                                            <div style={{ height: '1px', background: '#334155', margin: '4px 0' }}></div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#94a3b8' }}>ยอดรวม:</span>
                                                <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                                    {booking.totalPrice.toLocaleString()} ฿
                                                </span>
                                            </div>
                                        </div>

                                        {/* 🎟️ ปุ่มดาวน์โหลด */}
                                        <button
                                            className="download-btn"
                                            onClick={() => handleDownloadTicket(booking)}
                                            disabled={ticketData !== null}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                background: ticketData && ticketData.id === booking.id ? '#475569' : '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                cursor: ticketData !== null ? 'wait' : 'pointer',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontWeight: 'bold',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <Download size={18} /> {ticketData && ticketData.id === booking.id ? 'กำลังสร้างรูป...' : 'Save E-Ticket'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <footer className="simple-footer">
                <p>Copyright © 2026 MCP Cinema Demo. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default HistoryPage;