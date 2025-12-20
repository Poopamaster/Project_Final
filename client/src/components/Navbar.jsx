// src/components/Navbar.jsx

// ... imports เหมือนเดิม
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from "../App";
import { User, Film, LogOut, Menu, Loader2, LayoutDashboard } from 'lucide-react'; 
import '../css/navbar.css';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import MobileSidebar from './MobileSidebar'; 

// ✅ 1. เพิ่ม props "sidebarContent" ตรงนี้
const Navbar = ({ sidebarContent }) => {
    // ... code logic เดิมทั้งหมด (navigate, user, logout...)
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const { logout } = useContext(AuthContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const openSidebar = () => setIsSidebarOpen(true);
    const closeSidebar = () => setIsSidebarOpen(false);

    // ... (logic handleNavigation, useEffect, handleLogout เหมือนเดิม) ...
    const handleNavigation = (path) => {
        closeSidebar(); 
        const shouldReload = path === '/chatbot' || location.pathname === path;
        setIsLoading(true);

        setTimeout(() => {
            if (shouldReload) {
                window.location.href = path; 
            } else {
                navigate(path);
                setIsLoading(false); 
            }
        }, 500);
    };

    useEffect(() => {
        const checkUser = () => {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            setUser(null);
          }
        };
        checkUser();
    }, [location]);

    const handleLogout = () => {
        logout();
        setUser(null);
        setIsLoading(true);
        setTimeout(() => {
            navigate('/login');
            closeSidebar();
            setIsLoading(false);
        }, 500);
    };

    return (
        <>
           {isLoading && (
                <div className="global-loader-overlay">
                    <div className="full-loader">
                        <Loader2 className="spin-animation" size={64} color="#e50914" />
                        <p>กำลังโหลดข้อมูล...</p>
                        <small>กรุณารอสักครู่ ระบบกำลังนำทาง/รีเฟรชข้อมูล</small>
                    </div>
                </div>
            )}

            <nav className="navbar">
                 {/* ... (Code ส่วนแสดงผล Navbar เหมือนเดิมทุกอย่าง) ... */}
                 <div className="navbar-left-group" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="menu-icon" onClick={openSidebar} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Menu size={28} color="white" />
                    </div>
                    <div className="nav-brand" style={{ margin: 0 }}>
                        <div className="brand-icon"><Film size={24} /></div>
                        <Link to="/" className="brand-text" onClick={(e) => { e.preventDefault(); handleNavigation('/'); }}>MCP CINEMA DEMO</Link>
                    </div>
                </div>

                <div className="nav-menu"> 
                    <div className="nav-links">
                        <Link to="/" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('/'); }}>หน้าแรก</Link>
                        <Link to="/chatbot" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('/chatbot'); }}>แชทบอท</Link>
                        <Link to="/movies" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('/movies'); }}>ภาพยนตร์</Link>
                        <Link to="/history" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('/history'); }}>ประวัติการจอง</Link>
                    </div>

                    <div className="nav-auth-section">
                        {user ? (
                            <div className="nav-user-profile">
                                {user.role === 'admin' && (
                                    <button className="nav-admin-btn" onClick={() => handleNavigation('/admin')}>
                                        <LayoutDashboard size={18} /><span>Dashboard</span>
                                    </button>
                                )}
                                <div className="user-info">
                                    <span className="user-name">{user.name}</span>
                                    {user.role === 'admin' && <span className="user-badge">Admin</span>}
                                </div>
                                <button onClick={handleLogout} className="nav-logout-btn"><LogOut size={18} /></button>
                            </div>
                        ) : (
                            <button className="nav-login-btn" onClick={() => handleNavigation('/login')}>
                                <User size={18} /><span>เข้าสู่ระบบ / สมัครสมาชิก</span>
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* ✅ 2. ส่ง props "sidebarContent" (children) ไปให้ MobileSidebar */}
            <MobileSidebar 
                isOpen={isSidebarOpen} 
                onClose={closeSidebar} 
                user={user}
                handleLogout={handleLogout}
            >
                {sidebarContent} 
            </MobileSidebar>
        </>
    );
};

export default Navbar;