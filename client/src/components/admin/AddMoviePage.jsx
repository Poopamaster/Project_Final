import React, { useState } from 'react';
import api from '../../api/axiosInstance';
import { Search, Save, Languages, Clapperboard } from 'lucide-react';
import { AlertModal } from './SharedComponents';

const AddMoviePage = ({ onMovieAdded }) => {
    const [step, setStep] = useState('search');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alertState, setAlertState] = useState({ isOpen: false });

    const [form, setForm] = useState({
        title_th: '', title_en: '', poster_url: '', genre: '',
        duration_min: 120, language: 'TH', start_date: '', due_date: ''
    });

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        try {
            const res = await api.get('/admin/tmdb/search', { params: { query } });
            setResults(res.data.results || []);
        } catch (err) {
            console.error(err);
            alert("Search failed. Check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (m) => {
        setForm(prev => ({
            ...prev,
            title_th: m.title_th || m.title_en,
            title_en: m.title_en,
            poster_url: m.poster_url || "",
            genre: "", duration_min: 120, language: "TH", start_date: "", due_date: ""
        }));
        setStep('edit');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.title_en || !form.start_date || !form.due_date) {
            setAlertState({ isOpen: true, type: 'danger', title: 'Missing Info', text: 'Please fill Titles and Dates.', onConfirm: () => setAlertState({ isOpen: false }) });
            return;
        }
        try {
            await api.post('/admin/movies', form);
            setAlertState({ isOpen: true, type: 'success', title: 'Success', text: 'Movie saved!', confirmText: 'Done', onConfirm: () => {
                setAlertState({ isOpen: false });
                onMovieAdded();
            }});
        } catch (err) {
            setAlertState({ isOpen: true, type: 'danger', title: 'Error', text: 'Failed to save.', onConfirm: () => setAlertState({ isOpen: false }) });
        }
    };

    return (
        <div className="page-container">
            <div className="page-header"><h1 className="page-title">Add New Movie</h1></div>
            
            {step === 'search' && (
                <div className="search-container">
                    <form onSubmit={handleSearch} className="search-bar">
                        <input className="form-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search TMDB..." autoFocus />
                        <button type="submit" disabled={loading} className="btn-primary">{loading ? '...' : <Search />}</button>
                    </form>
                    <div className="search-results">
                        {results.map((m, i) => (
                            <div key={i} className="result-card">
                                <img src={m.poster_url || "https://via.placeholder.com/100x150"} className="result-poster" alt="" />
                                <div style={{flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
                                    <div><h4 style={{margin:0}}>{m.title_en}</h4><small style={{color:'#737373'}}>{m.title_th}</small></div>
                                    <button onClick={() => handleSelect(m)} className="btn-outline">Select</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 'edit' && (
                <div className="split-form">
                    <div className="poster-preview-panel">
                        <img src={form.poster_url} alt="Preview" style={{width:'100%', borderRadius:'8px'}} onError={e => e.target.src="https://via.placeholder.com/300x450"}/>
                        <button onClick={() => setStep('search')} className="btn-secondary" style={{width:'100%', marginTop:'1rem'}}>Change Movie</button>
                    </div>
                    <div className="form-panel">
                        <form onSubmit={handleSave} className="form-body">
                            <div className="grid-2">
                                <div className="form-group"><label>Title (EN)</label><input className="form-input" value={form.title_en} onChange={e => setForm({...form, title_en: e.target.value})} required /></div>
                                <div className="form-group"><label>Title (TH)</label><input className="form-input" value={form.title_th} onChange={e => setForm({...form, title_th: e.target.value})} /></div>
                            </div>
                            <div className="grid-3">
                                <div className="form-group"><label>Genre</label><input className="form-input" value={form.genre} onChange={e => setForm({...form, genre: e.target.value})} /></div>
                                <div className="form-group"><label>Duration</label><input type="number" className="form-input" value={form.duration_min} onChange={e => setForm({...form, duration_min: parseInt(e.target.value)})} /></div>
                                <div className="form-group"><label>Language</label>
                                    <select className="form-input" value={form.language} onChange={e => setForm({...form, language: e.target.value})}>
                                        <option value="TH">TH</option><option value="EN">EN</option><option value="TH/EN">TH/EN</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group"><label style={{color:'var(--primary-red)'}}>Start Date *</label><input type="date" className="form-input" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required /></div>
                                <div className="form-group"><label style={{color:'var(--primary-red)'}}>End Date *</label><input type="date" className="form-input" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} required /></div>
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={() => setStep('search')} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary"><Save size={18}/> Save Movie</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <AlertModal {...alertState} />
        </div>
    );
};

export default AddMoviePage;