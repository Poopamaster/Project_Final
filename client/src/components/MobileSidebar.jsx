import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './MobileSidebar.css';

// ✅ เพิ่ม ClipboardList เข้ามาในกลุ่มไอคอน
import { 
  Home, MessageSquare, Film, History, LogOut, 
  X, User, LayoutDashboard, ClipboardList, BarChart3, Settings 
} from 'lucide-react';

const MobileSidebar = ({ isOpen, onClose, user, handleLogout, children }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>

      <div className={`mobile-sidebar ${isOpen ? 'active' : ''}`}>
        <button className="close-btn" onClick={onClose}><X size={24} /></button>

        <div className="sidebar-header">
            {user ? (
                <div className="user-profile-compact">
                    <div className="avatar-circle">{user.name?.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                        <h4>{user.name}</h4>
                        <p>{user.email}</p>
                        {user.role === 'admin' && <span className="sidebar-badge">Admin</span>}
                    </div>
                </div>
            ) : (
                <div className="user-profile-compact guest">
                    <div className="avatar-circle"><User size={20} /></div>
                    <div className="user-info"><h4>ผู้เยี่ยมชม</h4></div>
                </div>
            )}
        </div>

        <div className="divider"></div>

        <nav className="sidebar-nav">
            <div className="menu-label">MENU</div>
            
            {/* เมนูสำหรับ User ทั่วไป */}
            <Link to="/" className={`nav-item ${isActive('/')}`} onClick={onClose}>
                <Home size={20} /> <span>ภาพรวม</span>
            </Link>

            {/* เมนูสำหรับ Admin (แทรก Log System ตรงนี้) */}
            {user && user.role === 'admin' && (
                <>
                    <Link to="/admin/movies" className={`nav-item ${isActive('/admin/movies')}`} onClick={onClose}>
                        <Film size={20} /> <span>จัดการหนัง</span>
                    </Link>

                    <Link to="/admin/bookings" className={`nav-item ${isActive('/admin/bookings')}`} onClick={onClose}>
                        <History size={20} /> <span>การจอง</span>
                    </Link>

                    <Link to="/admin/customers" className={`nav-item ${isActive('/admin/customers')}`} onClick={onClose}>
                        <User size={20} /> <span>ลูกค้า</span>
                    </Link>

                    <Link to="/admin/reports" className={`nav-item ${isActive('/admin/reports')}`} onClick={onClose}>
                        <BarChart3 size={20} /> <span>รายงาน</span>
                    </Link>

                    {/* ✅ เพิ่มเมนู Log System ตรงนี้ครับ */}
                    <Link to="/admin/logs" className={`nav-item ${isActive('/admin/logs')}`} onClick={onClose}>
                        <ClipboardList size={20} /> <span>Log System</span>
                    </Link>

                    <Link to="/admin/settings" className={`nav-item ${isActive('/admin/settings')}`} onClick={onClose}>
                        <Settings size={20} /> <span>ตั้งค่า</span>
                    </Link>
                </>
            )}

            {children}
        </nav>

        {user && (
            <div className="sidebar-footer">
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={20} /> <span>ออกจากระบบ</span>
                </button>
            </div>
        )}
      </div>
    </>
  );
};

export default MobileSidebar;