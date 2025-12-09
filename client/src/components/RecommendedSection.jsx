// ไฟล์: src/components/RecommendedSection.jsx
import React, { useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import { getAllMovies } from '../api/movieApi';
import '../css/RecommendedSection.css'; // อย่าลืม import CSS

const RecommendedSection = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const data = await getAllMovies();

        const formattedMovies = data.map(movie => ({
          id: movie._id,
          title: movie.title_th,
          poster_url: movie.poster_url,
          genre: movie.genre,
          duration: convertDuration(movie.duration_min),
          language: movie.language || "TH/EN",
          start_date: movie.start_date,
          due_date: movie.due_date
        }));

        setMovies(formattedMovies);
      } catch (error) {
        console.error("ไม่สามารถโหลดข้อมูลหนังได้");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const convertDuration = (minutes) => {
    if (!minutes) return "-";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h} ชม. ${m} นาที`;
  };

  const formatThaiDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    });
  };

  const currentDate = new Date();

  // 1. กำลังฉาย
  const nowShowingMovies = movies.filter(movie => {
    if (!movie.start_date || !movie.due_date) return false;
    const start = new Date(movie.start_date);
    const end = new Date(movie.due_date);
    return currentDate >= start && currentDate <= end;
  });

  // 2. โปรแกรมหน้า
  const upcomingMovies = movies.filter(movie => {
    if (!movie.start_date) return false;
    const start = new Date(movie.start_date);
    return start > currentDate;
  });

  // 3. แนะนำ (เอา 5 เรื่องแรก)
  const recommendedMovies = movies.slice(0, 5);

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>กำลังโหลดข้อมูล...</div>;

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
              ประเภท : {movie.genre || "ไม่ระบุประเภท"}
              </div>
              <div className="date-badge badge-expiring">
                จะลาจอ: {formatThaiDate(movie.due_date)}
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#aaa', gridColumn: '1 / -1' }}>ไม่มีรายการแนะนำ</p>
        )}
      </div>

      {/* --- ส่วนที่ 2: กำลังฉาย (อยากใส่ Genre ด้วยก็ได้เช่นกัน) --- */}
      <h2 className='rec-header' style={{ marginTop: '3rem' }}>กำลังฉาย</h2>
      <div className="rec-grid">
        {nowShowingMovies.map((movie) => (
          <div key={movie.id} className="movie-item-wrapper">
            <MovieCard movie={movie} />
            <div className="genre-badge" style={{ marginBottom: '4px' }}>
              ประเภท : {movie.genre || "ไม่ระบุประเภท"}
            </div>
            <div className="date-badge badge-expiring">
              จะลาจอ: {formatThaiDate(movie.due_date)}
            </div>
          </div>
        ))}
      </div>

      {/* --- ส่วนที่ 3: โปรแกรมหน้า --- */}
      <h2 className='rec-header' style={{ marginTop: '3rem' }}>โปรแกรมหน้า (Coming Soon)</h2>
      <div className="rec-grid">
        {upcomingMovies.map((movie) => (
          <div key={movie.id} className="movie-item-wrapper">
            <MovieCard movie={movie} />
            <div className="genre-badge" style={{ marginBottom: '4px' }}>
              ประเภท : {movie.genre || "ไม่ระบุประเภท"}
            </div>
            <div className="date-badge badge-upcoming">
              เข้าฉาย: {formatThaiDate(movie.start_date)}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default RecommendedSection;