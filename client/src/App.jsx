import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import ChatBotPage from './pages/ChatBotPage';
import Homepage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Navbar from "./components/Navbar";
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import MoviePage from './pages/MoviePage';
import BookingPage from './pages/BookingPage';
import SeatSelectionPage from "./pages/SeatSelectionPage";
import AdminPage from './pages/AdminPage';
import HistoryPage from './pages/HistoryPage';
import LogSystemPage from './components/admin/LogSystemPage';

// ✅ Import หน้าจัดการรอบฉายที่คุณต้องการเพิ่ม
import ShowtimePageAdmin from './components/admin/ShowtimePageAdmin'; 

import './style.css';

export const AuthContext = createContext(null);

const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decoded = JSON.parse(jsonPayload);
        if (!decoded.exp) return true;
        return (decoded.exp * 1000) < Date.now();
    } catch (error) {
        return true;
    }
};

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('jwtToken'));

    const login = (token, userData) => {
        localStorage.setItem('jwtToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsLoggedIn(true);
    };

    const logout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('user');
        localStorage.removeItem('ChatbotHistory');
        setUser(null);
        setIsLoggedIn(false);
    };

    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            if (isTokenExpired(token)) {
                alert("เซสชันของคุณหมดอายุ กรุณาเข้าสู่ระบบใหม่");
                logout();
            } else {
                setIsLoggedIn(true);
                setUser(JSON.parse(storedUser));
            }
        } else {
            logout();
        }
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

const AuthGuard = ({ children }) => {
    const { isLoggedIn } = useContext(AuthContext);
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const GoogleAuthHandler = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    useEffect(() => {
        if (location.pathname === '/verify-email') return;
        const params = new URLSearchParams(location.search);
        const tokenFromUrl = params.get('token');

        if (tokenFromUrl) {
            try {
                const base64Url = tokenFromUrl.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const decoded = JSON.parse(jsonPayload);
                const userData = {
                    _id: decoded.id || decoded._id,
                    role: decoded.role || 'user',
                    name: decoded.name || decoded.displayName || decoded.username || decoded.email.split('@')[0],
                    email: decoded.email || "Google Account"
                };
                login(tokenFromUrl, userData);
                navigate('/');
            } catch (error) {
                console.error("Failed to process Google Token:", error);
            }
        }
    }, [location, login, navigate]);
    return null;
};

const NavbarController = () => {
    const location = useLocation();
    if (location.pathname === '/chatbot' ||
        location.pathname === '/movies' ||
        location.pathname === '/payment' ||
        location.pathname.startsWith('/booking') ||
        location.pathname.startsWith('/admin') // ✅ ซ่อน Navbar หลักเมื่ออยู่ในหน้า Admin
    ) {
        return null;
    }
    return <Navbar />;
};

function App() {
    return (
        <AuthProvider>
            <GoogleAuthHandler />

            <div style={{ fontFamily: 'Prompt' }}>
                <NavbarController />
            </div>

            <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />

                {/* Flow การจอง */}
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/seat-selection" element={<SeatSelectionPage />} />
                <Route path="/movies" element={<MoviePage />} />
                <Route path="/booking/:id" element={<BookingPage />} />
                <Route path="/history" element={<HistoryPage />} />

                {/* ✅ ส่วนของ Admin Dashboard */}
                <Route path="/admin" element={<AdminPage />} />
                
                {/* ✅ เพิ่ม Route สำหรับหน้าจัดการรอบฉาย โดยให้ AdminPage เป็น Layout คลุมไว้ */}
                <Route path="/admin/showtimes" element={<AdminPage><ShowtimePageAdmin /></AdminPage>} />
                
                <Route path="/admin/logs" element={<AdminPage><LogSystemPage /></AdminPage>} />
                
                <Route
                    path="/chatbot"
                    element={
                        <AuthGuard>
                            <ChatBotPage />
                        </AuthGuard>
                    }
                />
            </Routes>
        </AuthProvider>
    );
}

export default App;