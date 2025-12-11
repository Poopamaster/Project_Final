import React, { useState, useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, Send, Bot, Film, Home, User, Trash2, Paperclip, X, Menu, LogOut, Loader2 } from 'lucide-react';
import { AuthContext } from '../App';
import HeroSection from '../components/HeroSection';
import { useChatHistory, useChatInput, useInitialMessageProcessor } from '../hooks/useChatBotLogic'; // Import Hooks
import { sendMessageToBot } from '../api/chatbotApi';
import '../css/ChatBotPage.css';

const ChatBotPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. เรียกใช้ Custom Hooks
  const { messages, setMessages, isLoading, setIsLoading, messagesEndRef, clearChat } = useChatHistory(user);
  const { inputText, setInputText, selectedImage, imagePreview, isListening, handleFileSelect, clearImage, toggleListening, fileInputRef } = useChatInput();

  // -------------------------------------------------------------------
  // ⚙️ CORE LOGIC + ADMIN FEATURE
  // -------------------------------------------------------------------
  
  // ฟังก์ชันเช็คว่าเป็นคำสั่ง Admin หรือไม่
  const handleAdminCommand = async (text) => {
    // สมมติว่า user มี field role (เช่น 'admin')
    if (user?.role !== 'admin') return false; 

    // ตัวอย่างคำสั่ง: /addmovie Avengers
    if (text.startsWith('/addmovie')) {
       const movieName = text.replace('/addmovie', '').trim();
       return { 
         reply: `🛠️ [Admin Mode]: กำลังดำเนินการเพิ่มหนังเรื่อง "${movieName}" เข้าสู่ระบบ... (Feature นี้กำลังพัฒนา)` 
       };
    }
    
    // ตัวอย่างคำสั่ง: /checkstatus
    if (text === '/checkstatus') {
       return { reply: `🛠️ [System]: Server Online, Database Connected.` };
    }

    return false; // ไม่ใช่คำสั่ง Admin
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Main Send Function
  const handleSendMessage = useCallback(async (textOverride = null) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : inputText;
    if (!textToSend?.trim() && !selectedImage) return;

    // 1. UI Update ทันที (Optimistic UI)
    const userMsg = { id: Date.now(), sender: 'user', text: textToSend, image: imagePreview };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    clearImage();
    setIsLoading(true);

    try {
      // 2. ตรวจสอบ Admin Command ก่อนส่งไปหา Bot ปกติ
      const adminResponse = await handleAdminCommand(textToSend);
      
      if (adminResponse) {
         // ถ้าเป็นคำสั่ง Admin ให้ตอบกลับทันทีโดยไม่ต้องเรียก API Bot
         setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: adminResponse.reply }]);
            setIsLoading(false);
         }, 500);
         return;
      }

      // 3. ถ้าไม่ใช่คำสั่ง Admin -> ส่งหา Bot ปกติ
      let base64Image = selectedImage ? await convertToBase64(selectedImage) : null;
      const data = await sendMessageToBot(textToSend, base64Image);

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: data.reply }]);

    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg = (error?.code === "INVALID_TOKEN") 
        ? '⚠️ Session หมดอายุ กรุณา Login ใหม่' 
        : '⚠️ ขออภัย ระบบเกิดข้อผิดพลาด';
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, selectedImage, imagePreview, user, setMessages, setInputText, setIsLoading]); // Dependency array

  // 2. เรียกใช้ Hook Auto-Reload (ต้องอยู่หลัง handleSendMessage เพราะต้องใช้ function นี้)
  const isReloading = useInitialMessageProcessor(location, user, handleSendMessage);

  const handleLogout = () => {
    if (window.confirm("ยืนยันการออกจากระบบ?")) {
      logout();
      navigate('/login');
    }
  };

  const handleClearChatWrapper = async () => {
    const success = await clearChat();
    if (success) setIsSidebarOpen(false);
  };

  // -------------------------------------------------------------------
  // 🖼️ RENDER UI (สะอาดขึ้น แยกเงื่อนไขชัดเจน)
  // -------------------------------------------------------------------

  // Loading Screen (Full Page)
  if (isReloading) {
    return (
      <div className="chatbot-container full-loader">
        <Loader2 className="spin-animation" size={64} color="#e50914" />
        <p>กำลังประมวลผลคำขอ...</p>
        <small>กรุณารอสักครู่ ระบบกำลังรีเฟรชข้อมูล</small>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      {/* --- Sidebar --- */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`chat-sidebar ${isSidebarOpen ? 'active' : ''}`}>
        <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
        <div className="user-profile">
          <div className="avatar-circle">{user?.name ? user.name.charAt(0).toUpperCase() : <User />}</div>
          <div className="user-info">
            <h3>{user?.name || "Guest User"} {user?.role === 'admin' && <span className="admin-badge">(Admin)</span>}</h3>
            <p>{user?.email || "กรุณาเข้าสู่ระบบ"}</p>
          </div>
        </div>
        <div className="divider"></div>
        <nav className="quick-menu">
            <div className="menu-header">QUICK MENU</div>
            <ul>
              <li onClick={() => navigate('/')}><Home size={18} /> หน้าแรก</li>
              <li onClick={() => navigate('/movies')}><Film size={18} /> ภาพยนตร์</li>
              <li onClick={handleClearChatWrapper} style={{ color: '#ff6b6b' }}><Trash2 size={18} /> ล้างประวัติ</li>
              <li onClick={handleLogout} className="menu-logout"><LogOut size={18} /> ออกจากระบบ</li>
            </ul>
        </nav>
      </aside>

      {/* --- Main Chat Window --- */}
      <main className="chat-window">
        <header className="chat-header">
          <div className="header-left">
            <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}><Menu size={24} color="white" /></button>
            <div className="bot-avatar-header"><Bot size={24} color="white" /></div>
            <div className="header-text">
              <h2>CineBot Assistant</h2>
              <p>เพื่อนคู่คิดเรื่องหนัง</p>
            </div>
          </div>
        </header>

        <div className="messages-area">
          {messages.length <= 1 ? (
            <div className="hero-wrapper">
              <HeroSection
                handleSendMessage={handleSendMessage}
                inputText={inputText}
                setInputText={setInputText}
                toggleListening={toggleListening}
                isListening={isListening}
                isLoading={isLoading}
                handleKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              />
            </div>
          ) : (
            <>
              <div className="date-divider"><span>ประวัติการสนทนา</span></div>
              {messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.sender}`}>
                  {msg.sender === 'bot' && <div className="bot-icon-chat"><Bot size={20} /></div>}
                  <div className="message-content-wrapper">
                    {msg.image && <img src={msg.image} alt="uploaded" className="chat-image-bubble" />}
                    {msg.text && (
                      <div className={`message-bubble ${msg.text.startsWith('🛠️') ? 'admin-msg' : ''}`}>
                        {msg.text.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message-row bot">
                  <div className="bot-icon-chat"><Bot size={20} /></div>
                  <div className="message-bubble typing-indicator"><span>.</span><span>.</span><span>.</span></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* --- Footer --- */}
        {messages.length > 1 && (
          <div className="chat-footer">
            {imagePreview && (
              <div className="image-preview-container">
                <img src={imagePreview} alt="preview" />
                <button className="remove-image-btn" onClick={clearImage}><X size={14} /></button>
              </div>
            )}
            
            <div className="shortcut-container">
               {/* ถ้าเป็น Admin ให้โชว์ Shortcut สำหรับแอดหนัง */}
               {user?.role === 'admin' ? (
                  <button className="shortcut-chip admin-chip" onClick={() => setInputText('/addmovie ')}>+ เพิ่มหนัง</button>
               ) : null}
               {["📽️ หนังเข้าใหม่", "📍 โรงหนังใกล้ฉัน", "🎟️ วิธีจองตั๋ว"].map((text, idx) => (
                  <button key={idx} className="shortcut-chip" onClick={() => handleSendMessage(text)} disabled={isLoading}>{text}</button>
               ))}
            </div>

            <div className="input-container">
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />
              <button className="attach-btn" onClick={() => fileInputRef.current.click()}><Paperclip size={20} /></button>
              
              <input
                type="text"
                placeholder={isListening ? "กำลังฟัง..." : (user?.role === 'admin' ? "พิมพ์ /addmovie เพื่อเพิ่มหนัง..." : "พิมพ์ข้อความ...")}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                disabled={isLoading}
                className={isListening ? "listening-mode" : ""}
              />

              <div className="input-actions">
                <button className={`action-icon mic ${isListening ? 'active' : ''}`} onClick={toggleListening}><Mic size={20} /></button>
                <button className="send-btn" onClick={() => handleSendMessage()} disabled={isLoading || (!inputText.trim() && !selectedImage)}><Send size={18} /></button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatBotPage;