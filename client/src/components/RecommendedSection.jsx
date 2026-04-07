import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ ดึง useNavigate มาใช้
import MovieCard from './MovieCard';
import { getAllMovies } from '../api/movieApi';
import '../css/RecommendedSection.css';

const RecommendedSection = () => {
  const navigate = useNavigate(); // ✅ เรียกใช้งาน navigate
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
    const now = new Date();
    const startDate = new Date(movie.start_date);
    const dueDate = new Date(movie.due_date);

    if (now < startDate) {
      return 'coming_soon';
    }
    else if (now >= startDate && now <= dueDate) {
      return 'now_showing';
    }
    else {
      return 'ended';
    }
  };

  if (loading) return <div className="loading-text" style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>กำลังโหลดข้อมูลภาพยนตร์...</div>;
  if (error) return <div className="error-text" style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;

  const nowShowingMovies = movies.filter(movie => getMovieCategory(movie) === 'now_showing');
  const upcomingMovies = movies.filter(movie => getMovieCategory(movie) === 'coming_soon');
  const recommendedMovies = nowShowingMovies.slice(0, 10); 

  // ✅ ฟังก์ชันช่วยในการคลิกการ์ด
  const handleMovieClick = (movie, isComingSoon = false) => {
    if (!isComingSoon) {
      navigate('/booking', { state: { movie } });
    }
  };

  return (
    <div className="rec-container">

      {/* --- ส่วนที่ 1: ภาพยนตร์แนะนำ --- */}
      <h2 className="rec-header">ภาพยนตร์แนะนำ</h2>
      <div className="rec-grid">
        {recommendedMovies.length > 0 ? (
          recommendedMovies.map((movie) => (
            <div 
              key={movie._id} 
              className="movie-item-wrapper"
              onClick={() => handleMovieClick(movie)} // ✅ กดได้
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            >
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
            <div 
              key={movie._id} 
              className="movie-item-wrapper"
              onClick={() => handleMovieClick(movie)} // ✅ กดได้
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            >
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
            <div 
              key={movie._id} 
              className="movie-item-wrapper"
              onClick={() => handleMovieClick(movie, true)} // ❌ เป็น Coming Soon เลยตั้งไม่ให้ไปต่อ
              style={{ cursor: 'default' }} // เคอร์เซอร์ไม่เป็นรูปมือ
            >
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