import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, Monitor, Save, Calendar, Clock, Film, Info, MapPin } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import 'dayjs/locale/th';

export default function ShowtimePageAdmin() {
    const [movies, setMovies] = useState([]);
    const [auditoriums, setAuditoriums] = useState([]);
    const [showtimes, setShowtimes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        movie_id: '',
        auditorium_id: '',
        show_date: '', 
        show_time: '', 
        base_price: '160' 
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [movieRes, auditoriumRes, showtimeRes] = await Promise.all([
                axiosInstance.get('/movies'), 
                axiosInstance.get('/auditoriums'), 
                axiosInstance.get('/showtimes')
            ]);
            setMovies(movieRes.data.data || []);
            setAuditoriums(auditoriumRes.data.data || []);
            setShowtimes(showtimeRes.data.data || []);
        } catch (error) {
            console.error("Fetch error:", error);
            Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const confirmSave = await Swal.fire({
            title: 'ยืนยันการเพิ่มรอบฉาย?',
            text: "ระบบจะบันทึกกิจกรรมนี้ลงใน Log System ด้วย",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#8b5cf6',
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            background: '#1e212f', color: '#fff'
        });

        if (confirmSave.isConfirmed) {
            const combinedDateTime = `${formData.show_date}T${formData.show_time}:00`;
            try {
                const res = await axiosInstance.post('/admin/showtimes', {
                    movie_id: formData.movie_id,
                    auditorium_id: formData.auditorium_id,
                    start_time: combinedDateTime,
                    base_price: formData.base_price,
                    language: "TH"
                });
                if (res.data.success) {
                    await Swal.fire({ icon: 'success', title: 'เพิ่มรอบฉายสำเร็จ', background: '#1e212f', color: '#fff' });
                    fetchData();
                    setFormData({ ...formData, movie_id: '', auditorium_id: '', show_date: '', show_time: '' });
                }
            } catch (error) {
                Swal.fire('ผิดพลาด', error.response?.data?.message || 'เวลาฉายซ้ำซ้อนกับรอบอื่น', 'error');
            }
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบรอบฉาย?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'ใช่, ลบเลย!',
            background: '#1e212f', color: '#fff'
        });
        if (result.isConfirmed) {
            try {
                const res = await axiosInstance.delete(`/admin/showtimes/${id}`);
                if (res.data.success) {
                    await Swal.fire({ title: 'ลบสำเร็จ!', icon: 'success', background: '#1e212f', color: '#fff' });
                    fetchData(); 
                }
            } catch (error) {
                Swal.fire('ผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
            }
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '100px' }}>
            <Loader2 className="animate-spin" size={48} color="#8b5cf6" />
            <p style={{color: '#94a3b8', marginTop: '10px'}}>กำลังเชื่อมต่อฐานข้อมูล...</p>
        </div>
    );

    return (
        <div className="admin-page-content-inside" style={{ color: '#f1f5f9' }}>
            <header style={{ marginBottom: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>จัดการรอบฉาย</h1>
                    <p style={{ color: '#94a3b8', marginTop: '5px' }}>กำหนดตารางเวลาและโรงภาพยนตร์ (ทั้งหมด {showtimes.length} รอบ)</p>
                </div>
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '12px 24px', borderRadius: '18px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <span style={{ color: '#a78bfa', fontSize: '0.95rem', fontWeight: '600' }}>🍿 สถานะระบบ: พร้อมใช้งาน</span>
                </div>
            </header>

            {/* ส่วนฟอร์มที่ปรับปรุงใหม่: ช่องใหญ่ สวยงาม ใช้งานง่าย */}
            <div style={{ 
                background: 'rgba(30, 33, 47, 0.6)', 
                padding: '40px', 
                borderRadius: '32px', 
                marginBottom: '40px', 
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(12px)'
            }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    {/* แถวที่ 1: เลือกหนัง และ โรงฉาย (ช่องใหญ่เต็มตา) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ color: '#a78bfa', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Film size={18} /> เลือกภาพยนตร์ที่ต้องการฉาย
                            </label>
                            <select 
                                style={{ 
                                    width: '100%', padding: '18px 24px', background: '#11131f', color: 'white', 
                                    border: '2px solid #334155', borderRadius: '20px', fontSize: '1rem',
                                    appearance: 'none', cursor: 'pointer', transition: 'all 0.3s ease'
                                }}
                                value={formData.movie_id} onChange={(e) => setFormData({...formData, movie_id: e.target.value})} required>
                                <option value="">-- คลิกเพื่อเลือกหนังในระบบ --</option>
                                {movies.map(m => <option key={m._id} value={m._id}>{m.title_th}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ color: '#a78bfa', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Monitor size={18} /> เลือกโรงภาพยนตร์และสาขา
                            </label>
                            <select 
                                style={{ 
                                    width: '100%', padding: '18px 24px', background: '#11131f', color: 'white', 
                                    border: '2px solid #334155', borderRadius: '20px', fontSize: '1rem',
                                    appearance: 'none', cursor: 'pointer', transition: 'all 0.3s ease'
                                }}
                                value={formData.auditorium_id} onChange={(e) => setFormData({...formData, auditorium_id: e.target.value})} required>
                                <option value="">-- คลิกเพื่อเลือกโรงฉาย --</option>
                                {auditoriums.map(a => <option key={a._id} value={a._id}>{a.name} ({a.cinema_id?.name || 'สาขาหลัก'})</option>)}
                            </select>
                        </div>
                    </div>

                    {/* แถวที่ 2: วันที่ และ เวลา (ใช้งานง่าย ไม่ต้องพิมพ์) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ color: '#a78bfa', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={18} /> กำหนดวันที่ฉาย
                            </label>
                            <input 
                                type="date" 
                                style={{ 
                                    width: '100%', padding: '16px 24px', background: '#11131f', color: 'white', 
                                    border: '2px solid #334155', borderRadius: '20px', fontSize: '1.1rem', cursor: 'pointer'
                                }}
                                value={formData.show_date} onChange={(e) => setFormData({...formData, show_date: e.target.value})} required />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ color: '#a78bfa', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Clock size={18} /> กำหนดเวลาเริ่มฉาย (คลิกเพื่อเลือกเวลา)
                            </label>
                            <input 
                                type="time" 
                                style={{ 
                                    width: '100%', padding: '16px 24px', background: '#11131f', color: 'white', 
                                    border: '2px solid #334155', borderRadius: '20px', fontSize: '1.1rem', cursor: 'pointer'
                                }}
                                value={formData.show_time} onChange={(e) => setFormData({...formData, show_time: e.target.value})} required />
                        </div>
                    </div>

                    <button type="submit" style={{ 
                        marginTop: '10px', background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)', 
                        color: 'white', border: 'none', padding: '22px', borderRadius: '22px', 
                        fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', gap: '12px',
                        boxShadow: '0 15px 30px -5px rgba(139, 92, 246, 0.4)', transition: 'all 0.3s ease'
                    }}>
                        <Save size={24} /> บันทึกและเพิ่มรอบฉายลงในตาราง
                    </button>
                </form>
            </div>

            {/* ตารางแสดงผลคงเดิมแต่ปรับ Padding ให้สมดุล */}
            <div style={{ background: '#1e212f', borderRadius: '28px', padding: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                        <thead>
                            <tr style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <th style={{ textAlign: 'left', padding: '0 25px' }}>ข้อมูลภาพยนตร์</th>
                                <th>โรง / สถานที่</th>
                                <th>วันที่ฉาย</th>
                                <th>เวลาเริ่ม</th>
                                <th>การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {showtimes.map((st) => (
                                <tr key={st._id} style={{ background: 'rgba(17, 19, 31, 0.8)', borderRadius: '20px' }}>
                                    <td style={{ padding: '20px 25px', borderRadius: '20px 0 0 20px' }}>
                                        <div style={{ fontWeight: '700', color: '#fff', fontSize: '1.05rem' }}>{st.movie_id?.title_th || "ไม่พบข้อมูลหนัง"}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{st.movie_id?.title_en || "No Title"}</div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ color: '#22d3ee', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                            <Monitor size={15} /> {st.auditorium_id?.name || "ไม่พบโรง"}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>{st.auditorium_id?.cinema_id?.name || "สาขาหลัก"}</div>
                                    </td>
                                    <td style={{ textAlign: 'center', color: '#f1f5f9' }}>{dayjs(st.start_time).locale('th').format('DD/MM/YYYY')}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ color: '#fbbf24', fontWeight: '800', background: 'rgba(251, 191, 36, 0.1)', padding: '6px 14px', borderRadius: '10px', display: 'inline-block', fontSize: '0.95rem' }}>
                                            {dayjs(st.start_time).format('HH:mm')} น.
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', borderRadius: '0 20px 20px 0' }}>
                                        <button onClick={() => handleDelete(st._id)} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '12px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                                            <Trash2 size={20}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}