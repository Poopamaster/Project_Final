import React, { useState } from 'react';
import { ClipboardList, Search, Filter, User, Calendar, Activity, Download } from 'lucide-react';

export default function LogSystemPage() {
    const [logs] = useState([
        { id: 1, admin: 'Admin ธรรมธร', action: 'เพิ่มหนังใหม่', target: 'ธี่หยด 2', date: '2026-01-31 14:20', status: 'SUCCESS' },
        { id: 2, admin: 'Admin ธรรมธร', action: 'ลบผู้ดูแล', target: 'test_admin@mail.com', date: '2026-01-31 13:45', status: 'DANGER' },
        { id: 3, admin: 'System', action: 'Backup Database', target: 'Port 8000', date: '2026-01-31 12:00', status: 'INFO' },
        { id: 4, admin: 'Admin ธรรมธร', action: 'แก้ไขราคาตั๋ว', target: 'โรง 1 (Sriracha)', date: '2026-01-31 10:30', status: 'WARNING' },
        { id: 5, admin: 'Admin ธรรมธร', action: 'เข้าสู่ระบบ', target: 'Dashboard', date: '2026-01-31 09:00', status: 'SUCCESS' },
    ]);

    return (
        <div className="admin-page-content-inside">
            {/* Header Area */}
            <header className="content-header-figma" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="header-left">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <ClipboardList size={30} color="#8b5cf6" />
                        <h1 style={{ fontSize: '1.8rem', color: 'white', margin: 0 }}>Log System</h1>
                    </div>
                    <p style={{ color: '#94a3b8', marginTop: '5px' }}>ตรวจสอบประวัติกิจกรรมการทำงานของแอดมินย้อนหลัง</p>
                </div>
                <button style={{ background: '#1e212f', border: '1px solid #334155', color: 'white', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Download size={16} /> Export CSV
                </button>
            </header>

            {/* Filter Section - บังคับความกว้างไม่ให้เบียดกัน */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อแอดมิน, กิจกรรม หรือข้อมูลเป้าหมาย..." 
                        style={{ width: '100%', padding: '14px 14px 14px 50px', background: '#151823', border: '1px solid #334155', borderRadius: '15px', color: 'white', outline: 'none' }}
                    />
                </div>
                <button className="btn-save-settings" style={{ minWidth: '130px', justifyContent: 'center' }}>
                    <Filter size={18} /> <span>ตัวกรอง</span>
                </button>
            </div>

            {/* Table Area - แก้ไขจุดที่ทำให้ตัวหนังสือทับกัน */}
            <div className="figma-table-container" style={{ background: '#1e212f', padding: '25px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h2 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={18} color="#8b5cf6" /> รายการกิจกรรมล่าสุด
                </h2>
                
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left' }}>
                                <th style={{ padding: '15px', color: '#94a3b8', fontSize: '0.85rem' }}>วัน-เวลา</th>
                                <th style={{ padding: '15px', color: '#94a3b8', fontSize: '0.85rem' }}>ผู้ดำเนินการ</th>
                                <th style={{ padding: '15px', color: '#94a3b8', fontSize: '0.85rem' }}>กิจกรรม</th>
                                <th style={{ padding: '15px', color: '#94a3b8', fontSize: '0.85rem' }}>เป้าหมาย/ข้อมูล</th>
                                <th style={{ padding: '15px', color: '#94a3b8', fontSize: '0.85rem' }}>สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '20px 15px', color: '#cbd5e1', fontSize: '0.9rem' }}>{log.date}</td>
                                    <td style={{ padding: '20px 15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <User size={16} color="#a78bfa" />
                                            </div>
                                            <span style={{ color: 'white', fontWeight: '500' }}>{log.admin}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 15px', color: 'white' }}>{log.action}</td>
                                    <td style={{ padding: '20px 15px', color: '#94a3b8', fontSize: '0.85rem' }}>{log.target}</td>
                                    <td style={{ padding: '20px 15px' }}>
                                        <span className={`status-pill ${log.status.toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '5px 12px', fontWeight: '700' }}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}