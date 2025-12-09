import React, { useState, useEffect } from 'react';
import { User, Film, LogOut } from 'lucide-react'; // เพิ่ม icon LogOut
import '../css/navbar.css';
import { useNavigate, Link, useLocation } from 'react-router-dom'; 

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // ใช้เพื่อเช็คสถานะทุกครั้งที่เปลี่ยนหน้า
  const [user, setUser] = useState(null);

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

  // ฟังก์ชัน Logout
  const handleLogout = () => {
    localStorage.removeItem("user"); // ลบข้อมูลในเครื่อง
    setUser(null); // เคลียร์ state
    navigate('/login'); // เด้งไปหน้า login
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
        <Link to="/chatbot" className="nav-link">แชทบอท</Link>
        <a href="#" className="nav-link">ภาพยนตร์</a>
        <a href="#" className="nav-link">โรงภาพยนตร์</a>
        <a href="#" className="nav-link">ประวัติการจอง</a>
      </div>

      {/* เงื่อนไข: ถ้ามี User ให้โชว์ชื่อและปุ่ม Logout, ถ้าไม่มีให้โชว์ปุ่ม Login */}
      {user ? (
        <div className="nav-user-profile">
          <span className="user-name">สวัสดี, {user.name}</span>
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