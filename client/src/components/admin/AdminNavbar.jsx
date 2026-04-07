import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../../App"; 
import { Menu, LogOut, ExternalLink, User, Loader2 } from 'lucide-react';

const AdminNavbar = ({ toggleSidebar }) => {
    const navigate = useNavigate();
    // ดึง user และ logout มาจาก AuthContext โดยตรง
    const { logout, user } = useContext(AuthContext); 
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
            setIsLoading(true);
            try {
                // เรียกฟังก์ชัน logout จาก Context (ซึ่งควรจะเคลียร์ LocalStorage/Cookie)
                await logout(); 
                navigate('/login');
            } catch (error) {
                console.error("Logout failed:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleGoToSite = () => {
        setIsLoading(true);
        // นำทางไปหน้าแรกของ MCP CINEMA
        setTimeout(() => {
            navigate('/');
            setIsLoading(false);
        }, 300);
    };

    return (
        <>
            {isLoading && (
                <div className="admin-loader-overlay">
                    <div className="loader-box">
                        <Loader2 className="animate-spin" size={48} color="#dc2626" />
                        <p>กำลังดำเนินการ...</p>
                    </div>
                </div>
            )}

            <header className="admin-navbar">
                <div className="navbar-left">
                    <button className="menu-toggle-btn" onClick={toggleSidebar}>
                        <Menu size={24} color="white" />
                    </button>
                    <h2 className="navbar-title">Admin Console</h2>
                </div>

                <div className="navbar-right">
                    <button className="action-btn" onClick={handleGoToSite} title="Go to Website">
                        <ExternalLink size={18} />
                        <span className="btn-label">เข้าชมเว็บไซต์</span>
                    </button>

                    <div className="divider-vertical"></div>

                    <div className="admin-profile">
                        <div className="avatar-circle">
                            {/* ถ้ามีรูปโปรไฟล์ใน DB ให้แสดงรูป ถ้าไม่มีให้ใช้ icon User */}
                            {user?.profile_img ? (
                                <img src={user.profile_img} alt="admin" className="avatar-img" />
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                        <div className="admin-info-text">
                            <span className="admin-name">{user?.name || 'Administrator'}</span>
                            <span className="admin-role">ผู้ดูแลระบบ</span>
                        </div>
                    </div>

                    <button className="logout-btn" onClick={handleLogout} title="ออกจากระบบ">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>
        </>
    );
};

export default AdminNavbar;