import React, { useContext, useState } from 'react';
import { User, Lock, Globe, Save, LogOut, Loader2 } from 'lucide-react';
import { AuthContext } from "../../App"; // ตรวจสอบ path ของ AuthContext ให้ถูกต้อง
import { useNavigate } from 'react-router-dom';

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

    const handleSave = () => {
        setIsSaving(true);
        // จำลองการบันทึกค่า
        setTimeout(() => {
            setIsSaving(false);
            alert("บันทึกการตั้งค่าเรียบร้อยแล้ว");
        }, 1000);
    };

    return (
        <div className="admin-page-content-inside">
            <header className="content-header-figma">
                <div className="header-left">
                    <h1>ตั้งค่า</h1>
                    <p>จัดการข้อมูลบัญชีและตั้งค่าระบบ MCP CINEMA v2.0</p>
                </div>
                {/* ตัดส่วนเวลาออกเพื่อให้เหมือนหน้าอื่น */}
            </header>

            <div className="settings-grid-figma">
                {/* Profile Section */}
                <div className="settings-card-figma">
                    <div className="settings-card-header">
                        <User size={20} />
                        <h3>ข้อมูลโปรไฟล์</h3>
                    </div>
                    <div className="settings-form-group">
                        <div className="input-field-figma">
                            <label>ชื่อ-นามสกุล</label>
                            <input type="text" defaultValue={user?.name || "Admin MCP Cinema"} />
                        </div>
                        <div className="input-field-figma">
                            <label>อีเมล</label>
                            <input type="email" defaultValue={user?.email || "admin@mcp-cinema.com"} disabled />
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="settings-card-figma">
                    <div className="settings-card-header">
                        <Lock size={20} />
                        <h3>ความปลอดภัย</h3>
                    </div>
                    <div className="settings-form-group">
                        <button className="btn-secondary-figma">เปลี่ยนรหัสผ่าน</button>
                        <div className="toggle-row-figma">
                            <span>ยืนยันตัวตนสองชั้น (2FA)</span>
                            <label className="switch-figma">
                                <input type="checkbox" />
                                <span className="slider-figma round"></span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* System Settings */}
                <div className="settings-card-figma full-width">
                    <div className="settings-card-header">
                        <Globe size={20} />
                        <h3>การจัดการระบบ</h3>
                    </div>
                    <div className="settings-options-list">
                        <div className="option-item">
                            <div className="option-info">
                                <strong>เปิดโหมดจองตั๋วล่วงหน้า</strong>
                                <p>อนุญาตให้ลูกค้าจองตั๋วก่อนหนังฉาย 7 วัน</p>
                            </div>
                            <label className="switch-figma">
                                <input type="checkbox" defaultChecked />
                                <span className="slider-figma round"></span>
                            </label>
                        </div>
                        <div className="option-item">
                            <div className="option-info">
                                <strong>ปิดปรับปรุงระบบ AI</strong>
                                <p>ปิดการทำงานของ Chatbot ชั่วคราว</p>
                            </div>
                            <label className="switch-figma">
                                <input type="checkbox" />
                                <span className="slider-figma round"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="settings-actions-bottom">
                    <button className="btn-save-settings" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
                        {isSaving ? " กำลังบันทึก..." : " บันทึกการตั้งค่า"}
                    </button>
                    <button className="btn-logout-figma" onClick={handleLogout}>
                        <LogOut size={18} /> ออกจากระบบ
                    </button>
                </div>
            </div>
        </div>
    );
}