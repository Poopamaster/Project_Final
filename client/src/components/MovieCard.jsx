import React from 'react';
import '../css/MovieCard.css';

const MovieCard = ({ movie }) => {
  // 1. ให้แสดงข้อมูลที่ได้รับมาดูใน Console (กด F12 ดูได้)
  console.log("Movie Data:", movie);

  // 2. ถ้า movie เป็น undefined ให้สร้าง object ว่างๆ แทน จะได้ไม่ error และการ์ดไม่หาย
  const safeMovie = movie || {};

  return (
    <div className="movie-card-custom">
      <img 
        // 3. ใส่รูปภาพสำรอง (Placeholder) ถ้าหา URL รูปไม่เจอ
        src={safeMovie.image || "https://via.placeholder.com/300x450?text=No+Image"} 
        alt={safeMovie.title || "Movie"} 
        className="movie-img-custom" 
      />

      <div className="movie-overlay-custom">
        <h3 className="movie-title-custom">
          {safeMovie.title || "ไม่มีชื่อเรื่อง"}
        </h3>
        
        <div className="movie-info-custom">
          <div className="info-row">🏷️ {safeMovie.genre || "-"}</div>
          <div className="info-row">🕒 {safeMovie.duration || "-"}</div>
          <div className="info-row">🔊 {safeMovie.language || "-"}</div>
        </div>
        
        <button className="btn-more-custom">ดูเพิ่มเติม</button>
      </div>
    </div>
  );
};

export default MovieCard;