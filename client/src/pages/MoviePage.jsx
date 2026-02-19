import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../css/MoviePage.css';

import { getAllMovies } from '../api/movieApi';
import { getAllCinemas } from '../api/cinemaApi';

function MoviePage() {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('now_showing');
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [moviesRes, cinemasRes] = await Promise.all([
            getAllMovies(),
            getAllCinemas()
        ]);

        setMovies(Array.isArray(moviesRes.data) ? moviesRes.data : (Array.isArray(moviesRes) ? moviesRes : []));
        setCinemas(Array.isArray(cinemasRes.data) ? cinemasRes.data : (Array.isArray(cinemasRes) ? cinemasRes : []));

        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ 1. ใช้ Logic การแบ่งหมวดหมู่ที่แม่นยำ (เหมือน RecommendedSection)
  const getMovieCategory = (movie) => {
    const now = new Date();
    const startDate = new Date(movie.start_date);
    const dueDate = new Date(movie.due_date);

    if (now < startDate) {
      return 'coming_soon';
    } else if (now >= startDate && now <= dueDate) {
      return 'now_showing';
    } else {
      return 'ended';
    }
  };

  // ✅ 2. ปรับปรุง Logic การ Filter
  const filteredMovies = movies.filter(movie => {
    // กรองตามสถานะ Tab (Now Showing / Coming Soon)
    const category = getMovieCategory(movie);
    const matchTab = category === activeTab;

    // กรองตาม Dropdown หนัง
    const matchMovie = selectedMovieId ? movie._id === selectedMovieId : true;

    // กรองตาม Dropdown โรงหนัง 
    // หมายเหตุ: ตรงนี้ถ้าใน Object Movie มี field cinemas: [] ให้เช็ค include ได้เลย
    // หรือถ้ามี table Showtime ต้องไป Filter ที่นั่นแทนครับ
    const matchCinema = selectedCinemaId 
        ? (movie.cinemas && movie.cinemas.includes(selectedCinemaId)) || true // ตอนนี้ใส่ true ไว้ก่อนกันหลุด
        : true; 

    return matchTab && matchMovie && matchCinema;
  });

  const handleBooking = (movie) => {
    navigate('/booking', { state: { movie } });
  };

  const handleResetFilter = () => {
      setSelectedCinemaId('');
      setSelectedMovieId('');
  };

  if (loading) return <div className="loading-text" style={{textAlign: 'center', padding: '50px', color: 'white'}}>กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="error-text" style={{textAlign: 'center', padding: '50px', color: '#ff6b6b'}}>{error}</div>;

  return (
    <div className="movie-page-container">
      <Navbar />
      
      <div className="filter-section">
        <div className="search-box">
          
          {/* Dropdown 1: เลือกโรงหนัง */}
          <select 
            className="dropdown"
            value={selectedCinemaId}
            onChange={(e) => setSelectedCinemaId(e.target.value)}
          >
            <option value="">โรงภาพยนตร์ทั้งหมด</option>
            {cinemas.map((cinema) => (
                <option key={cinema._id} value={cinema._id}>
                    {cinema.name}
                </option>
            ))}
          </select>

          {/* Dropdown 2: เลือกหนัง (Show เฉพาะหนังที่อยู่ในสถานะของ Tab นั้นๆ) */}
          <select 
            className="dropdown"
            value={selectedMovieId}
            onChange={(e) => setSelectedMovieId(e.target.value)}
          >
            <option value="">ภาพยนตร์ทั้งหมด</option>
            {movies
                .filter(m => getMovieCategory(m) === activeTab)
                .map(m => (
                    <option key={m._id} value={m._id}>
                        {m.title_th || m.title_en}
                    </option>
            ))}
          </select>

          <button className="search-btn" onClick={handleResetFilter}>
               ล้างตัวกรอง
          </button>
        </div>
      </div>

      <div className="content-wrapper">
        <h1 className="section-title">
            {activeTab === 'now_showing' ? 'กำลังฉาย' : 'โปรแกรมล่วงหน้า'}
        </h1>
        
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'now_showing' ? 'active' : ''}`}
            onClick={() => { setActiveTab('now_showing'); setSelectedMovieId(''); }}
          >
            กำลังฉาย
          </button>
          <button 
            className={`tab-btn ${activeTab === 'coming_soon' ? 'active' : ''}`}
            onClick={() => { setActiveTab('coming_soon'); setSelectedMovieId(''); }}
          >
            โปรแกรมล่วงหน้า
          </button>
        </div>

        <div className="divider"></div>

        <div className="movie-grid">
          {filteredMovies.length > 0 ? (
            filteredMovies.map((movie) => (
              <div key={movie._id} className="movie-card">
                <div className="poster-wrapper">
                    <img 
                        src={movie.poster_url} 
                        alt={movie.title_th} 
                        className="poster-img"
                    />
                </div>

                <div className="movie-info">
                  <h3 className="movie-title">{movie.title_th || movie.title_en}</h3>
                  
                  <div className="movie-meta">
                      <span>📌 {movie.genre || "ไม่ระบุ"}</span>
                      <span>⏰ {movie.duration_min} นาที</span>
                  </div>
                  
                  {/* แสดงวันที่ฉายถ้าเป็น Coming Soon */}
                  {activeTab === 'coming_soon' && (
                      <div className="release-date">
                          📅 เริ่มฉาย: {new Date(movie.start_date).toLocaleDateString('th-TH')}
                      </div>
                  )}

                  <div className="audio-badge">🔊 {movie.language || "TH/EN"}</div>
                  
                  <button 
                    className="detail-btn"
                    onClick={() => handleBooking(movie)}
                  >
                    {activeTab === 'coming_soon' ? 'ดูข้อมูลเพิ่มเติม' : 'ซื้อตั๋วภาพยนตร์'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-movies-text">
                ไม่พบภาพยนตร์ในหมวดหมู่นี้
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MoviePage;