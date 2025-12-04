import React from 'react';
import { User, Film } from 'lucide-react';
import '../css/navbar.css';
import { useNavigate } from 'react-router-dom'; // ตรวจสอบว่ามีการ import useNavigate

const Navbar = () => {
  const navigate = useNavigate(); // เพิ่มการเรียก useNavigate

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="brand-icon">
          <Film size={24} />
        </div>
        <a className="brand-text" href="/">MCP CINEMA DEMO</a>
      </div>

      <div className="nav-links">
        <a href="#" className="nav-link">แชทบอท</a>
        <a href="#" className="nav-link">ภาพยนตร์</a>
        <a href="#" className="nav-link">โรงภาพยนตร์</a>
        <a href="#" className="nav-link">ประวัติการจอง</a>
      </div>

      <button
        type="button"
        className="nav-login-btn"
        onClick={() => navigate('/login')} // ใช้ navigate เพื่อเปลี่ยนเส้นทาง
      >
        <User size={18} />
        <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
      </button>
    </nav>
  );
};

export default Navbar;