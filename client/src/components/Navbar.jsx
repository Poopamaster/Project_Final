import React from 'react';
import { User, Film } from 'lucide-react';
import '../css/Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="brand-icon">
           <Film size={24} />
        </div>
        <a className="brand-text" href="Homepage">MCP CINEMA DEMO</a>
      </div>

      <div className="nav-links">
        <a href="#" className="nav-link">แชทบอท</a>
        <a href="#" className="nav-link">ภาพยนตร์</a>
        <a href="#" className="nav-link">โรงภาพยนตร์</a>
        <a href="#" className="nav-link">ประวัติการจอง</a>
      </div>

      <button className="nav-login-btn">
        <User size={18} />
        <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
      </button>
    </nav>
  );
};

export default Navbar;