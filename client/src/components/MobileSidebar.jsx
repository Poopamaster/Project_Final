import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './MobileSidebar.css';

import { 
  Home, MessageSquare, Film, History, LogOut, 
  X, User, LayoutDashboard, ClipboardList, BarChart3, Settings, ArrowRight, ArrowLeft
} from 'lucide-react';

const MobileSidebar = ({ isOpen, onClose, user, handleLogout, children }) => {
  const location = useLocation();
  
  // ✅ 1. เช็คว่าตอนนี้ user อยู่ในหน้า Admin หรือไม่
  const isAdminPage = location.pathname.startsWith('/admin');

  // ฟังก์ชันเช็ค active (ปรับให้รองรับ admin path)
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return 'active';
    if (path !== '/' && location.pathname.startsWith(path)) return 'active';
    return '';
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>

      <div className={`mobile-sidebar ${isOpen ? 'active' : ''}`}>
        <button className="close-btn" onClick={onClose}><X size={24} /></button>

        {/* --- Header Profile --- */}
        <div className="sidebar-header">
            {user ? (
                <div className="user-profile-compact">
                    <div className="avatar-circle">{user.name?.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                        <h4>{user.name}</h4>
                        <p>{user.email}</p>
                        {/* แสดง Badge เฉพาะถ้าเป็น Admin */}
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
            
            {/* ✅ 2. กรณีอยู่หน้า Admin Dashboard (แสดงเมนู Admin) */}
            {user?.role === 'admin' && isAdminPage ? (
                <>
                    <div className="menu-label">ADMIN MENU</div>
                    
                    <Link to="/admin" className={`nav-item ${isActive('/admin')}`} onClick={onClose}>
                        <LayoutDashboard size={20} /> <span>แดชบอร์ด</span>
                    </Link>

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

                    <Link to="/admin/logs" className={`nav-item ${isActive('/admin/logs')}`} onClick={onClose}>
                        <ClipboardList size={20} /> <span>Log System</span>
                    </Link>

                    <Link to="/admin/settings" className={`nav-item ${isActive('/admin/settings')}`} onClick={onClose}>
                        <Settings size={20} /> <span>ตั้งค่า</span>
                    </Link>

                    <div className="divider"></div>
                    
                    {/* ปุ่มกลับหน้าบ้าน */}
                    <Link to="/" className="nav-item special-link" onClick={onClose}>
                        <ArrowLeft size={20} /> <span>กลับสู่หน้าเว็บไซต์</span>
                    </Link>
                </>
            ) : (
                /* ✅ 3. กรณีอยู่หน้า User ทั่วไป (Home) */
                <>
                    <div className="menu-label">MENU</div>
                    
                    <Link to="/" className={`nav-item ${isActive('/')}`} onClick={onClose}>
                        <Home size={20} /> <span>ภาพรวม</span>
                    </Link>
                    <Link to="/chatbot" className={`nav-item ${isActive('/chatbot')}`} onClick={onClose}>
                        <MessageSquare size={20} /> <span>แชทบอท</span>
                    </Link>
                    <Link to="/movies" className={`nav-item ${isActive('/movies')}`} onClick={onClose}>
                        <Film size={20} /> <span>ภาพยนตร์</span>
                    </Link>
                    <Link to="/history" className={`nav-item ${isActive('/history')}`} onClick={onClose}>
                        <History size={20} /> <span>ประวัติการจอง</span>
                    </Link>

                    {/* ✅ ปุ่มทางลับเข้าหลังบ้าน (แสดงเฉพาะ Admin) */}
                    {user?.role === 'admin' && (
                        <>
                            <div className="divider"></div>
                            <Link to="/admin" className="nav-item special-admin-link" onClick={onClose}>
                                <LayoutDashboard size={20} /> 
                                <span>เข้าสู่ระบบจัดการ (Admin)</span>
                                <ArrowRight size={16} style={{marginLeft: 'auto'}}/>
                            </Link>
                        </>
                    )}
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
        {!user && (
            <div className="sidebar-footer">
                <Link to="/login" className="login-btn" onClick={onClose}>
                    <User size={20} /> <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
                </Link>
                </div>
        )}
      </div>
    </>
  );
};

export default MobileSidebar;