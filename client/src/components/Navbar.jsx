import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from "../App";
// ✅ เพิ่ม LayoutDashboard เข้ามาใน import
import { User, Film, LogOut, Menu, X, Loader2, LayoutDashboard } from 'lucide-react'; 
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

    const handleNavigation = (path) => {
        closeMenu();
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
            closeMenu(); 
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
                        <Link to="/history" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('/history'); }}>ประวัติการจอง</Link>
                    </div>

                    <div className="nav-auth-section">
                        {user ? (
                            <div className="nav-user-profile">
                                {/* ✅ ส่วนเช็คสิทธิ์ Admin: ถ้าเป็น admin ให้โชว์ปุ่ม Dashboard */}
                                {user.role === 'admin' && (
                                    <button 
                                        className="nav-admin-btn"
                                        onClick={() => handleNavigation('/admin')}
                                        title="ไปที่ระบบหลังบ้าน"
                                    >
                                        <LayoutDashboard size={18} />
                                        <span>Dashboard</span>
                                    </button>
                                )}

                                <div className="user-info">
                                    <span className="user-name">{user.name}</span>
                                    {/* แสดง Role เล็กๆ ใต้ชื่อ (Optional) */}
                                    {user.role === 'admin' && <span className="user-badge">Admin</span>}
                                </div>
                                
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