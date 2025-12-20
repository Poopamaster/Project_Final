import React, { useState } from 'react';
import { MapPin, CreditCard, CheckCircle, Download, Clock } from 'lucide-react';
import '../css/HistoryPage.css';

const HistoryPage = () => {
    // ข้อมูลจำลอง
    const [bookings, setBookings] = useState([
        {
            id: '001-10-68',
            movieTitle: 'โดราเอมอน เดอะมูฟวี่ ตอน ไดโนเสาร์ตัวใหม่ ของโนบิตะ',
            cinema: 'Cinema สาขา 1',
            date: '7 ต.ค. 2568',
            time: '18:00',
            seats: 'C7, C8',
            totalPrice: 300,
            paymentMethod: 'K+',
            status: 'Confirmed',
            poster: 'https://placehold.co/100x150?text=Doraemon'
        },
        {
            id: '003-10-68',
            movieTitle: 'Avenger Endgame',
            cinema: 'Cinema สาขา 2',
            date: '4 ต.ค. 2568',
            time: '11:30',
            seats: 'A3, A4',
            totalPrice: 300,
            paymentMethod: 'Credit Card',
            status: 'Confirmed',
            poster: 'https://placehold.co/100x150?text=Avenger'
        }
    ]);

    return (
        <div className="history-page-container">
            {/* ❌ 2. ลบบรรทัด <Navbar /> ตรงนี้ออก เพราะตัว App หลักจะแสดงให้อยู่แล้ว */}
            
            <div className="history-content">
                <h1 className="page-title">ประวัติการจอง</h1>

                {/* วนลูปแสดงรายการจอง */}
                {bookings.map((booking, index) => (
                    <div key={index} className="history-group">
                        <h3 className="history-date-header">{booking.date}</h3>
                        
                        <div className="ticket-card">
                            <div className="ticket-header">
                                <h2 className="movie-title">{booking.movieTitle}</h2>
                                <span className="status-badge confirmed">
                                    <CheckCircle size={16} /> {booking.status}
                                </span>
                            </div>

                            <div className="ticket-body">
                                {/* คอลัมน์ 1: ข้อมูลการจอง */}
                                <div className="info-col">
                                    <p><strong>Booking ID :</strong> <span className="blue-text">{booking.id}</span></p>
                                    <p><strong>โรงภาพยนตร์ :</strong> <span className="blue-text">{booking.cinema}</span></p>
                                </div>

                                {/* คอลัมน์ 2: เวลาและที่นั่ง */}
                                <div className="info-col">
                                    <p><Clock size={16} className="icon-inline"/> <strong>Date / Time :</strong> <span className="blue-text">{booking.date} / {booking.time}</span></p>
                                    <p><MapPin size={16} className="icon-inline"/> <strong>ที่นั่ง :</strong> <span className="blue-text">{booking.seats}</span></p>
                                </div>

                                {/* คอลัมน์ 3: ราคาและการชำระเงิน */}
                                <div className="info-col">
                                    <p><strong>ราคาทั้งหมด :</strong> <span className="blue-text">{booking.totalPrice} บาท</span></p>
                                    <p><CreditCard size={16} className="icon-inline"/> <strong>การชำระเงิน :</strong> <span className="blue-text">{booking.paymentMethod}</span></p>
                                </div>
                            </div>

                            <div className="ticket-footer">
                                <button className="download-btn">
                                    <Download size={18} /> Download Ticket
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <footer className="simple-footer">
                <p>Copyright © 2025 MCP Cinema Demo. All rights reserved.</p>
                <div className="contact-info">
                    <span>📞 02-999-999</span>
                </div>
            </footer>
        </div>
    );
};

export default HistoryPage;