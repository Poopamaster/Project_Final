import React, { useState, useEffect } from 'react';
import { Loader2, Search, MapPin, Monitor } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance'; 

export default function BookingPageAdmin() {
    const [bookings, setBookings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/admin/bookings');
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

    const filteredBookings = bookings.filter(item => {
        const customerName = item.userId?.name?.toLowerCase() || '';
        const customerEmail = item.userId?.email?.toLowerCase() || '';
        const movieName = item.movieId?.title_th?.toLowerCase() || '';
        return customerName.includes(searchTerm.toLowerCase()) || 
               customerEmail.includes(searchTerm.toLowerCase()) ||
               movieName.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="admin-page-content-inside">
            <header className="content-header-figma">
                <div className="header-left">
                    <h1>การจอง</h1>
                    <p>จัดการและตรวจสอบสถานะการจองตั๋วภาพยนตร์ MCP CINEMA v2.0</p>
                </div>
            </header>

            <div className="search-box-figma" style={{ marginBottom: '25px', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input 
                    type="text" 
                    placeholder="ค้นหาชื่อลูกค้า, อีเมล หรือชื่อหนัง..." 
                    className="input-field-figma"
                    style={{ width: '100%', padding: '15px 15px 15px 50px', background: '#1e212f', border: '1px solid #334155', borderRadius: '16px', color: 'white' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="figma-table-container">
                <h2 className="table-title">รายการการจองทั้งหมด ({filteredBookings.length})</h2>
                
                {loading ? (
                    <div className="flex justify-center p-10 text-center">
                        <Loader2 className="animate-spin" size={32} color="#8b5cf6" />
                    </div>
                ) : (
                    <div className="table-scroll-wrapper">
                        <table className="admin-custom-table">
                            <thead>
                                <tr>
                                    <th>รหัสจอง</th>
                                    <th>ข้อมูลลูกค้า</th>
                                    <th>ภาพยนตร์</th>
                                    <th>โรง/สาขา</th>
                                    <th>ที่นั่ง</th>
                                    <th>ราคา</th>
                                    <th>สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map((item) => (
                                        <tr key={item._id}>
                                            <td><span style={{ color: '#8b5cf6', fontWeight: '600' }}>#{item._id?.substring(18, 24).toUpperCase()}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: '500' }}>{item.userId?.name || 'ลูกค้าทั่วไป'}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.userId?.email}</span>
                                                </div>
                                            </td>
                                            <td className="text-truncate">{item.movieId?.title_th || 'ไม่ระบุชื่อหนัง'}</td>
                                            
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                                                    <Monitor size={14} color="#22d3ee" /> {item.showtime_id?.theater_name || 'โรง 1'}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: '#64748b' }}>
                                                    <MapPin size={12} /> {item.showtime_id?.branch || 'สาขาศรีราชา'}
                                                </div>
                                            </td>

                                            <td>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {item.seats && item.seats.length > 0 ? item.seats.map((seat, idx) => (
                                                        <span key={idx} style={{ background: '#8b5cf6', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                                                            {/* ✅ แสดง seat_number (A1, B2) ถ้า Backend ส่งมาถูกต้อง */}
                                                            {seat.seat_number || seat} 
                                                        </span>
                                                    )) : <span style={{ color: '#64748b' }}>ไม่ได้ระบุ</span>}
                                                </div>
                                            </td>

                                            <td>{item.totalPrice?.toLocaleString()} บ.</td>
                                            <td>
                                                <span className={`status-pill ${item.status === 'paid' ? 'paid' : 'pending'}`}>
                                                    {item.status === 'paid' ? 'ชำระแล้ว' : 'รอชำระ'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>ไม่พบข้อมูลที่ค้นหา</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}