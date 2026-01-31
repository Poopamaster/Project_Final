import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';
// ✅ เปลี่ยนมาใช้ axiosInstance เพื่อเรียกพอร์ต 8000 และรองรับความปลอดภัยตามที่คุยกัน
import axiosInstance from '../../api/axiosInstance'; 

export default function ReportPage() {
    const [chartData, setChartData] = useState([]); 
    const [loading, setLoading] = useState(true);

    // สีสำหรับกราฟสไตล์ Figma
    const COLORS = ['#8b5cf6', '#fb7185', '#22d3ee'];

    const fetchReports = async () => {
        try {
            setLoading(true);
            // ✅ เรียกผ่าน axiosInstance ระบบจะจัดการ BaseURL และ Token ให้เอง
            const response = await axiosInstance.get('/admin/reports');
            
            if (response.data.success) {
                // ข้อมูลกราฟที่คำนวณมาจาก Backend
                setChartData(response.data.seatStats || []); 
            }
            setLoading(false);
        } catch (error) {
            console.error("Fetch reports error:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
        // ดึงข้อมูลใหม่ทุก 1 นาทีเพื่อให้ข้อมูลกราฟเป็นปัจจุบัน
        const interval = setInterval(fetchReports, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="admin-page-content-inside">
            <header className="content-header-figma">
                <div className="header-left">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <TrendingUp size={32} color="#8b5cf6" />
                        <div>
                            <h1>รายงานและสถิติ</h1>
                            <p>วิเคราะห์ข้อมูลการขายและสถิติภาพยนตร์จากระบบ MCP CINEMA</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="report-main-section" style={{ marginTop: '25px' }}>
                <div className="charts-grid-figma" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                    
                    {/* กราฟประเภทที่นั่งที่ขายได้ (Real-time) */}
                    <div className="chart-card-figma" style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                        <h3 style={{ color: '#e2e8f0', marginBottom: '20px', fontSize: '18px' }}>สถิติประเภทที่นั่งที่ขายได้</h3>
                        <div style={{ width: '100%', height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {loading ? (
                                <div style={{ textAlign: 'center' }}>
                                    <Loader2 className="animate-spin" size={40} color="#8b5cf6" />
                                    <p style={{ color: '#94a3b8', marginTop: '10px' }}>กำลังประมวลผลสถิติ...</p>
                                </div>
                            ) : chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ color: '#64748b' }}>ยังไม่มีข้อมูลการจองเพื่อนำมาแสดงสถิติ</div>
                            )}
                        </div>
                    </div>

                    
                </div>
            </div>
        </div>
    );
}