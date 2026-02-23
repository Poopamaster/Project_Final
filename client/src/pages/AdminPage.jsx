// src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom'; // 🌟 เพิ่ม useParams
import { 
    LayoutDashboard, Film, Ticket, Users, 
    MessageSquare, BarChart3, Settings, ShieldCheck,
    ClipboardList, Monitor, QrCode // 🌟 เพิ่มไอคอน QrCode
} from 'lucide-react';
import '../css/AdminDashboardPage.css';

import DashboardPage from '../components/admin/DashboardPage';
import AddMoviePage from '../components/admin/AddMoviePage';
import BookingPage from '../components/admin/BookingPageAdmin'; 
import CustomerPageAdmin from '../components/admin/CustomerPageAdmin';
import AdminManagementPage from '../components/admin/AdminManagementPage';
import AiChatPageAdmin from '../components/admin/AiChatPageAdmin';
import ReportPage from '../components/admin/ReportPage';
import LogSystemPage from '../components/admin/LogSystemPage';
import SettingsPage from '../components/admin/SettingsPage';
import ShowtimePageAdmin from '../components/admin/ShowtimePageAdmin';
import VerifyTicketPage from '../components/admin/VerifyTicketPage'; // 🌟 Import หน้า Verify

export default function AdminPage() {
    // 🌟 เช็คว่ามีเลข Booking แนบมาใน URL หรือเปล่า (กรณีสแกน QR)
    const { bookingNumber } = useParams();
    
    // ถ้ามีเลข Booking ให้เปิดหน้า verify อัตโนมัติ ถ้าไม่มีก็หน้า dashboard
    const [page, setPage] = useState(bookingNumber ? 'verify' : 'dashboard');

    // ถ้า URL เปลี่ยน (สแกนอันใหม่) ให้เด้งไปหน้า verify
    useEffect(() => {
        if (bookingNumber) {
            setPage('verify');
        }
    }, [bookingNumber]);

    const menuItems = [
        { id: 'dashboard', label: 'ภาพรวม', icon: <LayoutDashboard size={20} /> },
        { id: 'add-movie', label: 'จัดการหนัง', icon: <Film size={20} /> },
        { id: 'showtime', label: 'จัดการรอบหนัง', icon: <Monitor size={20} /> },
        { id: 'bookings', label: 'การจอง', icon: <Ticket size={20} /> },
        { id: 'verify', label: 'ตรวจสอบตั๋ว', icon: <QrCode size={20} /> }, // 🌟 เพิ่มเมนูใหม่
        { id: 'customers', label: 'ลูกค้า', icon: <Users size={20} /> },
        { id: 'admins', label: 'จัดการผู้ดูแล', icon: <ShieldCheck size={20} /> },
        { id: 'ai-chat', label: 'คุยกับ AI', icon: <MessageSquare size={20} /> },
        { id: 'reports', label: 'รายงาน', icon: <BarChart3 size={20} /> },
        { id: 'logs', label: 'Log System', icon: <ClipboardList size={20} /> },
        { id: 'settings', label: 'ตั้งค่า', icon: <Settings size={20} /> },
    ];

    return (
        <div className="admin-pure-layout" style={{ display: 'flex', minHeight: '100vh', background: '#0f111a' }}>
            <aside className="sidebar-figma">
                <div className="sidebar-profile-figma">
                    <div className="avatar-figma"><Users size={28} color="white" /></div>
                    <div className="profile-info-figma">
                        <h3>Admin</h3>
                        <p>ผู้จัดการระบบ</p>
                    </div>
                </div>
                <div className="menu-section-label">MENU</div>
                <nav className="nav-menu-figma">
                    {menuItems.map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => setPage(item.id)} 
                            className={`nav-item-figma ${page === item.id ? 'active' : ''}`}
                        >
                            <span className="nav-icon-figma">{item.icon}</span>
                            <span className="nav-label-figma">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer-figma">MCP CINEMA v2.0</div>
            </aside>
            
            <main className="content-area-figma" style={{ flex: 1, position: 'relative', overflowY: 'auto', padding: '40px' }}>
                <div style={{ position: 'absolute', top: '30px', right: '40px', zIndex: 999 }}>
                    <Link to="/" style={{ 
                        display: 'flex', alignItems: 'center', gap: '10px', 
                        background: '#1e293b', color: '#f1f5f9', padding: '12px 20px', 
                        borderRadius: '14px', fontSize: '0.85rem', textDecoration: 'none',
                        border: '1px solid #334155', fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <Monitor size={18} />
                        <span>กลับสู่หน้าหลัก</span>
                    </Link>
                </div>

                <div className="content-container-figma" style={{ marginTop: '40px' }}>
                    {page === 'dashboard' && <DashboardPage />}
                    {page === 'verify' && <VerifyTicketPage />} {/* 🌟 แสดงหน้า Verify */}
                    {page === 'add-movie' && <AddMoviePage onMovieAdded={() => setPage('dashboard')} />}
                    {page === 'showtime' && <ShowtimePageAdmin />}
                    {page === 'bookings' && <BookingPage />}
                    {page === 'customers' && <CustomerPageAdmin />}
                    {page === 'admins' && <AdminManagementPage />}
                    {page === 'ai-chat' && <AiChatPageAdmin />}
                    {page === 'reports' && <ReportPage />}
                    {page === 'logs' && <LogSystemPage />}
                    {page === 'settings' && <SettingsPage />}
                </div>
            </main>
        </div>
    );
}