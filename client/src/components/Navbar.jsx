import React from 'react';
import { User, Film } from 'lucide-react';
import '../css/navbar.css';
// 1. นำเข้า Link เพิ่มตรงนี้ครับ
import { useNavigate, Link } from 'react-router-dom'; 

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="brand-icon">
          <Film size={24} />
        </div>
        {/* เปลี่ยน Logo ให้กดกลับหน้าแรกได้ด้วย */}
        <Link to="/" className="brand-text">MCP CINEMA DEMO</Link>
      </div>

      <div className="nav-links">
        {/* 2. แก้ตรงนี้: เปลี่ยนจาก a href="#" เป็น Link to="/chatbot" */}
        <Link to="/chatbot" className="nav-link">แชทบอท</Link>
        
        {/* เมนูอื่นปล่อยไว้ก่อนได้ครับ */}
        <a href="#" className="nav-link">ภาพยนตร์</a>
        <a href="#" className="nav-link">โรงภาพยนตร์</a>
        <a href="#" className="nav-link">ประวัติการจอง</a>
      </div>

      <button
        type="button"
        className="nav-login-btn"
        onClick={() => navigate('/login')}
      >
        <User size={18} />
        <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
      </button>
    </nav>
  );
};

export default Navbar;