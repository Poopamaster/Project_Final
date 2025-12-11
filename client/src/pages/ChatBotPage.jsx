import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
// ✅ 1. เพิ่ม import Menu (Hamburger)
import { Mic, Send, Bot, Film, Ticket, Home, History, User, Trash2, Paperclip, X, Menu } from 'lucide-react'; 
import { AuthContext } from '../App'; 
import { sendMessageToBot, getChatHistory, clearChatHistory } from '../api/chatbotApi'; 
import '../css/ChatBotPage.css';

const ChatBotPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); 
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null); 

  // ✅ 2. เพิ่ม State ควบคุม Sidebar บนมือถือ
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const shortcuts = [
    "📽️ หนังเข้าใหม่",
    "🔥 แนะนำหนัง Action",
    "🍿 เช็ครอบหนัง Avatar",
    "📍 โรงหนังใกล้ฉัน",
    "🎟️ วิธีจองตั๋ว"
  ];

  const userChatKey = user ? `chatHistory_${user._id || user.email}` : null;

  // --- STATE ---
  const [messages, setMessages] = useState([]); 
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // --- EFFECT: Load History ---
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
                      text: `สวัสดีครับคุณ ${user?.name || 'ลูกค้า'}, ผม CineBot ยินดีให้บริการครับ! วันนี้อยากดูหนังแนวไหน หรือเช็ครอบเรื่องอะไร บอกผมได้เลยนะครับ 🎬` 
                    }
                ]);
            }
        } catch (error) {
            console.error("Failed to load chat history");
        } finally {
            setIsLoading(false);
        }
    };
    fetchHistory();
  }, [user]); 

  // --- AUTO SCROLL ---
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- CLEAR HISTORY ---
  const handleClearChat = async () => {
    if(window.confirm("ต้องการลบประวัติการสนทนาทั้งหมดแบบถาวร?")) {
        const success = await clearChatHistory();
        if (success) {
            setMessages([{ 
                id: Date.now(), 
                sender: 'bot', 
                text: `เริ่มการสนทนาใหม่ครับ คุณ ${user?.name || 'ลูกค้า'} มีอะไรให้ช่วยไหมครับ?` 
            }]);
            setIsSidebarOpen(false); // ปิดเมนูหลังกด
        }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
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
      setInputText(prev => prev + " " + transcript); 
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleSendMessage = async (textOverride = null) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : inputText;
    if (!textToSend.trim() && !selectedImage) return;

    const imageToSend = selectedImage; 
    const previewToSend = imagePreview;

    const userMsg = { 
      id: Date.now(), 
      sender: 'user', 
      text: textToSend,
      image: previewToSend 
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText(''); 
    clearImage(); 
    setIsLoading(true);

    try {
      let base64Image = null;
      if (imageToSend) {
        base64Image = await convertToBase64(imageToSend);
      }
      
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

  return (
    <div className="chatbot-container">
      
      {/* ✅ 3. Sidebar Backdrop (พื้นหลังดำจางๆ เวลาเปิดเมนูบนมือถือ) */}
      {isSidebarOpen && (
        <div 
            className="sidebar-overlay" 
            onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* ✅ 4. Sidebar: เพิ่ม Class active เมื่อเปิดเมนู */}
      <aside className={`chat-sidebar ${isSidebarOpen ? 'active' : ''}`}>
        {/* ปุ่มปิดเมนู (เฉพาะมือถือ) */}
        <button 
            className="close-sidebar-btn" 
            onClick={() => setIsSidebarOpen(false)}
        >
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
             <li onClick={handleClearChat} style={{color: '#ff6b6b', cursor: 'pointer'}}><Trash2 size={18} /> ล้างประวัติ</li>
           </ul>
        </nav>
      </aside>

      <main className="chat-window">
        <header className="chat-header">
           <div className="header-left">
            
            {/* ✅ 5. ปุ่ม Hamburger (แสดงเฉพาะมือถือ) */}
            <button 
                className="hamburger-btn" 
                onClick={() => setIsSidebarOpen(true)}
            >
                <Menu size={24} color="white" />
            </button>

            <div className="bot-avatar-header"><Bot size={24} color="white" /></div>
            <div className="header-text">
              <h2>CineBot Assistant (AI)</h2>
              <p>ถาม-ตอบ รอบหนัง จองตั๋ว 💬</p>
            </div>
          </div>
        </header>

        <div className="messages-area">
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
          {imagePreview && (
            <div className="image-preview-container">
                <img src={imagePreview} alt="preview" />
                <button className="remove-image-btn" onClick={clearImage}>
                    <X size={14} />
                </button>
            </div>
          )}

          <div className="shortcut-container">
             {shortcuts.map((text, index) => (
                <button 
                    key={index} 
                    className="shortcut-chip"
                    onClick={() => handleSendMessage(text)}
                    disabled={isLoading}
                >
                    {text}
                </button>
             ))}
          </div>

          <div className="input-container">
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{display: 'none'}} 
                accept="image/*"
                onChange={handleFileSelect}
            />

            <button className="attach-btn" onClick={() => fileInputRef.current.click()}>
                <Paperclip size={20} />
            </button>

            <input 
              type="text" 
              placeholder={isListening ? "กำลังฟัง..." : "พิมพ์ข้อความ หรือเลือกคำสั่งด่วน..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              className={isListening ? "listening-mode" : ""}
            />
            
            <div className="input-actions">
              <button className={`action-icon mic ${isListening ? 'active' : ''}`} onClick={toggleListening}><Mic size={20} /></button>
              <button className="send-btn" onClick={() => handleSendMessage()} disabled={isLoading || (!inputText.trim() && !selectedImage)}><Send size={18} /></button>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default ChatBotPage;