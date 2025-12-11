// ไฟล์: src/components/RecommendedSection.jsx
import React from 'react';
import MovieCard from './MovieCard';
import { movies } from '../data/movies'; // <--- 1. ดึงข้อมูลจากไฟล์ mock ของเรา
import '../css/RecommendedSection.css';

const RecommendedSection = () => {

  // แปลงข้อมูลจากไฟล์ movies.js ให้เข้ากับที่ MovieCard ต้องการ
  // (ถ้า field ชื่อตรงกันอยู่แล้วก็ไม่ต้องทำ แต่กันเหนียวไว้ก่อน)
  const allMovies = movies.map(movie => ({
    ...movie,
    poster_url: movie.image, // แปลง image -> poster_url
    genre: movie.category,   // แปลง category -> genre
    // duration ในไฟล์เราเป็น string แล้ว ไม่ต้องแปลง
  }));

  // --- ส่วน Logic การกรองหนัง (ใช้ status จากไฟล์ movies.js) ---

  // 1. ภาพยนตร์แนะนำ (กรองจาก isRecommended: true)
  const recommendedMovies = allMovies.filter(movie => movie.isRecommended);

  // 2. กำลังฉาย (กรองจาก status: 'now_showing')
  const nowShowingMovies = allMovies.filter(movie => movie.status === 'now_showing');

  // 3. โปรแกรมหน้า (กรองจาก status: 'coming_soon')
  const upcomingMovies = allMovies.filter(movie => movie.status === 'coming_soon');

  return (
    <div className="rec-container">

      {/* --- ส่วนที่ 1: ภาพยนตร์แนะนำ --- */}
      <h2 className="rec-header">ภาพยนตร์แนะนำ</h2>
      <div className="rec-grid">
        {recommendedMovies.length > 0 ? (
          recommendedMovies.map((movie) => (
            <div key={movie.id} className="movie-item-wrapper">
              <MovieCard movie={movie} />
              <div className="genre-badge">
                ประเภท : {movie.genre || "ไม่ระบุ"}
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#aaa', gridColumn: '1 / -1' }}>ไม่มีรายการแนะนำ</p>
        )}
      </div>

      {/* --- ส่วนที่ 2: กำลังฉาย --- */}
      <h2 className='rec-header' style={{ marginTop: '3rem' }}>กำลังฉาย</h2>
      <div className="rec-grid">
        {nowShowingMovies.length > 0 ? (
          nowShowingMovies.map((movie) => (
            <div key={movie.id} className="movie-item-wrapper">
              <MovieCard movie={movie} />
              <div className="genre-badge">
                ประเภท : {movie.genre || "ไม่ระบุ"}
              </div>
              <div className="date-badge badge-expiring">
                เวลา: {movie.duration}
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#aaa' }}>ยังไม่มีโปรแกรมฉาย</p>
        )}
      </div>

      {/* --- ส่วนที่ 3: โปรแกรมหน้า --- */}
      <h2 className='rec-header' style={{ marginTop: '3rem' }}>โปรแกรมหน้า (Coming Soon)</h2>
      <div className="rec-grid">
        {upcomingMovies.length > 0 ? (
          upcomingMovies.map((movie) => (
            <div key={movie.id} className="movie-item-wrapper">
              <MovieCard movie={movie} />
              <div className="genre-badge">
                ประเภท : {movie.genre || "ไม่ระบุ"}
              </div>
              <div className="date-badge badge-upcoming">
                เร็วๆ นี้
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#aaa' }}>ยังไม่มีโปรแกรมล่วงหน้า</p>
        )}
      </div>

    </div>
  );
};

export default RecommendedSection;