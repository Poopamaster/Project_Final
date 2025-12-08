import React from 'react';
import MovieCard from './MovieCard';
import '../css/RecommendedSection.css';

const RecommendedSection = () => {
  const movies = [
    {
      id: 1,
      title: "โดราเอมอน เดอะมูฟวี่",
      // เปลี่ยนชื่อจาก posterUrl เป็น image ให้ตรงกับที่ MovieCard รอรับ
      image: "https://upload.wikimedia.org/wikipedia/th/2/27/ใบปิดภาพยนตร์_โดราเอมอน_ตอน_เรื่องราวในโลกภาพวาดของโนบิตะ.jpg",
      genre: "ผจญภัย / ตลก",
      duration: "01 ชม. 45 นาที",
      language: "พากย์ไทย / ENG" // เพิ่มอันนี้เพราะใน Card มีช่องแสดงภาษา
    },
    {
      id: 2,
      title: "Avengers: Endgame",
      image: "https://upload.wikimedia.org/wikipedia/en/0/0d/Avengers_Endgame_poster.jpg",
      genre: "แอคชั่น / ไซไฟ",
      duration: "03 ชม. 02 นาที",
      language: "ENG / SUB"
    },
    {
      id: 3,
      title: "Avatar: The Way of Water",
      image: "https://upload.wikimedia.org/wikipedia/en/5/54/Avatar_The_Way_of_Water_poster.jpg",
      genre: "ไซไฟ / ผจญภัย",
      duration: "03 ชม. 12 นาที",
      language: "ENG / TH"
    }
  ];

  return (
    <div className="rec-container">
      <h2 className="rec-header">ภาพยนตร์แนะนำ</h2>
      <div className="rec-grid">
        {/* แก้ตรงนี้: ส่งไปเป็นก้อน object ชื่อ movie={movie} */}
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
};

export default RecommendedSection;