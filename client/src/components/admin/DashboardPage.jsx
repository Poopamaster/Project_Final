import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { Film, LayoutDashboard } from 'lucide-react';
import { AlertModal, MovieCard } from './SharedComponents';

const DashboardPage = ({ refreshTrigger }) => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertState, setAlertState] = useState({ isOpen: false });

    const fetchMovies = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/movies');
            setMovies(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Failed to fetch movies", error);
            setMovies([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMovies(); }, [refreshTrigger]);

    const handleDelete = (id) => {
        setAlertState({
            isOpen: true, type: 'danger', title: 'Delete Movie?', text: 'Cannot undo this action.',
            confirmText: 'Delete', onCancel: () => setAlertState({ isOpen: false }),
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/movies/${id}`);
                    setAlertState({ isOpen: false });
                    fetchMovies();
                } catch (err) {
                    alert("Delete failed");
                }
            }
        });
    };

    // --- Logic แยกหมวดหมู่ ---
    const now = new Date();
    
    // 1. Now Showing (กำลังฉาย): วันนี้ต้องอยู่ระหว่าง start กับ due
    const nowShowingMovies = movies.filter(m => {
        const start = new Date(m.start_date);
        const due = new Date(m.due_date);
        return now >= start && now <= due;
    });

    // 2. Coming Soon (เร็วๆ นี้): วันนี้ยังไม่ถึง start
    const comingSoonMovies = movies.filter(m => {
        const start = new Date(m.start_date);
        return now < start;
    });

    // 3. Ended (ฉายจบแล้ว): วันนี้เลย due ไปแล้ว
    const endedMovies = movies.filter(m => {
        const due = new Date(m.due_date);
        return now > due;
    });

    // Component ย่อยสำหรับแสดงแต่ละ Section (จะได้ไม่ต้องเขียนซ้ำ)
    const MovieSection = ({ title, data, color }) => {
        if (data.length === 0) return null;
        return (
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'white' }}>{title}</h2>
                    <span style={{ 
                        backgroundColor: color, 
                        color: 'black', 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold', 
                        padding: '2px 8px', 
                        borderRadius: '10px' 
                    }}>
                        {data.length}
                    </span>
                </div>
                <div className="movie-grid">
                    {data.map(m => <MovieCard key={m._id} movie={m} onDelete={handleDelete} />)}
                </div>
            </div>
        );
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div><h1 className="page-title">Movie Library</h1><p className="page-subtitle">Manage movies in database</p></div>
                <div className="stat-badge">Total: <span>{movies.length}</span></div>
            </div>

            {loading ? (
                <div className="loading-container"><div className="spinner"></div></div>
            ) : movies.length === 0 ? (
                <div className="empty-state"><Film size={48} /><p>No movies found</p></div>
            ) : (
                <div className="dashboard-content">
                    {/* แสดงผลทีละหมวดหมู่ */}
                    <MovieSection title="Now Showing" data={nowShowingMovies} color="#22c55e" />
                    <MovieSection title="Coming Soon" data={comingSoonMovies} color="#eab308" />
                    <MovieSection title="Ended" data={endedMovies} color="#ef4444" />
                </div>
            )}
            
            <AlertModal {...alertState} />
        </div>
    );
};

export default DashboardPage;