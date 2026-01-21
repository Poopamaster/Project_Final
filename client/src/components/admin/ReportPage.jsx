import React from 'react';
import { BarChart3, PieChart as PieChartIcon, MessageSquareQuote } from 'lucide-react';

export default function ReportPage() {
    // ข้อมูลจำลองสำหรับกราฟ
    const feedback = [
        { user: "คุณพิซซ่า ดี***", comment: "เว็บล่มเมื่อตอน 9 โมงเช้า จองตั๋วรอบเช้าไม่ทันเลย" },
        { user: "คุณโดนัท พ***", comment: "ใช้งานง่ายมากเลยค่ะ" }
    ];

    return (
        <div className="admin-page-content-inside">
            <header className="content-header-figma">
                <div className="header-left">
                    <h1>รายงาน</h1>
                    <p>รวมข้อมูลการรายงานจากผู้ใช้...</p>
                </div>
                <div className="header-right-time">
                    <span>11 Sep 2026</span>
                    <span className="time-clock">22:41:56</span>
                </div>
            </header>

            <div className="report-main-section">
                <h2 className="section-title">รายงานและสถิติ</h2>
                <div className="charts-grid-figma">
                    {/* กราฟรายได้รายเดือน */}
                    <div className="chart-card-figma">
                        <div className="chart-header-row">
                            <h3>รายได้รายเดือน</h3>
                            <span className="chart-type-tag">BarLineChart</span>
                        </div>
                        <div className="mock-chart-container">
                            <img src="https://quickchart.io/chart?c={type:'bar',data:{labels:['Jan','Feb','Mar','Apr','May'],datasets:[{label:'VIP',data:[25,26,18,12,25],backgroundColor:'%238b5cf6'},{label:'NORMAL',data:[12,15,10,18,17],backgroundColor:'%23fb7185'},{label:'PREMIUM',data:[15,20,25,28,24],backgroundColor:'%2322d3ee'}]}}" alt="Monthly Revenue Chart" />
                        </div>
                    </div>

                    {/* กราฟประเภทที่นั่ง */}
                    <div className="chart-card-figma">
                        <div className="chart-header-row">
                            <h3>ประเภทที่นั่งที่ขายได้</h3>
                            <span className="chart-type-tag">PieChart</span>
                        </div>
                        <div className="mock-chart-container pie">
                            <img src="https://quickchart.io/chart?c={type:'doughnut',data:{labels:['VIP','PREMIUM','NORMAL'],datasets:[{data:[1742,1538,1574],backgroundColor:['%238b5cf6','%23fb7185','%2322d3ee']}]}}" alt="Seat Category Chart" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="feedback-section-figma">
                <h2 className="section-title">รายงานจากผู้ใช้งาน</h2>
                <div className="feedback-grid">
                    {feedback.map((item, index) => (
                        <div key={index} className="feedback-card-figma">
                            <p className="feedback-user">{item.user}</p>
                            <p className="feedback-text">"{item.comment}"</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}