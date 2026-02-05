import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Trash2, Monitor, Save, Calendar, Clock, Film, Filter, Plus, X, RotateCcw, CalendarDays } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import 'dayjs/locale/th';

export default function ShowtimePageAdmin() {
    const [movies, setMovies] = useState([]);
    const [auditoriums, setAuditoriums] = useState([]);
    const [showtimes, setShowtimes] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- State สำหรับ Checkbox Selection ---
    const [selectedIds, setSelectedIds] = useState([]);

    // --- State สำหรับ Bulk Create ---
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedHour, setSelectedHour] = useState("12");
    const [selectedMinute, setSelectedMinute] = useState("00");

    // --- State สำหรับ Filter (เพิ่ม Date และ Time) ---
    const [filterCinema, setFilterCinema] = useState('all');
    const [filterMovie, setFilterMovie] = useState('all');
    const [filterDate, setFilterDate] = useState(''); // เก็บวันที่ YYYY-MM-DD
    const [filterTimePeriod, setFilterTimePeriod] = useState('all'); // all, morning, afternoon, evening

    const [formData, setFormData] = useState({
        movie_id: '',
        auditorium_id: '',
        start_date: '',
        end_date: '',
        base_price: '160'
    });

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
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
            setSelectedIds([]);

        } catch (error) {
            console.error("Fetch error:", error);
            alert("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Logic การกรองข้อมูล (Update ใหม่) ---
    const filteredShowtimes = useMemo(() => {
        return showtimes.filter(st => {
            // 1. Filter Movie
            const matchMovie = filterMovie === 'all' || st.movie_id?._id === filterMovie;

            // 2. Filter Cinema
            const matchCinema = filterCinema === 'all' || st.auditorium_id?.cinema_id?._id === filterCinema;

            // 3. Filter Date (เพิ่มใหม่)
            let matchDate = true;
            if (filterDate) {
                matchDate = dayjs(st.start_time).format('YYYY-MM-DD') === filterDate;
            }

            // 4. Filter Time Period (เพิ่มใหม่)
            let matchTime = true;
            if (filterTimePeriod !== 'all') {
                const hour = dayjs(st.start_time).hour();
                if (filterTimePeriod === 'morning') matchTime = hour < 12;      // ก่อนเที่ยง
                else if (filterTimePeriod === 'afternoon') matchTime = hour >= 12 && hour < 17; // 12:00 - 16:59
                else if (filterTimePeriod === 'evening') matchTime = hour >= 17;  // 17:00 เป็นต้นไป
            }

            return matchMovie && matchCinema && matchDate && matchTime;
        }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    }, [showtimes, filterMovie, filterCinema, filterDate, filterTimePeriod]);

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

    // Function Reset Filter
    const handleResetFilter = () => {
        setFilterCinema('all');
        setFilterMovie('all');
        setFilterDate('');
        setFilterTimePeriod('all');
    };

    // --- CHECKBOX LOGIC ---
    const handleSelectRow = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredShowtimes.length && filteredShowtimes.length > 0) {
            setSelectedIds([]);
        } else {
            const allIds = filteredShowtimes.map(st => st._id);
            setSelectedIds(allIds);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        const result = await Swal.fire({
            title: `ลบ ${selectedIds.length} รายการ?`,
            text: "ยืนยันการลบข้อมูลที่เลือกทั้งหมด",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ลบเลย',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#ef4444',
            background: '#1e212f', color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                const res = await axiosInstance.post('/showtimes/delete-multiple', { ids: selectedIds });
                await Swal.fire({
                    icon: 'success', title: 'เรียบร้อย!', text: res.data.message,
                    timer: 1500, showConfirmButton: false, background: '#1e212f', color: '#fff'
                });
                fetchData();
            } catch (error) {
                Swal.fire({
                    icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.response?.data?.message,
                    background: '#1e212f', color: '#fff'
                });
            }
        }
    };

    // --- Handlers อื่นๆ (คงเดิม) ---
    const handleAddTimeSlot = (e) => {
        e.preventDefault();
        const time = `${selectedHour}:${selectedMinute}`;
        if (!timeSlots.includes(time)) setTimeSlots([...timeSlots, time].sort());
    };
    const handleRemoveTimeSlot = (t) => setTimeSlots(timeSlots.filter(x => x !== t));
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.movie_id || !formData.auditorium_id || !formData.start_date || !formData.end_date) { alert('กรอกข้อมูลให้ครบ'); return; }
        if (timeSlots.length === 0) { alert('เพิ่มรอบเวลา'); return; }
        try {
            const payload = { ...formData, time_slots: timeSlots, base_price: Number(formData.base_price), language: "TH" };
            const res = await axiosInstance.post('/showtimes/bulk', payload);
            if (res.data.success) { alert(`สร้างสำเร็จ ${res.data.data.length} รอบ`); fetchData(); setTimeSlots([]); }
        } catch (error) { alert(error.message); }
    };
    const handleDeleteSingle = async (showtime) => {
        const id = showtime._id;
        if (showtime.batch_id) {
            const result = await Swal.fire({
                title: 'ลบข้อมูล', text: 'รอบนี้อยู่ในกลุ่ม (Batch)', icon: 'question',
                showDenyButton: true, showCancelButton: true, confirmButtonText: 'ลบแค่อันนี้', denyButtonText: 'ลบทั้งกลุ่ม',
                background: '#1e212f', color: '#fff'
            });
            if (result.isConfirmed) deleteApi(id);
            else if (result.isDenied) deleteBatchApi(showtime.batch_id);
        } else {
            if (window.confirm(`ลบ ID: ${id}?`)) deleteApi(id);
        }
    };
    const deleteApi = async (id) => { try { await axiosInstance.delete(`/showtimes/${id}`); fetchData(); } catch (e) { alert(e.message); } };
    const deleteBatchApi = async (batchId) => { try { await axiosInstance.delete(`/showtimes/batch/${batchId}`); fetchData(); } catch (e) { alert(e.message); } };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}><Loader2 className="animate-spin" color="#8b5cf6" /></div>;

    return (
        <div className="admin-page-content-inside" style={{ color: '#f1f5f9', fontFamily: 'Kanit, sans-serif' }}>
            {/* --- ส่วนที่แก้ไข: Header และ Form สร้างรอบฉาย --- */}
            <header style={{ marginBottom: '35px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0 }}>จัดการรอบฉาย</h1>
                        <p style={{ color: '#94a3b8', margin: '5px 0 0 0' }}>Overview & Management</p>
                    </div>
                </div>

                {/* Toggle Form Area */}
                <div style={{ marginTop: '30px' }}>
                    <details open style={{ background: '#161925', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' }}>
                        <summary style={{
                            cursor: 'pointer',
                            padding: '15px 20px',
                            background: '#1e212f',
                            color: '#a78bfa',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            listStyle: 'none' // ซ่อนลูกศรสามเหลี่ยม default
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Plus size={20} />
                                <span>เปิดฟอร์มสร้างรอบฉาย (Create)</span>
                            </div>
                        </summary>

                        <div style={{ padding: '25px' }}>
                            <form onSubmit={handleSubmit}>

                                {/* Row 1: Movie & Cinema */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Film size={16} /> เลือกหนัง
                                        </label>
                                        <select required onChange={e => setFormData({ ...formData, movie_id: e.target.value })} style={modernInputStyle}>
                                            <option value="">-- กรุณาเลือกหนัง --</option>
                                            {movies.map(m => <option key={m._id} value={m._id}>{m.title_th}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Monitor size={16} /> เลือกโรงภาพยนตร์
                                        </label>
                                        <select required onChange={e => setFormData({ ...formData, auditorium_id: e.target.value })} style={modernInputStyle}>
                                            <option value="">-- กรุณาเลือกโรง --</option>
                                            {auditoriums.map(a => <option key={a._id} value={a._id}>{a.name} ({a.cinema_id?.name})</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Row 2: Date Range */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Calendar size={16} /> วันที่เริ่มฉาย
                                        </label>
                                        <input type="date" required onChange={e => setFormData({ ...formData, start_date: e.target.value })} style={modernInputStyle} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Calendar size={16} /> วันที่สิ้นสุด
                                        </label>
                                        <input type="date" required onChange={e => setFormData({ ...formData, end_date: e.target.value })} style={modernInputStyle} />
                                    </div>
                                </div>

                                {/* Row 3: Time Selection */}
                                <div style={{ marginBottom: '25px' }}>
                                    <label style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                                        <Clock size={16} /> รอบเวลาฉาย
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', borderRadius: '8px', padding: '5px', border: '1px solid #334155' }}>
                                            <select onChange={e => setSelectedHour(e.target.value)} value={selectedHour} style={timeSelectStyle}>
                                                {hours.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                            <span style={{ color: '#64748b', fontWeight: 'bold', padding: '0 5px' }}>:</span>
                                            <select onChange={e => setSelectedMinute(e.target.value)} value={selectedMinute} style={timeSelectStyle}>
                                                {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>

                                        <button type="button" onClick={handleAddTimeSlot}
                                            style={{
                                                background: '#8b5cf6', border: 'none', width: '42px', height: '42px',
                                                borderRadius: '10px', color: 'white', cursor: 'pointer', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.5)'
                                            }}>
                                            <Plus size={24} />
                                        </button>
                                    </div>

                                    {/* Selected Tags */}
                                    {timeSlots.length > 0 && (
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
                                            {timeSlots.map(t => (
                                                <div key={t} style={{
                                                    background: '#6d28d9', padding: '6px 14px', borderRadius: '20px',
                                                    fontSize: '0.9rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                                }}>
                                                    {t}
                                                    <X size={14} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => handleRemoveTimeSlot(t)} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button type="submit" style={{
                                    width: '100%',
                                    background: 'linear-gradient(to right, #7c3aed, #9333ea)',
                                    color: 'white',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                                    transition: 'transform 0.1s'
                                }}>
                                    สร้างรอบฉาย
                                </button>
                            </form>
                        </div>
                    </details>
                </div>
            </header>



            {/* --- Filter & Action Bar (Redesigned) --- */}
            <div style={{
                marginBottom: '20px', padding: '20px', background: '#161925',
                borderRadius: '16px', border: '1px solid #334155',
                position: 'sticky', top: '10px', zIndex: 20,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>

                    {/* Filter Group 1: General */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Film size={14} /> ภาพยนตร์
                        </label>
                        <select value={filterMovie} onChange={(e) => setFilterMovie(e.target.value)} style={inputStyle}>
                            <option value="all">🎬 ทั้งหมด</option>
                            {movies.map(m => (<option key={m._id} value={m._id}>{m.title_th}</option>))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Monitor size={14} /> สาขา
                        </label>
                        <select value={filterCinema} onChange={(e) => setFilterCinema(e.target.value)} style={inputStyle}>
                            <option value="all">🏢 ทุกสาขา</option>
                            {uniqueCinemas.map(c => (<option key={c._id} value={c._id}>{c.name}</option>))}
                        </select>
                    </div>

                    {/* Filter Group 2: Time */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CalendarDays size={14} /> วันที่ฉาย
                        </label>
                        
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={14} /> ช่วงเวลา
                        </label>
                        <select value={filterTimePeriod} onChange={(e) => setFilterTimePeriod(e.target.value)} style={inputStyle}>
                            <option value="all">🕒 ทุกช่วงเวลา</option>
                            <option value="morning">🌅 เช้า (ก่อน 12:00)</option>
                            <option value="afternoon">☀️ บ่าย (12:00 - 16:59)</option>
                            <option value="evening">🌙 เย็น/ค่ำ (17:00+)</option>
                        </select>
                    </div>

                    {/* Reset Button */}
                    {(filterCinema !== 'all' || filterMovie !== 'all' || filterDate !== '' || filterTimePeriod !== 'all') && (
                        <button onClick={handleResetFilter} style={{ ...inputStyle, background: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="ล้างตัวกรอง">
                            <RotateCcw size={18} color="#e2e8f0" />
                        </button>
                    )}

                    {/* Action: Delete Selected */}
                    {selectedIds.length > 0 && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>เลือก {selectedIds.length} รายการ</span>
                            <button
                                onClick={handleDeleteSelected}
                                style={{
                                    background: '#ef4444', color: 'white', border: 'none',
                                    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold',
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                                }}
                            >
                                <Trash2 size={18} /> ลบข้อมูล
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Table Section --- */}
            <div style={{ background: '#1e212f', borderRadius: '24px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead>
                            <tr style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                <th style={{ padding: '0 15px', width: '50px', textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length > 0 && selectedIds.length === filteredShowtimes.length}
                                        onChange={handleSelectAll}
                                        style={{ transform: 'scale(1.3)', cursor: 'pointer', accentColor: '#8b5cf6' }}
                                    />
                                </th>
                                <th style={{ textAlign: 'left', padding: '0 15px' }}>ภาพยนตร์</th>
                                <th style={{ textAlign: 'center' }}>สาขา / โรง</th>
                                <th style={{ textAlign: 'center' }}>วันเวลาที่ฉาย</th>
                                <th style={{ textAlign: 'center' }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredShowtimes.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                        <Filter size={40} />
                                        <span>ไม่พบข้อมูลตามเงื่อนไขที่เลือก</span>
                                    </div>
                                </td></tr>
                            ) : (
                                filteredShowtimes.map((st) => (
                                    <tr key={st._id} style={{
                                        background: selectedIds.includes(st._id) ? 'rgba(139, 92, 246, 0.15)' : 'rgba(17, 19, 31, 0.5)',
                                        transition: 'background 0.2s'
                                    }}>
                                        <td style={{ textAlign: 'center', borderRadius: '12px 0 0 12px' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(st._id)}
                                                onChange={() => handleSelectRow(st._id)}
                                                style={{ transform: 'scale(1.3)', cursor: 'pointer', accentColor: '#8b5cf6' }}
                                            />
                                        </td>
                                        <td style={{ padding: '15px' }}>
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
                                            <button onClick={() => handleDeleteSingle(st)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>
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

            {/* --- (Optional) Bulk Create Form Button --- */}

        </div>
    );
}

// Common Style for Inputs
const inputStyle = {
    padding: '10px 12px',
    borderRadius: '8px',
    background: '#0f172a',
    color: '#e2e8f0',
    border: '1px solid #334155',
    minWidth: '140px',
    outline: 'none',
    fontSize: '0.9rem'
};

const modernInputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    background: '#0f172a',
    color: '#f8fafc',
    border: '1px solid #334155',
    outline: 'none',
    fontSize: '0.95rem',
    transition: 'border-color 0.2s'
};

// Style เฉพาะสำหรับ Dropdown เวลา
const timeSelectStyle = {
    background: 'transparent',
    color: '#f8fafc',
    border: 'none',
    padding: '8px',
    fontSize: '1.1rem',
    fontWeight: '500',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none', // ซ่อนลูกศร default ของ browser
    textAlign: 'center'
};