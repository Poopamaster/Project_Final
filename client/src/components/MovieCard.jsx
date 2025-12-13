// ไฟล์: src/components/MovieCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/MovieCard.css';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const safeMovie = movie || {};

  // --- แก้ไขจุดสำคัญ: ให้รองรับทั้ง id (Mock Data) และ _id (MongoDB) ---
  const movieId = safeMovie.id || safeMovie._id;

  // 1. ดึง URL: ใช้ poster_url ที่มาจาก DB หรือใช้ Placeholder
  const imageUrl = safeMovie.poster_url || safeMovie.image || "https://via.placeholder.com/300x450?text=No+Image";

  // 2. ชื่อเรื่อง
  const movieTitle = safeMovie.title_th || safeMovie.title || "ไม่มีชื่อเรื่อง";

  const handleClick = () => {
    // ตรวจสอบว่ามี ID ไหม ถ้ามีให้พาไปหน้า Booking
    if (movieId) {
      navigate(`/booking/${movieId}`);
    } else {
      console.error("Error: Movie ID not found", safeMovie);
    }
  };

  return (
    <div className="movie-card-custom" onClick={handleClick}>
      <img
        src={imageUrl}
        alt={movieTitle}
        className="movie-img-custom"
        // ถ้าลิงก์รูปเสีย ให้ใช้ภาพ Placeholder แทน
        onError={(e) => {
          e.target.onerror = null; // ป้องกัน infinite loop
          e.target.src = "https://via.placeholder.com/300x450?text=No+Image"; 
        }}
      />

      <div className="movie-overlay-custom">
        <h3 className="movie-title-custom">
          {movieTitle}
        </h3>

        <div className="movie-info-custom">
          <div className="info-row">🏷️ {safeMovie.genre || safeMovie.category || "-"}</div>
          <div className="info-row">
            🕒 {safeMovie.duration_min ? safeMovie.duration_min + " นาที" : safeMovie.duration || "-"}
          </div>
          <div className="info-row">🔊 {safeMovie.language || safeMovie.audio || "TH/EN"}</div>
        </div>

        <button className="btn-more-custom">ดูเพิ่มเติม</button>
      </div>
    </div>
  );
};

export default MovieCard;