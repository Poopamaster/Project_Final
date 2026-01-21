import React, { useState } from 'react';
import { 
    LayoutDashboard, Film, Ticket, Users, 
    MessageSquare, BarChart3, Settings 
} from 'lucide-react';
import '../css/AdminDashboardPage.css';

// --- 1. Import All Sub-Pages ---
import DashboardPage from '../components/admin/DashboardPage';
import AddMoviePage from '../components/admin/AddMoviePage';
import BookingPage from '../components/admin/BookingPageAdmin'; 
import CustomerPageAdmin from '../components/admin/CustomerPageAdmin';
import AiChatPageAdmin from '../components/admin/AiChatPageAdmin';
import ReportPage from '../components/admin/ReportPage';
import SettingsPage from '../components/admin/SettingsPage'; // หน้าสุดท้ายที่เพิ่มเข้ามา

export default function AdminPage() {
    const [page, setPage] = useState('dashboard');

    const menuItems = [
        { id: 'dashboard', label: 'ภาพรวม', icon: <LayoutDashboard size={20} /> },
        { id: 'add-movie', label: 'จัดการหนัง', icon: <Film size={20} /> },
        { id: 'bookings', label: 'การจอง', icon: <Ticket size={20} /> },
        { id: 'customers', label: 'ลูกค้า', icon: <Users size={20} /> },
        { id: 'ai-chat', label: 'คุยกับ AI', icon: <MessageSquare size={20} /> },
        { id: 'reports', label: 'รายงาน', icon: <BarChart3 size={20} /> },
        { id: 'settings', label: 'ตั้งค่า', icon: <Settings size={20} /> },
    ];

    return (
        <div className="admin-pure-layout">
            
            {/* Sidebar ด้านซ้าย */}
            <aside className="sidebar-figma">
                <div className="sidebar-profile-figma">
                    <div className="avatar-figma">
                        <Users size={28} color="white" />
                    </div>
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

                <div className="sidebar-footer-figma">
                    MCP CINEMA v2.0
                </div>
            </aside>
            
            {/* พื้นที่ Content ด้านขวา */}
            <main className="content-area-figma">
                <div className="content-container-figma">
                    {/* --- 2. Conditional Rendering (แสดงผลตามหน้าทีเลือก) --- */}
                    {page === 'dashboard' && <DashboardPage />}
                    {page === 'add-movie' && <AddMoviePage onMovieAdded={() => setPage('dashboard')} />}
                    {page === 'bookings' && <BookingPage />}
                    {page === 'customers' && <CustomerPageAdmin />}
                    {page === 'ai-chat' && <AiChatPageAdmin />}
                    {page === 'reports' && <ReportPage />}
                    {page === 'settings' && <SettingsPage />}
                    
                    {/* --- 3. ส่วนควบคุมบล็อก WIP (ตอนนี้จะไม่แสดงผลในหน้าทีทำเสร็จแล้ว) --- */}
                    {!['dashboard', 'add-movie', 'bookings', 'customers', 'ai-chat', 'reports', 'settings'].includes(page) && (
                        <div className="wip-box">
                            <h2>กำลังพัฒนาหน้า {menuItems.find(i => i.id === page)?.label}</h2>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}