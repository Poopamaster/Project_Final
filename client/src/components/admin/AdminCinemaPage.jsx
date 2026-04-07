import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Plus, Loader2, Trash2, Edit2, X, MonitorPlay } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance'; 
import Swal from 'sweetalert2';

export default function AdminCinemaPage() {
    const [cinemas, setCinemas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // State สำหรับข้อมูลสาขา
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        province: '',
        phone: ''
    });

    // State สำหรับข้อมูลโรงหนัง
    const [auditoriums, setAuditoriums] = useState([
        { name: 'Theater 1', capacity: '200', format: 'Standard' }
    ]);
    
    // 🌟 State เก็บ ID ของโรงหนังที่โดนกด (X) ทิ้งตอนแก้ไข
    const [deletedAuditoriums, setDeletedAuditoriums] = useState([]);

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

    const handleAuditoriumChange = (index, field, value) => {
        const newAuditoriums = [...auditoriums];
        newAuditoriums[index][field] = value;
        setAuditoriums(newAuditoriums);
    };

    const addAuditoriumRow = () => {
        setAuditoriums([...auditoriums, { name: `Theater ${auditoriums.length + 1}`, capacity: '200', format: 'Standard' }]);
    };

    const removeAuditoriumRow = (index) => {
        const audToRemove = auditoriums[index];
        // 🌟 ถ้ารายการนี้มี _id แสดงว่าเป็นของเดิมใน DB ต้องจำ ID ไว้ไปสั่งลบ
        if (audToRemove._id) {
            setDeletedAuditoriums(prev => [...prev, audToRemove._id]);
        }
        setAuditoriums(auditoriums.filter((_, i) => i !== index));
    };

    // 🌟 1. ดึงข้อมูลโรงหนังมาแสดงตอนกด "แก้ไข"
    const handleEditClick = async (cinema) => {
        setFormData({
            name: cinema.name,
            address: cinema.address,
            province: cinema.province,
            phone: cinema.phone
        });
        setEditingId(cinema._id);
        setDeletedAuditoriums([]); // ล้างค่าโรงที่จะลบก่อน

        try {
            // ดึงโรงหนังของสาขานี้มาใส่ฟอร์ม
            const res = await axiosInstance.get(`/auditoriums/cinema/${cinema._id}`);
            if (res.data.success && res.data.data.length > 0) {
                setAuditoriums(res.data.data);
            } else {
                setAuditoriums([]); // ถ้าสาขานี้ยังไม่มีโรงเลย ให้ว่างไว้
            }
        } catch (error) {
            console.error("Failed to load auditoriums", error);
            setAuditoriums([]);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setFormData({ name: '', address: '', province: '', phone: '' });
        setEditingId(null);
        setAuditoriums([{ name: 'Theater 1', capacity: '200', format: 'Standard' }]);
        setDeletedAuditoriums([]);
    };

    const handleDeleteClick = async (id, name) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: `คุณต้องการลบสาขา "${name}" ใช่หรือไม่?`,
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
                const response = await axiosInstance.delete(`/cinemas/${id}`);
                if (response.data.success) {
                    Swal.fire({ icon: 'success', title: 'ลบสำเร็จ!', text: 'ลบสาขาออกจากระบบแล้ว', background: '#1e212f', color: 'white' });
                    fetchCinemas();
                }
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: error.response?.data?.message || 'ไม่สามารถลบสาขาได้', background: '#1e212f', color: 'white' });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingId) {
                // 📝 กรณี: อัปเดตข้อมูลสาขา และ โรงหนัง
                // 1. อัปเดตข้อมูลสาขาหลัก
                await axiosInstance.put(`/cinemas/${editingId}`, formData);

                // 2. ลบโรงหนังที่ถูกกดกากบาท (X) ทิ้งไป
                if (deletedAuditoriums.length > 0) {
                    const deletePromises = deletedAuditoriums.map(id => axiosInstance.delete(`/auditoriums/${id}`));
                    await Promise.all(deletePromises);
                }

                // 3. จัดการโรงหนังที่อยู่ในฟอร์มปัจจุบัน (แยกของเก่า กับ ของใหม่)
                const audPromises = auditoriums.map(aud => {
                    if (aud._id) {
                        // ของเก่า (มี _id) -> ใช้ PUT อัปเดตข้อมูล
                        return axiosInstance.put(`/auditoriums/${aud._id}`, {
                            cinema_id: editingId,
                            name: aud.name,
                            capacity: Number(aud.capacity),
                            format: aud.format
                        });
                    } else {
                        // ของใหม่ (ไม่มี _id เพราะเพิ่งกด +เพิ่มโรง) -> ใช้ POST สร้างใหม่
                        return axiosInstance.post('/auditoriums', {
                            cinema_id: editingId,
                            name: aud.name,
                            capacity: Number(aud.capacity),
                            format: aud.format
                        });
                    }
                });
                
                // รอให้เซฟโรงหนังครบทุกแถว
                await Promise.all(audPromises);

                Swal.fire({ icon: 'success', title: 'อัปเดตสำเร็จ!', text: 'แก้ไขข้อมูลสาขาและโรงภาพยนตร์เรียบร้อยแล้ว', background: '#1e212f', color: 'white', timer: 2000, showConfirmButton: false });
                handleCancelEdit();
                fetchCinemas();
            } else {
                // 📝 กรณี: เพิ่มสาขาใหม่ (สร้างครั้งแรก)
                if (auditoriums.length === 0) {
                    Swal.fire({ icon: 'warning', title: 'แจ้งเตือน', text: 'กรุณาเพิ่มโรงภาพยนตร์อย่างน้อย 1 โรง', background: '#1e212f', color: 'white' });
                    setSubmitting(false);
                    return;
                }

                const cinemaRes = await axiosInstance.post('/cinemas', formData);
                if (cinemaRes.data.success) {
                    const newCinemaId = cinemaRes.data.data._id; 
                    const auditoriumPromises = auditoriums.map(aud => 
                        axiosInstance.post('/auditoriums', {
                            cinema_id: newCinemaId,
                            name: aud.name,
                            capacity: Number(aud.capacity),
                            format: aud.format
                        })
                    );
                    await Promise.all(auditoriumPromises);

                    Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: `เพิ่มสาขาและโรงภาพยนตร์ ${auditoriums.length} โรง เรียบร้อยแล้ว`, background: '#1e212f', color: 'white', timer: 2500, showConfirmButton: false });
                    setFormData({ name: '', address: '', province: '', phone: '' });
                    setAuditoriums([{ name: 'Theater 1', capacity: '200', format: 'Standard' }]);
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
                        จัดการสาขาและโรงภาพยนตร์
                    </h1>
                    <p style={{ color: '#94a3b8' }}>เพิ่ม แก้ไขข้อมูลสาขา พร้อมตั้งค่าโรงภาพยนตร์ในสาขานั้นๆ</p>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                
                <div style={cardStyle}>
                    <h3 style={{ marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px', color: editingId ? '#3b82f6' : 'white' }}>
                        {editingId ? '✏️ แก้ไขข้อมูลสาขาและโรงภาพยนตร์' : '➕ เพิ่มสาขาใหม่'}
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
                            <textarea name="address" value={formData.address} onChange={handleChange} required placeholder="ที่อยู่ครบถ้วน..." style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}></textarea>
                        </div>

                        {/* 🌟 ปลดล็อกให้แสดงตลอด ไม่ว่าจะเพิ่มใหม่หรือกำลังแก้ไข! */}
                        <div style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #334155' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h4 style={{ margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <MonitorPlay size={18} /> จัดการโรงภาพยนตร์
                                </h4>
                                <button 
                                    type="button" 
                                    onClick={addAuditoriumRow}
                                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}
                                >
                                    <Plus size={14} /> เพิ่มโรง
                                </button>
                            </div>

                            {auditoriums.map((aud, index) => (
                                <div key={index} style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', marginBottom: '10px', position: 'relative' }}>
                                    {/* เปิดให้กดลบได้อิสระ ไม่บังคับซ่อนแล้ว */}
                                    <button type="button" onClick={() => removeAuditoriumRow(index)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                        <X size={16} />
                                    </button>
                                    
                                    <label style={{ fontSize: '12px', color: '#94a3b8' }}>ชื่อโรง</label>
                                    <input type="text" value={aud.name} onChange={(e) => handleAuditoriumChange(index, 'name', e.target.value)} required placeholder="Theater 1" style={{ ...inputStyle, padding: '8px', marginBottom: '10px', width: '90%' }} />
                                    
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '12px', color: '#94a3b8' }}>ที่นั่ง (ความจุ)</label>
                                            <input type="number" value={aud.capacity} onChange={(e) => handleAuditoriumChange(index, 'capacity', e.target.value)} required style={{ ...inputStyle, padding: '8px', marginBottom: '0' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '12px', color: '#94a3b8' }}>ระบบ (Format)</label>
                                            <select value={aud.format} onChange={(e) => handleAuditoriumChange(index, 'format', e.target.value)} style={{ ...inputStyle, padding: '8px', marginBottom: '0' }}>
                                                <option value="Standard">Standard</option>
                                                <option value="MCP">MCP</option>
                                                <option value="IMAX">IMAX</option>
                                                <option value="4DX">4DX</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {auditoriums.length === 0 && (
                                <p style={{ textAlign: 'center', fontSize: '12px', color: '#ef4444', margin: 0 }}>ไม่มีโรงภาพยนตร์ในสาขานี้</p>
                            )}
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
                                {submitting ? 'กำลังบันทึก...' : (editingId ? 'อัปเดตข้อมูลทั้งหมด' : 'บันทึกสาขา และ โรงภาพยนตร์')}
                            </button>

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
                                    background: editingId === cinema._id ? '#1e293b' : '#0f172a', 
                                    padding: '20px', borderRadius: '10px', 
                                    border: editingId === cinema._id ? '1px solid #3b82f6' : '1px solid #334155', 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ color: '#8b5cf6', fontSize: '18px', margin: '0 0 10px 0' }}>{cinema.name}</h4>
                                        <div style={{ display: 'flex', gap: '15px', color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <MapPin size={16} /> จ.{cinema.province}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Phone size={16} /> {cinema.phone}
                                            </span>
                                        </div>
                                    </div>
                                    
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