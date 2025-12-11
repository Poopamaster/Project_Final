import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Send, Bot, Film, Ticket, Home, History, User, Trash2, Paperclip, X } from 'lucide-react'; 
import { AuthContext } from '../App'; 
import { sendMessageToBot } from '../api/chatbotApi'; 
import '../css/ChatBotPage.css';

const ChatBotPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); 
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null); // ✅ Ref สำหรับปุ่มเลือกไฟล์

  // --- STATE ---
  const [messages, setMessages] = useState(() => {
    const savedChats = localStorage.getItem('chatHistory');
    return savedChats ? JSON.parse(savedChats) : [
      { 
        id: 1, 
        sender: 'bot', 
        text: `สวัสดีครับคุณ ${user?.name || 'ลูกค้า'}, ผม CineBot ยินดีให้บริการครับ! วันนี้อยากดูหนังแนวไหน หรือเช็ครอบเรื่องอะไร บอกผมได้เลยนะครับ 🎬` 
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // ✅ State สำหรับรูปภาพ
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // ✅ State สำหรับไมโครโฟน
  const [isListening, setIsListening] = useState(false);

  // --- EFFECT: Auto Scroll & Save History ---
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- FUNCTION: จัดการรูปภาพ ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // สร้าง URL สำหรับ Preview รูป
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // แปลงไฟล์รูปเป็น Base64 (เพื่อส่งให้ Backend)
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result); // ผลลัพธ์จะเป็น string base64
      reader.onerror = error => reject(error);
    });
  };

  // --- FUNCTION: สั่งงานด้วยเสียง (Speech to Text) ---
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      window.speechRecognition?.stop();
      return;
    }

    // ตรวจสอบ Browser Support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser ของคุณไม่รองรับฟีเจอร์นี้ (แนะนำให้ใช้ Chrome)");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'th-TH'; // ตั้งค่าภาษาไทย
    recognition.interimResults = false; // เอาผลลัพธ์สุดท้ายทีเดียว

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev + " " + transcript); // ต่อข้อความเดิม
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech Error:", event.error);
      setIsListening(false);
    };

    recognition.start();
  };


  // --- FUNCTION: ส่งข้อความ ---
  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const textToSend = inputText;
    const imageToSend = selectedImage; // เก็บค่าไว้ก่อนเคลียร์ state
    const previewToSend = imagePreview;

    // 1. สร้าง Message Object ของ User
    const userMsg = { 
      id: Date.now(), 
      sender: 'user', 
      text: textToSend,
      image: previewToSend // โชว์รูปในแชทฝั่งเราด้วย
    };

    // 2. อัปเดต UI ทันที
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    clearImage(); // ล้างรูปออกจากช่องพิมพ์
    setIsLoading(true);

    try {
      // 3. เตรียมข้อมูลส่ง API
      let base64Image = null;
      if (imageToSend) {
        base64Image = await convertToBase64(imageToSend);
      }

      // หมายเหตุ: ต้องแก้ API sendMessageToBot ให้รับ image ด้วย
      const data = await sendMessageToBot(textToSend, base64Image);

      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: data.reply }
      ]);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: '⚠️ ระบบขัดข้อง กรุณาลองใหม่ครับ' }
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

  const clearChat = () => {
    if(window.confirm("ลบประวัติ?")) {
        setMessages([]);
        localStorage.removeItem('chatHistory');
    }
  };

  return (
    <div className="chatbot-container">
      
      {/* SIDEBAR (คงเดิม) */}
      <aside className="chat-sidebar">
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
           {/* ... เมนูเหมือนเดิม ... */}
           <div className="menu-header">QUICK MENU</div>
           <ul>
             <li onClick={() => navigate('/')}><Home size={18} /> หน้าแรก</li>
             <li onClick={clearChat} style={{color: '#ff6b6b', cursor: 'pointer'}}><Trash2 size={18} /> ล้างประวัติ</li>
           </ul>
        </nav>
      </aside>

      {/* CHAT WINDOW */}
      <main className="chat-window">
        <header className="chat-header">
           <div className="header-left">
            <div className="bot-avatar-header"><Bot size={24} color="white" /></div>
            <div className="header-text">
              <h2>CineBot Assistant (AI)</h2>
              <p>รองรับรูปภาพและสั่งงานด้วยเสียง 📸🎙️</p>
            </div>
          </div>
        </header>

        <div className="messages-area">
          <div className="date-divider"><span>วันนี้</span></div>

          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>
              {msg.sender === 'bot' && <div className="bot-icon-chat"><Bot size={20} /></div>}
              
              <div className="message-content-wrapper">
                {/* ✅ ถ้ามีรูป ให้แสดงรูปด้วย */}
                {msg.image && (
                    <img src={msg.image} alt="uploaded" className="chat-image-bubble" />
                )}
                
                {/* แสดงข้อความ ถ้ามี */}
                {msg.text && (
                    <div className="message-bubble">
                        {msg.text.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}
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
        </div>

        <div className="chat-footer">
          {/* ✅ ส่วน Preview รูปภาพก่อนส่ง */}
          {imagePreview && (
            <div className="image-preview-container">
                <img src={imagePreview} alt="preview" />
                <button className="remove-image-btn" onClick={clearImage}>
                    <X size={14} />
                </button>
            </div>
          )}

          <div className="input-container">
            {/* Input เลือกไฟล์ (ซ่อนไว้) */}
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{display: 'none'}} 
                accept="image/*"
                onChange={handleFileSelect}
            />

            {/* ปุ่มแนบรูป */}
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
              {/* ปุ่มไมโครโฟน */}
              <button 
                className={`action-icon mic ${isListening ? 'active' : ''}`} 
                onClick={toggleListening}
              >
                 <Mic size={20} />
              </button>

              <button className="send-btn" onClick={handleSendMessage} disabled={isLoading || (!inputText.trim() && !selectedImage)}>
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