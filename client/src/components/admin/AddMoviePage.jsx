import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function AddMoviePage() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMovies = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8000/api/admin/movies');
            if (response.data.success) {
                setMovies(response.data.data);
            }
            setLoading(false);
        } catch (err) {
            console.error("Fetch movies error:", err);
            setError("ไม่สามารถดึงข้อมูลหนังได้");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    const handleDelete = async (id, title) => {
        if (window.confirm(`คุณแน่ใจใช่ไหมว่าจะลบเรื่อง "${title}"?`)) {
            try {
                await axios.delete(`http://localhost:8000/api/admin/movies/${id}`);
                fetchMovies();
            } catch (err) {
                alert("ลบไม่สำเร็จ");
            }
        }
    };

    return (
        <div className="admin-page-content">
            <header className="content-header">
                <div>
                    <h1>จัดการหนัง</h1>
                    <p>จัดการภาพยนตร์ในระบบจากฐานข้อมูลจริง...</p>
                </div>
                {/* ตัดส่วน header-time ออกเรียบร้อยแล้ว */}
            </header>

            <div className="movie-management-box">
                <div className="box-header">
                    <h2>รายการหนังทั้งหมด ({movies.length})</h2>
                    <button className="btn-add-purple">
                        <Plus size={18} /> เพิ่มหนังใหม่
                    </button>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <Loader2 className="animate-spin" /> กำลังโหลดข้อมูล...
                    </div>
                ) : error ? (
                    <div className="error-text">{error}</div>
                ) : (
                    <div className="movie-figma-grid">
                        {movies.map(movie => (
                            <div key={movie._id} className="movie-figma-card">
                                <img 
                                    src={movie.poster_url || 'https://via.placeholder.com/500x750?text=No+Poster'} 
                                    alt={movie.title_en} 
                                    className="movie-poster-img" 
                                />
                                <div className="movie-card-info">
                                    <h3>{movie.title_th || movie.title_en}</h3>
                                    <p className="movie-meta">{movie.genre} | {movie.duration_min} นาที</p>
                                    <div className="card-actions">
                                        <button className="btn-edit-blue"><Edit2 size={14} /> แก้ไข</button>
                                        <button 
                                            className="btn-delete-red"
                                            onClick={() => handleDelete(movie._id, movie.title_en)}
                                        >
                                            <Trash2 size={14} /> ลบ
                                        </button>
                                    </div>
                                    <p className="sales-text">ภาษา: {movie.language}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}