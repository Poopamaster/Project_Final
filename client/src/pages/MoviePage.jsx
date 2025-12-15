import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../css/MoviePage.css';

// ✅ 1. Import API
import { getAllMovies } from '../api/movieApi';
import { getAllCinemas } from '../api/cinemaApi'; // อย่าลืมสร้างไฟล์นี้ตามที่คุยกันนะครับ

function MoviePage() {
  const navigate = useNavigate();
  
  // --- State Management ---
  const [activeTab, setActiveTab] = useState('now_showing');
  
  // ข้อมูลจาก Database
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  
  // สถานะการโหลด
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ตัวแปรสำหรับ Filter
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState('');

  // ✅ 2. ดึงข้อมูลเมื่อโหลดหน้าเว็บ (Movies + Cinemas)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // ดึงข้อมูลพร้อมกัน 2 API เพื่อความรวดเร็ว
        const [moviesRes, cinemasRes] = await Promise.all([
            getAllMovies(),
            getAllCinemas()
        ]);

        // จัดการข้อมูล Movies
        const movieList = moviesRes.data || moviesRes; 
        setMovies(Array.isArray(movieList) ? movieList : []);

        // จัดการข้อมูล Cinemas
        const cinemaList = cinemasRes.data || cinemasRes;
        setCinemas(Array.isArray(cinemaList) ? cinemaList : []);

        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ 3. Helper Function: เช็คสถานะหนังจากวันที่
  const getMovieStatus = (releaseDate) => {
    if (!releaseDate) return 'now_showing'; // กันเหนียวเผื่อไม่มีวันที่
    
    const today = new Date();
    const movieDate = new Date(releaseDate);
    
    // Set เวลาเป็น 00:00:00 เพื่อเทียบแค่วันที่
    today.setHours(0, 0, 0, 0);
    movieDate.setHours(0, 0, 0, 0);

    return movieDate > today ? 'coming_soon' : 'now_showing';
  };

  // ✅ 4. Logic การกรองหนัง (Core Feature)
  const filteredMovies = movies.filter(movie => {
    // 4.1 กรองตาม Tab (Now Showing / Coming Soon)
    const status = getMovieStatus(movie.start_date || movie.release_date); 
    const matchTab = status === activeTab;

    // 4.2 กรองตาม Dropdown หนัง
    const matchMovie = selectedMovieId ? movie._id === selectedMovieId : true;

    // 4.3 กรองตาม Dropdown โรงหนัง
    // (อนาคต: ต้องเช็คว่า movie._id นี้ มี Showtime ใน selectedCinemaId หรือไม่)
    // ตอนนี้ให้ return true ไปก่อนเพื่อให้ UI ไม่ว่างเปล่า
    const matchCinema = true; 

    return matchTab && matchMovie && matchCinema;
  });

  // ฟังก์ชันไปหน้าจอง
  const handleBooking = (movie) => {
    navigate('/booking', { state: { movie } });
  };

  // ฟังก์ชันล้างตัวกรอง
  const handleResetFilter = () => {
      setSelectedCinemaId('');
      setSelectedMovieId('');
  };

  // --- UI Render ---

  if (loading) return <div className="loading-text" style={{textAlign: 'center', padding: '50px', color: 'white'}}>กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="error-text" style={{textAlign: 'center', padding: '50px', color: '#ff6b6b'}}>{error}</div>;

  return (
    <div className="movie-page-container">
      <Navbar />
      
      {/* --- ส่วนค้นหา (Filter Section) --- */}
      <div className="filter-section">
        <div className="search-box">
          
          {/* Dropdown 1: เลือกโรงหนัง (จาก Database) */}
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

          {/* Dropdown 2: เลือกหนัง (Show เฉพาะหนังใน Tab ปัจจุบัน) */}
          <select 
            className="dropdown"
            value={selectedMovieId}
            onChange={(e) => setSelectedMovieId(e.target.value)}
          >
            <option value="">ภาพยนตร์ทั้งหมด</option>
            {movies
                .filter(m => getMovieStatus(m.start_date || m.release_date) === activeTab)
                .map(m => (
                    <option key={m._id} value={m._id}>
                        {m.title_th || m.title_en || m.title}
                    </option>
            ))}
          </select>

          {/* ปุ่ม Reset */}
          <button className="search-btn" onClick={handleResetFilter}>
             ล้างตัวกรอง
          </button>
        </div>
      </div>

      {/* --- เนื้อหาหลัก --- */}
      <div className="content-wrapper">
        <h1 className="section-title">ภาพยนตร์</h1>
        
        {/* Tabs */}
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

        {/* Grid แสดงหนัง */}
        <div className="movie-grid">
          {filteredMovies.length > 0 ? (
            filteredMovies.map((movie) => (
              <div key={movie._id} className="movie-card">
                
                {/* รูปภาพโปสเตอร์ */}
                <div className="poster-wrapper">
                    <img 
                        src={movie.poster_url} 
                        alt={movie.title_th} 
                        className="poster-img"
                        onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = 'https://via.placeholder.com/300x450?text=No+Image'; 
                        }}
                    />
                </div>

                {/* รายละเอียดหนัง */}
                <div className="movie-info">
                  <h3 className="movie-title">{movie.title_th || movie.title_en}</h3>
                  
                  <div className="movie-meta">
                      <span>📌 {movie.genre || "ไม่ระบุ"}</span>
                      <span>⏰ {movie.duration_min ? `${movie.duration_min} นาที` : "-"}</span>
                  </div>
                  
                  <div className="audio-badge">🔊 {movie.language || "TH"}</div>
                  
                  <button 
                    className="detail-btn"
                    onClick={() => handleBooking(movie)}
                  >
                    {activeTab === 'coming_soon' ? 'ดูข้อมูล' : 'ซื้อตั๋ว'}
                  </button>
                  
                </div>
              </div>
            ))
          ) : (
            <div className="no-movies-text" style={{gridColumn: '1 / -1', textAlign: 'center', color: '#aaa', marginTop: '2rem', fontSize: '1.2rem'}}>
                ไม่พบภาพยนตร์ตามเงื่อนไขที่เลือก
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MoviePage;