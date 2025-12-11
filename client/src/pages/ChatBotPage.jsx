import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mic, Send, Bot, Film, Home, User, Trash2, Paperclip, X, Menu, LogOut, Loader2
} from 'lucide-react';

import { AuthContext } from '../App';
import { sendMessageToBot, getChatHistory, clearChatHistory } from '../api/chatbotApi';
import HeroSection from '../components/HeroSection';
import '../css/ChatBotPage.css';

const ChatBotPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // ✅ STATE ใหม่: เอาไว้โชว์ Loading ก่อน Reload
  const [isReloading, setIsReloading] = useState(false);
  
  const hasInitialMessageSent = useRef(false);

  const shortcuts = ["📽️ หนังเข้าใหม่", "📍 โรงหนังใกล้ฉัน", "🎟️ วิธีจองตั๋ว"];

  // ✅ EFFECT 1: Load Chat History (เหมือนเดิม)
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const history = await getChatHistory();
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          setMessages([
            {
              id: 1,
              sender: 'bot',
              text: `สวัสดีครับคุณ ${user?.name || 'ลูกค้า'} ผม CineBot ยินดีให้บริการครับ! 🎬`
            }
          ]);
        }
      } catch (error) {
        console.error("Failed to load chat history", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  // ✅ EFFECT 2: ส่งข้อความ -> โชว์ Loading -> แล้ว Reload
  useEffect(() => {
    const initialMessage = location.state?.initialMessage;

    if (initialMessage && user && !hasInitialMessageSent.current) {
      hasInitialMessageSent.current = true;
      
      // 1. เปิดหน้าจอ Loading ค้างไว้เลย
      setIsReloading(true);

      // 2. เรียกฟังก์ชันส่งข้อความ
      handleSendMessage(initialMessage).then(() => {
        
        // 3. เคลียร์ State เพื่อไม่ให้ Loop ตอน Reload กลับมา
        window.history.replaceState({}, document.title);

        // 4. หน่วงเวลานิดนึงให้ UI ไม่กระตุก แล้ว Reload
        setTimeout(() => {
           window.location.reload();
        }, 1000); // รอ 1 วินาทีให้ User เห็นว่าโหลดเสร็จ
      });
    }
  }, [location.state, user]);

  // ✅ EFFECT 3: Auto Scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = () => {
    if (window.confirm("ยืนยันการออกจากระบบ?")) {
      logout();
      navigate('/login');
    }
  };

  const handleClearChat = async () => {
    if (window.confirm("ต้องการลบประวัติการสนทนาทั้งหมด?")) {
      const success = await clearChatHistory();
      if (success) {
        setMessages([{
          id: Date.now(),
          sender: 'bot',
          text: `เริ่มการสนทนาใหม่ครับ คุณ ${user?.name || 'ลูกค้า'} มีอะไรให้ช่วยไหมครับ?`
        }]);
        setIsSidebarOpen(false);
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      window.speechRecognition?.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser ของคุณไม่รองรับฟีเจอร์นี้");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'th-TH';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev ? prev + " " + transcript : transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // ✅ CORE SEND MESSAGE
  const handleSendMessage = async (textOverride = null) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : inputText;

    if (!textToSend?.trim() && !selectedImage) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      image: imagePreview
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    clearImage();
    setIsLoading(true);

    try {
      let base64Image = null;
      if (selectedImage) {
        base64Image = await convertToBase64(selectedImage);
      }

      const data = await sendMessageToBot(textToSend, base64Image);

      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: data.reply }
      ]);

    } catch (error) {
      console.error("Chat Error:", error);

      let errorMsg = '⚠️ ขออภัย ระบบเกิดข้อผิดพลาด กรุณาลองใหม่ครับ';
      if (error?.error === "jwt malformed" || error?.code === "INVALID_TOKEN") {
        errorMsg = '⚠️ Session หมดอายุ หรือ Token ไม่ถูกต้อง กรุณา Login ใหม่';
      }

      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: errorMsg }
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

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar Code (เหมือนเดิม) */}
      <aside className={`chat-sidebar ${isSidebarOpen ? 'active' : ''}`}>
        <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
          <X size={24} />
        </button>
        <div className="user-profile">
          <div className="avatar-circle">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User />}
          </div>
          <div className="user-info">
            <h3>{user?.name || "Guest User"}</h3>
            <p>{user?.email || "กรุณาเข้าสู่ระบบ"}</p>
          </div>
        </div>
        <div className="divider"></div>
        <nav className="quick-menu">
          <div className="menu-header">QUICK MENU</div>
          <ul>
            <li onClick={() => navigate('/')}><Home size={18} /> หน้าแรก</li>
            <li onClick={() => navigate('/movies')}><Film size={18} /> ภาพยนตร์</li>
            <li onClick={handleClearChat} style={{ color: '#ff6b6b', cursor: 'pointer' }}>
              <Trash2 size={18} /> ล้างประวัติ
            </li>
            <li onClick={handleLogout} style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '1rem' }}>
              <LogOut size={18} /> ออกจากระบบ
            </li>
          </ul>
        </nav>
      </aside>

      <main className="chat-window">
        <header className="chat-header">
          <div className="header-left">
            <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} color="white" />
            </button>
            <div className="bot-avatar-header"><Bot size={24} color="white" /></div>
            <div className="header-text">
              <h2>CineBot Assistant</h2>
              <p>เพื่อนคู่คิดเรื่องหนัง</p>
            </div>
          </div>
        </header>

        {/* ✅ UI ส่วนแสดงผลข้อความ */}
        <div className="messages-area" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* 🔥 ส่วนที่แก้: เช็คว่าถ้ากำลังจะ Reload (isReloading) ให้โชว์ Loading ตัวใหญ่แทน */}
          {isReloading ? (
             <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#141414', // สีพื้นหลังเดียวกับธีม
                zIndex: 99
            }}>
              <Loader2 className="spin-animation" size={64} color="#e50914" />
              <p style={{ marginTop: '1.5rem', color: '#fff', fontSize: '1.2rem' }}>กำลังประมวลผลคำขอ...</p>
              <p style={{ color: '#aaa', fontSize: '0.9rem' }}>กรุณารอสักครู่ ระบบกำลังรีเฟรชข้อมูล</p>
            </div>
          ) : (
            <>
                {messages.length <= 1 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HeroSection
                    handleSendMessage={handleSendMessage}
                    inputText={inputText}
                    setInputText={setInputText}
                    toggleListening={toggleListening}
                    isListening={isListening}
                    isLoading={isLoading}
                    handleKeyPress={handleKeyPress}
                    />
                </div>
                ) : (
                <>
                    <div className="date-divider"><span>ประวัติการสนทนา</span></div>
                    {messages.map((msg) => (
                    <div key={msg.id} className={`message-row ${msg.sender}`}>
                        {msg.sender === 'bot' && <div className="bot-icon-chat"><Bot size={20} /></div>}
                        <div className="message-content-wrapper">
                        {msg.image && (
                            <img src={msg.image} alt="uploaded" className="chat-image-bubble" />
                        )}
                        {msg.text && (
                            <div className="message-bubble">
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
            </>
          )}
        </div>

        {/* ซ่อน Footer ถ้ากำลังจะ Reload */}
        {!isReloading && messages.length > 1 && (
            <div className="chat-footer">
            {imagePreview && (
                <div className="image-preview-container">
                <img src={imagePreview} alt="preview" />
                <button className="remove-image-btn" onClick={clearImage}><X size={14} /></button>
                </div>
            )}

            <div className="shortcut-container">
                {shortcuts.map((text, index) => (
                <button key={index} className="shortcut-chip" onClick={() => handleSendMessage(text)} disabled={isLoading}>
                    {text}
                </button>
                ))}
            </div>

            <div className="input-container">
                <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileSelect}
                />

                <button className="attach-btn" onClick={() => fileInputRef.current.click()}>
                <Paperclip size={20} />
                </button>

                <input
                type="text"
                placeholder={isListening ? "กำลังฟัง..." : "พิมพ์ข้อความ..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                className={isListening ? "listening-mode" : ""}
                />

                <div className="input-actions">
                <button className={`action-icon mic ${isListening ? 'active' : ''}`} onClick={toggleListening}>
                    <Mic size={20} />
                </button>
                <button className="send-btn" onClick={() => handleSendMessage()} disabled={isLoading || (!inputText.trim() && !selectedImage)}>
                    <Send size={18} />
                </button>
                </div>
            </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default ChatBotPage;