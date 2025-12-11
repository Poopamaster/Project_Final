import React, { useState, useEffect } from 'react';
import { useContext } from "react";
import { AuthContext } from "../App";
import { User, Film, LogOut } from 'lucide-react'; // เพิ่ม icon LogOut
import '../css/navbar.css';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // ใช้เพื่อเช็คสถานะทุกครั้งที่เปลี่ยนหน้า
  const [user, setUser] = useState(null);
  const { logout } = useContext(AuthContext);

  // ฟังก์ชันโหลดข้อมูล User
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
  }, [location]); // ใส่ location เพื่อให้เช็คใหม่ทุกครั้งที่เปลี่ยนหน้า

  const handleLogout = () => {
    logout();                 // ← ลบ jwtToken ที่ถูกต้อง
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="brand-icon">
          <Film size={24} />
        </div>
        <Link to="/" className="brand-text">MCP CINEMA DEMO</Link>
      </div>

      <div className="nav-links">
        <a href="/" className="nav-link">หน้าแรก</a>
        <a href="/chatbot" className="nav-link">แชทบอท</a>
        <a href="/movies" className="nav-link">ภาพยนตร์</a>
        <a href="#" className="nav-link">โรงภาพยนตร์</a>
        <a href="#" className="nav-link">ประวัติการจอง</a>
      </div>

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
          onClick={() => navigate('/login')}
        >
          <User size={18} />
          <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
        </button>
      )}
    </nav>
  );
};

export default Navbar;