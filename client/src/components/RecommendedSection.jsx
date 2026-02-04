import React, { useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import { getAllMovies } from '../api/movieApi';
import '../css/RecommendedSection.css';

const RecommendedSection = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAllMovies();
        if (response.data) {
          setMovies(response.data);
        } else {
          setMovies(response);
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to load movies:", err);
        setError("ไม่สามารถดึงข้อมูลภาพยนตร์ได้");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ 3. แก้ไข Logic การแบ่งประเภทหนัง (เพิ่ม due_date)
  const getMovieCategory = (movie) => {
    const now = new Date();
    const startDate = new Date(movie.start_date);
    const dueDate = new Date(movie.due_date);

    // ปรับเวลาให้เป็น 00:00:00 เพื่อเปรียบเทียบเฉพาะ "วัน" (Optional: ช่วยให้แม่นยำขึ้น)
    // now.setHours(0, 0, 0, 0);
    // startDate.setHours(0, 0, 0, 0);
    // dueDate.setHours(23, 59, 59, 999); // ให้ due_date ครอบคลุมจนจบวัน

    // 1. ยังไม่ถึงวันฉาย -> Coming Soon
    if (now < startDate) {
      return 'coming_soon';
    }
    // 2. เลยวันฉายมาแล้ว AND ยังไม่เลยวันสิ้นสุด -> Now Showing
    else if (now >= startDate && now <= dueDate) {
      return 'now_showing';
    }
    // 3. นอกเหนือจากนั้น (เลย due_date ไปแล้ว) -> Ended
    else {
      return 'ended';
    }
  };

  if (loading) return <div className="loading-text" style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>กำลังโหลดข้อมูลภาพยนตร์...</div>;
  if (error) return <div className="error-text" style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;

  // --- จัดกลุ่มหนัง ---

  // 1. กำลังฉาย (Now Showing)
  const nowShowingMovies = movies.filter(movie => getMovieCategory(movie) === 'now_showing');

  // 2. โปรแกรมหน้า (Coming Soon)
  const upcomingMovies = movies.filter(movie => getMovieCategory(movie) === 'coming_soon');

  // 3. ภาพยนตร์แนะนำ (Recommended)
  // แนะนำให้เลือกจาก "กำลังฉาย" เท่านั้น (จะได้ไม่เอาหนังเก่า หรือหนังที่ยังไม่ฉายมาแนะนำ)
  const recommendedMovies = nowShowingMovies.slice(0, 10); 

  return (
    <div className="rec-container">

      {/* --- ส่วนที่ 1: ภาพยนตร์แนะนำ --- */}
      <h2 className="rec-header">ภาพยนตร์แนะนำ</h2>
      <div className="rec-grid">
        {recommendedMovies.length > 0 ? (
          recommendedMovies.map((movie) => (
            <div key={movie._id} className="movie-item-wrapper">
              <MovieCard movie={movie} />
              <div className='title'>{movie.title_th || movie.title_en}</div>
              <div className="genre-badge">
                {movie.genre}
              </div>
              <div className="date-badge badge-expiring">
                {movie.duration_min ? `${movie.duration_min} นาที` : 'ฉายแล้ว'}
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
              <div className='title'>{movie.title_th || movie.title_en}</div>
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
              <div className='title'>{movie.title_en}</div>
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