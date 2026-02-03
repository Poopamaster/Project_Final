import React, { useState } from 'react';
import { ClipboardList, ArrowRight, Bot, ShieldCheck, Clock, Calendar, Database, Activity, Info, Hash } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import '../../css/LogSystem.css'; // ตรวจสอบว่าไฟล์ CSS มีการตั้งค่า white-space: nowrap แล้ว

export default function LogSystemPage() {
    // 📝 ข้อมูลจำลอง (Mock Data)
    const [logs] = useState([
        {
            _id: "L001",
            timestamp: "2026-02-04T10:30:00",
            user_email: "AI_Assistant@mcp.com",
            role: "ai",
            action: "update",
            table_name: "Booking",
            target_id: "BK-995421",
            old_value: { status: "pending", payment: "unpaid" },
            new_value: { status: "cancelled", payment: "expired" },
            note: "AI ยกเลิกตั๋วอัตโนมัติเนื่องจากเกินระยะเวลาการชำระเงินที่กำหนดในระบบ"
        },
        {
            _id: "L002",
            timestamp: "2026-02-04T09:15:22",
            user_email: "admin@mcp.com",
            role: "admin",
            action: "login",
            table_name: "User",
            target_id: "ADM-001",
            old_value: null,
            new_value: null,
            note: "แอดมินเข้าสู่ระบบสำเร็จ (Verified Session)"
        },
        {
            _id: "L003",
            timestamp: "2026-02-03T21:45:10",
            user_email: "thammatorn@kaset.ac.th",
            role: "user",
            action: "update",
            table_name: "Booking",
            target_id: "BK-884210",
            old_value: { seats: "A1, A2" },
            new_value: { seats: "A1, A2, A3" },
            note: "ลูกค้าแก้ไขจำนวนที่นั่งเพิ่มเติมผ่านหน้าเว็บหลัก"
        }
    ]);

    // ✅ ฟังก์ชันแสดงความแตกต่างแบบแนวนอน (No Wrap)
    const renderDiff = (oldVal, newVal) => {
        if (!newVal) return <span style={{ color: '#475569', fontSize: '0.75rem', fontStyle: 'italic' }}>No changes detected</span>;
        if (!oldVal) return <div style={{ color: '#4ade80', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>+ Initialized: {JSON.stringify(newVal)}</div>;
        
        return (
            <div className="diff-container" style={{ display: 'flex', gap: '20px', whiteSpace: 'nowrap' }}>
                {Object.keys(newVal).map(key => (
                    <div key={key} className="diff-line" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span className="diff-key" style={{ marginRight: '5px', color: '#94a3b8', fontWeight: '600' }}>{key}:</span>
                        <span className="diff-old" style={{ color: '#f87171', textDecoration: 'line-through', opacity: 0.8 }}>{oldVal[key]}</span>
                        <ArrowRight size={10} color="#475569" style={{ margin: '0 8px' }} />
                        <span className="diff-new" style={{ color: '#4ade80', fontWeight: '700' }}>{newVal[key]}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="log-page-container">
            <header className="log-header">
                <div className="log-icon-box">
                    <ClipboardList size={26} color="white" />
                </div>
                <div className="log-title-section">
                    <h1>Log System</h1>
                    <p>ระบบติดตามกิจกรรมย้อนหลังในสภาพแวดล้อมจำลอง (Sandbox)</p>
                </div>
            </header>

            {/* ✅ Container ที่อนุญาตให้เลื่อนแนวนอน */}
            <div className="log-table-card" style={{ overflowX: 'auto' }}>
                <table className="log-table" style={{ minWidth: '1300px', tableLayout: 'auto' }}>
                    <thead>
                        <tr>
                            <th style={{ whiteSpace: 'nowrap' }}>วัน / เวลา</th>
                            <th style={{ whiteSpace: 'nowrap' }}>ผู้ดำเนินการ</th>
                            <th style={{ whiteSpace: 'nowrap' }}>กิจกรรม / ตาราง</th>
                            <th style={{ whiteSpace: 'nowrap' }}>การเปลี่ยนแปลง (Diff)</th>
                            <th style={{ whiteSpace: 'nowrap' }}>หมายเหตุ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log._id}>
                                {/* วันและเวลา */}
                                <td>
                                    <div className="log-time-group" style={{ whiteSpace: 'nowrap' }}>
                                        <div className="log-date-text">
                                            <Calendar size={13} style={{ marginRight: 6, opacity: 0.6 }} /> 
                                            {dayjs(log.timestamp).format('DD/MM/YYYY')}
                                        </div>
                                        <div className="log-clock-badge">
                                            <Clock size={12} style={{ marginRight: 4 }} /> 
                                            {dayjs(log.timestamp).format('HH:mm:ss')}
                                        </div>
                                    </div>
                                </td>

                                {/* ผู้ดำเนินการ */}
                                <td>
                                    <div className="user-identity" style={{ whiteSpace: 'nowrap' }}>
                                        {log.role === 'ai' ? 
                                            <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: 10, borderRadius: 12 }}><Bot size={20} color="#4ade80" /></div> : 
                                            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: 10, borderRadius: 12 }}><ShieldCheck size={20} color="#a78bfa" /></div>
                                        }
                                        <div className="user-main-info">
                                            <span className="email">{log.user_email}</span>
                                            <span className="role" style={{ color: log.role === 'ai' ? '#4ade80' : '#8b5cf6' }}>{log.role.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </td>

                                {/* กิจกรรมและตาราง */}
                                <td>
                                    <div className="table-id-stack" style={{ whiteSpace: 'nowrap' }}>
                                        <div className={`activity-label label-${log.action}`} style={{ width: 'fit-content' }}>
                                            <Activity size={12} /> {log.action.toUpperCase()}
                                        </div>
                                        <div className="table-name"><Database size={13} style={{ marginRight: 6, color: '#64748b' }} /> {log.table_name}</div>
                                        <div className="target-id-small"><Hash size={11} style={{ marginRight: 4 }} /> ID: {log.target_id}</div>
                                    </div>
                                </td>

                                {/* การเปลี่ยนแปลง (Diff แนวนอน) */}
                                <td style={{ verticalAlign: 'middle' }}>
                                    {renderDiff(log.old_value, log.new_value)}
                                </td>

                                {/* หมายเหตุ */}
                                <td style={{ verticalAlign: 'middle' }}>
                                    <div className="note-card" style={{ whiteSpace: 'nowrap', maxWidth: 'none' }}>
                                        <Info size={14} style={{ marginRight: 8, verticalAlign: 'middle', opacity: 0.7 }} />
                                        {log.note}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}