import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

export default function ReportPage() {
    const [chartData, setChartData] = useState([]); // ข้อมูลสำหรับกราฟ
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);

    // สีสำหรับกราฟ
    const COLORS = ['#8b5cf6', '#fb7185', '#22d3ee'];

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8000/api/admin/reports');
            
            if (response.data.success) {
                setFeedback(response.data.feedback);
                // ข้อมูลกราฟที่คำนวณมาจาก Backend (ตัวอย่าง: [{name: 'VIP', value: 400}, ...])
                setChartData(response.data.seatStats); 
            }
            setLoading(false);
        } catch (error) {
            console.error("Fetch error:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
        // ถ้าอยากให้ Real-time มากขึ้น สามารถตั้ง Interval ให้ดึงข้อมูลใหม่ทุก 1 นาที
        const interval = setInterval(fetchReports, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="admin-page-content-inside">
            <header className="content-header-figma">
                <div>
                    <h1>รายงานและสถิติ</h1>
                    <p>ข้อมูลอัปเดตล่าสุดจากฐานข้อมูลจริง</p>
                </div>
            </header>

            <div className="report-main-section">
                <div className="charts-grid-figma">
                    {/* กราฟประเภทที่นั่งที่ขายได้ (Real-time) */}
                    <div className="chart-card-figma">
                        <h3>ประเภทที่นั่งที่ขายได้</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                    
                    {/* กราฟรายได้ (Bar Chart) - ทำในลักษณะเดียวกัน */}
                </div>
            </div>
            
            {/* ส่วน Feedback ด้านล่างเหมือนเดิม */}
        </div>
    );
}