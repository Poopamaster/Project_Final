import React from 'react';
import { Mic, Send, ThumbsUp, Calendar, Heart } from 'lucide-react';
import '../css/HeroSection.css';

const HeroSection = ({ 
  handleSendMessage = () => {}, 
  inputText = '', 
  setInputText = () => {}, 
  toggleListening = () => {}, 
  isListening = false, 
  isLoading = false,
  handleKeyPress = () => {}
}) => {
  
  // ✅ Handle Tag Click - ส่งข้อความสำเร็จรูป
  const handleTagClick = (text) => {
    handleSendMessage(text);
  };

  return (
    <div className="hero-container">
      <h1 className="hero-title">
        จองตั๋วหนังได้ง่ายขึ้น เพียงบอกชื่อหนังที่อยากดู
      </h1>
      <p className="hero-subtitle">
        ระบบอัจฉริยะจะจัดการทุกอย่างให้คุณ ตั้งแต่เลือกรอบ ไปจนถึงเลือกที่นั่ง!
      </p>

      <div className="search-wrapper">
        <input
          type="text"
          placeholder={isListening ? "กำลังฟัง..." : "เริ่มจองง่าย ๆ เพียงพิมพ์ว่า 'อยากดู Inside Out ที่ใกล้ฉัน'"}
          className="search-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
        />
        <div className="search-actions">
          <button 
            className={`mic-btn ${isListening ? 'active' : ''}`}
            onClick={toggleListening}
            disabled={isLoading}
            type="button"
          >
            <Mic size={24} />
          </button>
          <button 
            className="send-btn"
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputText?.trim()}
            type="button"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      <div className="tags-container">
        <Tag 
          icon={<ThumbsUp size={16} color="#EAB308" />} 
          text="แนะนำหนังใหม่" 
          onClick={() => handleTagClick("แนะนำหนังใหม่")}
          disabled={isLoading}
        />
        <Tag 
          icon={<Calendar size={16} color="#22C55E" />} 
          text="รอบฉายวันนี้" 
          onClick={() => handleTagClick("รอบฉายวันนี้")}
          disabled={isLoading}
        />
        <Tag 
          icon={<Heart size={16} color="#F472B6" />} 
          text="หนังโรแมนติก" 
          onClick={() => handleTagClick("หนังโรแมนติก")}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

const Tag = ({ icon, text, onClick, disabled }) => (
  <button 
    className="tag-btn" 
    onClick={onClick}
    disabled={disabled}
    type="button"
  >
    {icon}
    <span>{text}</span>
  </button>
);

export default HeroSection;