import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. เพิ่ม import นี้
import Navbar from '../components/Navbar';
import { movies } from '../data/movies';
import '../css/MoviePage.css';

function MoviePage() {
  const navigate = useNavigate(); // 2. ประกาศตัวแปรสำหรับเปลี่ยนหน้า
  const [activeTab, setActiveTab] = useState('now_showing');

  // กรองหนังตามแท็บที่เลือก
  const filteredMovies = movies.filter(movie => movie.status === activeTab);

  const handleBooking = (movie) => {
    // 3. ฟังก์ชันสั่งเปลี่ยนหน้า และส่งข้อมูลหนัง (movie) ไปด้วย
    navigate('/booking', { state: { movie } });
  };

  return (
    <div className="movie-page-container">
      <Navbar />
      
      {/* ส่วนค้นหาด้านบน */}
      <div className="filter-section">
        <div className="search-box">
          <select className="dropdown">
            <option>โรงภาพยนตร์</option>
            <option>Cinema สาขา 1</option>
          </select>
          <select className="dropdown">
            <option>ภาพยนตร์ทั้งหมด</option>
          </select>
          <button className="search-btn">ค้นหารอบฉาย</button>
        </div>
      </div>

      {/* เนื้อหาหลัก */}
      <div className="content-wrapper">
        <h1 className="section-title">ภาพยนตร์</h1>
        
        {/* ปุ่มเลือกแท็บ */}
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'now_showing' ? 'active' : ''}`}
            onClick={() => setActiveTab('now_showing')}
          >
            กำลังฉาย
          </button>
          <button 
            className={`tab-btn ${activeTab === 'coming_soon' ? 'active' : ''}`}
            onClick={() => setActiveTab('coming_soon')}
          >
            โปรแกรมล่วงหน้า
          </button>
        </div>

        <div className="divider"></div>

        {/* Grid แสดงหนัง */}
        <div className="movie-grid">
          {filteredMovies.map((movie) => (
            <div key={movie.id} className="movie-card">
              <div className="poster-wrapper">
                  <img src={movie.image} alt={movie.title} className="poster-img"/>
              </div>
              <div className="movie-info">
                <h3 className="movie-title">{movie.title}</h3>
                <div className="movie-meta">
                    <span>📌 {movie.category}</span>
                    <span>⏰ {movie.duration}</span>
                </div>
                <div className="audio-badge">🔊 {movie.audio}</div>
                
                {/* 4. แก้ไขปุ่มให้เรียกใช้ฟังก์ชัน handleBooking */}
                <button 
                  className="detail-btn"
                  onClick={() => handleBooking(movie)}
                >
                  ดูเพิ่มเติม
                </button>
                
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MoviePage;