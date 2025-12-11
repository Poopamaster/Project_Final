// ไฟล์: src/components/MovieCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/MovieCard.css';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const safeMovie = movie || {};

  // 1. ดึง URL: ใช้ poster_url ที่มาจาก DB หรือใช้ Placeholder
  const imageUrl = safeMovie.poster_url || safeMovie.image || "https://via.placeholder.com/300x450?text=No+Image";

  // 2. ชื่อเรื่อง
  const movieTitle = safeMovie.title_th || safeMovie.title || "ไม่มีชื่อเรื่อง";

  const handleClick = () => {
    // **แก้ไขการดึง ID: ใช้ _id แทน id**
    if (safeMovie._id) {
      navigate(`/booking/${safeMovie._id}`);
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
        }}
      />

      <div className="movie-overlay-custom">
        <h3 className="movie-title-custom">
          {movieTitle}
        </h3>

        <div className="movie-info-custom">
          <div className="info-row">🏷️ {safeMovie.genre || "-"}</div>
          <div className="info-row">
            🕒 {safeMovie.duration_min ? safeMovie.duration_min + " นาที" : safeMovie.duration || "-"}
          </div>
          <div className="info-row">🔊 {safeMovie.language || "TH/EN"}</div>
        </div>

        <button className="btn-more-custom">ดูเพิ่มเติม</button>
      </div>
    </div>
  );
};

export default MovieCard;