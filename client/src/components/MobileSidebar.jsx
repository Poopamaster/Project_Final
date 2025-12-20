import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './MobileSidebar.css';

// ใช้ Lucide React
import { Home, MessageSquare, Film, History, LogOut, X, User, LayoutDashboard } from 'lucide-react';

// ✅ 1. เพิ่ม children เข้าไปใน props (เพื่อรับปุ่มพิเศษจากหน้าอื่น)
const MobileSidebar = ({ isOpen, onClose, user, handleLogout, children }) => {
  const location = useLocation();

  // ฟังก์ชันเช็คว่าหน้าไหน Active อยู่
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <>
      {/* --- ฉากหลังสีดำจางๆ (Overlay) --- */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
      ></div>

      {/* --- ตัว Sidebar --- */}
      <div className={`mobile-sidebar ${isOpen ? 'active' : ''}`}>
        
        {/* ปุ่มปิด X */}
        <button className="close-btn" onClick={onClose}>
            <X size={24} />
        </button>

        {/* --- ส่วนหัว: โปรไฟล์ผู้ใช้ --- */}
        <div className="sidebar-header">
            {user ? (
                <div className="user-profile-compact">
                    <div className="avatar-circle">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="user-info">
                        <h4>{user.name}</h4>
                        <p>{user.email || 'Member'}</p>
                        {user.role === 'admin' && <span className="sidebar-badge">Admin</span>}
                    </div>
                </div>
            ) : (
                <Link to="/login" className="user-profile-compact guest" onClick={onClose}>
                     <div className="avatar-circle" style={{background: '#334155'}}>
                        <User size={20} />
                     </div>
                     <div className="user-info">
                        <h4>ผู้เยี่ยมชม</h4>
                        <p>คลิกเพื่อเข้าสู่ระบบ</p>
                     </div>
                </Link>
            )}
        </div>

        <div className="divider"></div>

        {/* --- รายการเมนู --- */}
        <nav className="sidebar-nav">
            <div className="menu-label">QUICK MENU</div>
            
            <Link to="/" className={`nav-item ${isActive('/')}`} onClick={onClose}>
                <Home size={20} />
                <span>หน้าแรก</span>
            </Link>

            <Link to="/chatbot" className={`nav-item ${isActive('/chatbot')}`} onClick={onClose}>
                <MessageSquare size={20} />
                <span>แชทบอท AI</span>
            </Link>

            <Link to="/movies" className={`nav-item ${isActive('/movies')}`} onClick={onClose}>
                <Film size={20} />
                <span>ภาพยนตร์</span>
            </Link>

            <Link to="/history" className={`nav-item ${isActive('/history')}`} onClick={onClose}>
                <History size={20} />
                <span>ประวัติการจอง</span>
            </Link>

            {/* ✅ 2. แทรก children ตรงนี้ (ปุ่มพิเศษจะโผล่ตรงนี้) */}
            {children}

            {/* เมนูพิเศษสำหรับ Admin */}
            {user && user.role === 'admin' && (
                <Link to="/admin" className={`nav-item ${isActive('/admin')}`} onClick={onClose}>
                    <LayoutDashboard size={20} color="#eab308" />
                    <span style={{color: '#eab308'}}>ระบบหลังบ้าน</span>
                </Link>
            )}
        </nav>

        {/* --- ส่วนท้าย: ปุ่ม Logout --- */}
        {user && (
            <div className="sidebar-footer">
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>ออกจากระบบ</span>
                </button>
            </div>
        )}
      </div>
    </>
  );
};

export default MobileSidebar;