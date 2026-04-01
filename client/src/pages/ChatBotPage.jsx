// src/pages/ChatBotPage.jsx
import React, { useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Mic, Send, Bot, Trash2, Paperclip, Loader2, X } from 'lucide-react';
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

  React.useEffect(() => {
    const handleAdminClearChat = () => {
      clearChat(); // รันฟังก์ชันล้างแชทของหน้าลูก
    };

    // ดักฟัง Event ชื่อ 'trigger-clear-chat'
    window.addEventListener('trigger-clear-chat', handleAdminClearChat);

    // คืนค่าเพื่อลบ Event ออกตอนปิดหน้าเว็บ (กันบัคความจำรั่วไหล)
    return () => window.removeEventListener('trigger-clear-chat', handleAdminClearChat);
  }, [clearChat]);

  // ✅ Hook 2: จัดการ Input และการอัปโหลดไฟล์
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

      // ✨ ดักจับกรณี API ส่ง status 200 แต่แนบ success: false มา (ขึ้นอยู่กับการเขียนฝั่ง API)
      if (data && data.success === false && data.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply
      }]);
    } catch (error) {
      console.error("Chat Error:", error);

      // ✨ สร้างตัวแปรเก็บข้อความ Error เริ่มต้น
      let errorMessage = '⚠️ ระบบเกิดข้อผิดพลาดในการส่งข้อความ';

      // 🛡️ ตรวจสอบ Error จาก Backend (รองรับทั้ง Axios และ Fetch)
      if (error.response && error.response.status === 429) {
        // กรณีใช้ Axios: ดึง message จาก response.data
        errorMessage = `⏳ ${error.response.data.error || "คุณส่งข้อความถี่เกินไป กรุณารอสักครู่ครับ"}`;
      } else if (error.message) {
        // กรณีใช้ Fetch หรือ Backend โยน Error message มาตรงๆ
        if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
          errorMessage = "⏳ คุณส่งข้อความถี่เกินไป กรุณารอสักครู่ครับ";
        } else {
          // ดึงข้อความ Error ที่ถูกส่งมาจาก Data (เช่น error ตัวที่เรา Throw ไว้ด้านบน)
          errorMessage = `⚠️ ${error.message}`;
        }
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: errorMessage // แสดงข้อความ Rate Limit ให้ User เห็น
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

    // 2. ลบประโยคที่ AI พยายามบอกว่าจะใช้เครื่องมือ/Tool อะไร
    cleanText = cleanText.replace(/(กรุณา)?(ใช้|เรียกใช้)\s*(Tool|เครื่องมือ|คำสั่ง)\s+\w+\s*(เพื่อ)?/gi, '');
    cleanText = cleanText.replace(/กำลังค้นหาโดยใช้วันที่/gi, 'รอบฉายวันที่');

    // 3. ลบ ObjectID และรหัส ID ต่างๆ
    cleanText = cleanText.replace(/\w*ID?s?[:：]\s*[a-f\d]{24}/gi, '');
    cleanText = cleanText.replace(/รหัส(หนัง|สาขา|รอบฉาย)[:：]\s*[a-f\d]{24}/gi, '');
    cleanText = cleanText.replace(/[a-f\d]{24}/gi, '');

    // 4. ลบวงเล็บที่ว่างเปล่า หรือเหลือแค่เศษเครื่องหมายข้างใน
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

    // 2. เริ่มหั่น ::VISUAL::
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

        const componentId = visualData.componentId;

        // 💡 แปลง isLatest เป็น isDisabled เพื่อส่งต่อให้ Component ลูก
        const isDisabled = !isLatest;

        return (
          <div className="message-content-visual" style={{ width: '100%' }}>
            {/* ✨ กรองข้อความส่วนหัวของ Visual */}
            {textPart && <div className="message-bubble">{formatDisplayText(textPart)}</div>}

            {VisualComponent ? (
              <VisualComponent
                data={visualData.data ? visualData.data : visualData}
                onAction={handleSendMessage}
                isLatest={isLatest}
                isDisabled={isDisabled} // 👈 ส่งไม้ต่อให้ตัวลูกไปล็อคปุ่ม
                messages={messages}
                componentId={componentId}
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
            <header className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="bot-avatar-header"><Bot size={24} color="white" /></div>
                <div className="header-text">
                  <h2 style={{ margin: 0 }}>CineBot</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>ผู้ช่วยจองตั๋วหนัง</p>
                </div>
              </div>

              {/* ✨ เพิ่มปุ่มลบแชทมุมขวาบน สำหรับ Desktop */}
              <div className="header-right">
                <button
                  onClick={clearChat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(239, 68, 68, 0.1)', // สีแดงจางๆ
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#ef4444',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  title="ล้างประวัติการสนทนา"
                >
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">ล้างแชท</span>
                </button>
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

                {messages.map((msg, index) => {
                  // 💡 เช็คว่าหลังจากข้อความบอทอันนี้ มีการพิมพ์ข้อความของผู้ใช้ตามมาอีกไหม
                  const hasUserRepliedAfter = messages.slice(index + 1).some(m => m.sender === 'user');
                  const isActuallyLatest = !hasUserRepliedAfter;

                  return (
                    <div key={msg.id} className={`message-row ${msg.sender}`}>
                      {msg.sender === 'bot' && <div className="bot-icon-chat"><Bot size={20} /></div>}
                      <div className="message-content-wrapper">
                        {msg.image && <img src={msg.image} alt="uploaded" className="chat-image-bubble" style={{ maxWidth: '200px', borderRadius: '10px', marginBottom: '5px' }} />}

                        {/* 👇 2. ส่งค่า isActuallyLatest เข้าไป */}
                        {renderMessageContent(msg, isActuallyLatest)}

                      </div>
                    </div>
                  );
                })}

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
              {/* ✅ รองรับ Excel และรูปภาพ */}
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