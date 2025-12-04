import React from 'react';
import { Mic, Send, ThumbsUp, Calendar, Heart } from 'lucide-react';
import '../css/HeroSection.css';

const HeroSection = () => {
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
          placeholder="เริ่มจองง่าย ๆ เพียงพิมพ์ว่า 'อยากดู Inside Out ที่ใกล้ฉัน'"
          className="search-input"
        />
        <div className="search-actions">
          <button className="mic-btn">
            <Mic size={24} />
          </button>
          <button className="send-btn">
            <Send size={20} />
          </button>
        </div>
      </div>

      <div className="tags-container">
        <Tag icon={<ThumbsUp size={16} color="#EAB308" />} text="แนะนำหนังใหม่" />
        <Tag icon={<Calendar size={16} color="#22C55E" />} text="รอบฉายวันนี้" />
        <Tag icon={<Heart size={16} color="#F472B6" />} text="หนังโรแมนติก" />
      </div>
    </div>
  );
};

const Tag = ({ icon, text }) => (
  <button className="tag-btn">
    {icon}
    <span>{text}</span>
  </button>
);

export default HeroSection;