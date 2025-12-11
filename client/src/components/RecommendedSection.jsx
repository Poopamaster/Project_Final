import React, { useState, useEffect } from 'react';
import MovieCard from './MovieCard';
// ✅ 1. Import API ที่คุณมีอยู่แล้ว
import { getAllMovies } from '../api/movieApi';
import '../css/RecommendedSection.css';

const RecommendedSection = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 2. ดึงข้อมูลเมื่อโหลดหน้าเว็บ
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllMovies(); // เรียกใช้ฟังก์ชันจาก movieApi.js
        setMovies(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load movies:", err);
        setError("ไม่สามารถดึงข้อมูลภาพยนตร์ได้");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ 3. ฟังก์ชันแยกประเภทหนังตามวันที่ (Database Logic)
  const getMovieCategory = (movie) => {
    const today = new Date();
    const startDate = new Date(movie.start_date);
    
    // ถ้าวันฉาย มากกว่า วันนี้ = Coming Soon
    if (startDate > today) {
        return 'coming_soon';
    }
    // ถ้าวันฉาย น้อยกว่าหรือเท่ากับ วันนี้ = Now Showing
    return 'now_showing';
  };

  if (loading) return <div className="loading-text" style={{padding: '2rem', textAlign: 'center', color: 'white'}}>กำลังโหลดข้อมูลภาพยนตร์...</div>;
  if (error) return <div className="error-text" style={{padding: '2rem', textAlign: 'center', color: 'red'}}>{error}</div>;

  // --- จัดกลุ่มหนัง ---

  // 1. ภาพยนตร์แนะนำ (ตัวอย่าง: เอา 4 เรื่องแรก หรือถ้ามี field 'is_recommended' ใน DB ก็ใช้ได้)
  const recommendedMovies = movies.slice(0, 4);

  // 2. กำลังฉาย
  const nowShowingMovies = movies.filter(movie => getMovieCategory(movie) === 'now_showing');

  // 3. โปรแกรมหน้า
  const upcomingMovies = movies.filter(movie => getMovieCategory(movie) === 'coming_soon');

  return (
    <div className="rec-container">

      {/* --- ส่วนที่ 1: ภาพยนตร์แนะนำ --- */}
      <h2 className="rec-header">ภาพยนตร์แนะนำ</h2>
      <div className="rec-grid">
        {recommendedMovies.length > 0 ? (
          recommendedMovies.map((movie) => (
            <div key={movie._id} className="movie-item-wrapper">
              <MovieCard movie={movie} />
              <div className="genre-badge">
                {movie.genre || "Action"}
              </div>
            </div>
          ))
        ) : (
          <p className="empty-text">ไม่มีรายการแนะนำ</p>
        )}
      </div>

      {/* --- ส่วนที่ 2: กำลังฉาย --- */}
      <h2 className='rec-header' style={{ marginTop: '3rem' }}>กำลังฉาย</h2>
      <div className="rec-grid">
        {nowShowingMovies.length > 0 ? (
          nowShowingMovies.map((movie) => (
            <div key={movie._id} className="movie-item-wrapper">
              <MovieCard movie={movie} />
              <div className="genre-badge">
                {movie.genre || "ไม่ระบุ"}
              </div>
              <div className="date-badge badge-expiring">
                {movie.duration_min ? `${movie.duration_min} นาที` : 'ฉายแล้ว'}
              </div>
            </div>
          ))
        ) : (
          <p className="empty-text">ยังไม่มีโปรแกรมฉาย</p>
        )}
      </div>

      {/* --- ส่วนที่ 3: โปรแกรมหน้า --- */}
      <h2 className='rec-header' style={{ marginTop: '3rem' }}>โปรแกรมหน้า (Coming Soon)</h2>
      <div className="rec-grid">
        {upcomingMovies.length > 0 ? (
          upcomingMovies.map((movie) => (
            <div key={movie._id} className="movie-item-wrapper">
              <MovieCard movie={movie} />
              <div className="genre-badge">
                {movie.genre || "ไม่ระบุ"}
              </div>
              <div className="date-badge badge-upcoming">
                {new Date(movie.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          ))
        ) : (
          <p className="empty-text">ยังไม่มีโปรแกรมล่วงหน้า</p>
        )}
      </div>

    </div>
  );
};

export default RecommendedSection;