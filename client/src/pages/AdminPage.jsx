import React, { useState, useEffect, useContext } from 'react';
import { LayoutDashboard, Plus } from 'lucide-react';
import '../css/AdminDashboardPage.css';
import { AuthContext } from '../App'; // Import AuthContext

// Import Components
import DashboardPage from '../components/admin/DashboardPage';
import AddMoviePage from '../components/admin/AddMoviePage';
import AdminNavbar from '../components/admin/AdminNavbar'; // ✅ Import Navbar ใหม่

export default function AdminPage() {
    const { user } = useContext(AuthContext); // ดึงข้อมูล user มาโชว์
    const [page, setPage] = useState('dashboard');
    const [refreshKey, setRefreshKey] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setSidebarOpen(true);
            else setSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMovieAdded = () => {
        setPage('dashboard');
        setRefreshKey(prev => prev + 1);
        if (window.innerWidth <= 768) setSidebarOpen(false);
    };

    const handleMenuClick = (menuPage) => {
        setPage(menuPage);
        if (window.innerWidth <= 768) setSidebarOpen(false);
    };

    return (
        <div className="admin-container">
            {/* Backdrop สำหรับมือถือ */}
            {sidebarOpen && window.innerWidth <= 768 && (
                <div className="sidebar-overlay-backdrop" onClick={() => setSidebarOpen(false)}/>
            )}

            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <span className="brand-text">CINE<span className="text-highlight">ADMIN</span></span>
                </div>
                <nav className="sidebar-nav">
                    <button 
                        onClick={() => handleMenuClick('dashboard')} 
                        className={`nav-item ${page === 'dashboard' ? 'active' : ''}`}
                    >
                        <LayoutDashboard size={20} /> Dashboard
                    </button>
                    <button 
                        onClick={() => handleMenuClick('add-movie')} 
                        className={`nav-item ${page === 'add-movie' ? 'active' : ''}`}
                    >
                        <Plus size={20} /> Add Movie
                    </button>
                </nav>
                {/* เอาปุ่ม Logout ใน Sidebar ออก เพราะย้ายไปข้างบนแล้ว */}
                <div className="sidebar-footer">
                    <p style={{color: '#555', fontSize: '0.8rem', textAlign: 'center'}}>v1.0.0 Control Panel</p>
                </div>
            </div>
            
            {/* Main Content */}
            <main className="main-content" style={{ padding: 0 }}> {/* set padding 0 เพราะ navbar จะจัดการเอง */}
                
                {/* ✅ ใส่ Navbar ใหม่ตรงนี้ */}
                <AdminNavbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} />

                {/* เนื้อหาข้างใน (ใส่ Padding แยกต่างหาก) */}
                <div style={{ padding: '2rem' }}>
                    {page === 'dashboard' && <DashboardPage refreshTrigger={refreshKey} />}
                    {page === 'add-movie' && <AddMoviePage onMovieAdded={handleMovieAdded} />}
                </div>

                <div className="bg-decor" />
            </main>
        </div>
    );
}