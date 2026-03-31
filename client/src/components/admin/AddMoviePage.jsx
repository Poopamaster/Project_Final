import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Save, X, ImagePlus, CheckSquare } from 'lucide-react';
import axiosInstance from "../../api/axiosInstance";
import '../../css/AddMoviePage.css'; // ✅ Import CSS ที่แยกออกมา

export default function AddMoviePage() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const [viewMode, setViewMode] = useState('list');
    const [selectedMovies, setSelectedMovies] = useState([]);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMovie, setEditingMovie] = useState(null);

    const [manualMovie, setManualMovie] = useState({
        title_th: '', title_en: '', genre: '', duration_min: '',
        start_date: '', due_date: '', language: 'TH/EN'
    });
    const [posterFile, setPosterFile] = useState(null);
    const [posterPreview, setPosterPreview] = useState(null);

    const getImageUrl = (posterPath) => {
        if (!posterPath) return "https://placehold.co/500x750?text=No+Image";
        if (posterPath.startsWith("http") || posterPath.startsWith("data:")) return posterPath;
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const backendUrl = isLocalhost ? "http://localhost:5000" : "https://mcp-cinema-backend.up.railway.app";
        const cleanPath = posterPath.startsWith('/') ? posterPath : `/${posterPath}`;
        return `${backendUrl}${cleanPath}`;
    };

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

    const toggleSelectMovie = (id) => {
        if (selectedMovies.includes(id)) {
            setSelectedMovies(selectedMovies.filter(movieId => movieId !== id));
        } else {
            setSelectedMovies([...selectedMovies, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedMovies.length === 0) return;
        if (window.confirm(`คุณแน่ใจหรือไม่ว่าจะลบภาพยนตร์ที่เลือกจำนวน ${selectedMovies.length} เรื่อง? (การกระทำนี้ย้อนกลับไม่ได้)`)) {
            try {
                await Promise.all(selectedMovies.map(id => axiosInstance.delete(`/admin/movies/${id}`)));
                alert("ลบภาพยนตร์ที่เลือกเรียบร้อยแล้ว");
                setSelectedMovies([]); 
                fetchMovies(); 
            } catch (err) {
                alert("เกิดข้อผิดพลาดในการลบข้อมูลบางรายการ");
            }
        }
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
                setViewMode('list');
                fetchMovies();
            }
        } catch (err) {
            alert("ไม่สามารถเพิ่มหนังได้");
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPosterFile(file);
            setPosterPreview(URL.createObjectURL(file));
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title_th', manualMovie.title_th);
        formData.append('title_en', manualMovie.title_en);
        formData.append('genre', manualMovie.genre);
        formData.append('duration_min', manualMovie.duration_min);
        formData.append('start_date', manualMovie.start_date);
        formData.append('due_date', manualMovie.due_date);
        formData.append('language', manualMovie.language);
        if (posterFile) formData.append('poster', posterFile);

        try {
            const response = await axiosInstance.post('/admin/movies', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                alert("เพิ่มภาพยนตร์สำเร็จ!");
                setViewMode('list');
                setManualMovie({ title_th: '', title_en: '', genre: '', duration_min: '', start_date: '', due_date: '', language: 'TH/EN' });
                setPosterFile(null);
                setPosterPreview(null);
                fetchMovies();
            }
        } catch (err) {
            alert("บันทึกไม่สำเร็จ: " + (err.response?.data?.message || err.message));
        }
    };

    const openEditModal = (movie) => {
        setEditingMovie({ ...movie });
        setIsEditModalOpen(true);
    };

    const handleUpdateMovie = async (e) => {
        e.preventDefault();
        if (!editingMovie) return;
        try {
            const response = await axiosInstance.put(`/admin/movies/${editingMovie._id}`, {
                title_th: editingMovie.title_th,
                title_en: editingMovie.title_en,
                poster_url: editingMovie.poster_url,
                genre: editingMovie.genre,
                duration_min: Number(editingMovie.duration_min),
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
                setSelectedMovies(prev => prev.filter(movieId => movieId !== id));
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
                {/* Header ส่วน Action Buttons */}
                <div className="box-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
                    <h2 style={{ color: 'white', fontSize: '1.4rem', margin: 0 }}>
                        {viewMode === 'tmdb' ? "เพิ่มหนังผ่าน TMDB API" : viewMode === 'manual' ? "เพิ่มภาพยนตร์ (Manual)" : `รายการหนังทั้งหมด (${movies.length})`}
                    </h2>
                    
                    {/* ✅ ใช้คลาส CSS ที่แยกออกมาจัดการปุ่มให้เท่ากัน */}
                    <div className="action-buttons">
                        {viewMode !== 'list' && (
                            <button className="btn-action btn-back" onClick={() => setViewMode('list')}>
                                กลับหน้าหลัก
                            </button>
                        )}
                        {viewMode === 'list' && selectedMovies.length > 0 && (
                            <button className="btn-action btn-delete" onClick={handleBulkDelete}>
                                <Trash2 size={18} /> ลบที่เลือก ({selectedMovies.length})
                            </button>
                        )}
                        {viewMode === 'list' && (
                            <>
                                <button className="btn-action btn-tmdb" onClick={() => setViewMode('tmdb')}>
                                    <Plus size={18} /> ดึงจาก TMDB
                                </button>
                                <button className="btn-action btn-manual" onClick={() => setViewMode('manual')}>
                                    <Plus size={18} /> เพิ่มหนังเอง
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* --- โหมดเพิ่มหนังเอง (Manual Form) --- */}
                {viewMode === 'manual' && (
                    <div className="form-card">
                        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '30px' }}>
                                <div style={{ width: '200px', flexShrink: 0 }}>
                                    <label className="form-label">อัปโหลด Poster</label>
                                    <div className="poster-upload-box" onClick={() => document.getElementById('posterInput').click()}>
                                        {posterPreview ? (
                                            <img src={posterPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <>
                                                <ImagePlus size={40} color="#64748b" style={{ marginBottom: '10px' }} />
                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>คลิกเพื่อเลือกไฟล์รูป</span>
                                            </>
                                        )}
                                        <input id="posterInput" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                    </div>
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div className="input-field-figma">
                                        <label className="form-label">ชื่อภาพยนตร์ (TH) <span style={{ color: 'red' }}>*</span></label>
                                        <input type="text" className="form-input" value={manualMovie.title_th} onChange={(e) => setManualMovie({ ...manualMovie, title_th: e.target.value })} required />
                                    </div>
                                    <div className="input-field-figma">
                                        <label className="form-label">ชื่อภาพยนตร์ (EN) <span style={{ color: 'red' }}>*</span></label>
                                        <input type="text" className="form-input" value={manualMovie.title_en} onChange={(e) => setManualMovie({ ...manualMovie, title_en: e.target.value })} required />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                                        <div className="input-field-figma">
                                            <label className="form-label">หมวดหมู่ (Genre)</label>
                                            <input type="text" className="form-input" value={manualMovie.genre} onChange={(e) => setManualMovie({ ...manualMovie, genre: e.target.value })} placeholder="เช่น Action, Sci-Fi" required />
                                        </div>
                                        <div className="input-field-figma">
                                            <label className="form-label">เวลา (นาที)</label>
                                            <input type="number" className="form-input" value={manualMovie.duration_min} onChange={(e) => setManualMovie({ ...manualMovie, duration_min: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div className="input-field-figma">
                                        <label className="form-label">ระบบเสียง (Language)</label>
                                        <select className="form-input" value={manualMovie.language} onChange={(e) => setManualMovie({ ...manualMovie, language: e.target.value })}>
                                            <option value="TH">Audio: Thai</option>
                                            <option value="EN">Audio: English</option>
                                            <option value="TH/EN">Audio: TH / Sub: EN</option>
                                            <option value="EN/TH">Audio: EN / Sub: TH</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="input-field-figma">
                                            <label className="form-label">เริ่มฉาย</label>
                                            <input type="date" className="form-input" value={manualMovie.start_date} onChange={(e) => setManualMovie({ ...manualMovie, start_date: e.target.value })} required />
                                        </div>
                                        <div className="input-field-figma">
                                            <label className="form-label">สิ้นสุดการฉาย</label>
                                            <input type="date" className="form-input" value={manualMovie.due_date} onChange={(e) => setManualMovie({ ...manualMovie, due_date: e.target.value })} required />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="btn-action btn-manual" style={{ width: '100%', height: '50px', marginTop: '10px' }}>
                                <Save size={18} /> เพิ่มภาพยนตร์เข้าสู่ระบบ
                            </button>
                        </form>
                    </div>
                )}

                {/* --- โหมดค้นหา TMDB --- */}
                {viewMode === 'tmdb' && (
                    <div className="tmdb-search-container">
                        <form onSubmit={handleSearchTMDB} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                            <input type="text" className="form-input" placeholder="ค้นหาชื่อหนังภาษาอังกฤษ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ background: '#151823' }} />
                            <button type="submit" className="btn-action btn-tmdb" style={{ minWidth: '120px' }}>
                                {isSearching ? <Loader2 className="animate-spin" /> : "ค้นหา"}
                            </button>
                        </form>
                        <div className="movie-figma-grid">
                            {searchResults.map(result => (
                                <div key={result.id} className="movie-figma-card">
                                    <img src={getImageUrl(result.poster_url)} className="movie-poster-img" alt={result.title_th} />
                                    <div className="movie-card-info">
                                        <h3>{result.title_th}</h3>
                                        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{result.title_en}</p>
                                        <button className="btn-action btn-tmdb" onClick={() => handleAddFromTMDB(result)} style={{ width: '100%', marginTop: '10px' }}>
                                            <Save size={14} /> บันทึกลงระบบ
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- โหมดแสดงลิสต์หนังทั้งหมด --- */}
                {viewMode === 'list' && (
                    loading ? <div className="text-center p-10"><Loader2 className="animate-spin" size={40} color="#8b5cf6" /></div> : (
                        <div className="movie-categories space-y-10">
                            {['showing', 'soon', 'ended'].map((status) => (
                                <section key={status} className="mb-10">
                                    <h3 className="category-title" style={{ color: status === 'showing' ? '#10b981' : status === 'soon' ? '#8b5cf6' : '#ef4444', marginBottom: '15px', borderLeft: '4px solid', paddingLeft: '10px' }}>
                                        {status === 'showing' ? '🍿 กำลังฉายอยู่' : status === 'soon' ? '🗓️ Coming Soon' : '🚫 ออกจากโปรแกรม'} ({categorizeMovies(status).length})
                                    </h3>
                                    <div className="movie-figma-grid">
                                        {categorizeMovies(status).map(movie => (
                                            <div key={movie._id} className="movie-figma-card" style={{ background: '#1e212f', position: 'relative' }}>
                                                <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                                                    <input type="checkbox" checked={selectedMovies.includes(movie._id)} onChange={() => toggleSelectMovie(movie._id)} style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#ef4444' }} />
                                                </div>
                                                <img src={movie.poster_url || "https://placehold.co/500x750?text=No+Image"} className="movie-poster-img" alt={movie.title_th} />
                                                <div className="movie-card-info">
                                                    <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: '5px' }}>{movie.title_th}</h3>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>{movie.title_en}</p>
                                                    <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
                                                        <button className="btn-action btn-tmdb" onClick={() => openEditModal(movie)} style={{ flex: 1, height: '36px' }}>
                                                            <Edit2 size={14} /> แก้ไข
                                                        </button>
                                                        <button className="btn-action btn-delete" onClick={() => handleDelete(movie._id, movie.title_th)} style={{ flex: 1, height: '36px' }}>
                                                            <Trash2 size={14} /> ลบ
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

            {/* ✅ Modal แก้ไข (ทำส่วนที่ขาดให้เสร็จสมบูรณ์) */}
            {isEditModalOpen && editingMovie && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="close-modal-btn" onClick={() => setIsEditModalOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                        <div className="settings-card-header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <Edit2 size={24} color="#8b5cf6" />
                            <h3 style={{ fontSize: '1.3rem', color: 'white' }}>แก้ไขข้อมูลภาพยนตร์</h3>
                        </div>

                        <form onSubmit={handleUpdateMovie} className="settings-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="input-field-figma">
                                <label className="form-label">ชื่อภาพยนตร์ (TH) <span style={{ color: 'red' }}>*</span></label>
                                <input type="text" className="form-input" value={editingMovie.title_th || ''} onChange={(e) => setEditingMovie({ ...editingMovie, title_th: e.target.value })} required />
                            </div>

                            <div className="input-field-figma">
                                <label className="form-label">ชื่อภาพยนตร์ (EN) <span style={{ color: 'red' }}>*</span></label>
                                <input type="text" className="form-input" value={editingMovie.title_en || ''} onChange={(e) => setEditingMovie({ ...editingMovie, title_en: e.target.value })} required />
                            </div>

                            <div className="input-field-figma">
                                <label className="form-label">Poster URL</label>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <img src={getImageUrl(editingMovie.poster_url)} alt="preview" style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '8px' }} />
                                    <input type="text" className="form-input" value={editingMovie.poster_url || ''} onChange={(e) => setEditingMovie({ ...editingMovie, poster_url: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                                <div className="input-field-figma">
                                    <label className="form-label">หมวดหมู่ (Genre)</label>
                                    <input type="text" className="form-input" value={editingMovie.genre || ''} onChange={(e) => setEditingMovie({ ...editingMovie, genre: e.target.value })} />
                                </div>
                                <div className="input-field-figma">
                                    <label className="form-label">เวลา (นาที)</label>
                                    <input type="number" className="form-input" value={editingMovie.duration_min || ''} onChange={(e) => setEditingMovie({ ...editingMovie, duration_min: e.target.value })} required />
                                </div>
                            </div>

                            <div className="input-field-figma">
                                <label className="form-label">ระบบเสียง (Language)</label>
                                <select className="form-input" value={editingMovie.language || 'TH/EN'} onChange={(e) => setEditingMovie({ ...editingMovie, language: e.target.value })}>
                                    <option value="TH">Audio: Thai</option>
                                    <option value="EN">Audio: English</option>
                                    <option value="TH/EN">Audio: TH / Sub: EN</option>
                                    <option value="EN/TH">Audio: EN / Sub: TH</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="input-field-figma">
                                    <label className="form-label">เริ่มฉาย</label>
                                    <input type="date" className="form-input" value={editingMovie.start_date ? new Date(editingMovie.start_date).toISOString().split('T')[0] : ''} onChange={(e) => setEditingMovie({ ...editingMovie, start_date: e.target.value })} required />
                                </div>
                                <div className="input-field-figma">
                                    <label className="form-label">สิ้นสุด</label>
                                    <input type="date" className="form-input" value={editingMovie.due_date ? new Date(editingMovie.due_date).toISOString().split('T')[0] : ''} onChange={(e) => setEditingMovie({ ...editingMovie, due_date: e.target.value })} required />
                                </div>
                            </div>

                            <button type="submit" className="btn-action btn-tmdb" style={{ width: '100%', height: '50px', marginTop: '10px' }}>
                                <Save size={18} /> บันทึกการแก้ไข
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}