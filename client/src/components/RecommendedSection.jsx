// ไฟล์: src/components/RecommendedSection.jsx
import React, { useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import { getAllMovies } from '../api/movieApi'; 
import '../css/RecommendedSection.css';

const RecommendedSection = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const data = await getAllMovies();
        
        // ⚠️ จุดแก้ไข: Map ข้อมูลให้ชื่อตรงกับที่ MovieCard ต้องการ
        const formattedMovies = data.map(movie => ({
            id: movie._id,
            title: movie.title_th, // ใช้ชื่อไทย
            
            // ✅ ส่ง poster_url ตรงๆ (ค่าจาก DB)
            poster_url: movie.poster_url, 
            
            genre: movie.genre,
            duration: convertDuration(movie.duration_min),
            language: movie.language || "TH/EN"
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

  if (loading) return <div style={{color:'white', textAlign:'center'}}>กำลังโหลดข้อมูล...</div>;

  return (
    <div className="rec-container">
      <h2 className="rec-header">ภาพยนตร์แนะนำ</h2>
      <div className="rec-grid">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
};

export default RecommendedSection;