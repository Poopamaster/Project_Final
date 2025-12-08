import React, { useState } from 'react';
// 1. นำเข้า useNavigate
import { useNavigate } from 'react-router-dom';
import { Mic, Send, Bot, Film, Ticket, Home, History, User } from 'lucide-react'; 
import '../css/ChatBotPage.css';

const ChatBotPage = () => {
  // 2. ประกาศตัวแปร navigate
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'bot', 
      text: 'สวัสดีครับ, ยินดีต้อนรับเข้าสู่ระบบช่วยจองตั๋วหนัง คุณอยากดูเรื่องอะไร วันไหน เวลาไหน พิมพ์มาได้เลยครับ' 
    }
  ]);
  const [inputText, setInputText] = useState('');

  return (
    <div className="chatbot-container">
      
      {/* --- SIDEBAR ซ้าย --- */}
      <aside className="chat-sidebar">
        <div className="user-profile">
          <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&auto=format&fit=crop&q=60" alt="Profile" className="avatar-img" />
          <div className="user-info">
            <h3>Mr.TestDee</h3>
            <p>Example_123@gmail.com</p>
          </div>
        </div>

        <div className="divider"></div>

        <nav className="quick-menu">
          <div className="menu-header">QUICK MENU</div>
          <ul>
            {/* 3. สั่งให้กดแล้วกลับหน้าแรก */}
            <li onClick={() => navigate('/')}>
              <Home size={18} /> หน้าแรก
            </li>
            
            <li><Film size={18} /> ภาพยนตร์</li>
            <li><Ticket size={18} /> โรงภาพยนตร์ใกล้ฉัน</li>
            <li><History size={18} /> ประวัติการจอง</li>
          </ul>
        </nav>

        <div className="divider"></div>

        <div className="popular-widget">
          <div className="menu-header">POPULAR MOVIES</div>
          
          <div className="movie-rank-item">
            <div className="rank-number">1</div>
            <img src="https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_.jpg" alt="Avengers" className="movie-thumb" />
            <div className="movie-details">
              <h4>Avengers Endgame</h4>
              <p className="showtime">11:30 15:15 20:05 (Cinema2)</p>
              <p className="price">120-250 บาท</p>
            </div>
          </div>

          <div className="movie-rank-item">
            <div className="rank-number">2</div>
            <img src="https://upload.wikimedia.org/wikipedia/th/2/27/ใบปิดภาพยนตร์_โดราเอมอน_ตอน_เรื่องราวในโลกภาพวาดของโนบิตะ.jpg" alt="Doraemon" className="movie-thumb" />
            <div className="movie-details">
              <h4>Doraemon the movie</h4>
              <p className="showtime">11:10 15:00 19:15 (Cinema4)</p>
              <p className="price">120-250 บาท</p>
            </div>
          </div>

          <div className="movie-rank-item">
            <div className="rank-number">3</div>
            <img src="https://m.media-amazon.com/images/M/MV5BYjhiNjBlODctY2ZiOC00YjVlLWFlNzAtNTVhNzM1YjI1NzMxXkEyXkFqcGdeQXVyMjQxNTE1MDA@._V1_.jpg" alt="Avatar" className="movie-thumb" />
            <div className="movie-details">
              <h4>Avatar the way of water</h4>
              <p className="showtime">10:30 13:40 17:15 (Cinema1)</p>
              <p className="price">120-250 บาท</p>
            </div>
          </div>

        </div>
      </aside>

      {/* --- CHAT WINDOW ขวา --- */}
      <main className="chat-window">
        <header className="chat-header">
          <div className="header-left">
            <div className="bot-avatar-header">
              <Bot size={24} color="white" />
            </div>
            <div className="header-text">
              <h2>CineBot Assistant</h2>
              <p>พร้อมเป็นตัวช่วยคุณจองตั๋วหนังแล้ว....</p>
            </div>
          </div>
          <div className="header-right">
            <p>จองตั๋วหนังได้ง่ายขึ้น เพียงบอกชื่อหนังที่อยากดู</p>
            <span>ระบบอัจฉริยะจะจัดการทุกอย่างให้คุณ ตั้งแต่เลือกรอบ ไปจนถึงเลือกที่นั่ง!</span>
          </div>
        </header>

        <div className="messages-area">
          <div className="date-divider">
            <span>วันนี้</span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div className="bot-icon-chat">
                   <Bot size={20} />
                </div>
              )}
              <div className="message-bubble">
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-footer">
          <div className="suggestion-chips">
            <button>“อยากดูหนังดราม่า แนะนำหน่อย”</button>
            <button>“เช็ครอบโดราเอมอนให้หน่อย”</button>
          </div>

          <div className="input-container">
            <input 
              type="text" 
              placeholder="เช็ครอบหนังโดราเอมอนให้หน่อย" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="input-actions">
              <Mic className="action-icon mic" size={20} />
              <button className="send-btn">
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