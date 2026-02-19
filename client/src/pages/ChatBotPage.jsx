// src/pages/ChatBotPage.jsx
import React, { useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Mic, Send, Bot, Trash2, Paperclip, Loader2 } from 'lucide-react';
import { AuthContext } from '../App';
import HeroSection from '../components/HeroSection';
import { useChatHistory, useChatInput, useInitialMessageProcessor } from '../hooks/useChatBotLogic';
import { sendMessageToBot } from '../api/chatbotApi';
import '../css/ChatBotPage.css';

// ✅ Import Registry (ตัวรวม Component เช่น MovieCarousel, SeatSelector)
import { COMPONENT_REGISTRY } from '../components/ChatVisuals';

const ChatBotPage = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const { messages, setMessages, isLoading, setIsLoading, messagesEndRef, clearChat } = useChatHistory(user);
  const { inputText, setInputText, selectedImage, imagePreview, isListening, handleFileSelect, clearImage, toggleListening, fileInputRef } = useChatInput();

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleSendMessage = useCallback(async (textOverride = null) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : inputText;
    if (!textToSend?.trim() && !selectedImage) return;

    // เพิ่มข้อความฝั่ง User
    const userMsg = { id: Date.now(), sender: 'user', text: textToSend, image: imagePreview };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    clearImage();
    setIsLoading(true);

    try {
      let base64Image = selectedImage ? await convertToBase64(selectedImage) : null;
      // ส่งไปหา API
      const data = await sendMessageToBot(textToSend, base64Image);
      // เพิ่มข้อความตอบกลับจาก Bot
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: data.reply }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: '⚠️ ระบบเกิดข้อผิดพลาด' }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, selectedImage, imagePreview, user, setMessages, setInputText, setIsLoading, clearImage]);

  const isReloading = useInitialMessageProcessor(location, user, handleSendMessage);

  // --- 🔥 CORE: ฟังก์ชันแปลงข้อความธรรมดาเป็น Visual UI ---
  const renderMessageContent = (msg) => {
    // 1. ตรวจจับ Tag ::VISUAL:: เฉพาะข้อความจาก Bot
    if (msg.sender === 'bot' && msg.text && msg.text.includes('::VISUAL::')) {
      try {
        const [textPart, jsonPart] = msg.text.split('::VISUAL::');
        const visualData = JSON.parse(jsonPart);
        const VisualComponent = COMPONENT_REGISTRY[visualData.type];

        return (
          <div className="message-content-visual" style={{ width: '100%', maxWidth: '100%' }}>
            {/* แสดงข้อความนำเรื่อง (ถ้ามี) */}
            {textPart && <div className="message-bubble">{textPart}</div>}

            {/* แสดง Component Visual */}
            {VisualComponent ? (
              <VisualComponent
                data={visualData.data || visualData}
                onAction={handleSendMessage} // ส่งฟังก์ชันตอบกลับให้ component กดปุ่มแล้วส่งข้อความได้เลย
              />
            ) : (
              <div className="message-bubble text-red-400">⚠️ ไม่รองรับรูปแบบ {visualData.type}</div>
            )}
          </div>
        );
      } catch (e) {
        console.error("Visual Parse Error", e);
        // กรณี Parse พัง ให้แสดง text ธรรมดา
        return <div className="message-bubble">{msg.text}</div>;
      }
    }

    // 2. ข้อความปกติ
    return (
      <div className={`message-bubble ${msg.text.startsWith('🛠️') ? 'admin-msg' : ''}`}>
        {msg.text.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
      </div>
    );
  };

  const customSidebarItem = (
    <div className="nav-item" onClick={clearChat} style={{ cursor: 'pointer', color: '#ef4444' }}>
      <Trash2 size={20} /> <span>ล้างประวัติ</span>
    </div>
  );

  if (isReloading) return <div className="chatbot-container full-loader"><Loader2 className="animate-spin" /></div>;

  return (
    <div className={`chatbot-main-wrapper ${isEmbedded ? 'is-embedded' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isEmbedded ? '100%' : '100vh',
        width: '100%',
        overflow: 'hidden',
        background: isEmbedded ? 'transparent' : '#0f172a'
      }}>

      {!isEmbedded && <Navbar sidebarContent={customSidebarItem} />}

      <div className="chatbot-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <main className="chat-window" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* แสดง Header เฉพาะหน้า User ปกติ */}
          {!isEmbedded && (
            <header className="chat-header">
              <div className="header-left">
                <div className="bot-avatar-header"><Bot size={24} color="white" /></div>
                <div className="header-text"><h2>CineBot</h2><p>ผู้ช่วยจองตั๋วหนัง</p></div>
              </div>
            </header>
          )}

          <div className="messages-area" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* 🛠️ แก้ไขตรงนี้: ถ้าเป็นหน้า Admin (isEmbedded) ไม่ต้องโชว์ HeroSection ขนาดใหญ่ */}
            {messages.length <= 0 && !isEmbedded ? (
              <div className="hero-wrapper">
                <HeroSection
                  handleSendMessage={handleSendMessage}
                  inputText={inputText}
                  setInputText={setInputText}
                  toggleListening={toggleListening}
                  isListening={isListening}
                  isLoading={isLoading}
                />
              </div>
            ) : (
              <>
                {messages.length === 0 && isEmbedded && (
                  <div className="empty-chat-hint" style={{ textAlign: 'center', marginTop: '100px', color: '#64748b' }}>
                    <Bot size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                    <p>สวัสดีครับ Admin มีอะไรให้ CineBot ช่วยจัดการระบบไหมครับ?</p>
                  </div>
                )}

                {messages.length > 0 && <div className="date-divider"><span>การสนทนาในวันนี้</span></div>}

                {messages.map((msg) => (
                  <div key={msg.id} className={`message-row ${msg.sender}`}>
                    {msg.sender === 'bot' && <div className="bot-icon-chat"><Bot size={20} /></div>}
                    <div className="message-content-wrapper">
                      {msg.image && <img src={msg.image} alt="uploaded" className="chat-image-bubble" />}
                      {renderMessageContent(msg)}
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

          {/* ส่วนท้าย: ช่องกรอกข้อความ */}
          <div className="chat-footer" style={{ padding: '20px', background: isEmbedded ? 'rgba(30, 41, 59, 0.5)' : 'transparent' }}>
            <div className="shortcut-container">
              {user?.role === 'admin' && (
                <button className="shortcut-chip admin-chip" onClick={() => setInputText('/addmovie ')}>
                  ⚡ คำสั่ง Admin
                </button>
              )}
              {["📽️ หนังเข้าใหม่", "📍 โรงหนังใกล้ฉัน"].map((text, idx) => (
                <button key={idx} className="shortcut-chip" onClick={() => handleSendMessage(text)} disabled={isLoading}>{text}</button>
              ))}
            </div>

            <div className="input-container" style={{ background: '#1e293b', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />
              <button className="attach-btn" onClick={() => fileInputRef.current.click()}><Paperclip size={20} /></button>

              <input
                type="text"
                placeholder="พิมพ์คำสั่งหรือข้อความ..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                disabled={isLoading}
                className={isListening ? "listening-mode" : ""}
              />

              <div className="input-actions">
                <button className={`action-icon mic ${isListening ? 'active' : ''}`} onClick={toggleListening}><Mic size={20} /></button>
                <button className="send-btn" onClick={() => handleSendMessage()} disabled={isLoading || (!inputText.trim() && !selectedImage)}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatBotPage;