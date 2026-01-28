import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

export default function BookingPageAdmin() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. ฟังก์ชันดึงข้อมูลการจองจาก Database
    const fetchBookings = async () => {
        try {
            setLoading(true);
            // ดึงจาก Backend Port 8000 ที่คุณรันอยู่
            const response = await axios.get('http://localhost:8000/api/admin/bookings');
            
            if (response.data.success) {
                setBookings(response.data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error("Fetch bookings error:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    return (
        <div className="admin-page-content-inside">
            <header className="content-header-figma">
                <div className="header-left">
                    <h1>การจอง</h1>
                    <p>รวมข้อมูลการจองทั้งหมดในระบบ MCP CINEMA...</p>
                </div>
                {/* ตัดส่วนเวลาออกเพื่อให้เหมือนหน้าอื่น */}
            </header>

            <div className="figma-table-container">
                <h2 className="table-title">การจองทั้งหมด ({bookings.length})</h2>
                
                {loading ? (
                    <div className="flex justify-center p-10">
                        <Loader2 className="animate-spin" size={32} />
                    </div>
                ) : (
                    <div className="table-scroll-wrapper">
                        <table className="admin-custom-table">
                            <thead>
                                <tr>
                                    <th>รหัสจอง</th>
                                    <th>ชื่อ</th>
                                    <th>หนัง</th>
                                    <th>ที่นั่ง</th>
                                    <th>ราคา</th>
                                    <th>สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((item, index) => (
                                    <tr key={item._id || index}>
                                        <td>{item.bookingNumber || item._id.substring(0, 8)}</td>
                                        <td>{item.userId?.name || 'ลูกค้าทั่วไป'}</td>
                                        <td className="text-truncate">{item.movieId?.title_th || 'ไม่ระบุชื่อหนัง'}</td>
                                        <td>{item.seats?.join(', ')}</td>
                                        <td>{item.totalPrice?.toLocaleString()} บ.</td>
                                        <td>
                                            <span className={`status-pill ${item.status === 'paid' || item.status === 'ชำระแล้ว' ? 'paid' : 'pending'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}