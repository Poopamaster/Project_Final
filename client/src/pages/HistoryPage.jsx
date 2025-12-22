import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Download, X } from 'lucide-react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import '../css/HistoryPage.css';

const HistoryPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State สำหรับจัดการการแสดงผลรูปภาพ
    const [showModal, setShowModal] = useState(false);
    const [ticketImage, setTicketImage] = useState(null);
    const [currentBooking, setCurrentBooking] = useState(null);
    const ticketRef = useRef(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token'); 
                const response = await axios.get(`http://localhost:5000/api/bookings/my-bookings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBookings(response.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // ✅ ฟังก์ชันสร้างภาพจาก HTML Template
    const generateTicketImage = async (booking) => {
        setCurrentBooking(booking);
        setShowModal(true); // เปิด Modal
        
        // รอให้ React Render Template แป๊บนึงก่อน Capture
        setTimeout(async () => {
            if (ticketRef.current) {
                const canvas = await html2canvas(ticketRef.current, {
                    useCORS: true,
                    scale: 3, // เพิ่มความชัดระดับ 4K
                    backgroundColor: "#ffffff"
                });
                const dataUrl = canvas.toDataURL('image/png');
                setTicketImage(dataUrl); // เก็บรูปที่สร้างเสร็จลง State
            }
        }, 500);
    };

    // ✅ ฟังก์ชัน Save รูปลงเครื่อง
    const saveImage = () => {
        const link = document.createElement('a');
        link.download = `Ticket-${currentBooking.booking_number}.png`;
        link.href = ticketImage;
        link.click();
    };

    if (loading) return <div>กำลังโหลด...</div>;

    return (
        <div className="history-page-container">
            <div className="history-content">
                <h1 className="page-title">ประวัติการจอง</h1>
                {bookings.map((item) => (
                    <div key={item._id} className="ticket-card">
                        <div className="ticket-header">
                            <h2>{item.showtime_id?.movie_id?.title_th}</h2>
                            <button className="download-btn" onClick={() => generateTicketImage(item)}>
                                <Download size={18} /> Download Ticket
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- 🎫 1. ส่วนของ Modal แสดงรูปตั๋ว --- */}
            {showModal && (
                <div className="ticket-modal-overlay">
                    <div className="ticket-modal-content">
                        <button className="close-modal" onClick={() => { setShowModal(false); setTicketImage(null); }}>
                            <X size={24} />
                        </button>
                        
                        <div className="modal-body">
                            {ticketImage ? (
                                <>
                                    <img src={ticketImage} alt="Your Ticket" className="preview-img" />
                                    <button className="save-btn" onClick={saveImage}>บันทึกภาพตั๋ว</button>
                                </>
                            ) : (
                                <p>กำลังสร้างตั๋วของคุณ...</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- 📄 2. ส่วนของ Template (ซ่อนไว้เพื่อ Capture) --- */}
            {/* โครงสร้างนี้ดัดแปลงมาจาก HTML ในเมลที่คุณส่งมาเป๊ะๆ */}
            <div style={{ position: 'absolute', left: '-9999px' }}>
                <div ref={ticketRef} id="ticket-template" style={{ width: '380px', background: '#fff', padding: '0', fontFamily: 'sans-serif' }}>
                    <div style={{ background: '#1a1f2c', padding: '20px', textAlign: 'center', borderBottom: '3px solid #f1c40f' }}>
                        <h1 style={{ color: '#f1c40f', margin: 0, fontSize: '22px' }}>MCP CINEMA</h1>
                    </div>
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <div style={{ color: '#27ae60', fontSize: '30px' }}>✓</div>
                        <p style={{ color: '#7f8c8d', fontSize: '12px', margin: 0 }}>Booking ID</p>
                        <h2 style={{ margin: '5px 0', fontSize: '24px' }}>{currentBooking?.booking_number}</h2>
                        <p style={{ color: '#27ae60', fontSize: '12px', fontWeight: 'bold', margin: 0 }}>ชำระเงินเรียบร้อยแล้ว</p>
                    </div>
                    <div style={{ padding: '0 20px', display: 'flex', gap: '15px' }}>
                        <img src={currentBooking?.showtime_id?.movie_id?.poster_url} width="90" style={{ borderRadius: '5px' }} />
                        <div style={{ textAlign: 'left' }}>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{currentBooking?.showtime_id?.movie_id?.title_th}</h3>
                            <p style={{ fontSize: '11px', margin: '2px 0' }}>โรง: {currentBooking?.showtime_id?.auditorium_id?.name}</p>
                            <p style={{ fontSize: '11px', margin: '2px 0' }}>วันที่: {new Date(currentBooking?.showtime_id?.start_time).toLocaleDateString('th-TH')}</p>
                            <p style={{ fontSize: '11px', margin: '2px 0' }}>รอบฉาย: {new Date(currentBooking?.showtime_id?.start_time).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})} น.</p>
                        </div>
                    </div>
                    <div style={{ margin: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                        <div>
                            <p style={{ fontSize: '10px', color: '#888', margin: 0 }}>ที่นั่ง (Seats)</p>
                            <p style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '14px', margin: 0 }}>{currentBooking?.seats?.map(s => `${s.row_label}${s.seat_number}`).join(', ')}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '10px', color: '#888', margin: 0 }}>ยอดสุทธิ</p>
                            <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>{currentBooking?.total_price} THB</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${currentBooking?.booking_number}`} width="100" />
                        <p style={{ fontSize: '10px', color: '#999', marginTop: '10px' }}>สแกน QR Code นี้ที่หน้าทางเข้าโรงภาพยนตร์</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;