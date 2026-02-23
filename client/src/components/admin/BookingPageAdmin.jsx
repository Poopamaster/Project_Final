import React, { useState, useEffect } from 'react';
import { Loader2, Search, MapPin, Monitor, Clock, Users } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import '../../css/BookingPageAdmin.css';

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

    // ✅ ระบบ Search ที่รองรับ Deep Populate จาก Backend
    const filteredBookings = bookings.filter(item => {
        const user = item.user_id || item.userId;
        const searchLower = searchTerm.toLowerCase();

        // รหัสจอง (แก้ป้องกัน Error หาก _id ไม่มี)
        const bookingId = (item._id?.substring(18, 24) || '').toLowerCase();

        // ข้อมูลลูกค้า
        const customerName = (user?.name || '').toLowerCase();
        const customerEmail = (user?.email || '').toLowerCase();

        // ข้อมูลหนัง (เจาะเข้าไปหา title_th หรือ title_en)
        const movieObj = item.showtime_id?.movie_id || item.movieId;
        const movieNameTH = (movieObj?.title_th || '').toLowerCase();
        const movieNameEN = (movieObj?.title_en || '').toLowerCase();

        // ข้อมูลโรงและสาขา
        const theaterObj = item.showtime_id?.auditorium_id || item.showtime_id || {};
        const theaterName = (theaterObj?.name || theaterObj?.theater_name || '').toLowerCase();

        // 💡 ดักจับข้อมูลสาขาคลุมไว้ทุกรูปแบบ
        const rawBranch =
            theaterObj?.branch?.name ||
            theaterObj?.branch ||
            theaterObj?.theater_id?.name ||
            item.showtime_id?.theater_id?.name ||
            item.showtime_id?.branch?.name ||
            item.showtime_id?.branch ||
            '';
        const branchName = String(rawBranch).toLowerCase();

        // ✅ ปรับโลจิกสถานะให้ตรงกับ UI ด้านล่าง (รวม confirmed เข้าไป)
        const isPaid = item.status === 'paid' || item.status === 'confirmed';
        const statusText = isPaid ? 'ชำระแล้ว' : 'รอชำระ';

        const price = (item.totalPrice || item.total_price || 0).toString();

        return bookingId.includes(searchLower) ||
            customerName.includes(searchLower) ||
            customerEmail.includes(searchLower) ||
            movieNameTH.includes(searchLower) ||
            movieNameEN.includes(searchLower) ||
            theaterName.includes(searchLower) ||
            branchName.includes(searchLower) ||
            statusText.includes(searchLower) ||
            price.includes(searchLower);
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'ไม่ระบุ';
        return new Date(dateString).toLocaleDateString('th-TH', {
            day: '2-digit', month: 'short', year: '2-digit'
        });
    };

    // ฟังก์ชันช่วยจัดการเวลา
    const formatTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="admin-page-content-inside">
            <header className="content-header-figma">
                <div className="header-left">
                    <h1>การจอง ({filteredBookings.length})</h1>
                    <p>จัดการและตรวจสอบสถานะการจองตั๋วภาพยนตร์ MCP CINEMA v2.0</p>
                </div>
            </header>

            <div className="search-box-figma" style={{ marginBottom: '25px', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                    type="text"
                    placeholder="ค้นหาชื่อลูกค้า, อีเมล, ชื่อหนัง, รหัสจอง, โรง หรือสาขา..."
                    className="input-field-figma"
                    style={{ width: '100%', padding: '15px 15px 15px 50px', background: '#1e212f', border: '1px solid #334155', borderRadius: '16px', color: 'white' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="figma-table-container">
                {loading ? (
                    <div className="flex justify-center p-10 text-center">
                        <Loader2 className="animate-spin" size={32} color="#8b5cf6" />
                    </div>
                ) : (
                    <div className="table-scroll-wrapper" style={{ overflowX: 'auto', paddingBottom: '20px' }}>
                        <table className="admin-custom-table" style={{ width: '100%', minWidth: '1200px', tableLayout: 'fixed' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '90px' }}>รหัสจอง</th>
                                    <th style={{ width: '100px' }}>วันที่ทำรายการ</th>
                                    <th style={{ width: '180px' }}>ข้อมูลลูกค้า</th>
                                    <th style={{ width: '220px' }}>ภาพยนตร์ / รอบฉาย</th>
                                    <th style={{ width: '160px' }}>โรง/สาขา</th>
                                    <th style={{ width: '160px' }}>ที่นั่ง</th>
                                    <th style={{ width: '100px' }}>ราคา</th>
                                    <th style={{ width: '100px' }}>สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map((item) => {
                                        const user = item.user_id || item.userId;
                                        const movie = item.showtime_id?.movie_id || {};
                                        // รองรับการดึงชื่อโรงจาก deep populate
                                        const theaterInfo = item.showtime_id?.auditorium_id || item.showtime_id || {};

                                        // 💡 ดึงชื่อสาขามาแสดงผล
                                        const branchDisplay =
                                            item.cinema_id?.name ||
                                            item.showtime_id?.auditorium_id?.cinema_id?.name ||
                                            '-';

                                        const priceValue = item.totalPrice || item.total_price || 0;
                                        const isPaid = item.status === 'paid' || item.status === 'confirmed';

                                        return (
                                            <tr key={item._id}>
                                                {/* รหัสจอง */}
                                                <td style={{ fontWeight: 'bold', color: '#8b5cf6', fontFamily: 'monospace', fontSize: '1.1em' }}>
                                                    {item.booking_number || 'ไม่มีรหัส'}
                                                </td>

                                                {/* วันที่ทำรายการ */}
                                                <td>
                                                    <div style={{ color: '#cbd5e1' }}>{formatDate(item.createdAt)}</div>
                                                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{formatTime(item.createdAt)} น.</div>
                                                </td>

                                                {/* ข้อมูลลูกค้า */}
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: '#e2e8f0' }}>
                                                            <Users size={14} className="text-gray-400" />
                                                            <span title={user?.name}>{user?.name || 'ลูกค้าทั่วไป'}</span>
                                                        </div>
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', paddingLeft: '20px' }} title={user?.email}>
                                                            {user?.email || '-'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* ภาพยนตร์ / รอบฉาย */}
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span style={{ fontWeight: '500', color: 'white', lineHeight: '1.4' }}>
                                                            {movie.title_th || movie.title_en || 'ไม่ระบุชื่อหนัง'}
                                                        </span>
                                                        <span style={{ fontSize: '0.8rem', color: '#22d3ee', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Clock size={12} />
                                                            รอบ: {formatDate(item.showtime_id?.start_time)} เวลา {formatTime(item.showtime_id?.start_time)} น.
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* โรง/สาขา */}
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#e2e8f0' }}>
                                                            <Monitor size={14} color="#22d3ee" />
                                                            {theaterInfo.name || theaterInfo.theater_name || '-'}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                                                            <MapPin size={12} />
                                                            {branchDisplay}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* ที่นั่ง */}
                                                <td>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                        {item.seats?.map((seat, idx) => {
                                                            const seatLabel = typeof seat === 'object'
                                                                ? `${seat.row_label}${seat.seat_number}`
                                                                : seat;
                                                            return (
                                                                <span key={idx} style={{
                                                                    background: '#4c1d95',
                                                                    color: '#e9d5ff',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: '600',
                                                                    border: '1px solid #6d28d9',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    {seatLabel}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </td>

                                                {/* ราคา */}
                                                <td style={{ fontWeight: '600', color: '#34d399', fontSize: '0.95rem' }}>
                                                    ฿{priceValue.toLocaleString()}
                                                </td>

                                                {/* สถานะ */}
                                                <td>
                                                    <span
                                                        className={`status-pill ${isPaid ? 'paid' : 'pending'}`}
                                                        style={{ fontSize: '0.75rem' }}
                                                    >
                                                        {isPaid ? 'ชำระแล้ว' : 'รอชำระ'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                <Search size={40} opacity={0.5} />
                                                <span>ไม่พบข้อมูลที่ค้นหา</span>
                                            </div>
                                        </td>
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