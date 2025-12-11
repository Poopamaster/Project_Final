import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, Send, Bot, Film, Home, User, Trash2, Paperclip, X, Menu, LogOut
} from 'lucide-react';

// Import Context และ API
import { AuthContext } from '../App';
import { sendMessageToBot, getChatHistory, clearChatHistory } from '../api/chatbotApi';

// Import Component และ CSS
import ChatbotInputArea from '../components/HeroSection'; 
import '../css/ChatBotPage.css';

const ChatBotPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- STATE MANAGEMENT ---
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Responsive Sidebar

  // Shortcut สำหรับใช้ใน Chat Footer (หลังจากเริ่มคุยแล้ว)
  const shortcuts = ["📽️ หนังเข้าใหม่", "📍 โรงหนังใกล้ฉัน", "🎟️ วิธีจองตั๋ว"];

  // --- EFFECT: Load Chat History ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const history = await getChatHistory();
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          // ถ้าไม่มีประวัติ ให้ใส่ข้อความต้อนรับ 1 ข้อความ
          // (เพื่อให้ length = 1 ซึ่งจะไปเข้าเงื่อนไขแสดง HeroSection)
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

  // --- EFFECT: Auto Scroll ---
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- HANDLERS ---
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
        // รีเซ็ตเหลือ 1 ข้อความ เพื่อให้กลับไปหน้า HeroSection
        setMessages([{
          id: Date.now(),
          sender: 'bot',
          text: `เริ่มการสนทนาใหม่ครับ คุณ ${user?.name || 'ลูกค้า'} มีอะไรให้ช่วยไหมครับ?`
        }]);
        setIsSidebarOpen(false);
      }
    }
  };

  // จัดการรูปภาพ
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

  // จัดการเสียง (Speech to Text)
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

  // --- CORE SEND MESSAGE LOGIC ---
  const handleSendMessage = async (textOverride = null) => {
    // ถ้า textOverride มีค่า (จากปุ่ม Tag/Shortcut) ให้ใช้ค่านั้น
    // ถ้าไม่มี ให้ใช้จาก inputText ที่พิมพ์
    const textToSend = typeof textOverride === 'string' ? textOverride : inputText;

    // ตรวจสอบว่ามีข้อมูลที่จะส่งไหม
    if (!textToSend?.trim() && !selectedImage) return;

    // เตรียมข้อมูลแสดงผลฝั่ง User ทันที (Optimistic UI)
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      image: imagePreview
    };

    // 🔥 จุดเปลี่ยนสำคัญ: เพิ่มข้อความลง State
    // ถ้าตอนแรก messages.length <= 1 (อยู่หน้า Hero)
    // พอเพิ่มข้อความนี้ messages.length จะ > 1 ทำให้หน้าจอเปลี่ยนเป็น Chat UI ทันที
    setMessages(prev => [...prev, userMsg]);
    
    setInputText('');
    clearImage();
    setIsLoading(true);

    try {
      // แปลงรูปเป็น Base64 ถ้ามี
      let base64Image = null;
      if (selectedImage) {
        base64Image = await convertToBase64(selectedImage);
      }

      // เรียก API
      const data = await sendMessageToBot(textToSend, base64Image);

      // แสดงผลตอบกลับจาก Bot
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: data.reply }
      ]);

    } catch (error) {
      console.error("Chat Error:", error);
      
      // เพิ่ม Logic จัดการ Error ถ้า Token เสีย (เช่น User Google)
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
      handleSendMessage(); // ไม่ส่ง param จะใช้ inputText อัตโนมัติ
    }
  };

  // --- RENDER ---
  return (
    <div className="chatbot-container">

      {/* 1. Sidebar Backdrop (มือถือ) */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* 2. Sidebar Area */}
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
            <li onClick={() => navigate('/')}><Film size={18} /> ภาพยนตร์</li>
            <li onClick={handleClearChat} style={{ color: '#ff6b6b', cursor: 'pointer' }}>
              <Trash2 size={18} /> ล้างประวัติ
            </li>
            <li onClick={handleLogout} style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '1rem' }}>
              <LogOut size={18} /> ออกจากระบบ
            </li>
          </ul>
        </nav>
      </aside>

      {/* 3. Main Chat Window */}
      <main className="chat-window">
        {/* Header */}
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

        {/* --- Area: Messages OR Hero Section --- */}
        <div className="messages-area" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* ✅ CONDITION: ถ้าข้อความ <= 1 (มีแค่ Greeting) แสดง Hero Section */}
          {messages.length <= 1 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChatbotInputArea
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
            // ✅ ELSE: ถ้าเริ่มคุยแล้ว (messages > 1) แสดง Chat Bubble ปกติ
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
        </div>

        {/* ✅ FOOTER: แสดงเฉพาะเมื่อเริ่มคุยแล้ว (messages > 1) */}
        {/* เพราะถ้ายังไม่เริ่มคุย เราใช้ Input ของ HeroSection แทน */}
        {messages.length > 1 && (
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