import React, { useState, useEffect, useRef } from 'react';
import { MapPin, CreditCard, CheckCircle, Download, Clock, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import '../css/HistoryPage.css';
import { getMyBookings } from '../api/bookingApi';
import TicketTemplate from '../components/TicketTemplate'; // ✅ IMPORT ไฟล์ตั๋วที่เราเพิ่งสร้าง

const HistoryPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State และ Ref สำหรับการ Download Ticket
    const ticketRef = useRef(null);
    const [ticketData, setTicketData] = useState(null);

    // Helper Functions (สำหรับหน้าแสดงผลบนเว็บ)
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    };
    
    const formatTime = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
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
        setTicketData(booking); // 1. ส่งข้อมูลเข้า TicketTemplate

        // 2. รอให้ React Render TicketTemplate เสร็จก่อน (0.8 วิ)
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

    if (loading) return <div style={{textAlign:'center', paddingTop:'50px'}}>⏳ กำลังโหลดข้อมูล...</div>;
    if (error) return <div style={{textAlign:'center', color:'red', paddingTop:'50px'}}>{error}</div>;

    return (
        <div className="history-page-container">
            {/* ✅ ส่วน Ticket Template ซ่อนไว้ รอ render อย่างเดียว */}
            <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1 }}>
                <TicketTemplate 
                    ref={ticketRef} 
                    ticketData={ticketData} 
                />
            </div>

            {/* Content หน้าเว็บปกติ */}
            <div className="history-content">
                <h1 className="page-title">ประวัติการจองของฉัน</h1>
                {bookings.length === 0 ? (
                    <div className="empty-state">
                        <AlertCircle size={64} style={{marginBottom: '10px', color: '#888'}}/>
                        <h3>คุณยังไม่มีประวัติการจอง</h3>
                    </div>
                ) : (
                    bookings.map((booking, index) => (
                        <div key={index} className="history-group">
                            <h3 className="history-date-header">{formatDate(booking.date)}</h3>
                            <div className="ticket-card">
                                <div className="ticket-header">
                                    <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                                        <img src={booking.poster} alt="poster" style={{width:'40px', height:'60px', borderRadius:'4px', objectFit:'cover'}}/>
                                        <h2 className="movie-title">{booking.movieTitle}</h2>
                                    </div>
                                    <span className={`status-badge ${booking.status}`}>
                                        <CheckCircle size={16} /> {booking.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="ticket-body">
                                    <div className="info-col">
                                        <p><strong>Booking Ref :</strong> <span className="blue-text">{booking.id}</span></p>
                                        <p><strong>โรงภาพยนตร์ :</strong> <span className="blue-text">{booking.cinema}</span></p>
                                    </div>
                                    <div className="info-col">
                                        <p><Clock size={16} className="icon-inline"/> <strong>Time :</strong> <span className="blue-text">{formatTime(booking.date)}</span></p>
                                        <p><MapPin size={16} className="icon-inline"/> <strong>ที่นั่ง :</strong> <span className="blue-text" style={{fontWeight:'bold'}}>{booking.seats}</span></p>
                                    </div>
                                    <div className="info-col">
                                        <p><strong>ยอดรวม :</strong> <span className="blue-text">{booking.totalPrice.toLocaleString()} บาท</span></p>
                                        <p><CreditCard size={16} className="icon-inline"/> <strong>ชำระผ่าน :</strong> <span className="blue-text">{booking.paymentMethod}</span></p>
                                    </div>
                                </div>
                                <div className="ticket-footer">
                                    <button 
                                        className="download-btn" 
                                        onClick={() => handleDownloadTicket(booking)}
                                        disabled={ticketData !== null}
                                    >
                                        <Download size={18} /> {ticketData && ticketData.id === booking.id ? 'กำลังสร้างรูป...' : 'Save E-Ticket'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <footer className="simple-footer">
                <p>Copyright © 2025 MCP Cinema Demo. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default HistoryPage;