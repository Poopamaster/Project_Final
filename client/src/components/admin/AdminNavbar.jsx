import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../../App"; // หรือ path ที่ถูกต้องของ App.js
import { Menu, LogOut, ExternalLink, User, Loader2 } from 'lucide-react';

const AdminNavbar = ({ toggleSidebar, user }) => {
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = () => {
        setIsLoading(true);
        // จำลอง Delay ให้เหมือนมีการประมวลผล
        setTimeout(() => {
            logout();
            navigate('/login');
            setIsLoading(false);
        }, 500);
    };

    const handleGoToSite = () => {
        setIsLoading(true);
        setTimeout(() => {
            navigate('/');
            setIsLoading(false);
        }, 500);
    };

    return (
        <>
            {/* Loader Overlay (ถ้ากำลังโหลด) */}
            {isLoading && (
                <div className="admin-loader-overlay">
                    <div className="loader-box">
                        <Loader2 className="spin" size={48} color="#dc2626" />
                        <p>Processing...</p>
                    </div>
                </div>
            )}

            <header className="admin-navbar">
                {/* Left Side: Mobile Menu Toggle & Title */}
                <div className="navbar-left">
                    <button className="menu-toggle-btn" onClick={toggleSidebar}>
                        <Menu size={24} color="white" />
                    </button>
                    <h2 className="navbar-title">Admin Console</h2>
                </div>

                {/* Right Side: Actions & Profile */}
                <div className="navbar-right">
                    {/* ปุ่มกลับหน้าบ้าน */}
                    <button className="action-btn" onClick={handleGoToSite} title="Go to Website">
                        <ExternalLink size={18} />
                        <span className="btn-label">View Site</span>
                    </button>

                    <div className="divider-vertical"></div>

                    {/* ส่วนแสดงโปรไฟล์ */}
                    <div className="admin-profile">
                        <div className="avatar-circle">
                            <User size={20} />
                        </div>
                        <span className="admin-name">{user?.name || 'Administrator'}</span>
                    </div>

                    {/* ปุ่ม Logout */}
                    <button className="logout-btn" onClick={handleLogout} title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>
        </>
    );
};

export default AdminNavbar;