import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from "../App";
import { User, Film, LogOut, Menu, X } from 'lucide-react'; // 1. เพิ่ม icon Menu และ X
import '../css/navbar.css';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const { logout } = useContext(AuthContext);

  // 2. State สำหรับเปิด/ปิด เมนู
  const [isOpen, setIsOpen] = useState(false);

  // ฟังก์ชันสลับสถานะเมนู
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // ฟังก์ชันปิดเมนูเมื่อกด Link (UX ที่ดี)
  const closeMenu = () => {
    setIsOpen(false);
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
    navigate('/login');
    closeMenu(); // ปิดเมนูเมื่อ logout
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="brand-icon">
          <Film size={24} />
        </div>
        <Link to="/" className="brand-text" onClick={closeMenu}>MCP CINEMA DEMO</Link>
      </div>

      {/* 3. ปุ่ม Hamburger สำหรับมือถือ */}
      <div className="menu-icon" onClick={toggleMenu}>
        {isOpen ? <X size={28} color="white" /> : <Menu size={28} color="white" />}
      </div>

      {/* 4. รวม Links และ User Profile ไว้ใน nav-menu และเช็ค class active */}
      <div className={isOpen ? "nav-menu active" : "nav-menu"}>
        <div className="nav-links">
          {/* แนะนำให้ใช้ Link แทน a href เพื่อไม่ให้หน้าเว็บรีโหลดใหม่ */}
          <Link to="/" className="nav-link" onClick={closeMenu}>หน้าแรก</Link>
          <Link to="/chatbot" className="nav-link" onClick={closeMenu}>แชทบอท</Link>
          <Link to="/movies" className="nav-link" onClick={closeMenu}>ภาพยนตร์</Link>
          <Link to="#" className="nav-link" onClick={closeMenu}>โรงภาพยนตร์</Link>
          <Link to="#" className="nav-link" onClick={closeMenu}>ประวัติการจอง</Link>
        </div>

        <div className="nav-auth-section">
          {user ? (
            <div className="nav-user-profile">
              <span className="user-name">{user.name}</span>
              <button
                onClick={handleLogout}
                className="nav-logout-btn"
                title="ออกจากระบบ"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="nav-login-btn"
              onClick={() => {
                navigate('/login');
                closeMenu();
              }}
            >
              <User size={18} />
              <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;