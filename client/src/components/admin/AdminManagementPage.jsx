import React, { useState, useEffect } from 'react';
import { UserPlus, Search, ShieldCheck, Trash2, Loader2 } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance'; 

export default function AdminManagementPage() {
    const [admins, setAdmins] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/admin/list');
            if (response.data.success) {
                setAdmins(response.data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error("Fetch admins error:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handlePromoteAdmin = async (e) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            const response = await axiosInstance.post('/admin/promote', { email: adminEmail });
            if (response.data.success) {
                alert("แต่งตั้งผู้ดูแลสำเร็จ!");
                setAdminEmail('');
                fetchAdmins();
            }
        } catch (error) {
            alert(error.response?.data?.message || "ไม่พบอีเมลนี้ในระบบ");
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (window.confirm("คุณแน่ใจหรือไม่ที่จะถอนสิทธิ์ผู้ดูแลท่านนี้?")) {
            try {
                const response = await axiosInstance.delete(`/admin/delete/${id}`);
                if (response.data.success) {
                    alert("ถอนสิทธิ์เรียบร้อยแล้ว");
                    fetchAdmins();
                }
            } catch (error) {
                alert("ไม่สามารถดำเนินการได้");
            }
        }
    };

    const filteredAdmins = admins.filter(admin => 
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page-content-inside">
            <header className="content-header-figma">
                <div className="header-left">
                    <h1>จัดการสิทธิ์ผู้ดูแล</h1>
                    <p>ค้นหาอีเมลผู้ใช้เพื่อเปลี่ยนสถานะเป็น Admin ของระบบ MCP CINEMA</p>
                </div>
            </header>

            <div className="admin-management-grid">
                <div className="settings-card-figma">
                    <div className="settings-card-header">
                        <UserPlus size={20} />
                        <h3>แต่งตั้ง Admin ใหม่</h3>
                    </div>
                    <form onSubmit={handlePromoteAdmin} className="settings-form-group">
                        <div className="input-field-figma">
                            <label>อีเมลผู้ใช้ (ที่สมัครสมาชิกไว้แล้ว)</label>
                            <input 
                                type="email" 
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                placeholder="ระบุ email@example.com" 
                                required 
                            />
                        </div>
                        <button type="submit" className="btn-save-settings" disabled={isAdding}>
                            {isAdding ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                            {isAdding ? " กำลังดำเนินการ..." : " ยืนยันแต่งตั้ง Admin"}
                        </button>
                    </form>
                </div>

                <div className="settings-card-figma">
                    <div className="settings-card-header">
                        <Search size={20} />
                        <h3>รายชื่อผู้ดูแลในปัจจุบัน ({admins.length})</h3>
                    </div>
                    
                    {/* ✅ ปรับขนาดช่องค้นหาให้กว้างขึ้นและดูดีขึ้น */}
                    <div className="search-box-container-figma" style={{ padding: '0 10px 15px 10px' }}>
                        <div className="search-input-wrapper" style={{ position: 'relative', width: '100%' }}>
                            <Search 
                                size={18} 
                                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} 
                            />
                            <input 
                                type="text" 
                                placeholder="ค้นหาด้วยอีเมลผู้ดูแล..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    borderRadius: '8px',
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div className="admin-list-container" style={{maxHeight: '400px', overflowY: 'auto'}}>
                        {loading ? <div className="p-5 text-center"><Loader2 className="animate-spin" /></div> : (
                            <table className="admin-custom-table" style={{width: '100%'}}>
                                <thead>
                                    <tr>
                                        {/* ✅ ตัดคอลัมน์ชื่อออก เหลือแค่อีเมล */}
                                        <th style={{textAlign: 'left', padding: '12px'}}>อีเมลผู้ดูแลระบบ</th>
                                        <th style={{textAlign: 'center', width: '100px'}}>ถอนสิทธิ์</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAdmins.map(admin => (
                                        <tr key={admin._id} style={{borderTop: '1px solid #334155'}}>
                                            <td style={{padding: '15px', color: '#e2e8f0'}}>{admin.email}</td>
                                            <td style={{textAlign: 'center'}}>
                                                <button 
                                                    onClick={() => handleDeleteAdmin(admin._id)} 
                                                    className="btn-delete-red" 
                                                    style={{background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', transition: '0.2s'}}
                                                    onMouseOver={(e) => e.currentTarget.style.color = '#f43f5e'}
                                                    onMouseOut={(e) => e.currentTarget.style.color = '#fb7185'}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {!loading && filteredAdmins.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                                ไม่พบข้อมูลที่ค้นหา
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}