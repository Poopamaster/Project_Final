import React from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ ต้องมีตัวนี้เพื่อเปลี่ยนหน้า
import '../css/MovieCard.css';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate(); // ✅ ประกาศตัวแปรเพื่อใช้งาน
  const safeMovie = movie || {};
  
  // ดึง ID จาก Database (มักเป็น _id) หรือจาก Mock data (id)
  const movieId = safeMovie._id || safeMovie.id;
  const imageUrl = safeMovie.poster_url || safeMovie.image || "https://placehold.co/300x450?text=No+Image";
  const movieTitle = safeMovie.title_th || safeMovie.title_en || "ไม่มีชื่อเรื่อง";

  // ✅ ฟังก์ชันสำหรับเปลี่ยนหน้า
  const goToBooking = (e) => {
    e.stopPropagation(); // กันไม่ให้คลิกซ้อนกับส่วนอื่นของการ์ด
    if (movieId) {
      navigate(`/booking/${movieId}`); // ส่ง ID ไปที่ URL เช่น /booking/65xxxxxxx
    } else {
      console.error("ไม่พบรหัสหนัง (Movie ID is missing)");
    }
  };

  return (
    <div className="movie-card-custom" onClick={goToBooking}>
      <img
        src={imageUrl}
        alt={movieTitle}
        className="movie-img-custom"
        onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/300x450?text=No+Image";
        }}
      />

      <div className="movie-overlay-custom">
        <h3 className="movie-title-custom">{movieTitle}</h3>

        <div className="movie-info-custom">
          <div className="info-row">🏷️ {safeMovie.genre || safeMovie.category || "-"}</div>
          <div className="info-row">
            🕒 {safeMovie.duration_min ? safeMovie.duration_min + " นาที" : "-"}
          </div>
        </div>       
      </div>
    </div>
  );
};

export default MovieCard;