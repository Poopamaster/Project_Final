import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Map, Phone, Plus, Loader2, Trash2, Edit2, X } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance'; 
import Swal from 'sweetalert2'; // 🌟 นำเข้า SweetAlert2
// import '../../css/AdminCinemaPage.css'; 

export default function AdminCinemaPage() {
    const [cinemas, setCinemas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // 🌟 State สำหรับเช็คว่ากำลัง "แก้ไข" สาขาไหนอยู่ (ถ้าเป็น null คือการเพิ่มใหม่)
    const [editingId, setEditingId] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        province: '',
        phone: ''
    });

    const fetchCinemas = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/cinemas'); 
            if (response.data.success) {
                setCinemas(response.data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching cinemas:", error);
            setLoading(false);
            Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'ดึงข้อมูลสาขาไม่สำเร็จ' });
        }
    };

    useEffect(() => {
        fetchCinemas();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 🌟 ฟังก์ชัน: กดปุ่ม "แก้ไข" ที่รายชื่อสาขา
    const handleEditClick = (cinema) => {
        setFormData({
            name: cinema.name,
            address: cinema.address,
            province: cinema.province,
            phone: cinema.phone
        });
        setEditingId(cinema._id); // เซ็ตว่ากำลังแก้ ID นี้อยู่
        window.scrollTo({ top: 0, behavior: 'smooth' }); // เลื่อนจอกลับไปที่ฟอร์ม
    };

    // 🌟 ฟังก์ชัน: ยกเลิกการแก้ไข (เคลียร์ฟอร์ม)
    const handleCancelEdit = () => {
        setFormData({ name: '', address: '', province: '', phone: '' });
        setEditingId(null);
    };

    // 🌟 ฟังก์ชัน: กดปุ่ม "ลบ"
    const handleDeleteClick = async (id, name) => {
        // ใช้ SweetAlert2 ถามยืนยันก่อนลบ
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: `คุณต้องการลบสาขา "${name}" ใช่หรือไม่? (ข้อมูลนี้ไม่สามารถกู้คืนได้)`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#334155',
            confirmButtonText: 'ใช่, ลบทิ้งเลย',
            cancelButtonText: 'ยกเลิก',
            background: '#1e212f',
            color: 'white'
        });

        if (result.isConfirmed) {
            try {
                // ส่ง Request ลบไปที่ Backend
                const response = await axiosInstance.delete(`/cinemas/${id}`);
                if (response.data.success) {
                    Swal.fire({ icon: 'success', title: 'ลบสำเร็จ!', text: 'ลบสาขาออกจากระบบแล้ว', background: '#1e212f', color: 'white' });
                    fetchCinemas(); // รีเฟรชข้อมูล
                }
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: error.response?.data?.message || 'ไม่สามารถลบสาขาได้', background: '#1e212f', color: 'white' });
            }
        }
    };

    // กด Submit ฟอร์ม (ทำงานได้ทั้ง เพิ่ม และ แก้ไข)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingId) {
                // 📝 กรณี: อัปเดตข้อมูล (PUT Request)
                const response = await axiosInstance.put(`/cinemas/${editingId}`, formData);
                if (response.data.success) {
                    Swal.fire({ icon: 'success', title: 'อัปเดตสำเร็จ!', text: 'แก้ไขข้อมูลสาขาเรียบร้อยแล้ว', background: '#1e212f', color: 'white', timer: 2000, showConfirmButton: false });
                    handleCancelEdit(); // เคลียร์ฟอร์ม
                    fetchCinemas();
                }
            } else {
                // 📝 กรณี: เพิ่มสาขาใหม่ (POST Request)
                const response = await axiosInstance.post('/cinemas', formData);
                if (response.data.success) {
                    Swal.fire({ icon: 'success', title: 'เพิ่มสาขาสำเร็จ!', text: 'บันทึกสาขาใหม่ลงในระบบแล้ว', background: '#1e212f', color: 'white', timer: 2000, showConfirmButton: false });
                    setFormData({ name: '', address: '', province: '', phone: '' });
                    fetchCinemas();
                }
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้', background: '#1e212f', color: 'white' });
        } finally {
            setSubmitting(false);
        }
    };

    const cardStyle = { background: '#1e212f', padding: '25px', borderRadius: '16px', color: 'white' };
    const inputStyle = { 
        width: '100%', padding: '12px 15px', borderRadius: '8px', 
        border: '1px solid #334155', background: '#0f172a', color: 'white', 
        marginBottom: '15px', outline: 'none'
    };

    return (
        <div className="dashboard-content" style={{ padding: '20px' }}>
            <header className="dashboard-header" style={{ marginBottom: '30px' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Building2 color="#8b5cf6" />
                        จัดการสาขาโรงภาพยนตร์
                    </h1>
                    <p style={{ color: '#94a3b8' }}>เพิ่ม แก้ไข และลบข้อมูลสาขา MCP CINEMA</p>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                
                {/* --- ส่วนที่ 1: ฟอร์มเพิ่ม/แก้ไขสาขา --- */}
                <div style={cardStyle}>
                    <h3 style={{ marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px', color: editingId ? '#3b82f6' : 'white' }}>
                        {editingId ? '✏️ แก้ไขข้อมูลสาขา' : '➕ เพิ่มสาขาใหม่'}
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>ชื่อสาขา (Name)</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="เช่น MCP Cinema Central World" style={inputStyle} />
                        </div>
                        
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>จังหวัด (Province)</label>
                            <input type="text" name="province" value={formData.province} onChange={handleChange} required placeholder="เช่น กรุงเทพมหานคร" style={inputStyle} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>เบอร์ติดต่อ (Phone)</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} required placeholder="เช่น 02-123-4567" style={inputStyle} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>ที่อยู่โดยละเอียด (Address)</label>
                            <textarea name="address" value={formData.address} onChange={handleChange} required placeholder="ที่อยู่ครบถ้วน..." style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                type="submit" 
                                disabled={submitting}
                                style={{ 
                                    flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                                    background: submitting ? '#4f46e5' : (editingId ? '#3b82f6' : '#8b5cf6'), color: 'white', 
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : (editingId ? <Edit2 size={20} /> : <Plus size={20} />)}
                                {submitting ? 'กำลังบันทึก...' : (editingId ? 'อัปเดตข้อมูล' : 'บันทึกสาขา')}
                            </button>

                            {/* ปุ่มยกเลิก (จะโชว์เฉพาะตอนอยู่ในโหมดแก้ไข) */}
                            {editingId && (
                                <button 
                                    type="button" 
                                    onClick={handleCancelEdit}
                                    style={{ 
                                        padding: '12px 20px', borderRadius: '8px', border: '1px solid #334155',
                                        background: 'transparent', color: '#94a3b8', cursor: 'pointer',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px'
                                    }}
                                >
                                    <X size={20} /> ยกเลิก
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* --- ส่วนที่ 2: รายการสาขา --- */}
                <div style={cardStyle}>
                    <h3 style={{ marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                        รายชื่อสาขาในระบบ ({cinemas.length})
                    </h3>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                            <Loader2 className="animate-spin" size={30} color="#8b5cf6" />
                        </div>
                    ) : cinemas.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {cinemas.map((cinema) => (
                                <div key={cinema._id} style={{ 
                                    background: editingId === cinema._id ? '#1e293b' : '#0f172a', // ไฮไลท์ถ้ากำลังแก้กล่องนี้อยู่
                                    padding: '20px', borderRadius: '10px', 
                                    border: editingId === cinema._id ? '1px solid #3b82f6' : '1px solid #334155', 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ color: '#8b5cf6', fontSize: '18px', margin: '0 0 10px 0' }}>{cinema.name}</h4>
                                        <div style={{ display: 'flex', gap: '15px', color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Map size={16} /> จ.{cinema.province}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Phone size={16} /> {cinema.phone}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', color: '#64748b', fontSize: '14px' }}>
                                            <MapPin size={16} style={{ marginTop: '3px', flexShrink: 0 }} /> 
                                            <span style={{ lineHeight: '1.4' }}>{cinema.address}</span>
                                        </div>
                                    </div>
                                    
                                    {/* 🌟 ชุดปุ่ม แก้ไข / ลบ */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '20px' }}>
                                        <button 
                                            onClick={() => handleEditClick(cinema)}
                                            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}
                                        >
                                            <Edit2 size={14} /> แก้ไข
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(cinema._id, cinema.name)}
                                            style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}
                                        >
                                            <Trash2 size={14} /> ลบ
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            <Building2 size={40} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                            <p>ยังไม่มีข้อมูลสาขาในระบบ</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}