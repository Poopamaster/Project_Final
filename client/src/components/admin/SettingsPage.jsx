import React, { useState, useContext } from 'react';
import { User, Lock, Globe, Save, LogOut, Loader2, ShieldCheck, Bell } from 'lucide-react';
import { AuthContext } from "../../App"; 
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance'; 

export default function SettingsPage() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);

    const handleLogout = async () => {
        if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
            await logout();
            navigate('/login');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // เรียกผ่าน axiosInstance ไปยังพอร์ต 8000 ตามโครงสร้างที่วางไว้
            // await axiosInstance.put('/admin/settings', { ... });
            
            setTimeout(() => {
                setIsSaving(false);
                alert("บันทึกการตั้งค่าระบบ MCP CINEMA v2.0 เรียบร้อยแล้ว");
            }, 1500); 
        } catch (error) {
            console.error(error);
            setIsSaving(false);
        }
    };

    return (
        <div className="admin-page-content-inside settings-layout">
            <header className="content-header-figma mb-8">
                <div className="header-left">
                    <h1>ตั้งค่าระบบ</h1>
                    <p>จัดการความปลอดภัยและกำหนดค่าการทำงานของระบบจัดการโรงภาพยนตร์</p>
                </div>
            </header>

            <div className="settings-grid-figma">
                
                {/* Profile Section - แสดงข้อมูลจริงของผู้ใช้ */}
                <div className="settings-card-figma">
                    <div className="settings-card-header">
                        <User size={22} color="#8b5cf6" />
                        <h3>ข้อมูลบัญชีผู้ดูแล</h3>
                    </div>
                    <div className="settings-form-group">
                        <div className="input-field-figma">
                            <label>ชื่อผู้ดูแลระบบ</label>
                            <input 
                                type="text" 
                                defaultValue={user?.name || "Administrator"} 
                            />
                        </div>
                        <div className="input-field-figma">
                            <label>อีเมล (ใช้สำหรับเข้าสู่ระบบ)</label>
                            <input 
                                type="email" 
                                defaultValue={user?.email || "admin@mcp-cinema.com"} 
                                disabled 
                            />
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="settings-card-figma">
                    <div className="settings-card-header">
                        <Lock size={22} color="#fb7185" />
                        <h3>ความปลอดภัย</h3>
                    </div>
                    <div className="settings-form-group">
                        <button className="btn-logout-figma" style={{ width: '100%', marginBottom: '15px', justifyContent: 'center' }}>
                            <ShieldCheck size={18} /> เปลี่ยนรหัสผ่านใหม่
                        </button>
                        <div className="option-item">
                            <span className="text-sm text-gray-300">ยืนยันตัวตนสองชั้น (2FA)</span>
                            <label className="switch-figma">
                                <input type="checkbox" />
                                <span className="slider-figma"></span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* System Settings - ไม่มี Feedback Table ตามความต้องการ */}
                <div className="settings-card-figma full-width">
                    <div className="settings-card-header">
                        <Globe size={22} color="#22d3ee" />
                        <h3>การจัดการระบบโรงภาพยนตร์</h3>
                    </div>
                    <div className="settings-grid-figma" style={{ marginTop: 0 }}>
                        <div className="option-item">
                            <div className="option-info">
                                <strong>ระบบแจ้งเตือนการจอง</strong>
                                <p>ส่งอีเมลยืนยันให้ลูกค้าอัตโนมัติ</p>
                            </div>
                            <label className="switch-figma">
                                <input type="checkbox" defaultChecked />
                                <span className="slider-figma"></span>
                            </label>
                        </div>

                        <div className="option-item">
                            <div className="option-info">
                                <strong>โหมดปิดปรับปรุงระบบ</strong>
                                <p>ปิดระบบการจองชั่วคราวเพื่อซ่อมบำรุง</p>
                            </div>
                            <label className="switch-figma">
                                <input type="checkbox" />
                                <span className="slider-figma"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* ส่วนปุ่มกดที่ใช้ Class จาก CSS บรรทัด 851+ */}
            <div className="settings-actions-bottom">
                <button 
                    className="btn-save-settings" 
                    onClick={handleSave} 
                    disabled={isSaving}
                >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
                    {isSaving ? " กำลังบันทึก..." : " บันทึกการเปลี่ยนแปลง"}
                </button>
                <button 
                    className="btn-logout-figma" 
                    onClick={handleLogout}
                >
                    <LogOut size={20} /> ออกจากระบบ
                </button>
            </div>
        </div>
    );
}