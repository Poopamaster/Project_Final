import React, { useState, useEffect } from 'react';
import { TrendingUp, Ticket, Users, Loader2 } from 'lucide-react';
import axios from 'axios';
import '../../css/AdminDashboardPage.css';

export default function DashboardPage() {
    const [statsData, setStatsData] = useState({ sales: 0, tickets: 0, users: 0 });
    const [loading, setLoading] = useState(true);

    // 1. ฟังก์ชันดึงข้อมูลสถิติจาก Backend Port 8000
    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8000/api/admin/stats');
            if (response.data.success) {
                setStatsData(response.data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
        const interval = setInterval(fetchDashboardStats, 300000);
        return () => clearInterval(interval);
    }, []);

    const statsCards = [
        { 
            label: 'ยอดขายทั้งหมด', 
            value: `${statsData.sales.toLocaleString()} บ.`, 
            trend: '+12.73%', 
            icon: <TrendingUp size={24} color="#8b5cf6" /> 
        },
        { 
            label: 'จำนวนตั๋วที่ขายได้', 
            value: `${statsData.tickets} ใบ`, 
            trend: '+13.43%', 
            icon: <Ticket size={24} color="#8b5cf6" /> 
        },
        { 
            label: 'ผู้ใช้ในระบบ', 
            value: `${statsData.users} คน`, 
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
                {/* ตัดส่วน dashboard-time ออกแล้ว */}
            </header>

            {loading ? (
                <div className="flex justify-center p-10">
                    <Loader2 className="animate-spin" size={40} color="#8b5cf6" />
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