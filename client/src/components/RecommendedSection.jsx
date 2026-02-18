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

  const getMovieCategory = (movie) => {
    const today = new Date();
    const startDate = new Date(movie.start_date);
    return startDate > today ? 'coming_soon' : 'now_showing';
  };

  if (loading) return <div className="loading-text" style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>กำลังโหลดข้อมูลภาพยนตร์...</div>;
  if (error) return <div className="error-text" style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;

  const recommendedMovies = movies.slice(0, 10);
  const nowShowingMovies = movies.filter(movie => getMovieCategory(movie) === 'now_showing');
  const upcomingMovies = movies.filter(movie => getMovieCategory(movie) === 'coming_soon');

  // ฟังก์ชันช่วย Render แต่ละ Item เพื่อลดความซับซ้อนของโค้ด
  const renderMovieItem = (movie, badgeType = 'expiring') => (
    <div key={movie._id} className="movie-item-wrapper">
      <MovieCard movie={movie} />
      {/* เปลี่ยนจาก 'title' เป็น 'movie-title' เพื่อให้ CSS ทำงาน */}
      <div className='movie-title'>{movie.title_th || movie.title_en}</div>
      <div className="genre-badge">
        {movie.genre || "ไม่ระบุ"}
      </div>
      <div className={`date-badge ${badgeType === 'expiring' ? 'badge-expiring' : 'badge-upcoming'}`}>
        {badgeType === 'expiring' 
          ? (movie.duration_min ? `${movie.duration_min} นาที` : 'ฉายแล้ว')
          : new Date(movie.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
        }
      </div>
    </div>
  );

  return (
    <div className="rec-container">
      <h2 className="rec-header">ภาพยนตร์แนะนำ</h2>
      <div className="rec-grid">
        {recommendedMovies.length > 0 ? recommendedMovies.map(m => renderMovieItem(m)) : <p>ไม่มีรายการแนะนำ</p>}
      </div>

      <h2 className='rec-header' style={{ marginTop: '3rem' }}>กำลังฉาย</h2>
      <div className="rec-grid">
        {nowShowingMovies.length > 0 ? nowShowingMovies.map(m => renderMovieItem(m)) : <p>ยังไม่มีโปรแกรมฉาย</p>}
      </div>

      <h2 className='rec-header' style={{ marginTop: '3rem' }}>โปรแกรมหน้า (Coming Soon)</h2>
      <div className="rec-grid">
        {upcomingMovies.length > 0 ? upcomingMovies.map(m => renderMovieItem(m, 'upcoming')) : <p>ยังไม่มีโปรแกรมล่วงหน้า</p>}
      </div>
    </div>
  );
};

export default RecommendedSection;