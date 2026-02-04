import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Trash2, Monitor, Save, Calendar, Clock, Film, Filter, MapPin } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import 'dayjs/locale/th';

export default function ShowtimePageAdmin() {
    const [movies, setMovies] = useState([]);
    const [auditoriums, setAuditoriums] = useState([]);
    const [showtimes, setShowtimes] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- State สำหรับ Time Picker (แบบ 10 นาที) ---
    const [selectedHour, setSelectedHour] = useState("12");
    const [selectedMinute, setSelectedMinute] = useState("00");

    // --- State สำหรับ Filter (กรองข้อมูล) ---
    const [filterCinema, setFilterCinema] = useState('all');
    const [filterMovie, setFilterMovie] = useState('all');

    const [formData, setFormData] = useState({
        movie_id: '',
        auditorium_id: '',
        show_date: '',
        base_price: '160'
    });

    // สร้างตัวเลือกชั่วโมง (00-23)
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    // สร้างตัวเลือกนาที (00, 10, 20, 30, 40, 50)
    const minutes = ['00', '10', '20', '30', '40', '50'];

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
            Swal.fire({
                title: 'Error', text: 'ไม่สามารถโหลดข้อมูลได้', icon: 'error',
                background: '#1e212f', color: '#fff'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Logic การกรองข้อมูล (Filter Logic) ---
    // ใช้ useMemo เพื่อไม่ให้คำนวณใหม่ทุกครั้งที่ render ถ้า state ไม่เปลี่ยน
    const filteredShowtimes = useMemo(() => {
        return showtimes.filter(st => {
            // 1. กรองตามหนัง
            const matchMovie = filterMovie === 'all' || st.movie_id?._id === filterMovie;

            // 2. กรองตามสาขา (Cinema)
            // ต้องเช็ค st.auditorium_id -> cinema_id -> _id
            const matchCinema = filterCinema === 'all' || st.auditorium_id?.cinema_id?._id === filterCinema;

            return matchMovie && matchCinema;
        }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)); // เรียงตามเวลาฉายด้วย
    }, [showtimes, filterMovie, filterCinema]);

    // ดึงรายชื่อสาขาที่มีอยู่จริงจาก Auditoriums เพื่อมาทำ Dropdown Filter
    const uniqueCinemas = useMemo(() => {
        const cinemas = [];
        const map = new Map();
        for (const aud of auditoriums) {
            if (aud.cinema_id && !map.has(aud.cinema_id._id)) {
                map.set(aud.cinema_id._id, true);
                cinemas.push(aud.cinema_id);
            }
        }
        return cinemas;
    }, [auditoriums]);


    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("🔥 1. เริ่มทำงาน handleSubmit");

        // 1. Validation
        if (!formData.movie_id || !formData.auditorium_id || !formData.show_date) {
            alert('ข้อมูลไม่ครบ! กรุณาเลือกให้ครบทุกช่อง');
            return;
        }

        // 2. เตรียมข้อมูล (Convert Type ตรงนี้)
        // รวมวันที่ + เวลา + Timezone (+07:00 สำคัญมาก)
        const combinedDateTime = `${formData.show_date}T${selectedHour}:${selectedMinute}:00+07:00`;

        const payload = {
            movie_id: formData.movie_id,
            auditorium_id: formData.auditorium_id,
            start_time: combinedDateTime,
            base_price: Number(formData.base_price), // 👈 แปลง String เป็น Number ตรงนี้!
            language: "TH"
        };

        console.log("🚀 2. กำลังยิง API ไปที่ Backend...", payload);

        try {
            // 3. ยิง API (ตัด SweetAlert ออก ยิงสดเลย)
            const res = await axiosInstance.post('/showtimes', payload);

            console.log("✅ 3. Backend ตอบกลับมาว่า:", res.data);

            if (res.data.success) {
                alert('บันทึกสำเร็จเรียบร้อย!'); // ใช้ alert ธรรมดาแทนไปก่อน
                fetchData();
                setFormData({ ...formData, movie_id: '', auditorium_id: '' });
            }
        } catch (error) {
            console.error("❌ 4. Error เว้ยเฮ้ย:", error);
            const msg = error.response?.data?.message || error.message;
            alert(`พังครับพี่: ${msg}`);
        }
    };

    const handleDelete = async (id) => {
        console.log("🛠️ [Debug] 1. กดปุ่มลบ - ได้รับ ID:", id);

        // ❌ ปิด SweetAlert ตัวเก่าไปก่อน (เพราะสงสัยว่ามันค้าง หรือโดนบัง)
        /* const result = await Swal.fire({
            ...
        });
        if (!result.isConfirmed) return;
        */

        // ✅ ใช้วิธีนี้แทน (Popup ของ Browser เอง ชัวร์กว่า)
        const isConfirmed = window.confirm(`ต้องการลบ ID: ${id} ใช่ไหม? การลบจะไม่สามารถย้อนกลับได้!`);

        if (isConfirmed) {
            try {
                const url = `/showtimes/${id}`;
                console.log(`🚀 [Debug] 2. กำลังยิง API ไปที่: DELETE ${url}`);

                // ยิง API Delete
                const res = await axiosInstance.delete(url);

                console.log("✅ [Debug] 3. ผลลัพธ์จาก Server:", res);

                if (res.data.success || res.status === 200) {
                    alert('ลบเรียบร้อยแล้ว!'); // Alert ธรรมดา
                    fetchData(); // โหลดข้อมูลใหม่
                }
            } catch (error) {
                console.error("❌ [Debug] 4. Error:", error);
                alert(`ลบไม่ได้: ${error.response?.data?.message || error.message}`);
            }
        } else {
            console.log("🚫 ยกเลิกการลบ");
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <Loader2 className="animate-spin" size={48} color="#8b5cf6" />
        </div>
    );

    return (
        <div className="admin-page-content-inside" style={{ color: '#f1f5f9' }}>
            <header style={{ marginBottom: '35px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>จัดการรอบฉาย</h1>
                <p style={{ color: '#94a3b8' }}>กำหนดตารางเวลาและโรงภาพยนตร์</p>
            </header>

            {/* --- Form Section --- */}
            <div style={{
                background: 'rgba(30, 33, 47, 0.6)', padding: '30px', borderRadius: '24px',
                marginBottom: '40px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)'
            }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

                    {/* Row 1: Movie & Auditorium */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ color: '#a78bfa', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                                <Film size={16} style={{ display: 'inline', marginRight: '5px' }} /> ภาพยนตร์
                            </label>
                            <select
                                style={{ width: '100%', padding: '14px', background: '#11131f', color: 'white', border: '1px solid #334155', borderRadius: '12px' }}
                                value={formData.movie_id} onChange={(e) => setFormData({ ...formData, movie_id: e.target.value })} required>
                                <option value="">-- เลือกหนัง --</option>
                                {movies.map(m => <option key={m._id} value={m._id}>{m.title_th}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ color: '#a78bfa', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                                <Monitor size={16} style={{ display: 'inline', marginRight: '5px' }} /> โรงภาพยนตร์
                            </label>
                            <select
                                style={{ width: '100%', padding: '14px', background: '#11131f', color: 'white', border: '1px solid #334155', borderRadius: '12px' }}
                                value={formData.auditorium_id} onChange={(e) => setFormData({ ...formData, auditorium_id: e.target.value })} required>
                                <option value="">-- เลือกโรงฉาย --</option>
                                {auditoriums.map(a => (
                                    <option key={a._id} value={a._id}>{a.cinema_id?.name} - {a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Date & Custom Time Picker */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ color: '#a78bfa', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                                <Calendar size={16} style={{ display: 'inline', marginRight: '5px' }} /> วันที่ฉาย
                            </label>
                            <input
                                type="date"
                                style={{ width: '100%', padding: '14px', background: '#11131f', color: 'white', border: '1px solid #334155', borderRadius: '12px' }}
                                value={formData.show_date} onChange={(e) => setFormData({ ...formData, show_date: e.target.value })} required />
                        </div>

                        <div>
                            <label style={{ color: '#a78bfa', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                                <Clock size={16} style={{ display: 'inline', marginRight: '5px' }} /> เวลาฉาย (นาฬิกา : นาที)
                            </label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {/* Hour Select */}
                                <select
                                    value={selectedHour}
                                    onChange={(e) => setSelectedHour(e.target.value)}
                                    style={{ flex: 1, padding: '14px', background: '#11131f', color: 'white', border: '1px solid #334155', borderRadius: '12px', textAlign: 'center' }}
                                >
                                    {hours.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>:</span>
                                {/* Minute Select (10-minute intervals) */}
                                <select
                                    value={selectedMinute}
                                    onChange={(e) => setSelectedMinute(e.target.value)}
                                    style={{ flex: 1, padding: '14px', background: '#11131f', color: 'white', border: '1px solid #334155', borderRadius: '12px', textAlign: 'center' }}
                                >
                                    {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>น.</span>
                            </div>
                        </div>
                    </div>

                    <button type="submit" style={{
                        background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
                        color: 'white', border: 'none', padding: '16px', borderRadius: '12px',
                        fontWeight: '700', fontSize: '1rem', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px'
                    }}>
                        <Save size={20} /> ยืนยันเพิ่มรอบฉาย
                    </button>
                </form>
            </div>

            {/* --- Filter Bar Section (ส่วนใหม่สำหรับกรองข้อมูล) --- */}
            <div style={{
                marginBottom: '20px', padding: '15px 20px', background: '#161925',
                borderRadius: '16px', border: '1px solid #334155', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 'bold' }}>
                    <Filter size={20} /> ตัวกรอง:
                </div>

                {/* Filter Cinema */}
                <select
                    value={filterCinema}
                    onChange={(e) => setFilterCinema(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', minWidth: '200px' }}
                >
                    <option value="all">🏢 ทุกสาขา</option>
                    {uniqueCinemas.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>

                {/* Filter Movie */}
                <select
                    value={filterMovie}
                    onChange={(e) => setFilterMovie(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', minWidth: '200px' }}
                >
                    <option value="all">🎬 หนังทุกเรื่อง</option>
                    {movies.map(m => (
                        <option key={m._id} value={m._id}>{m.title_th}</option>
                    ))}
                </select>

                <div style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '0.9rem' }}>
                    เจอทั้งหมด {filteredShowtimes.length} รอบ
                </div>
            </div>

            {/* --- Table Section --- */}
            <div style={{ background: '#1e212f', borderRadius: '24px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead>
                            <tr style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                <th style={{ textAlign: 'left', padding: '0 15px' }}>ภาพยนตร์</th>
                                <th style={{ textAlign: 'center' }}>สาขา / โรง</th>
                                <th style={{ textAlign: 'center' }}>วันเวลาที่ฉาย</th>
                                <th style={{ textAlign: 'center' }}>ลบ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredShowtimes.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>ไม่พบรอบฉายตามเงื่อนไข</td></tr>
                            ) : (
                                filteredShowtimes.map((st) => (
                                    <tr key={st._id} style={{ background: 'rgba(17, 19, 31, 0.5)' }}>
                                        <td style={{ padding: '15px', borderRadius: '12px 0 0 12px' }}>
                                            <div style={{ fontWeight: '600', color: '#fff' }}>{st.movie_id?.title_th}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{st.movie_id?.duration_min} นาที</div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ color: '#22d3ee', fontSize: '0.9rem' }}>{st.auditorium_id?.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{st.auditorium_id?.cinema_id?.name}</div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ color: '#e2e8f0' }}>{dayjs(st.start_time).locale('th').format('DD MMM YYYY')}</div>
                                            <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>{dayjs(st.start_time).format('HH:mm')} น.</div>
                                        </td>
                                        <td style={{ textAlign: 'center', borderRadius: '0 12px 12px 0' }}>
                                            <button onClick={() => handleDelete(st._id)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}