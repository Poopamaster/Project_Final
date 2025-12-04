import React from 'react';
import { Tag as TagIcon, Clock, Volume2 } from 'lucide-react';
import '../css/MovieCard.css';

const MovieCard = ({ title, posterUrl, isDetailed, genre, duration, lang }) => {
  return (
    <div className="movie-card">
      <img src={posterUrl} alt={title} className="card-poster" />
      
      {/* Gradient Overlay */}
      <div className="card-overlay" />

      {isDetailed ? (
        <div className="card-content">
          <h3 className="card-title">{title}</h3>
          
          <div className="card-info">
            <TagIcon size={14} color="#FACC15" />
            <span>{genre}</span>
          </div>
          
          <div className="card-info">
            <Clock size={14} />
            <span>{duration}</span>
          </div>

          <div className="card-info">
            <Volume2 size={14} color="#C084FC" />
            <span>{lang}</span>
          </div>

          <button className="card-btn">ดูเพิ่มเติม</button>
        </div>
      ) : (
        <h3 className="simple-title">{title}</h3>
      )}
    </div>
  );
};

export default MovieCard;