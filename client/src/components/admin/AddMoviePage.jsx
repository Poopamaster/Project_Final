import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Save, X } from 'lucide-react';
import axiosInstance from "../../api/axiosInstance";

export default function AddMoviePage() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMovie, setEditingMovie] = useState(null);

    const fetchMovies = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/movies');
            if (response.data.success) {
                setMovies(response.data.data);
            }
            setLoading(false);
        } catch (err) {
            alert("ไม่สามารถดึงข้อมูลหนังได้");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    const categorizeMovies = (status) => {
        const now = new Date();
        return movies.filter(movie => {
            const startDate = new Date(movie.start_date);
            const endDate = new Date(movie.due_date);
            if (status === 'showing') return now >= startDate && now <= endDate;
            if (status === 'soon') return now < startDate;
            if (status === 'ended') return now > endDate;
            return false;
        });
    };

    const handleSearchTMDB = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;
        setIsSearching(true);
        try {
            const response = await axiosInstance.get(`/admin/search-tmdb?query=${searchQuery}`);
            setSearchResults(response.data.results || []);
        } catch (err) {
            alert("ค้นหาข้อมูลจาก TMDB ไม่สำเร็จ");
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddFromTMDB = async (tmdbMovie) => {
        try {
            const response = await axiosInstance.post('/admin/movies/add-tmdb', { tmdbId: tmdbMovie.id });
            if (response.data.success) {
                alert(`เพิ่มเรื่อง ${tmdbMovie.title_th} เรียบร้อย!`);
                setShowSearch(false);
                fetchMovies();
            }
        } catch (err) {
            alert("ไม่สามารถเพิ่มหนังได้");
        }
    };

    const openEditModal = (movie) => {
        setEditingMovie({ ...movie });
        setIsEditModalOpen(true);
    };

    // ✅ แก้ไข: เพิ่ม field ให้ครบตาม Database Schema
    const handleUpdateMovie = async (e) => {
        e.preventDefault();
        if (!editingMovie) return;

        try {
            const response = await axiosInstance.put(`/movies/${editingMovie._id}`, {
                title_th: editingMovie.title_th,
                title_en: editingMovie.title_en,   // ✅ เพิ่ม
                poster_url: editingMovie.poster_url, // ✅ เพิ่ม
                genre: editingMovie.genre,
                duration_min: Number(editingMovie.duration_min), // ✅ แปลงเป็น Number
                start_date: editingMovie.start_date,
                due_date: editingMovie.due_date,
                language: editingMovie.language
            });

            if (response.data.success) {
                alert("บันทึกการแก้ไขเรียบร้อยแล้ว!");
                setIsEditModalOpen(false);
                fetchMovies();
            }
        } catch (err) {
            alert("บันทึกไม่สำเร็จ: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id, title) => {
        if (window.confirm(`คุณแน่ใจใช่ไหมว่าจะลบเรื่อง "${title}"?`)) {
            try {
                await axiosInstance.delete(`/admin/movies/${id}`);
                alert("ลบหนังเรียบร้อยแล้ว");
                fetchMovies();
            } catch (err) {
                alert("ลบไม่สำเร็จ");
            }
        }
    };

    return (
        <div className="admin-page-content-inside">
            <header className="content-header-figma">
                <div className="header-left">
                    <h1>จัดการหนัง</h1>
                    <p>กำหนดสถานะการฉายและจัดการข้อมูลภาพยนตร์ MCP CINEMA v2.0</p>
                </div>
            </header>

            <div className="movie-management-box">
                <div className="box-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                    <h2 style={{ color: 'white', fontSize: '1.4rem' }}>
                        {showSearch ? "เพิ่มหนังผ่าน TMDB API" : `รายการหนังทั้งหมด (${movies.length})`}
                    </h2>
                    <button className="btn-save-settings" onClick={() => setShowSearch(!showSearch)}>
                        {showSearch ? "กลับหน้าหลัก" : <><Plus size={18} /> <span>เพิ่มหนังใหม่ (TMDB)</span></>}
                    </button>
                </div>

                {showSearch ? (
                    <div className="tmdb-search-container">
                        <form onSubmit={handleSearchTMDB} className="input-field-figma" style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อหนังภาษาอังกฤษ..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ flex: 1, background: '#151823', border: '1px solid #334155', borderRadius: '12px', padding: '12px', color: 'white' }}
                            />
                            <button type="submit" className="btn-save-settings" style={{ minWidth: '120px' }}>
                                {isSearching ? <Loader2 className="animate-spin" /> : "ค้นหา"}
                            </button>
                        </form>
                        <div className="movie-figma-grid">
                            {searchResults.map(result => (
                                <div key={result.id} className="movie-figma-card">
                                    <img src={result.poster_url || "https://placehold.co/500x750?text=No+Image"} className="movie-poster-img" alt={result.title_th} />
                                    <div className="movie-card-info">
                                        <h3>{result.title_th}</h3>
                                        <p style={{fontSize: '0.8rem', color: '#94a3b8'}}>{result.title_en}</p>
                                        <button className="btn-add-purple" onClick={() => handleAddFromTMDB(result)} style={{ width: '100%', marginTop: '10px' }}>
                                            <Save size={14} /> <span>บันทึกลงระบบ</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    loading ? <div className="text-center p-10"><Loader2 className="animate-spin" size={40} color="#8b5cf6" /></div> : (
                        <div className="movie-categories space-y-10">
                            {['showing', 'soon', 'ended'].map((status) => (
                                <section key={status} className="mb-10">
                                    <h3 className="category-title" style={{
                                        color: status === 'showing' ? '#10b981' : status === 'soon' ? '#8b5cf6' : '#ef4444',
                                        marginBottom: '15px', borderLeft: '4px solid', paddingLeft: '10px'
                                    }}>
                                        {status === 'showing' ? '🍿 กำลังฉายอยู่' : status === 'soon' ? '🗓️ Coming Soon' : '🚫 ออกจากโปรแกรม'} ({categorizeMovies(status).length})
                                    </h3>
                                    <div className="movie-figma-grid">
                                        {categorizeMovies(status).map(movie => (
                                            <div key={movie._id} className="movie-figma-card" style={{ background: '#1e212f' }}>
                                                <img src={movie.poster_url || "https://placehold.co/500x750?text=No+Image"} className="movie-poster-img" alt={movie.title_th} />
                                                <div className="movie-card-info">
                                                    <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: '5px' }}>{movie.title_th}</h3>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>{movie.title_en}</p>
                                                    <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
                                                        <button className="btn-edit-blue" onClick={() => openEditModal(movie)} style={{ flex: 1, justifyContent: 'center' }}>
                                                            <Edit2 size={14} /> <span>แก้ไข</span>
                                                        </button>
                                                        <button className="btn-delete-red" onClick={() => handleDelete(movie._id, movie.title_th)} style={{ flex: 1, justifyContent: 'center' }}>
                                                            <Trash2 size={14} /> <span>ลบ</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* ✅ Modal แก้ไข: เพิ่ม Input ให้ครบตาม DB Schema */}
            {isEditModalOpen && editingMovie && (
                <div className="admin-loader-overlay" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', overflowY: 'auto' }}>
                    <div className="settings-card-figma" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', background: '#1e212f', padding: '30px', borderRadius: '24px' }}>
                        <button className="close-modal-btn" onClick={() => setIsEditModalOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                        <div className="settings-card-header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <Edit2 size={24} color="#8b5cf6" />
                            <h3 style={{ fontSize: '1.3rem', color: 'white' }}>แก้ไขข้อมูลภาพยนตร์</h3>
                        </div>

                        <form onSubmit={handleUpdateMovie} className="settings-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            
                            {/* Title TH */}
                            <div className="input-field-figma">
                                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>ชื่อภาพยนตร์ (TH) <span style={{color:'red'}}>*</span></label>
                                <input type="text" value={editingMovie.title_th || ''} onChange={(e) => setEditingMovie({ ...editingMovie, title_th: e.target.value })} required 
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                            </div>

                            {/* Title EN (เพิ่มใหม่) */}
                            <div className="input-field-figma">
                                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>ชื่อภาพยนตร์ (EN) <span style={{color:'red'}}>*</span></label>
                                <input type="text" value={editingMovie.title_en || ''} onChange={(e) => setEditingMovie({ ...editingMovie, title_en: e.target.value })} required 
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                            </div>

                            {/* Poster URL (เพิ่มใหม่) */}
                            <div className="input-field-figma">
                                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Poster URL</label>
                                <input type="text" value={editingMovie.poster_url || ''} onChange={(e) => setEditingMovie({ ...editingMovie, poster_url: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                            </div>

                            {/* Genre & Duration */}
                            <div className="grid grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                                <div className="input-field-figma">
                                    <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>หมวดหมู่ (Genre)</label>
                                    <input type="text" value={editingMovie.genre || ''} onChange={(e) => setEditingMovie({ ...editingMovie, genre: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                                </div>
                                <div className="input-field-figma">
                                    <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>เวลา (นาที)</label>
                                    <input type="number" value={editingMovie.duration_min || ''} onChange={(e) => setEditingMovie({ ...editingMovie, duration_min: e.target.value })} required
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                                </div>
                            </div>

                            {/* Language (เพิ่มใหม่) */}
                            <div className="input-field-figma">
                                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>ระบบเสียง (Language)</label>
                                <select value={editingMovie.language || 'TH/EN'} onChange={(e) => setEditingMovie({ ...editingMovie, language: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }}>
                                    <option value="TH">Audio: Thai</option>
                                    <option value="EN">Audio: English</option>
                                    <option value="TH/EN">Audio: TH / Sub: EN</option>
                                    <option value="EN/TH">Audio: EN / Sub: TH</option>
                                </select>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="input-field-figma">
                                    <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>เริ่มฉาย</label>
                                    <input type="date" value={editingMovie.start_date ? new Date(editingMovie.start_date).toISOString().split('T')[0] : ''} 
                                    onChange={(e) => setEditingMovie({ ...editingMovie, start_date: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                                </div>
                                <div className="input-field-figma">
                                    <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>สิ้นสุด</label>
                                    <input type="date" value={editingMovie.due_date ? new Date(editingMovie.due_date).toISOString().split('T')[0] : ''} 
                                    onChange={(e) => setEditingMovie({ ...editingMovie, due_date: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                                </div>
                            </div>

                            <button type="submit" className="btn-save-settings" style={{ width: '100%', marginTop: '10px', justifyContent: 'center', padding: '15px', borderRadius: '16px' }}>
                                <Save size={18} /> <span>บันทึกการเปลี่ยนแปลง</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}