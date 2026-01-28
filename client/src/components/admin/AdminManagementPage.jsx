import React, { useState, useEffect } from 'react';
import { UserPlus, Search, ShieldCheck, Trash2, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function AdminManagementPage() {
    const [admins, setAdmins] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8000/api/admin/list');
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

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            const response = await axios.post('http://localhost:8000/api/admin/add', newAdmin);
            if (response.data.success) {
                alert("เพิ่มผู้ดูแลสำเร็จ!");
                setNewAdmin({ name: '', email: '', password: '' });
                fetchAdmins();
            }
        } catch (error) {
            alert(error.response?.data?.message || "เกิดข้อผิดพลาด");
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (window.confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ดูแลท่านนี้?")) {
            try {
                const response = await axios.delete(`http://localhost:8000/api/admin/delete/${id}`);
                if (response.data.success) {
                    alert("ลบผู้ดูแลเรียบร้อยแล้ว");
                    fetchAdmins();
                }
            } catch (error) {
                alert("ไม่สามารถลบผู้ดูแลได้");
            }
        }
    };

    const filteredAdmins = admins.filter(admin => 
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page-content-inside">
            <header className="content-header-figma">
                <div className="header-left">
                    <h1>จัดการผู้ดูแล</h1>
                    <p>เพิ่มและจัดการสิทธิ์การเข้าถึงระบบ MCP CINEMA...</p>
                </div>
            </header>

            <div className="admin-management-grid">
                {/* ส่วนเพิ่ม Admin ใหม่ */}
                <div className="settings-card-figma">
                    <div className="settings-card-header">
                        <UserPlus size={20} />
                        <h3>เพิ่มผู้ดูแลใหม่</h3>
                    </div>
                    <form onSubmit={handleAddAdmin} className="settings-form-group">
                        <div className="input-field-figma">
                            <label>ชื่อ-นามสกุล</label>
                            <input 
                                type="text" 
                                value={newAdmin.name}
                                onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                                placeholder="ชื่อผู้ดูแล" required 
                            />
                        </div>
                        <div className="input-field-figma">
                            <label>อีเมล</label>
                            <input 
                                type="email" 
                                value={newAdmin.email}
                                onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                                placeholder="admin@mcp.com" required 
                            />
                        </div>
                        <div className="input-field-figma">
                            <label>รหัสผ่าน</label>
                            <input 
                                type="password" 
                                value={newAdmin.password}
                                onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                                placeholder="กำหนดรหัสผ่าน" required 
                            />
                        </div>
                        <button type="submit" className="btn-save-settings" disabled={isAdding}>
                            {isAdding ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                            {isAdding ? " กำลังบันทึก..." : " ยืนยันเพิ่มผู้ดูแล"}
                        </button>
                    </form>
                </div>

                {/* รายชื่อผู้ดูแลทั้งหมด */}
                <div className="settings-card-figma">
                    <div className="settings-card-header">
                        <Search size={20} />
                        <h3>รายชื่อผู้ดูแลทั้งหมด ({admins.length})</h3>
                    </div>
                    <div className="search-box-figma" style={{marginBottom: '15px'}}>
                        <input 
                            type="text" 
                            placeholder="ค้นหาผู้ดูแล..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="admin-list-container" style={{maxHeight: '400px', overflowY: 'auto'}}>
                        {loading ? <div className="p-5 text-center"><Loader2 className="animate-spin" /></div> : (
                            <table className="admin-custom-table" style={{width: '100%'}}>
                                <thead>
                                    <tr>
                                        <th style={{textAlign: 'left', padding: '10px'}}>ชื่อ</th>
                                        <th style={{textAlign: 'left'}}>อีเมล</th>
                                        <th style={{textAlign: 'center'}}>ลบ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAdmins.map(admin => (
                                        <tr key={admin._id} style={{borderTop: '1px solid #333'}}>
                                            <td style={{padding: '10px'}}>{admin.name}</td>
                                            <td>{admin.email}</td>
                                            <td style={{textAlign: 'center'}}>
                                                <button onClick={() => handleDeleteAdmin(admin._id)} className="btn-delete-red" style={{background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer'}}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}