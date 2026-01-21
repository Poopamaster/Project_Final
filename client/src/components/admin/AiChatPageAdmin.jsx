import React, { useState } from 'react';
import { Send, Mic, Bot, User, Sparkles } from 'lucide-react';

export default function AiChatPageAdmin() {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'สวัสดีครับ, ผม Admin Assistant มีอะไรให้รับใช้ บอกมาได้เลยครับ' }
    ]);
    const [inputText, setInputText] = useState('');

    const handleSend = () => {
        if (!inputText.trim()) return;
        
        // เพิ่มข้อความของผู้ใช้
        const newMessages = [...messages, { role: 'user', text: inputText }];
        setMessages(newMessages);
        setInputText('');

        // จำลองการตอบกลับของ AI
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                text: `รับทราบครับ กำลังดำเนินการเรื่อง "${inputText}" ให้ทันที!` 
            }]);
        }, 1000);
    };

    return (
        <div className="admin-page-content-inside chat-layout">
            <header className="content-header-figma">
                <div className="header-left">
                    <div className="ai-title-wrapper">
                        <Bot className="ai-icon-main" size={32} />
                        <div>
                            <h1>Admin Assistant</h1>
                            <p>พร้อมเป็นตัวช่วยคุณแล้ว....</p>
                        </div>
                    </div>
                </div>
                <div className="header-right-time">
                    <span>11 Sep 2026</span>
                    <span className="time-clock">22:41:56</span>
                </div>
            </header>

            <div className="chat-container-figma">
                <div className="chat-messages-area">
                    <div className="date-divider"><span>วันนี้</span></div>
                    
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-bubble-wrapper ${msg.role}`}>
                            <div className="avatar-mini">
                                {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                            </div>
                            <div className="bubble-text">
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="chat-input-section">
                    <div className="input-wrapper-figma">
                        <input 
                            type="text" 
                            placeholder="เพิ่มหนังเรื่อง ธี่หยด3 ให้หน่อย ฉายที่โรง cinema1-2"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button className="btn-mic"><Mic size={22} /></button>
                        <button className="btn-send-purple" onClick={handleSend}>
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}