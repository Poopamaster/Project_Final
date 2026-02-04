import React, { useState, useEffect } from 'react';
import { Loader2, Search, MapPin, Monitor, Clock } from 'lucide-react';
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

    // ✅ ระบบ Search ที่แก้ปัญหาเรื่อง โรง/สาขา ค้นหาไม่ได้
    const filteredBookings = bookings.filter(item => {
        const user = item.user_id || item.userId;
        const searchLower = searchTerm.toLowerCase();

        const bookingId = item._id?.substring(18, 24).toLowerCase() || '';
        const customerName = user?.name?.toLowerCase() || '';
        const customerEmail = user?.email?.toLowerCase() || '';

        // ดึงชื่อหนัง
        const movieName = (item.movieId?.title_th || item.showtime_id?.movie_id?.title_th || '').toLowerCase();

        // ดึงชื่อโรงและสาขา (เช็กหลายชั้นกันพัง)
        const theaterName = (item.showtime_id?.theater_name || '').toLowerCase();
        const branchName = (item.showtime_id?.branch || '').toLowerCase();

        const status = item.status === 'paid' ? 'ชำระแล้ว' : 'รอชำระ';
        const price = (item.totalPrice || item.total_price || 0).toString();

        return bookingId.includes(searchLower) ||
            customerName.includes(searchLower) ||
            customerEmail.includes(searchLower) ||
            movieName.includes(searchLower) ||
            theaterName.includes(searchLower) ||
            branchName.includes(searchLower) ||
            status.includes(searchLower) ||
            price.includes(searchLower);
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'ไม่ระบุ';
        return new Date(dateString).toLocaleDateString('th-TH', {
            day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

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
                    placeholder="ค้นหาชื่อลูกค้า, อีเมล, ชื่อหนัง, รหัสจอง, โรง หรือสาขา..."
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
                    <div className="table-scroll-wrapper" style={{ overflowX: 'auto' }}>
                        <div className="table-scroll-wrapper" style={{ overflowX: 'auto', paddingBottom: '20px' }}>
                            {/* ✅ แก้ minWidth เป็น 1200px เพื่อให้ตารางไม่เบียดกัน */}
                            <table className="admin-custom-table" style={{ width: '100%', minWidth: '1200px', tableLayout: 'fixed' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '80px' }}>รหัสจอง</th>
                                        <th style={{ width: '110px' }}>วันที่/เวลา</th>
                                        <th style={{ width: '160px' }}>ข้อมูลลูกค้า</th>
                                        <th>ภาพยนตร์ / รอบฉาย</th> {/* ปล่อย auto ให้ยืดตามที่เหลือ */}
                                        <th style={{ width: '130px' }}>โรง/สาขา</th>
                                        <th style={{ width: '160px' }}>ที่นั่ง ({/* ✅ เพิ่มความกว้างตรงนี้ */})</th>
                                        <th style={{ width: '90px' }}>ราคา</th>
                                        <th style={{ width: '100px' }}>สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.length > 0 ? (
                                        filteredBookings.map((item) => {
                                            const user = item.user_id || item.userId;
                                            const priceValue = item.totalPrice || item.total_price || 0;

                                            return (
                                                <tr key={item._id}>
                                                    <td style={{ fontWeight: 'bold', color: '#8b5cf6' }}>
                                                        #{item._id?.substring(18, 24).toUpperCase()}
                                                    </td>

                                                    <td>
                                                        <div style={{ color: '#cbd5e1', marginBottom: '4px' }}>{formatDate(item.createdAt).split(' ')[0]}</div>
                                                        <div style={{ color: '#22d3ee', fontSize: '0.8rem' }}>{formatDate(item.showtime_id?.start_time)}</div>
                                                    </td>

                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <span style={{ fontWeight: '500', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={user?.name}>
                                                                {user?.name || 'ลูกค้าทั่วไป'}
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={user?.email}>
                                                                {user?.email || '-'}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <span style={{ fontWeight: '500', color: 'white', lineHeight: '1.4' }}>
                                                                {item.showtime_id?.movie_id?.title_th || 'ไม่ระบุชื่อหนัง'}
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', color: '#22d3ee', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <Clock size={12} /> {formatTime(item.showtime_id?.start_time)} น.
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#e2e8f0' }}>
                                                                <Monitor size={14} color="#22d3ee" /> {item.showtime_id?.theater_name || '-'}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                                                                <MapPin size={12} /> {item.showtime_id?.branch || '-'}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* ✅ ส่วนแสดงที่นั่ง จัดให้ wrap สวยๆ */}
                                                    <td>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                            {item.seats?.map((seat, idx) => (
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
                                                                    {typeof seat === 'object' ? `${seat.row_label}${seat.seat_number}` : seat}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>

                                                    <td style={{ fontWeight: '600', color: '#34d399', fontSize: '0.95rem' }}>
                                                        {priceValue.toLocaleString()}
                                                    </td>

                                                    <td>
                                                        <span className={`status-pill ${item.status === 'paid' ? 'paid' : 'pending'}`} style={{ fontSize: '0.75rem' }}>
                                                            {item.status === 'paid' ? 'ชำระแล้ว' : 'รอชำระ'}
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
                    </div>
                )}
            </div>
        </div>
    );
}

// ฟังก์ชันช่วยจัดการเวลา
function formatTime(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}