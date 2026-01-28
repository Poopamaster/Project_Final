import React from 'react';
import ChatBotPage from "../../pages/ChatBotPage";
import { Bot } from 'lucide-react';

export default function AiChatPageAdmin() {
    return (
        <div className="admin-page-content-inside chat-layout" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header ของหน้า Admin */}
            <header className="content-header-figma">
                <div className="header-left">
                    <div className="ai-title-wrapper">
                        <Bot className="ai-icon-main" size={32} />
                        <div>
                            <h1>Admin Assistant</h1>
                            <p>จัดการระบบผ่าน CineBot (Full Access)</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* ✅ ดึง ChatBotPage มาแสดงผล และบอกมันว่าเป็น Embedded mode */}
            <div className="admin-chat-embedded-container" style={{ flex: 1, overflow: 'hidden', marginTop: '20px' }}>
                <ChatBotPage isEmbedded={true} /> 
            </div>
        </div>
    );
}