// src/pages/ChatBotPage.jsx
import React, { useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Mic, Send, Bot, Trash2, Paperclip, Loader2, X } from 'lucide-react'; // เพิ่ม X สำหรับลบ Preview
import { AuthContext } from '../App';
import HeroSection from '../components/HeroSection';
import { useChatHistory, useChatInput, useInitialMessageProcessor } from '../hooks/useChatBotLogic';
import { sendMessageToBot } from '../api/chatbotApi';
import '../css/ChatBotPage.css';

import { COMPONENT_REGISTRY } from '../components/ChatVisuals';

const ChatBotPage = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // ✅ Hook 1: ดึง State พื้นฐาน
  const { messages, setMessages, isLoading, setIsLoading, messagesEndRef, clearChat } = useChatHistory(user);

  // ✅ Hook 2: ส่ง Setter เข้าไปเพื่อให้ Hook จัดการอัปโหลด Excel เองได้ภายในตัว
  const {
    inputText, setInputText, selectedImage, imagePreview, isListening,
    handleFileSelect, clearImage, toggleListening, fileInputRef
  } = useChatInput(setMessages, setIsLoading);

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

    // เพิ่มข้อความฝั่ง User (รวมรูปภาพถ้ามี)
    const userMsg = { id: Date.now(), sender: 'user', text: textToSend, image: imagePreview };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    clearImage(); // ล้าง Preview รูปหลังส่ง
    setIsLoading(true);

    try {
      let base64Image = selectedImage ? await convertToBase64(selectedImage) : null;
      const data = await sendMessageToBot(textToSend, base64Image);

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply
      }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: '⚠️ ระบบเกิดข้อผิดพลาดในการส่งข้อความ'
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, selectedImage, imagePreview, setMessages, setInputText, setIsLoading, clearImage]);

  const isReloading = useInitialMessageProcessor(location, user, handleSendMessage);

  const formatDisplayText = (text) => {
    if (!text || typeof text !== 'string') return text;

    let cleanText = text;

    // 1. ซ่อนก้อน JSON จากระบบ Import Excel
    if (cleanText.includes("ข้อมูลที่ต้องการบันทึกคือ:")) {
      cleanText = cleanText.split("ข้อมูลที่ต้องการบันทึกคือ:")[0].trim() + " 📄 [แนบไฟล์ข้อมูลสำเร็จ]";
      return cleanText;
    }

    // 2. [เพิ่มใหม่] ลบประโยคที่ AI พยายามบอกว่าจะใช้เครื่องมือ/Tool อะไร
    // เช่น "กรุณาใช้ Tool get_showtimes ค้นหา..." หรือ "ฉันจะเรียกใช้..."
    cleanText = cleanText.replace(/(กรุณา)?(ใช้|เรียกใช้)\s*(Tool|เครื่องมือ|คำสั่ง)\s+\w+\s*(เพื่อ)?/gi, '');
    cleanText = cleanText.replace(/กำลังค้นหาโดยใช้วันที่/gi, 'รอบฉายวันที่');

    // 3. ลบ ObjectID และรหัส ID (69b176...) ทั้งแบบมีคำนำหน้าและไม่มี
    // ดักจับ: (รหัสหนัง: 69b...), (ID: 69b...), (69b...)
    cleanText = cleanText.replace(/\w*ID?s?[:：]\s*[a-f\d]{24}/gi, '');
    cleanText = cleanText.replace(/รหัส(หนัง|สาขา|รอบฉาย)[:：]\s*[a-f\d]{24}/gi, '');
    cleanText = cleanText.replace(/[a-f\d]{24}/gi, ''); // ลบ Hex ID 24 หลักเปล่าๆ

    // 4. ลบวงเล็บที่ว่างเปล่า หรือเหลือแค่เศษเครื่องหมายข้างใน ( , )
    cleanText = cleanText.replace(/\(\s*[,，]?\s*\)/g, '');
    cleanText = cleanText.replace(/\(\s*[:：]?\s*\)/g, '');

    // 5. กวาดล้างเศษเครื่องหมายจุลภาคที่หลงเหลือ
    cleanText = cleanText.replace(/,\s*\)/g, ')');
    cleanText = cleanText.replace(/\(\s*,/g, '(');
    cleanText = cleanText.replace(/,\s*,/g, ',');
    cleanText = cleanText.replace(/,\s*ราคารวม/gi, ' ราคารวม');

    // 6. ลบช่องว่างซ้ำซ้อน และจุลภาคที่ค้างหัว/ท้ายประโยค
    cleanText = cleanText.replace(/^[\s,，.:：]+|[\s,，.:：]+$/g, '');
    cleanText = cleanText.replace(/\s\s+/g, ' ').trim();

    // ถ้าลบไปลบมาแล้วข้อความว่างเปล่า ให้ส่งค่าว่างกลับไป (Frontend จะได้ไม่โชว์ Bubble เปล่า)
    return cleanText || "";
  };

  const renderMessageContent = (msg, isLatest) => {
    let actualText = msg.text || '';

    // 🛡️ 1. ดักจับกรณี Backend ส่งมาเป็นก้อน JSON ของ MCP Tool
    if (typeof actualText === 'string' && actualText.startsWith('{"content"')) {
      try {
        const parsedMcp = JSON.parse(actualText);
        if (parsedMcp.content && parsedMcp.content[0] && parsedMcp.content[0].text) {
          actualText = parsedMcp.content[0].text;
        }
      } catch (e) {
        console.warn("MCP Unwrapping failed", e);
      }
    }

    // 2. เริ่มหั่น ::VISUAL:: ตามปกติ
    if (msg.sender === 'bot' && actualText.includes('::VISUAL::')) {
      try {
        const [textPart, rawJsonPart] = actualText.split('::VISUAL::');

        const jsonStartIndex = rawJsonPart.indexOf('{');
        const jsonEndIndex = rawJsonPart.lastIndexOf('}');

        if (jsonStartIndex === -1 || jsonEndIndex === -1) {
          throw new Error("หาโครงสร้าง JSON ไม่เจอ");
        }

        const cleanJson = rawJsonPart.substring(jsonStartIndex, jsonEndIndex + 1);
        const trailingText = rawJsonPart.substring(jsonEndIndex + 1).trim();

        const visualData = JSON.parse(cleanJson);
        const VisualComponent = COMPONENT_REGISTRY[visualData.type];

        return (
          <div className="message-content-visual" style={{ width: '100%' }}>
            {/* ✨ กรองข้อความส่วนหัวของ Visual */}
            {textPart && <div className="message-bubble">{formatDisplayText(textPart)}</div>}

            {VisualComponent ? (
              <VisualComponent
                data={visualData.data ? visualData.data : visualData}
                onAction={handleSendMessage}
                isLatest={isLatest}
                messages={messages}
              />
            ) : (
              <div className="message-bubble text-red-400">⚠️ ไม่รองรับรูปแบบ {visualData.type}</div>
            )}

            {/* ✨ กรองข้อความส่วนท้ายของ Visual */}
            {trailingText && <div className="message-bubble" style={{ marginTop: '10px' }}>{formatDisplayText(trailingText)}</div>}
          </div>
        );
      } catch (e) {
        console.error("🚨 Visual Parse Error:", e, "\nRaw Text:", actualText);
        return <div className="message-bubble">{formatDisplayText(actualText)}</div>;
      }
    }

    // 3. ถ้าเป็นข้อความธรรมดา (ฝั่ง User หรือ Bot ที่ไม่มี Visual)
    return (
      <div className={`message-bubble ${actualText?.startsWith('🛠️') ? 'admin-msg' : ''}`}>
        {/* ✨ ใช้ formatDisplayText ครอบก่อนแสดงผล */}
        {formatDisplayText(actualText)?.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
      </div>
    );
  };

  if (isReloading) return <div className="chatbot-container full-loader"><Loader2 className="animate-spin" /></div>;

  return (
    <div className={`chatbot-main-wrapper ${isEmbedded ? 'is-embedded' : ''}`}
      style={{
        display: 'flex', flexDirection: 'column',
        height: isEmbedded ? '100%' : '100vh', width: '100%',
        overflow: 'hidden', background: isEmbedded ? 'transparent' : '#0f172a'
      }}>

      {!isEmbedded && <Navbar sidebarContent={<div className="nav-item" onClick={clearChat} style={{ cursor: 'pointer', color: '#ef4444' }}><Trash2 size={20} /> <span>ล้างประวัติ</span></div>} />}

      <div className="chatbot-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <main className="chat-window" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

          {!isEmbedded && (
            <header className="chat-header">
              <div className="header-left">
                <div className="bot-avatar-header"><Bot size={24} color="white" /></div>
                <div className="header-text"><h2>CineBot</h2><p>ผู้ช่วยจองตั๋วหนัง</p></div>
              </div>
            </header>
          )}

          <div className="messages-area" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {messages.length <= 0 && !isEmbedded ? (
              <HeroSection
                handleSendMessage={handleSendMessage}
                inputText={inputText} setInputText={setInputText}
                toggleListening={toggleListening} isListening={isListening} isLoading={isLoading}
              />
            ) : (
              <>
                {messages.length === 0 && isEmbedded && (
                  <div className="empty-chat-hint" style={{ textAlign: 'center', marginTop: '100px', color: '#64748b' }}>
                    <Bot size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                    <p>สวัสดีครับ Admin พร้อมจัดการไฟล์ Excel หรือยังครับ?</p>
                  </div>
                )}
                {messages.length > 0 && <div className="date-divider"><span>การสนทนาในวันนี้</span></div>}
                {messages.map((msg, index) => (
                  <div key={msg.id} className={`message-row ${msg.sender}`}>
                    {msg.sender === 'bot' && <div className="bot-icon-chat"><Bot size={20} /></div>}
                    <div className="message-content-wrapper">
                      {msg.image && <img src={msg.image} alt="uploaded" className="chat-image-bubble" style={{ maxWidth: '200px', borderRadius: '10px', marginBottom: '5px' }} />}

                      {/* 👇 2. ส่งค่า isLatest เข้าไป โดยเช็คว่า index ปัจจุบันคือข้อความสุดท้ายหรือเปล่า */}
                      {renderMessageContent(msg, index === messages.length - 1)}

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

          {/* Input Area */}
          <div className="chat-footer" style={{ padding: '20px', background: isEmbedded ? 'rgba(30, 41, 59, 0.5)' : 'transparent' }}>
            {/* Image Preview ก่อนส่ง */}
            {imagePreview && (
              <div className="image-preview-container" style={{ position: 'relative', width: 'fit-content', marginBottom: '10px' }}>
                <img src={imagePreview} alt="preview" style={{ height: '60px', borderRadius: '8px', border: '2px solid #3b82f6' }} />
                <button onClick={clearImage} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', borderRadius: '50%', padding: '2px', color: 'white' }}><X size={14} /></button>
              </div>
            )}

            <div className="shortcut-container">
              {user?.role === 'admin' && (
                <button className="shortcut-chip admin-chip" onClick={() => setInputText('/addmovie ')}>⚡ คำสั่ง Admin</button>
              )}

              {[
                { label: "📽️ หนังเข้าใหม่", action: "แนะนำหนังเข้าใหม่ให้หน่อย" },
                { label: "📍 โรงหนังใกล้ฉัน", action: "มีโรงหนังสาขาไหนบ้าง" },
                { label: "🔥 รอบฉาย", action: "มีรอบฉายอะไรบ้าง" },
              ].map((item, idx) => (
                <button
                  key={idx}
                  className="shortcut-chip"
                  onClick={() => handleSendMessage(item.action)}
                  disabled={isLoading}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="input-container" style={{ background: '#1e293b', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', padding: '5px 15px' }}>
              {/* ✅ แก้ไข: เพิ่ม .xlsx ใน accept */}
              <input type="file" ref={fileInputRef} hidden accept="image/*,.xlsx" onChange={handleFileSelect} />
              <button className="attach-btn" onClick={() => fileInputRef.current.click()}><Paperclip size={20} /></button>

              <input
                type="text"
                placeholder={user?.role === 'admin' ? "พิมพ์ข้อความหรือแนบไฟล์ Excel..." : "พิมพ์ข้อความ..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                disabled={isLoading}
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '10px', outline: 'none' }}
              />

              <div className="input-actions" style={{ display: 'flex', gap: '10px' }}>
                <button className={`action-icon mic ${isListening ? 'active' : ''}`} onClick={toggleListening} style={{ color: isListening ? '#ef4444' : '#94a3b8' }}><Mic size={20} /></button>
                <button className="send-btn" onClick={() => handleSendMessage()} disabled={isLoading || (!inputText.trim() && !selectedImage)} style={{ color: '#3b82f6' }}>
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