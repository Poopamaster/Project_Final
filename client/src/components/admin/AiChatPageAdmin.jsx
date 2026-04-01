import React from 'react';
import ChatBotPage from "../../pages/ChatBotPage";
import { Bot, Trash2 } from 'lucide-react'; // ✨ 1. อย่าลืม Import Trash2

export default function AiChatPageAdmin() {
    return (
        <div className="admin-page-container" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100vh', /* ✅ ล็อกหน้าจอไว้แค่ 1 หน้าจอพอดี */
            width: '100%',
            overflow: 'hidden', /* ✅ ฆ่า Scrollbar ตัวนอกทิ้ง */
            background: '#0B1120' 
        }}>
            {/* Header ของหน้า Admin */}
            <header style={{ 
                padding: '15px 25px', 
                flexShrink: 0, /* ✅ กัน Header โดนบีบ */
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', // ✨ 2. เปลี่ยนเป็น flex เพื่อแยกซ้าย-ขวา
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#3b82f6', padding: '8px', borderRadius: '10px' }}>
                        <Bot size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'white', margin: 0 }}>Admin AI Assistant</h1>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '0.8rem' }}>จัดการระบบผ่าน CineBot</p>
                    </div>
                </div>

                {/* ✨ 3. เพิ่มปุ่มลบแชทมุมขวาบน */}
                <button 
                  onClick={() => {
                      // ยิงสัญญาณ (Event) ไปบอกหน้า ChatBotPage ให้รันฟังก์ชัน clearChat
                      window.dispatchEvent(new Event('trigger-clear-chat'));
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#ef4444',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  title="ล้างประวัติการสนทนา"
                >
                  <Trash2 size={16} />
                  <span>ล้างแชท</span>
                </button>
            </header>

            {/* ส่วนที่ฝัง ChatBotPage */}
            <div className="admin-chat-content" style={{ 
                flex: 1, /* ✅ กินพื้นที่ที่เหลือจาก Header ทั้งหมด */
                minHeight: 0, /* ✅ บังคับให้ Scroll เกิดแค่ในตัวแชท */
                width: '100%',
                position: 'relative'
            }}>
                <ChatBotPage isEmbedded={true} /> 
            </div>
        </div>
    );
}