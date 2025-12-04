import React from 'react';
import MovieCard from './MovieCard';
import '../css/RecommendedSection.css';

const RecommendedSection = () => {
  const movies = [
    {
      id: 1,
      title: "โดราเอมอน เดอะมูฟวี่ ตอน ไดโนเสาร์ตัวใหม่ของโนบิตะ",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/2/2c/Doraemon_Nobita%27s_New_Dinosaur_poster.jpg",
      isDetailed: true,
      genre: "ผจญภัย / ตลก",
      duration: "01 ชม. 45 นาที",
      lang: "พากย์ไทย / ENG"
    },
    {
      id: 2,
      title: "Avengers: Endgame",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/0/0d/Avengers_Endgame_poster.jpg",
      isDetailed: false
    },
    {
      id: 3,
      title: "Avatar: The Way of Water",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/5/54/Avatar_The_Way_of_Water_poster.jpg",
      isDetailed: false
    }
  ];

  return (
    <div className="rec-container">
      <h2 className="rec-header">ภาพยนตร์แนะนำ</h2>
      <div className="rec-grid">
        {movies.map((movie) => (
          <MovieCard key={movie.id} {...movie} />
        ))}
      </div>
    </div>
  );
};

export default RecommendedSection;