import React from 'react';
import { CheckCircle, AlertTriangle, Calendar, Clock, Trash2 } from 'lucide-react';

export const AlertModal = ({ isOpen, type, title, text, onConfirm, onCancel, confirmText = "OK" }) => {
    if (!isOpen) return null;
    const modalTypeClass = type === 'danger' ? 'danger' : 'success';
    const Icon = type === 'danger' ? AlertTriangle : CheckCircle;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className={`modal-icon-wrapper ${modalTypeClass}`}><Icon size={32} /></div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>{title}</h3>
                    <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>{text}</p>
                    <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                        {onCancel && <button onClick={onCancel} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>}
                        <button onClick={onConfirm} className={`btn-primary`} style={{ flex: 1, backgroundColor: type === 'danger' ? '#dc2626' : '#16a34a' }}>{confirmText}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const StatusBadge = ({ start_date, due_date }) => {
    const today = new Date();
    const start = new Date(start_date);
    const due = new Date(due_date);
    
    let status = 'ended';
    let label = 'Ended';
    
    if (today < start) {
        status = 'coming';
        label = 'Coming Soon';
    } else if (today >= start && today <= due) {
        status = 'showing';
        label = 'Now Showing';
    }

    return <span className={`status-badge ${status}`}>{label}</span>;
};

export const MovieCard = ({ movie, onDelete }) => {
    const displayDate = movie.start_date ? new Date(movie.start_date).toLocaleDateString('en-GB') : 'TBA';

    return (
        <div className="movie-card">
            <div className="card-poster">
                <img src={movie.poster_url} alt={movie.title_en} onError={(e) => e.target.src = "https://via.placeholder.com/300x450?text=No+Image"} />
                <div className="card-overlay" />
                <StatusBadge start_date={movie.start_date} due_date={movie.due_date} />
                {movie.language && <div className="lang-badge">{movie.language}</div>}
            </div>
            <div className="card-content">
                <h3 className="card-title">{movie.title_th || movie.title_en}</h3>
                <p className="card-subtitle">{movie.title_en}</p>
                <div className="card-meta">
                    <div className="meta-item"><Calendar size={14} /><span>{displayDate}</span></div>
                    <div className="meta-item"><Clock size={14} /><span>{movie.duration_min} min</span></div>
                </div>
                <button onClick={() => onDelete(movie._id)} className="btn-remove">
                    <Trash2 size={16} /><span>Remove</span>
                </button>
            </div>
        </div>
    );
};