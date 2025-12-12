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
import './style.css';

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // เช็ค token เริ่มต้น (ใช้ key 'jwtToken' ตามที่คุณใช้ใน login function)
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

// ✅ Component ใหม่: สำหรับดักจับ Token จาก Google URL
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
                    _id: decoded.id || decoded._id, // เผื่อ key ไม่ตรง
                    role: decoded.role || 'user',
                    
                    // ✅ แก้ไข: ดึงชื่อจริงออกมา (เช็คหลายๆ key เผื่อ backend ส่งมาต่างกัน)
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
    if (location.pathname === '/chatbot' || location.pathname === '/movies') {
        return null;
    }
    return <Navbar />;
};

function App() {
    return (
        <AuthProvider>
            {/* ✅ ใส่ GoogleAuthHandler ไว้ตรงนี้เพื่อดักจับ URL ทุกหน้า */}
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
                <Route path="/movies" element={<MoviePage />} />

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