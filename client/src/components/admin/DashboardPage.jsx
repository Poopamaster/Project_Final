import React from 'react';
import { TrendingUp, Ticket, Users } from 'lucide-react';
import '../../css/AdminDashboardPage.css'; // ตรวจสอบ path ให้ถูกต้อง

export default function DashboardPage() {
    // ข้อมูลจำลองสำหรับแสดงผลตาม Figma
    const stats = [
        { label: 'ยอดขายวันนี้', value: '45,650 บ.', trend: '+12.73%', icon: <TrendingUp size={24} color="#8b5cf6" /> },
        { label: 'จำนวนตั๋วที่ขายได้', value: '231 ใบ', trend: '+13.43%', icon: <Ticket size={24} color="#8b5cf6" /> },
        { label: 'ผู้ใช้ใหม่', value: '43 คน', trend: '+7.4%', icon: <Users size={24} color="#8b5cf6" /> },
    ];

    return (
        <div className="dashboard-content">
            <header className="dashboard-header">
                <div>
                    <h1>ภาพรวมของระบบ</h1>
                    <p>ข้อมูลสถิติและการทำงานของระบบ...</p>
                </div>
                <div className="dashboard-time">
                    <p>21 Jan 2026</p>
                    <p className="clock">16:22:52</p>
                </div>
            </header>

            {/* ส่วนของการ์ดสถิติ 3 ใบด้านบน */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-icon-bg">{stat.icon}</div>
                        <div className="stat-info">
                            <p className="stat-label">{stat.label}</p>
                            <h2 className="stat-value">{stat.value}</h2>
                            <p className="stat-trend">{stat.trend}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ส่วนของกราฟ (จำลองโครงสร้างไว้ให้) */}
            <div className="charts-row">
                <div className="main-chart-card">
                    <h3>ยอดขาย 7 วันที่ผ่านมา</h3>
                    <div className="chart-placeholder">
                        {/* คุณสามารถนำ Recharts หรือ Chart.js มาใส่ตรงนี้ได้ */}
                        <div className="mock-graph"></div>
                    </div>
                </div>
                <div className="pie-chart-card">
                    <h3>ภาพยนตร์ยอดนิยม</h3>
                    <div className="pie-placeholder"></div>
                </div>
            </div>
        </div>
    );
}