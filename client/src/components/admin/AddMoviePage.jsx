import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function AddMoviePage() {
    // ข้อมูลจำลองตามภาพ Figma ที่คุณส่งมา
    const movies = [
        { id: 1, title: 'Avengers Endgame', genre: 'แอคชั่น', duration: '3 ชั่วโมง 45 นาที', sales: 168, img: 'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_.jpg' },
        { id: 2, title: 'Doraemon the movie', genre: 'การ์ตูน', duration: '2 ชั่วโมง 22 นาที', sales: 111, img: 'https://m.media-amazon.com/images/M/MV5BMzYxYmU1Y2ItYWRjNy00N2I5LWE0ZDYtZTRlOWE4NjZlYmU4XkEyXkFqcGdeQXVyNjExODE1MDc@._V1_.jpg' },
        { id: 3, title: 'Avatar the way of water', genre: 'ไซไฟ', duration: '2 ชั่วโมง 42 นาที', sales: 86, img: 'https://m.media-amazon.com/images/M/MV5BYjhiNjBlODUtY2UxYS00N2EzLWEwNzItNWU1ZTUxOWM3ZTU4XkEyXkFqcGdeQXVyNjQxMDg2NzE@._V1_.jpg' }
    ];

    return (
        <div className="admin-page-content">
            <header className="content-header">
                <div>
                    <h1>จัดการหนัง</h1>
                    <p>จัดการภาพยนตร์ในระบบ...</p>
                </div>
                <div className="header-time">
                    <span>11 Sep 2026</span>
                    <span className="time">22:41:56</span>
                </div>
            </header>

            <div className="movie-management-box">
                <div className="box-header">
                    <h2>จัดการหนัง</h2>
                    <button className="btn-add-purple">
                        <Plus size={18} /> เพิ่มหนังใหม่
                    </button>
                </div>

                <div className="movie-figma-grid">
                    {movies.map(movie => (
                        <div key={movie.id} className="movie-figma-card">
                            <img src={movie.img} alt={movie.title} className="movie-poster-img" />
                            <div className="movie-card-info">
                                <h3>{movie.title}</h3>
                                <p className="movie-meta">{movie.genre} | {movie.duration}</p>
                                <div className="card-actions">
                                    <button className="btn-edit-blue"><Edit2 size={14} /> แก้ไข</button>
                                    <button className="btn-delete-red"><Trash2 size={14} /> ลบ</button>
                                </div>
                                <p className="sales-text">ขายได้ {movie.sales} ที่นั่ง</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}