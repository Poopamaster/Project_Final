import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../css/MoviePage.css';

import { getAllMovies } from '../api/movieApi';
import { getAllCinemas } from '../api/cinemaApi';
import { getAllShowtimes } from '../api/showtimeApi'; // ✅ ต้องดึงตัวนี้มาเชื่อม!

function MoviePage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('now_showing');
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [showtimes, setShowtimes] = useState([]); // ✅ เพิ่ม State รอบฉาย
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // ดึง 3 อย่างพร้อมกัน: หนัง, สาขา, และรอบฉาย
        const [moviesRes, cinemasRes, showtimesRes] = await Promise.all([
          getAllMovies(),
          getAllCinemas(),
          getAllShowtimes()
        ]);

        const movieData = moviesRes.data?.data || moviesRes.data || moviesRes;
        const cinemaData = cinemasRes.data?.data || cinemasRes.data || cinemasRes;
        const showtimeData = showtimesRes.data?.data || showtimesRes.data || showtimesRes;

        setMovies(Array.isArray(movieData) ? movieData : []);
        setCinemas(Array.isArray(cinemaData) ? cinemaData : []);
        setShowtimes(Array.isArray(showtimeData) ? showtimeData : []);

        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getMovieCategory = (movie) => {
    const now = new Date();
    const startDate = new Date(movie.start_date);
    const dueDate = new Date(movie.due_date);
    if (now < startDate) return 'coming_soon';
    if (now >= startDate && now <= dueDate) return 'now_showing';
    return 'ended';
  };

  // ✅ 1. กรองรายชื่อหนังใน Dropdown ตามสาขาที่เลือก
  const moviesInDropdown = movies.filter(m => {
    const matchTab = getMovieCategory(m) === activeTab;
    if (!selectedCinemaId) return matchTab;

    // 🌟 แก้ไขตรงนี้: เช็คทั้ง cinema_id โดยตรง และเช็คผ่าน auditorium_id
    return showtimes.some(st => {
      const isMovieMatch = (st.movie_id?._id === m._id || st.movie_id === m._id);

      // เช็คว่าโรงนี้อยู่สาขาที่เลือกไหม (ครอบคลุมทั้ง 2 รูปแบบ Schema)
      const isCinemaMatch =
        (st.cinema_id?._id === selectedCinemaId || st.cinema_id === selectedCinemaId) ||
        (st.auditorium_id?.cinema_id?._id === selectedCinemaId || st.auditorium_id?.cinema_id === selectedCinemaId);

      return isMovieMatch && isCinemaMatch;
    });
  });

  // ✅ 2. กรอง Card หนังที่แสดงบนหน้าจอ
  const filteredMovies = movies.filter(movie => {
    const matchTab = getMovieCategory(movie) === activeTab;
    const matchMovie = selectedMovieId ? movie._id === selectedMovieId : true;

    let matchCinema = true;
    if (selectedCinemaId) {
      // 🌟 แก้ไขตรงนี้: เพิ่มการเช็คผ่าน auditorium_id ด้วยเหมือนกัน
      matchCinema = showtimes.some(st => {
        const isMovieMatch = (st.movie_id?._id === movie._id || st.movie_id === movie._id);
        const isCinemaMatch =
          (st.cinema_id?._id === selectedCinemaId || st.cinema_id === selectedCinemaId) ||
          (st.auditorium_id?.cinema_id?._id === selectedCinemaId || st.auditorium_id?.cinema_id === selectedCinemaId);

        return isMovieMatch && isCinemaMatch;
      });
    }
    return matchTab && matchMovie && matchCinema;
  });

  const handleResetFilter = () => {
    setSelectedCinemaId('');
    setSelectedMovieId('');
  };

  if (loading) return <div className="loading-text" style={{ textAlign: 'center', padding: '50px', color: 'white' }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div className="movie-page-container">
      <Navbar />

      <div className="filter-section">
        <div className="search-box">

          {/* ✅ Dropdown 1: เลือกสาขา (Cinema) */}
          <select
            className="dropdown"
            value={selectedCinemaId}
            onChange={(e) => {
              setSelectedCinemaId(e.target.value);
              setSelectedMovieId(''); // Reset หนังเมื่อเปลี่ยนสาขา
            }}
          >
            <option value="">โรงภาพยนตร์ทั้งหมด</option>
            {cinemas.map((cinema) => (
              <option key={cinema._id} value={cinema._id}>
                {cinema.name}
              </option>
            ))}
          </select>

          {/* ✅ Dropdown 2: เลือกหนัง (กรองตามสาขาที่เลือกด้านบน) */}
          <select
            className="dropdown"
            value={selectedMovieId}
            onChange={(e) => setSelectedMovieId(e.target.value)}
          >
            <option value="">ภาพยนตร์ทั้งหมด</option>
            {moviesInDropdown.map(m => (
              <option key={m._id} value={m._id}>
                {m.title_th || m.title_en}
              </option>
            ))}
          </select>

          <button className="search-btn" onClick={handleResetFilter}>ล้างตัวกรอง</button>
        </div>
      </div>

      <div className="content-wrapper">
        <h1 className="section-title">
          {activeTab === 'now_showing' ? 'กำลังฉาย' : 'โปรแกรมล่วงหน้า'}
        </h1>

        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'now_showing' ? 'active' : ''}`} onClick={() => { setActiveTab('now_showing'); handleResetFilter(); }}>กำลังฉาย</button>
          <button className={`tab-btn ${activeTab === 'coming_soon' ? 'active' : ''}`} onClick={() => { setActiveTab('coming_soon'); handleResetFilter(); }}>โปรแกรมล่วงหน้า</button>
        </div>

        <div className="divider"></div>

        <div className="movie-grid">
          {filteredMovies.length > 0 ? (
            filteredMovies.map((movie) => (
              <div key={movie._id} className="movie-card">
                <div className="poster-wrapper">
                  <img src={movie.poster_url} alt={movie.title_th} className="poster-img" />
                </div>
                <div className="movie-info">
                  <h3 className="movie-title">{movie.title_th || movie.title_en}</h3>
                  <div className="movie-meta">
                    <span>📌 {movie.genre || "ไม่ระบุ"}</span>
                    <span>⏰ {movie.duration_min} นาที</span>
                  </div>
                  <div className="audio-badge">🔊 {movie.language || "TH/EN"}</div>
                  <button className="detail-btn" onClick={() => navigate('/booking', { state: { movie } })}>
                    {activeTab === 'coming_soon' ? 'ดูข้อมูลเพิ่มเติม' : 'ซื้อตั๋วภาพยนตร์'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-movies-text">ไม่พบภาพยนตร์ในเงื่อนไขที่เลือก</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MoviePage;