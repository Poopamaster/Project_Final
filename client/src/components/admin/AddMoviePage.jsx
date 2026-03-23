import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Save, X, ImagePlus, CheckSquare } from 'lucide-react';
import axiosInstance from "../../api/axiosInstance";

export default function AddMoviePage() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // โหมดหน้าจอ: 'list', 'tmdb', 'manual'
    const [viewMode, setViewMode] = useState('list');

    const getImageUrl = (posterPath) => {
        if (!posterPath) return "https://placehold.co/500x750?text=No+Image";
        if (posterPath.startsWith("http") || posterPath.startsWith("data:")) return posterPath;

        // ลอง log ค่าออกมาดูใน console (เฉพาะตอนพัฒนา)
        const envUrl = import.meta.env.VITE_API_URL;

        // ถ้า envUrl ไม่มีค่า ให้ใช้ / เฉยๆ (เพื่อให้มันดึงจาก domain เดียวกัน) 
        // หรือใส่ URL ของ Backend ตรงๆ ไปเลยถ้าแก้ Env ไม่ผ่านจริงๆ
        const backendUrl = envUrl ? envUrl.replace(/\/+$/, "") : "https://mcp-cinema-backend.up.railway.app";

        const cleanPath = posterPath.startsWith('/') ? posterPath : `/${posterPath}`;
        return `${backendUrl}${cleanPath}`;
    };

    // ✅ State สำหรับจัดการ Checkbox เลือกหนังหลายรายการ
    const [selectedMovies, setSelectedMovies] = useState([]);

    // Modal State สำหรับแก้ไข
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMovie, setEditingMovie] = useState(null);

    // State สำหรับเพิ่มหนังเอง (Manual Add)
    const [manualMovie, setManualMovie] = useState({
        title_th: '', title_en: '', genre: '', duration_min: '',
        start_date: '', due_date: '', language: 'TH/EN'
    });
    const [posterFile, setPosterFile] = useState(null);
    const [posterPreview, setPosterPreview] = useState(null);

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

    // --- ส่วนของการเลือกและลบหลายรายการ ---
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
                // ใช้ Promise.all เพื่อยิง API ลบทีละตัวพร้อมๆ กัน (ไม่ต้องแก้ Backend)
                await Promise.all(selectedMovies.map(id => axiosInstance.delete(`/admin/movies/${id}`)));
                alert("ลบภาพยนตร์ที่เลือกเรียบร้อยแล้ว");
                setSelectedMovies([]); // เคลียร์การเลือก
                fetchMovies(); // โหลดข้อมูลใหม่
            } catch (err) {
                alert("เกิดข้อผิดพลาดในการลบข้อมูลบางรายการ");
            }
        }
    };

    // --- ส่วนของ TMDB ---
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

    // --- ส่วนของการเพิ่มหนังเอง (Manual) ---
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

        if (posterFile) {
            formData.append('poster', posterFile);
        }

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

    // --- ส่วนของการแก้ไขหนัง ---
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
                // หากลบตัวที่เลือกค้างไว้อยู่ ให้เอาออกจาก State ด้วย
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
                <div className="box-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
                    <h2 style={{ color: 'white', fontSize: '1.4rem', margin: 0 }}>
                        {viewMode === 'tmdb' ? "เพิ่มหนังผ่าน TMDB API" : viewMode === 'manual' ? "เพิ่มภาพยนตร์ (Manual)" : `รายการหนังทั้งหมด (${movies.length})`}
                    </h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {/* ปุ่มกลับหน้าหลัก */}
                        {viewMode !== 'list' && (
                            <button className="btn-cancel" onClick={() => setViewMode('list')} style={{ padding: '8px 15px', borderRadius: '8px', background: '#334155', color: 'white', border: 'none', cursor: 'pointer' }}>
                                กลับหน้าหลัก
                            </button>
                        )}

                        {/* ✅ ปุ่มลบหลายรายการ จะโผล่มาเมื่อมีการเลือกหนัง 1 เรื่องขึ้นไป */}
                        {viewMode === 'list' && selectedMovies.length > 0 && (
                            <button onClick={handleBulkDelete} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                                <Trash2 size={18} /> ลบที่เลือก ({selectedMovies.length})
                            </button>
                        )}

                        {viewMode === 'list' && (
                            <>
                                <button className="btn-save-settings" onClick={() => setViewMode('tmdb')} style={{ background: '#3b82f6' }}>
                                    <Plus size={18} /> <span>ดึงจาก TMDB</span>
                                </button>
                                <button className="btn-save-settings" onClick={() => setViewMode('manual')} style={{ background: '#10b981' }}>
                                    <Plus size={18} /> <span>เพิ่มหนังเอง</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* --- โหมดเพิ่มหนังเอง (Manual Form) --- */}
                {viewMode === 'manual' && (
                    <div className="settings-card-figma" style={{ background: '#1e212f', padding: '30px', borderRadius: '24px', maxWidth: '800px', margin: '0 auto' }}>
                        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '30px' }}>
                                <div style={{ width: '200px', flexShrink: 0 }}>
                                    <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>อัปโหลด Poster</label>
                                    <div
                                        style={{
                                            width: '100%', height: '300px', background: '#0d0f17', border: '2px dashed #334155', borderRadius: '12px',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            position: 'relative', overflow: 'hidden', cursor: 'pointer'
                                        }}
                                        onClick={() => document.getElementById('posterInput').click()}
                                    >
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
                                        <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>ชื่อภาพยนตร์ (TH) <span style={{ color: 'red' }}>*</span></label>
                                        <input type="text" value={manualMovie.title_th} onChange={(e) => setManualMovie({ ...manualMovie, title_th: e.target.value })} required style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                                    </div>
                                    <div className="input-field-figma">
                                        <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>ชื่อภาพยนตร์ (EN) <span style={{ color: 'red' }}>*</span></label>
                                        <input type="text" value={manualMovie.title_en} onChange={(e) => setManualMovie({ ...manualMovie, title_en: e.target.value })} required style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                                        <div className="input-field-figma">
                                            <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>หมวดหมู่ (Genre)</label>
                                            <input type="text" value={manualMovie.genre} onChange={(e) => setManualMovie({ ...manualMovie, genre: e.target.value })} placeholder="เช่น Action, Sci-Fi" required style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                                        </div>
                                        <div className="input-field-figma">
                                            <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>เวลา (นาที)</label>
                                            <input type="number" value={manualMovie.duration_min} onChange={(e) => setManualMovie({ ...manualMovie, duration_min: e.target.value })} required style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                                        </div>
                                    </div>
                                    <div className="input-field-figma">
                                        <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>ระบบเสียง (Language)</label>
                                        <select value={manualMovie.language} onChange={(e) => setManualMovie({ ...manualMovie, language: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }}>
                                            <option value="TH">Audio: Thai</option>
                                            <option value="EN">Audio: English</option>
                                            <option value="TH/EN">Audio: TH / Sub: EN</option>
                                            <option value="EN/TH">Audio: EN / Sub: TH</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="input-field-figma">
                                            <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>เริ่มฉาย</label>
                                            <input type="date" value={manualMovie.start_date} onChange={(e) => setManualMovie({ ...manualMovie, start_date: e.target.value })} required style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                                        </div>
                                        <div className="input-field-figma">
                                            <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>สิ้นสุดการฉาย</label>
                                            <input type="date" value={manualMovie.due_date} onChange={(e) => setManualMovie({ ...manualMovie, due_date: e.target.value })} required style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="btn-save-settings" style={{ width: '100%', marginTop: '10px', justifyContent: 'center', padding: '15px', borderRadius: '16px', background: '#10b981' }}>
                                <Save size={18} /> <span>เพิ่มภาพยนตร์เข้าสู่ระบบ</span>
                            </button>
                        </form>
                    </div>
                )}

                {/* --- โหมดค้นหา TMDB --- */}
                {viewMode === 'tmdb' && (
                    <div className="tmdb-search-container">
                        <form onSubmit={handleSearchTMDB} className="input-field-figma" style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                            <input type="text" placeholder="ค้นหาชื่อหนังภาษาอังกฤษ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, background: '#151823', border: '1px solid #334155', borderRadius: '12px', padding: '12px', color: 'white' }} />
                            <button type="submit" className="btn-save-settings" style={{ minWidth: '120px' }}>
                                {isSearching ? <Loader2 className="animate-spin" /> : "ค้นหา"}
                            </button>
                        </form>
                        <div className="movie-figma-grid">
                            {searchResults.map(result => (
                                <div key={result.id} className="movie-figma-card">
                                    {/* ✅ ตัด getImageUrl ทิ้งแล้วใช้รูปตรงๆ */}
                                    <img src={getImageUrl(result.poster_url)} className="movie-poster-img" alt={result.title_th} />
                                    <div className="movie-card-info">
                                        <h3>{result.title_th}</h3>
                                        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{result.title_en}</p>
                                        <button className="btn-add-purple" onClick={() => handleAddFromTMDB(result)} style={{ width: '100%', marginTop: '10px' }}>
                                            <Save size={14} /> <span>บันทึกลงระบบ</span>
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
                                            // ✅ ใส่ position: 'relative' เพื่อให้ Checkbox ลอยอยู่บนการ์ดได้
                                            <div key={movie._id} className="movie-figma-card" style={{ background: '#1e212f', position: 'relative' }}>

                                                {/* ✅ Checkbox สำหรับเลือกทีละหลายรายการ */}
                                                <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMovies.includes(movie._id)}
                                                        onChange={() => toggleSelectMovie(movie._id)}
                                                        style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#ef4444' }}
                                                    />
                                                </div>

                                                {/* ✅ ตัด getImageUrl ทิ้ง ใช้ URL จาก Mongoose Getter ได้เลย */}
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

            {/* ✅ Modal แก้ไข */}
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

                            <div className="input-field-figma">
                                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>ชื่อภาพยนตร์ (TH) <span style={{ color: 'red' }}>*</span></label>
                                <input type="text" value={editingMovie.title_th || ''} onChange={(e) => setEditingMovie({ ...editingMovie, title_th: e.target.value })} required
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                            </div>

                            <div className="input-field-figma">
                                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>ชื่อภาพยนตร์ (EN) <span style={{ color: 'red' }}>*</span></label>
                                <input type="text" value={editingMovie.title_en || ''} onChange={(e) => setEditingMovie({ ...editingMovie, title_en: e.target.value })} required
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                            </div>

                            <div className="input-field-figma">
                                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Poster URL (ลิงก์รูปภาพ หรือ Path ระบบ)</label>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    {/* ✅ ตัด getImageUrl ออกแล้ว */}
                                    <img src={getImageUrl(editingMovie.poster_url)} alt="preview" style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '8px' }} />
                                    <input type="text" value={editingMovie.poster_url || ''} onChange={(e) => setEditingMovie({ ...editingMovie, poster_url: e.target.value })}
                                        style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#0d0f17', border: '1px solid #334155', color: 'white' }} />
                                </div>
                            </div>

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