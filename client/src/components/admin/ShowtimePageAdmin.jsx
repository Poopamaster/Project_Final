import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Trash2, Monitor, Save, Calendar, Clock, Film, Filter, Plus, X, RotateCcw, CalendarDays } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import 'dayjs/locale/th';

// Import CSS File
import '../../css/ShowtimePageAdmin.css';

// Constants
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '10', '20', '30', '40', '50'];

// 🌟 สร้าง SweetAlert Custom Instance สำหรับหน้า Admin โดยเฉพาะ
const adminSwal = Swal.mixin({
    background: '#1e212f',
    color: '#fff',
    heightAuto: false, // 🛑 ป้องกันไม่ให้ Swal ไปแก้ CSS ของ Body จนหน้า Admin พัง
    scrollbarPadding: false // 🛑 ป้องกันหน้าจอกระตุกตอน Alert เด้ง
});

export default function ShowtimePageAdmin() {
    // --- State Management ---
    const [movies, setMovies] = useState([]);
    const [auditoriums, setAuditoriums] = useState([]);
    const [showtimes, setShowtimes] = useState([]);
    const [cinemas, setCinemas] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedIds, setSelectedIds] = useState([]);

    // Bulk Create State
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedHour, setSelectedHour] = useState("12");
    const [selectedMinute, setSelectedMinute] = useState("00");

    // Filter State
    const [filterCinema, setFilterCinema] = useState('all');
    const [filterMovie, setFilterMovie] = useState('all');
    const [filterDate, setFilterDate] = useState('');
    const [filterTimePeriod, setFilterTimePeriod] = useState('all');

    const [formData, setFormData] = useState({
        movie_id: '',
        auditorium_id: '',
        start_date: '',
        end_date: '',
        base_price: '160'
    });

    const [selectedCreateCinema, setSelectedCreateCinema] = useState("");

    // --- API & Effects ---
    const fetchData = async () => {
        try {
            setLoading(true);
            // 🛠️ แก้ไข: เพิ่ม cinemaRes เข้าไปใน array destructuring ให้ตรงกับจำนวน API ที่เรียก
            const [movieRes, auditoriumRes, showtimeRes, cinemaRes] = await Promise.all([
                axiosInstance.get('/movies'),
                axiosInstance.get('/auditoriums'),
                axiosInstance.get('/showtimes'),
                axiosInstance.get('/cinemas')
            ]);

            setMovies(movieRes.data.data || []);
            setAuditoriums(auditoriumRes.data.data || []);
            setShowtimes(showtimeRes.data.data || []);
            setCinemas(cinemaRes.data.data || []);
            setSelectedIds([]);

        } catch (error) {
            console.error("Fetch error:", error);
            adminSwal.fire({
                icon: 'error',
                title: 'Error',
                text: 'ไม่สามารถโหลดข้อมูลได้'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Filter Logic ---
    const filteredShowtimes = useMemo(() => {
        return showtimes.filter(st => {
            const matchMovie = filterMovie === 'all' || st.movie_id?._id === filterMovie;
            const matchCinema = filterCinema === 'all' || st.auditorium_id?.cinema_id?._id === filterCinema;

            let matchDate = true;
            if (filterDate) {
                matchDate = dayjs(st.start_time).format('YYYY-MM-DD') === filterDate;
            }

            let matchTime = true;
            if (filterTimePeriod !== 'all') {
                const hour = dayjs(st.start_time).hour();
                if (filterTimePeriod === 'morning') matchTime = hour < 12;
                else if (filterTimePeriod === 'afternoon') matchTime = hour >= 12 && hour < 17;
                else if (filterTimePeriod === 'evening') matchTime = hour >= 17;
            }

            return matchMovie && matchCinema && matchDate && matchTime;
        }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    }, [showtimes, filterMovie, filterCinema, filterDate, filterTimePeriod]);

    const uniqueCinemas = useMemo(() => {
        const map = new Map();
        return auditoriums.reduce((acc, aud) => {
            if (aud.cinema_id && !map.has(aud.cinema_id._id)) {
                map.set(aud.cinema_id._id, true);
                acc.push(aud.cinema_id);
            }
            return acc;
        }, []);
    }, [auditoriums]);

    const filteredAuditoriumsForCreate = useMemo(() => {
        // 1. ถ้ายังไม่เลือกสาขา ไม่ต้องโชว์โรง (ป้องกันการเลือกผิดสาขา)
        if (!selectedCreateCinema) return [];

        return auditoriums.filter(a => {
            // 2. ดึง Cinema ID จากโรงหนัง (เช็คทั้งแบบ Object และ String)
            const auditoriumCinemaId = (a.cinema_id && typeof a.cinema_id === 'object')
                ? a.cinema_id._id
                : a.cinema_id;

            // 3. เทียบกับสาขาที่เลือกอยู่ใน Dropdown "เลือกสาขา"
            return String(auditoriumCinemaId) === String(selectedCreateCinema);
        });
    }, [auditoriums, selectedCreateCinema]);

    // --- Handlers ---
    const handleResetFilter = () => {
        setFilterCinema('all');
        setFilterMovie('all');
        setFilterDate('');
        setFilterTimePeriod('all');
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredShowtimes.length && filteredShowtimes.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredShowtimes.map(st => st._id));
        }
    };

    const handleAddTimeSlot = (e) => {
        e.preventDefault();
        const time = `${selectedHour}:${selectedMinute}`;
        if (!timeSlots.includes(time)) setTimeSlots([...timeSlots, time].sort());
    };

    const handleRemoveTimeSlot = (t) => setTimeSlots(timeSlots.filter(x => x !== t));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.movie_id || !formData.auditorium_id || !formData.start_date || !formData.end_date) {
            return adminSwal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' });
        }
        if (timeSlots.length === 0) {
            return adminSwal.fire({ icon: 'warning', title: 'เวลาไม่ถูกต้อง', text: 'กรุณาเพิ่มรอบเวลาอย่างน้อย 1 รอบ' });
        }

        try {
            const payload = { ...formData, time_slots: timeSlots, base_price: Number(formData.base_price), language: "TH" };
            const res = await axiosInstance.post('/showtimes/bulk', payload);

            if (res.data.success) {
                await adminSwal.fire({
                    icon: 'success',
                    title: 'สำเร็จ',
                    text: `สร้างรายการสำเร็จ ${res.data.data.length} รอบ`,
                    confirmButtonColor: '#8b5cf6'
                });

                fetchData();
                setTimeSlots([]);
                setFormData({ ...formData, auditorium_id: '' });
            }
        } catch (error) {
            adminSwal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.response?.data?.message || error.message });
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;

        const result = await adminSwal.fire({
            title: `ลบ ${selectedIds.length} รายการ?`,
            text: "ยืนยันการลบข้อมูลที่เลือกทั้งหมด",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ลบเลย',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#ef4444'
        });

        if (result.isConfirmed) {
            try {
                const res = await axiosInstance.post('/showtimes/delete-multiple', { ids: selectedIds });
                adminSwal.fire({ icon: 'success', title: 'เรียบร้อย!', text: res.data.message, timer: 1500, showConfirmButton: false });
                fetchData();
            } catch (error) {
                adminSwal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.response?.data?.message || error.message });
            }
        }
    };

    const handleDeleteSingle = async (showtime) => {
        const id = showtime._id;
        if (showtime.batch_id) {
            const result = await adminSwal.fire({
                title: 'ลบข้อมูล', text: 'รอบนี้อยู่ในกลุ่ม (Batch) คุณต้องการลบแค่รอบนี้หรือทั้งกลุ่ม?', icon: 'question',
                showDenyButton: true, showCancelButton: true, confirmButtonText: 'ลบแค่อันนี้', denyButtonText: 'ลบทั้งกลุ่ม', cancelButtonText: 'ยกเลิก',
                confirmButtonColor: '#ef4444', denyButtonColor: '#b91c1c'
            });
            if (result.isConfirmed) deleteApi(id);
            else if (result.isDenied) deleteBatchApi(showtime.batch_id);
        } else {
            const result = await adminSwal.fire({
                title: 'ยืนยันการลบ', text: 'คุณต้องการลบรายการนี้ใช่หรือไม่?', icon: 'warning',
                showCancelButton: true, confirmButtonText: 'ลบเลย', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#ef4444'
            });
            if (result.isConfirmed) deleteApi(id);
        }
    };

    const deleteApi = async (id) => {
        try {
            await axiosInstance.delete(`/showtimes/${id}`);
            adminSwal.fire({ icon: 'success', title: 'ยกเลิกรอบฉายสำเร็จ', timer: 1000, showConfirmButton: false });
            fetchData();
        } catch (e) {
            // ✅ แก้ไข: ดึงข้อความอธิบายที่ Backend ส่งมาให้ (e.response.data.message)
            adminSwal.fire({
                icon: 'error',
                title: 'ไม่สามารถยกเลิกได้',
                text: e.response?.data?.message || e.message
            });
        }
    };

    const deleteBatchApi = async (batchId) => {
        try {
            await axiosInstance.delete(`/showtimes/batch/${batchId}`);
            adminSwal.fire({ icon: 'success', title: 'ยกเลิกกลุ่มสำเร็จ', timer: 1000, showConfirmButton: false });
            fetchData();
        } catch (e) {
            // ✅ แก้ไข: ดึงข้อความอธิบายที่ Backend ส่งมาให้
            adminSwal.fire({
                icon: 'error',
                title: 'ไม่สามารถยกเลิกกลุ่มได้',
                text: e.response?.data?.message || e.message
            });
        }
    };

    if (loading) return <div className="flex-center" style={{ marginTop: '50px', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" color="#8b5cf6" /></div>;

    return (
        <div className="admin-page">
            {/* --- Header & Create Form --- */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">จัดการรอบฉาย</h1>
                    <p className="page-subtitle">Overview & Management</p>
                </div>

                <div className="create-section">
                    <details open className="create-details">
                        <summary className="create-summary">
                            <div className="summary-content">
                                <Plus size={20} />
                                <span>เปิดฟอร์มสร้างรอบฉาย (Create)</span>
                            </div>
                        </summary>

                        <div className="form-content">
                            <form onSubmit={handleSubmit}>
                                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                    <div className="form-group">
                                        <label className="form-label"><Film size={16} /> เลือกหนัง</label>
                                        <select required className="form-select" onChange={e => setFormData({ ...formData, movie_id: e.target.value })}>
                                            <option value="">-- กรุณาเลือกหนัง --</option>
                                            {movies.map(m => <option key={m._id} value={m._id}>{m.title_th}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label"><Monitor size={16} /> เลือกสาขา</label>
                                        <select
                                            required
                                            className="form-select"
                                            value={selectedCreateCinema}
                                            onChange={e => {
                                                setSelectedCreateCinema(e.target.value);
                                                // 🛑 สำคัญมาก: เมื่อเปลี่ยนสาขา ต้องล้างค่าโรงเดิมทิ้งทันที
                                                setFormData(prev => ({ ...prev, auditorium_id: '' }));
                                            }}
                                        >
                                            <option value="">-- เลือกสาขา --</option>
                                            {cinemas.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label"><Monitor size={16} /> เลือกโรงภาพยนตร์</label>
                                        <select
                                            required
                                            className="form-select"
                                            value={formData.auditorium_id}
                                            disabled={!selectedCreateCinema} // 🛑 ถ้าไม่เลือกสาขา ห้ามเลือกโรง
                                            onChange={e => setFormData({ ...formData, auditorium_id: e.target.value })}
                                        >
                                            <option value="">
                                                {selectedCreateCinema ? "-- กรุณาเลือกโรง --" : "-- กรุณาเลือกสาขาก่อน --"}
                                            </option>
                                            {filteredAuditoriumsForCreate.map(a => (
                                                <option key={a._id} value={a._id}>
                                                    {a.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label"><Calendar size={16} /> วันที่เริ่มฉาย</label>
                                        <input type="date" required className="form-input" onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label"><Calendar size={16} /> วันที่สิ้นสุด</label>
                                        <input type="date" required className="form-input" onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                                    </div>
                                </div>

                                <div className="time-selection-wrapper">
                                    <label className="form-label" style={{ marginBottom: '8px' }}><Clock size={16} /> รอบเวลาฉาย</label>
                                    <div className="time-picker-container">
                                        <div className="time-picker-box">
                                            <select className="time-dropdown" onChange={e => setSelectedHour(e.target.value)} value={selectedHour}>
                                                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                            <span className="time-separator">:</span>
                                            <select className="time-dropdown" onChange={e => setSelectedMinute(e.target.value)} value={selectedMinute}>
                                                {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <button type="button" className="btn-add-time" onClick={handleAddTimeSlot}>
                                            <Plus size={24} />
                                        </button>
                                    </div>

                                    {timeSlots.length > 0 && (
                                        <div className="selected-tags">
                                            {timeSlots.map(t => (
                                                <div key={t} className="tag-badge">
                                                    {t}
                                                    <X size={14} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => handleRemoveTimeSlot(t)} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button type="submit" className="btn-submit">สร้างรอบฉาย</button>
                            </form>
                        </div>
                    </details>
                </div>
            </header>

            {/* --- Filter & Action Bar --- */}
            <div className="filter-bar">
                <div className="filter-controls">
                    <div className="form-group">
                        <label className="form-label"><Film size={14} /> ภาพยนตร์</label>
                        <select className="filter-input" value={filterMovie} onChange={(e) => setFilterMovie(e.target.value)}>
                            <option value="all">🎬 ทั้งหมด</option>
                            {movies.map(m => (<option key={m._id} value={m._id}>{m.title_th}</option>))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Monitor size={14} /> สาขา</label>
                        <select className="filter-input" value={filterCinema} onChange={(e) => setFilterCinema(e.target.value)}>
                            <option value="all">🏢 ทุกสาขา</option>
                            {uniqueCinemas.map(c => (<option key={c._id} value={c._id}>{c.name}</option>))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label"><CalendarDays size={14} /> วันที่ฉาย</label>
                        <input type="date" className="filter-input" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Clock size={14} /> ช่วงเวลา</label>
                        <select className="filter-input" value={filterTimePeriod} onChange={(e) => setFilterTimePeriod(e.target.value)}>
                            <option value="all">🕒 ทุกช่วงเวลา</option>
                            <option value="morning">🌅 เช้า (ก่อน 12:00)</option>
                            <option value="afternoon">☀️ บ่าย (12:00 - 16:59)</option>
                            <option value="evening">🌙 เย็น/ค่ำ (17:00+)</option>
                        </select>
                    </div>

                    {(filterCinema !== 'all' || filterMovie !== 'all' || filterDate !== '' || filterTimePeriod !== 'all') && (
                        <button className="filter-input btn-reset" onClick={handleResetFilter} title="ล้างตัวกรอง">
                            <RotateCcw size={18} color="#e2e8f0" />
                        </button>
                    )}

                    {selectedIds.length > 0 && (
                        <div className="bulk-actions">
                            <span className="selection-count">เลือก {selectedIds.length} รายการ</span>
                            <button className="btn-delete-bulk" onClick={handleDeleteSelected}>
                                <Trash2 size={18} /> ลบข้อมูล
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Table Section --- */}
            <div className="table-container">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="checkbox-cell">
                                    <input
                                        type="checkbox"
                                        className="custom-checkbox"
                                        checked={selectedIds.length > 0 && selectedIds.length === filteredShowtimes.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th style={{ textAlign: 'left' }}>ภาพยนตร์</th>
                                <th style={{ textAlign: 'center' }}>สาขา / โรง</th>
                                <th style={{ textAlign: 'center' }}>วันเวลาที่ฉาย</th>
                                <th style={{ textAlign: 'center' }}>สถานะ</th>
                                <th style={{ textAlign: 'center' }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredShowtimes.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="empty-state"> {/* 🌟 แก้ colSpan เป็น 6 */}
                                        <div className="empty-content">
                                            <Filter size={40} />
                                            <span>ไม่พบข้อมูลตามเงื่อนไขที่เลือก</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredShowtimes.map((st) => {
                                    // 🌟 2. เช็คว่า status เป็น cancelled หรือไม่
                                    const isCancelled = st.status === 'cancelled';

                                    return (
                                        // 🌟 3. ปรับ Style ให้แถวที่ถูกยกเลิกดูสีดรอปลง (opacity)
                                        <tr
                                            key={st._id}
                                            className={`data-row ${selectedIds.includes(st._id) ? 'selected' : ''}`}
                                            style={{
                                                opacity: isCancelled ? 0.6 : 1,
                                                backgroundColor: isCancelled ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                                            }}
                                        >
                                            <td className="checkbox-cell" style={{ borderRadius: '12px 0 0 12px' }}>
                                                <input
                                                    type="checkbox"
                                                    className="custom-checkbox"
                                                    checked={selectedIds.includes(st._id)}
                                                    onChange={() => handleSelectRow(st._id)}
                                                    disabled={isCancelled} // 🌟 4. ถ้าโดนยกเลิกแล้ว ปิดไม่ให้ติ๊ก Checkbox ซ้ำ
                                                />
                                            </td>
                                            <td>
                                                <div className="text-movie-title" style={{ textDecoration: isCancelled ? 'line-through' : 'none' }}>
                                                    {st.movie_id?.title_th}
                                                </div>
                                                <div className="text-movie-duration">{st.movie_id?.duration_min} นาที</div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="text-cinema">{st.auditorium_id?.name}</div>
                                                <div className="text-cinema-loc">{st.auditorium_id?.cinema_id?.name}</div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="text-date">{dayjs(st.start_time).locale('th').format('DD MMM YYYY')}</div>
                                                <div className="text-time">{dayjs(st.start_time).format('HH:mm')} น.</div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {/* 🌟 5. เพิ่ม Badge แสดงสถานะ */}
                                                {isCancelled ? (
                                                    <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                                                        ถูกยกเลิก
                                                    </span>
                                                ) : (
                                                    <span style={{ backgroundColor: '#10b981', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                                                        เปิดจอง
                                                    </span>
                                                )}
                                            </td>
                                            <td className="action-cell" style={{ borderRadius: '0 12px 12px 0' }}>
                                                {/* 🌟 6. ซ่อนปุ่มลบถ้ารอบถูกยกเลิกไปแล้ว */}
                                                {!isCancelled && (
                                                    <button className="btn-icon-delete" onClick={() => handleDeleteSingle(st)} title="ยกเลิกรอบฉาย">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}