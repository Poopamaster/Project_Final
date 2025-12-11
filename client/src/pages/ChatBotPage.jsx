import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Send, Bot, Film, Ticket, Home, History, User, Trash2 } from 'lucide-react'; 
import { AuthContext } from '../App'; 
import { sendMessageToBot } from '../api/chatbotApi'; // ✅ 1. Import API ที่แยกไว้
import '../css/ChatBotPage.css';

const ChatBotPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); 
  const messagesEndRef = useRef(null);

  // ✅ 2. โหลดประวัติแชทจาก LocalStorage (ถ้ามี) ถ้าไม่มีให้ใช้ข้อความต้อนรับ
  const [messages, setMessages] = useState(() => {
    const savedChats = localStorage.getItem('chatHistory');
    if (savedChats) {
      return JSON.parse(savedChats);
    }
    return [
      { 
        id: 1, 
        sender: 'bot', 
        text: `สวัสดีครับคุณ ${user?.name || 'ลูกค้า'}, ผม CineBot ยินดีให้บริการครับ! วันนี้อยากดูหนังแนวไหน หรือเช็ครอบเรื่องอะไร บอกผมได้เลยนะครับ 🎬` 
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ✅ 3. ทุกครั้งที่ messages เปลี่ยน ให้บันทึกลง LocalStorage
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ฟังก์ชันล้างประวัติแชท (เผื่ออยากลบ)
  const clearChat = () => {
    if(window.confirm("ต้องการลบประวัติการสนทนาทั้งหมด?")) {
        const initialMsg = [{ 
            id: Date.now(), 
            sender: 'bot', 
            text: `เริ่มการสนทนาใหม่ครับ คุณ ${user?.name || 'ลูกค้า'} มีอะไรให้ช่วยไหมครับ?` 
        }];
        setMessages(initialMsg);
        localStorage.removeItem('chatHistory');
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessageText = inputText;
    
    setInputText('');
    const newMessages = [
      ...messages, 
      { id: Date.now(), sender: 'user', text: userMessageText }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // ✅ 4. เรียกใช้ API จากไฟล์แยก
      const data = await sendMessageToBot(userMessageText);

      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: data.reply }
      ]);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: '⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ หรือ Session หมดอายุ กรุณา Login ใหม่ครับ' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      
      {/* --- SIDEBAR --- */}
      <aside className="chat-sidebar">
        <div className="user-profile">
          {/* ✅ 5. ตรวจสอบการแสดงผล User Profile */}
          <div className="avatar-circle">
             {user?.name ? user.name.charAt(0).toUpperCase() : <User />}
          </div>
          <div className="user-info">
            {/* ใช้ user?.xxx เพื่อป้องกัน error ถ้า user เป็น null */}
            <h3>{user?.name || "Guest User"}</h3>
            <p>{user?.email || "กรุณาเข้าสู่ระบบ"}</p>
          </div>
        </div>

        <div className="divider"></div>

        <nav className="quick-menu">
          <div className="menu-header">QUICK MENU</div>
          <ul>
            <li onClick={() => navigate('/')}>
              <Home size={18} /> หน้าแรก
            </li>
            <li onClick={() => navigate('/')}><Film size={18} /> ภาพยนตร์</li>
            <li><Ticket size={18} /> โรงภาพยนตร์ใกล้ฉัน</li>
            <li><History size={18} /> ประวัติการจอง</li>
            {/* ปุ่มล้างแชท */}
            <li onClick={clearChat} style={{color: '#ff6b6b', cursor: 'pointer'}}>
                <Trash2 size={18} /> ล้างประวัติแชท
            </li>
          </ul>
        </nav>

        {/* ... (Popular Movies ส่วนเดิม) ... */}
        <div className="divider"></div>
         {/* (ย่อ Popular Movies ไว้เพื่อความกระชับ) */}
      </aside>

      {/* --- CHAT WINDOW --- */}
      <main className="chat-window">
        <header className="chat-header">
          <div className="header-left">
            <div className="bot-avatar-header">
              <Bot size={24} color="white" />
            </div>
            <div className="header-text">
              <h2>CineBot Assistant (AI)</h2>
              <p>Bot พร้อมใช้งาน • ตอบคำถามภาพยนตร์</p>
            </div>
          </div>
        </header>

        <div className="messages-area">
          <div className="date-divider">
            <span>ประวัติการสนทนา</span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div className="bot-icon-chat"><Bot size={20} /></div>
              )}
              <div className="message-bubble">
                {msg.text.split('\n').map((line, i) => (
                    <span key={i}>{line}<br/></span>
                ))}
              </div>
            </div>
          ))}

          {isLoading && (
             <div className="message-row bot">
                <div className="bot-icon-chat"><Bot size={20} /></div>
                <div className="message-bubble typing-indicator">
                   <span>.</span><span>.</span><span>.</span>
                </div>
             </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-footer">
          <div className="input-container">
            <input 
              type="text" 
              placeholder="พิมพ์ข้อความที่นี่..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
            />
            <div className="input-actions">
              <button className="send-btn" onClick={handleSendMessage} disabled={isLoading}>
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default ChatBotPage;