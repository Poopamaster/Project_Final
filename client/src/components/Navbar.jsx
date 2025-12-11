import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from "../App";
// 1. เปลี่ยนการ import Icon ให้ใช้ Loader2 แทน Loader
import { User, Film, LogOut, Menu, X, Loader2 } from 'lucide-react'; 
import '../css/navbar.css';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const { logout } = useContext(AuthContext);

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const closeMenu = () => {
        setIsOpen(false);
    };

    // ฟังก์ชันจัดการการนำทาง (Delay เพื่อลด Flicker)
    const handleNavigation = (path) => {
        closeMenu();

        const shouldReload = path === '/chatbot' || location.pathname === path;

        setIsLoading(true);

        setTimeout(() => {
            if (shouldReload) {
                // กรณีที่ต้องการโหลดใหม่: ใช้ window.location.href เพื่อบังคับ Browser ไป Path นั้นและโหลดใหม่
                window.location.href = path; 
                
            } else {
                // กรณีไปหน้าอื่นปกติ: ใช้ React Router navigate
                navigate(path);
                setIsLoading(false); 
            }
        }, 500); // 500 milliseconds (0.5 วินาที)
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
            closeMenu(); 
            setIsLoading(false);
        }, 500);
    };

    return (
        <>
            {/* 2. UI Loader Overlay ที่ใช้ Style ตามที่คุณต้องการ */}
            {isLoading && (
                <div className="global-loader-overlay">
                    <div className="full-loader"> {/* ใช้ class นี้ในการจัดรูปแบบ */}
                        <Loader2 className="spin-animation" size={64} color="#e50914" />
                        <p>กำลังโหลดข้อมูล...</p>
                        <small>กรุณารอสักครู่ ระบบกำลังนำทาง/รีเฟรชข้อมูล</small>
                    </div>
                </div>
            )}

            <nav className="navbar">
                <div className="nav-brand">
                    <div className="brand-icon">
                        <Film size={24} />
                    </div>
                    <Link to="/" className="brand-text" onClick={(e) => { e.preventDefault(); handleNavigation('/'); }}>MCP CINEMA DEMO</Link>
                </div>

                <div className="menu-icon" onClick={toggleMenu}>
                    {isOpen ? <X size={28} color="white" /> : <Menu size={28} color="white" />}
                </div>

                <div className={isOpen ? "nav-menu active" : "nav-menu"}>
                    <div className="nav-links">
                        <Link to="/" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('/'); }}>หน้าแรก</Link>
                        <Link to="/chatbot" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('/chatbot'); }}>แชทบอท</Link>
                        <Link to="/movies" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('/movies'); }}>ภาพยนตร์</Link>
                        <Link to="#" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('#'); }}>โรงภาพยนตร์</Link>
                        <Link to="#" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('#'); }}>ประวัติการจอง</Link>
                    </div>

                    <div className="nav-auth-section">
                        {user ? (
                            <div className="nav-user-profile">
                                <span className="user-name">{user.name}</span>
                                <button
                                    onClick={handleLogout}
                                    className="nav-logout-btn"
                                    title="ออกจากระบบ"
                                    disabled={isLoading}
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="nav-login-btn"
                                onClick={() => {
                                    handleNavigation('/login');
                                }}
                                disabled={isLoading}
                            >
                                <User size={18} />
                                <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
                            </button>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Navbar;