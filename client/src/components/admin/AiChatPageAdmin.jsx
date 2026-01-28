import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Bot, User, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function AiChatPageAdmin() {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'สวัสดีครับ, ผม Admin Assistant มีอะไรให้รับใช้ บอกมาได้เลยครับ' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    // เลื่อนลงไปที่ข้อความล่าสุดอัตโนมัติ
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim()) return;
        
        const userMessage = { role: 'user', text: inputText };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        try {
            
            const response = await axios.post('http://localhost:5001/api/mcp/chat', {
                message: inputText,
                context: 'admin' 
            });

            if (response.data) {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    text: response.data.reply 
                }]);
            }
        } catch (error) {
            console.error("MCP Chat Error:", error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                text: 'ขออภัยครับ ระบบเชื่อมต่อกับ MCP Server ไม่ได้ กรุณาเช็คว่ารัน mcp-server หรือยัง' 
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="admin-page-content-inside chat-layout">
            <header className="content-header-figma">
                <div className="header-left">
                    <div className="ai-title-wrapper">
                        <Bot className="ai-icon-main" size={32} />
                        <div>
                            <h1>Admin Assistant</h1>
                            <p>พร้อมเป็นตัวช่วยจัดการระบบ MCP CINEMA...</p>
                        </div>
                    </div>
                </div>
                {/* ตัดส่วนเวลาออกแล้ว */}
            </header>

            <div className="chat-container-figma">
                <div className="chat-messages-area" ref={scrollRef}>
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
                    {isTyping && (
                        <div className="chat-bubble-wrapper assistant">
                            <div className="avatar-mini"><Loader2 className="animate-spin" size={14} /></div>
                            <div className="bubble-text italic text-gray-400">กำลังคิด...</div>
                        </div>
                    )}
                </div>

                <div className="chat-input-section">
                    <div className="input-wrapper-figma">
                        <input 
                            type="text" 
                            placeholder="พิมพ์คำสั่ง เช่น 'สรุปยอดขายวันนี้' หรือ 'เพิ่มหนังใหม่'"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isTyping}
                        />
                        <button className="btn-mic"><Mic size={22} /></button>
                        <button className="btn-send-purple" onClick={handleSend} disabled={isTyping}>
                            {isTyping ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}