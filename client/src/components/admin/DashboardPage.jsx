// ในไฟล์ src/pages/admin/AdminDashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { TrendingUp, Ticket, Users, Loader2, BarChart3 } from 'lucide-react'; // 🌟 เพิ่มไอคอน BarChart3
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import axiosInstance from '../../api/axiosInstance'; 
import '../../css/AdminDashboardPage.css';

export default function DashboardPage() {
    const [statsData, setStatsData] = useState({ 
        sales: 0, tickets: 0, users: 0, 
        chartSales: [], chartMovies: [] 
    });
    const [loading, setLoading] = useState(true);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/admin/stats');
            if (response.data.success) {
                setStatsData({
                    sales: response.data.data.sales || 0,
                    tickets: response.data.data.tickets || 0,
                    users: response.data.data.users || 0,
                    chartSales: response.data.data.chartSales || [],
                    chartMovies: response.data.data.chartMovies || []
                });
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
        { label: 'ยอดขายทั้งหมด', value: `${(statsData.sales || 0).toLocaleString()} บ.`, trend: 'รวมทุกสาขา', icon: <TrendingUp size={24} color="#8b5cf6" /> },
        { label: 'จำนวนตั๋วที่ขายได้', value: `${statsData.tickets || 0} ใบ`, trend: 'รวมทุกสาขา', icon: <Ticket size={24} color="#8b5cf6" /> },
        { label: 'ผู้ใช้ในระบบ', value: `${statsData.users || 0} คน`, trend: 'ลูกค้าทั้งหมด', icon: <Users size={24} color="#8b5cf6" /> },
    ];

    const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

    // 🌟 Helper component สำหรับแสดงหน้า "ไม่มีข้อมูล" ให้ดูสวยงาม
    const EmptyState = ({ message }) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '15px' }}>
            <BarChart3 size={40} color="#334155" />
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>{message}</p>
        </div>
    );

    return (
        <div className="dashboard-content">
            <header className="dashboard-header">
                <div>
                    <h1>ภาพรวมของระบบ</h1>
                    <p>ข้อมูลสถิติจากฐานข้อมูล MCP CINEMA v2.0 (Real-time)</p>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center p-10 text-center" style={{ width: '100%' }}>
                    <Loader2 className="animate-spin" size={40} color="#8b5cf6" style={{ margin: '0 auto' }} />
                    <p style={{ marginTop: '15px', color: '#94a3b8' }}>กำลังอัปเดตสถิติล่าสุด...</p>
                </div>
            ) : (
                <>
                    {/* --- กล่องตัวเลข --- */}
                    <div className="stats-grid">
                        {statsCards.map((stat, index) => (
                            <div key={index} className="stat-card">
                                <div className="stat-icon-bg">{stat.icon}</div>
                                <div className="stat-info">
                                    <p className="stat-label">{stat.label}</p>
                                    <h2 className="stat-value">{stat.value}</h2>
                                    {/* 🌟 ปรับสีข้อความ trend ให้เป็นสีเทาดูสะอาดขึ้น */}
                                    <p className="stat-trend" style={{ color: '#64748b' }}>{stat.trend}</p> 
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* --- กราฟของจริงจาก Backend (Layout สวยขึ้น) --- */}
                    <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '30px' }}>
                        
                        {/* กราฟเส้น: ยอดขาย 7 วัน */}
                        <div className="main-chart-card" style={{ background: '#1e212f', padding: '25px', borderRadius: '16px' }}>
                            <h3 style={{ color: 'white', marginBottom: '25px' }}>ยอดขาย 7 วันที่ผ่านมา</h3>
                            <div style={{ width: '100%', height: 320 }}>
                                {/* ✅ เช็คความยาวข้อมูล: ถ้ามีให้แสดงกราฟ ถ้าไม่มีให้โชว์ EmptyState */}
                                {statsData.chartSales.length > 0 ? (
                                    <ResponsiveContainer>
                                        <LineChart data={statsData.chartSales}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                                            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: 'white' }} itemStyle={{ color: '#8b5cf6' }} />
                                            <Line type="monotone" dataKey="sales" name="ยอดขาย (บาท)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState message="ยังไม่มีข้อมูลยอดขายในช่วง 7 วันนี้" />
                                )}
                            </div>
                        </div>

                        {/* กราฟวงกลม: ภาพยนตร์ยอดนิยม */}
                        <div className="pie-chart-card" style={{ background: '#1e212f', padding: '25px', borderRadius: '16px' }}>
                            <h3 style={{ color: 'white', marginBottom: '25px' }}>สัดส่วนการขายตั๋ว</h3>
                            <div style={{ width: '100%', height: 320 }}>
                                {/* ✅ เช็คความยาวข้อมูล: ถ้ามีให้แสดงกราฟ ถ้าไม่มีให้โชว์ EmptyState */}
                                {statsData.chartMovies.length > 0 ? (
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={statsData.chartMovies} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                                                {statsData.chartMovies.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', color: 'white' }} />
                                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#94a3b8', fontSize: '12px', paddingTop: '10px' }}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState message="ยังไม่มีข้อมูลการขายตั๋วแยกตามภาพยนตร์" />
                                )}
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
}