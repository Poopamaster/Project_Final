import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import ChatBotPage from './pages/ChatBotPage';
import Homepage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Navbar from "./components/Navbar";
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PaymentPage from './pages/PaymentPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import MoviePage from './pages/MoviePage';
import BookingPage from './pages/BookingPage';
import SeatSelectionPage from "./pages/SeatSelectionPage";
import './style.css';

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // เช็ค token เริ่มต้น (เปิดโหมด Login ค้างไว้ตามที่คุณตั้งค่ามา)
   const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem('jwtToken');
    return token && token !== 'undefined' && token !== 'null';
    });


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

// Component สำหรับดักจับ Token จาก Google URL
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
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
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

// --- 2. ปรับ NavbarController ---
const NavbarController = () => {
    const location = useLocation();
    
    // ซ่อน Navbar กลาง เมื่ออยู่หน้าเหล่านี้ (เพราะในหน้านั้นมี Navbar ของตัวเองแล้ว หรือไม่ต้องการให้โชว์)
    if (location.pathname === '/chatbot' || 
        location.pathname === '/movies' ||
        location.pathname.startsWith('/booking') // ดักจับทุกหน้าที่ขึ้นต้นด้วย /booking
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
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/seat-selection" element={<SeatSelectionPage />} />
                
                {/* หน้าดูรายการหนังรวม */}
                <Route path="/movies" element={<MoviePage />} />

                {/* --- 3. เพิ่ม Route สำหรับ Flow การจอง --- */}
                {/* หน้าเลือกรอบฉาย (รับ ID หนัง) */}
                <Route path="/booking/:id" element={<BookingPage />} />
                

                <Route
                    path="/chatbot"
                    element={
                        <AuthGuard>
                            <ChatBotPage />
                        </AuthGuard>
                    }
                />
                <Route
                    path="/payment"
                    element={
                        <AuthGuard>
                            <PaymentPage />
                        </AuthGuard>
                    }
                />
            </Routes>
        </AuthProvider>
    );
}

export default App;