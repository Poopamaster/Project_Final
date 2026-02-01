import React, { useState, useEffect } from 'react';
import { TrendingUp, Ticket, Users, Loader2 } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance'; 
import '../../css/AdminDashboardPage.css';

export default function DashboardPage() {
    const [statsData, setStatsData] = useState({ sales: 0, tickets: 0, users: 0 });
    const [loading, setLoading] = useState(true);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            
            const response = await axiosInstance.get('/admin/stats');
            if (response.data.success) {
                setStatsData(response.data.data || { sales: 0, tickets: 0, users: 0 });
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
        // ดึงข้อมูลใหม่ทุก 5 นาที
        const interval = setInterval(fetchDashboardStats, 300000);
        return () => clearInterval(interval);
    }, []);

    const statsCards = [
        { 
            label: 'ยอดขายทั้งหมด', 
            value: `${(statsData.sales || 0).toLocaleString()} บ.`, 
            trend: '+12.73%', 
            icon: <TrendingUp size={24} color="#8b5cf6" /> 
        },
        { 
            label: 'จำนวนตั๋วที่ขายได้', 
            value: `${statsData.tickets || 0} ใบ`, 
            trend: '+13.43%', 
            icon: <Ticket size={24} color="#8b5cf6" /> 
        },
        { 
            label: 'ผู้ใช้ในระบบ', 
            value: `${statsData.users || 0} คน`, 
            trend: '+7.4%', 
            icon: <Users size={24} color="#8b5cf6" /> 
        },
    ];

    return (
        <div className="dashboard-content">
            <header className="dashboard-header">
                <div>
                    <h1>ภาพรวมของระบบ</h1>
                    <p>ข้อมูลสถิติจากฐานข้อมูล MCP CINEMA v2.0</p>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center p-10 text-center" style={{ width: '100%' }}>
                    <Loader2 className="animate-spin" size={40} color="#8b5cf6" style={{ margin: '0 auto' }} />
                    <p style={{ marginTop: '15px', color: '#94a3b8' }}>กำลังอัปเดตสถิติล่าสุด...</p>
                </div>
            ) : (
                <div className="stats-grid">
                    {statsCards.map((stat, index) => (
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
            )}

            <div className="charts-row">
                <div className="main-chart-card">
                    <h3>ยอดขาย 7 วันที่ผ่านมา</h3>
                    <div className="chart-placeholder">
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