import React, { useState, useEffect } from 'react';
import { Armchair, LayoutGrid, MonitorPlay, Plus, Loader2, Trash2 } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import Swal from 'sweetalert2';

export default function AdminSeatPage() {
    // State สำหรับ Dropdown
    const [cinemas, setCinemas] = useState([]);
    const [selectedCinema, setSelectedCinema] = useState('');
    const [auditoriums, setAuditoriums] = useState([]);
    const [selectedAuditorium, setSelectedAuditorium] = useState('');
    const [seatTypes, setSeatTypes] = useState([]);

    // State สำหรับข้อมูลและสถานะ
    const [seats, setSeats] = useState([]); // เก็บเก้าอี้ที่ Generate แล้วมาโชว์เป็นผัง
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    // State สำหรับฟอร์มสร้างที่นั่ง
    const [formData, setFormData] = useState({
        seat_type_id: '',
        startRow: 'A',
        endRow: 'F',
        col_count: 20
    });

    // 1. โหลดข้อมูลเริ่มต้น (สาขา และ ประเภทที่นั่ง)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [cinemaRes, seatTypeRes] = await Promise.all([
                    axiosInstance.get('/cinemas'),
                    axiosInstance.get('/seats/type') // ✅ เช็คแล้วว่าตรงกับ Backend
                ]);

                if (cinemaRes.data.success) setCinemas(cinemaRes.data.data);
                if (seatTypeRes.data.success) setSeatTypes(seatTypeRes.data.data);
            } catch (error) {
                console.error("Error fetching initial data:", error);
                Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'โหลดข้อมูลเริ่มต้นไม่สำเร็จ' });
            }
        };
        fetchInitialData();
    }, []);

    // 2. เมื่อเลือก "สาขา" ให้ไปดึง "โรงภาพยนตร์" ของสาขานั้นมา
    useEffect(() => {
        if (selectedCinema) {
            const fetchAuditoriums = async () => {
                try {
                    const res = await axiosInstance.get(`/auditoriums/cinema/${selectedCinema}`);
                    if (res.data.success) {
                        setAuditoriums(res.data.data);
                        setSelectedAuditorium(''); // รีเซ็ตโรงที่เลือก
                        setSeats([]); // ล้างผังที่นั่งเก่า
                    }
                } catch (error) {
                    console.error("Error fetching auditoriums:", error);
                }
            };
            fetchAuditoriums();
        } else {
            setAuditoriums([]);
            setSelectedAuditorium('');
            setSeats([]);
        }
    }, [selectedCinema]);

    // 3. เมื่อเลือก "โรงภาพยนตร์" ให้ไปดึง "ที่นั่ง" ของโรงนั้นมาแสดงเป็นผัง
    useEffect(() => {
        if (selectedAuditorium) {
            fetchSeats();
        } else {
            setSeats([]);
        }
    }, [selectedAuditorium]);

    const fetchSeats = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/seats/auditorium/${selectedAuditorium}`);
            if (res.data.success) {
                setSeats(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching seats:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 4. กดยืนยันสร้างที่นั่ง (Generate Seats)
    const handleGenerateSeats = async (e) => {
        e.preventDefault();

        if (!selectedAuditorium) {
            return Swal.fire({ icon: 'warning', title: 'แจ้งเตือน', text: 'กรุณาเลือกโรงภาพยนตร์ก่อน' });
        }

        setGenerating(true);
        try {
            // 🌟 1. แปลงตัวอักษร A-Z ให้เป็นตัวเลข Index (A=0, B=1, C=2...)
            const startChar = formData.startRow.toUpperCase();
            const endChar = formData.endRow.toUpperCase();

            const startIndex = startChar.charCodeAt(0) - 65; // แปลงรหัส ASCII 'A' เป็น 0
            const endIndex = endChar.charCodeAt(0) - 65;

            // 🌟 2. คำนวณว่าต้องสร้างทั้งหมดกี่แถว (row_count)
            const rowCount = endIndex - startIndex + 1;

            if (rowCount <= 0) {
                setGenerating(false);
                return Swal.fire({ icon: 'error', title: 'ข้อมูลผิดพลาด', text: 'ตัวอักษรแถวสิ้นสุด ต้องอยู่หลังแถวเริ่มต้น (เช่น เริ่ม A จบ C)' });
            }

            // 🌟 3. ส่ง Payload ไปหา Backend
            const response = await axiosInstance.post('/seats/generate', {
                auditorium_id: selectedAuditorium,
                seat_type_id: formData.seat_type_id,
                start_row_index: startIndex,   
                row_count: rowCount,           
                col_count: Number(formData.col_count) 
            });

            if (response.data.success) {
                Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: response.data.message });
                fetchSeats(); 
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.response?.data?.message || 'ไม่สามารถสร้างที่นั่งได้' });
        } finally {
            setGenerating(false);
        }
    };

    // 🎨 ฟังก์ชันกำหนดสีให้แต่ละ Seat Type อัตโนมัติ (ย้ายมาไว้ข้างนอก render)
    const getSeatColor = (typeId) => {
        const colors = ['#3b82f6', '#ec4899', '#a855f7', '#10b981', '#f97316', '#eab308'];
        const index = seatTypes.findIndex(st => st._id === typeId);
        return index !== -1 ? colors[index % colors.length] : '#1e293b'; 
    };

    // 🗑️ ฟังก์ชันล้างผังที่นั่งทั้งหมดในโรง
    const handleClearSeats = async () => {
        if (!selectedAuditorium) return;

        const result = await Swal.fire({
            title: 'ยืนยันการล้างผังที่นั่ง?',
            text: "ที่นั่งทั้งหมดในโรงนี้จะถูกลบทิ้ง คุณไม่สามารถกู้คืนได้!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#334155',
            confirmButtonText: 'ใช่, ลบทิ้งเลย!',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                const res = await axiosInstance.delete(`/seats/auditorium/${selectedAuditorium}`);
                if (res.data.success) {
                    Swal.fire('ลบสำเร็จ!', res.data.message, 'success');
                    fetchSeats(); // ดึงข้อมูลมาใหม่ (โรงว่าง)
                }
            } catch (error) {
                Swal.fire('ผิดพลาด', 'ไม่สามารถลบที่นั่งได้', 'error');
            }
        }
    };

    // 🎨 ฟังก์ชันสำหรับวาดผัง
    const renderSeatingPlan = () => {
        if (seats.length === 0) return <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>ยังไม่มีที่นั่งในโรงนี้</p>;

        const seatMap = {};
        seats.forEach(seat => {
            if (!seatMap[seat.row_label]) seatMap[seat.row_label] = [];
            seatMap[seat.row_label].push(seat);
        });

        const rows = Object.keys(seatMap).sort();

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', marginTop: '20px' }}>
                
                {/* 🌟 คำอธิบายสัญลักษณ์ (Legend) */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {seatTypes.map(st => (
                        <div key={st._id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                            <div style={{ width: '15px', height: '15px', borderRadius: '4px', background: getSeatColor(st._id) }}></div>
                            <span style={{ color: '#cbd5e1' }}>{st.name}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                        <div style={{ width: '15px', height: '15px', borderRadius: '4px', background: '#ef4444' }}></div>
                        <span style={{ color: '#cbd5e1' }}>ชำรุด/ถูกบล็อก</span>
                    </div>
                </div>

                {/* หน้าจอ Screen */}
                <div style={{ width: '80%', height: '10px', background: '#3b82f6', borderRadius: '5px', boxShadow: '0 0 15px #3b82f6', marginBottom: '40px', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)', color: '#94a3b8', fontSize: '12px', letterSpacing: '5px' }}>SCREEN</span>
                </div>

                {rows.map(rowLabel => (
                    <div key={rowLabel} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <strong style={{ color: '#8b5cf6', width: '20px', textAlign: 'center' }}>{rowLabel}</strong>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {seatMap[rowLabel].sort((a, b) => Number(a.seat_number) - Number(b.seat_number)).map(seat => (
                                <div
                                    key={seat._id}
                                    title={`${seat.seat_type_id?.name || 'Seat'} - ${seat.row_label}${seat.seat_number}`}
                                    style={{
                                        width: '25px', height: '25px',
                                        background: seat.is_blocked ? '#ef4444' : getSeatColor(seat.seat_type_id?._id),
                                        border: seat.is_blocked ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '4px', borderTopLeftRadius: '10px', borderTopRightRadius: '10px',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        fontSize: '10px', color: 'white', cursor: 'pointer',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    {seat.seat_number}
                                </div>
                            ))}
                        </div>
                        <strong style={{ color: '#8b5cf6', width: '20px', textAlign: 'center' }}>{rowLabel}</strong>
                    </div>
                ))}
            </div>
        );
    };

    const inputStyle = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', outline: 'none' };
    const cardStyle = { background: '#1e212f', padding: '25px', borderRadius: '16px', color: 'white' };

    return (
        <div style={{ padding: '20px' }}>
            <header style={{ marginBottom: '30px' }}>
                <h1 style={{ color: 'white', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Armchair color="#8b5cf6" /> จัดการผังที่นั่ง (Seating Plan)
                </h1>
                <p style={{ color: '#94a3b8' }}>สร้างและจัดการผังที่นั่งสำหรับโรงภาพยนตร์แต่ละสาขา</p>
            </header>

            {/* ส่วนตัวกรอง (Filter) ด้านบน */}
            <div style={{ ...cardStyle, marginBottom: '20px', display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>1. เลือกสาขา</label>
                    <select value={selectedCinema} onChange={(e) => setSelectedCinema(e.target.value)} style={inputStyle}>
                        <option value="">-- กรุณาเลือกสาขา --</option>
                        {cinemas.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>2. เลือกโรงภาพยนตร์</label>
                    <select value={selectedAuditorium} onChange={(e) => setSelectedAuditorium(e.target.value)} disabled={!selectedCinema} style={{ ...inputStyle, opacity: !selectedCinema ? 0.5 : 1 }}>
                        <option value="">-- กรุณาเลือกโรงภาพยนตร์ --</option>
                        {auditoriums.map(a => <option key={a._id} value={a._id}>{a.name} (ความจุ: {a.capacity} ที่นั่ง)</option>)}
                    </select>
                </div>
            </div>

            {/* ส่วนหลัก: ฟอร์มสร้างที่นั่ง (ซ้าย) & ผังที่นั่ง (ขวา) */}
            {selectedAuditorium && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>

                    {/* ฝั่งซ้าย: ฟอร์ม Generate */}
                    <div style={cardStyle}>
                        <h3 style={{ marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <LayoutGrid size={20} color="#10b981" /> สร้างที่นั่งอัตโนมัติ
                        </h3>
                        <form onSubmit={handleGenerateSeats} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8', fontSize: '14px' }}>ประเภทที่นั่ง</label>
                                <select name="seat_type_id" value={formData.seat_type_id} onChange={handleChange} required style={inputStyle}>
                                    <option value="">-- เลือกประเภทที่นั่ง --</option>
                                    {seatTypes.map(st => <option key={st._id} value={st._id}>{st.name} ({st.price} บาท)</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8', fontSize: '14px' }}>แถวเริ่มต้น</label>
                                    <input type="text" name="startRow" value={formData.startRow} onChange={handleChange} maxLength="1" required placeholder="A" style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8', fontSize: '14px' }}>แถวสิ้นสุด</label>
                                    <input type="text" name="endRow" value={formData.endRow} onChange={handleChange} maxLength="1" required placeholder="F" style={inputStyle} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8', fontSize: '14px' }}>จำนวนที่นั่งต่อแถว (คอลัมน์)</label>
                                <input type="number" name="col_count" value={formData.col_count} onChange={handleChange} required min="1" max="50" style={inputStyle} />
                            </div>
                            <button
                                type="submit"
                                disabled={generating}
                                style={{
                                    marginTop: '10px', padding: '12px', borderRadius: '8px', border: 'none',
                                    background: generating ? '#4f46e5' : '#10b981', color: 'white',
                                    cursor: generating ? 'not-allowed' : 'pointer', fontWeight: 'bold',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                                }}
                            >
                                {generating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                {generating ? 'กำลังสร้าง...' : 'สร้างผังที่นั่ง'}
                            </button>
                        </form>
                    </div>

                    {/* ฝั่งขวา: พรีวิวผังที่นั่ง */}
                    <div style={{ ...cardStyle, overflowX: 'auto' }}>
                        
                        {/* 🌟 Header ของโซนพรีวิว พร้อมปุ่มล้างผัง */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MonitorPlay size={20} color="#3b82f6" /> ตัวอย่างผังที่นั่ง
                            </h3>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <span style={{ background: '#1e293b', color: '#94a3b8', padding: '5px 15px', borderRadius: '20px', fontSize: '13px', border: '1px solid #334155' }}>
                                    รวม {seats.length} ที่นั่ง
                                </span>
                                
                                {seats.length > 0 && (
                                    <button 
                                        onClick={handleClearSeats}
                                        style={{ 
                                            background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', 
                                            padding: '5px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                                            display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold'
                                        }}
                                    >
                                        <Trash2 size={16} /> ล้างผังที่นั่ง
                                    </button>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                <Loader2 className="animate-spin" size={30} color="#8b5cf6" />
                            </div>
                        ) : (
                            renderSeatingPlan()
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}