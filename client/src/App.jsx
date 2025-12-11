import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import ChatBotPage from './pages/ChatBotPage';
import Homepage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Navbar from "./components/Navbar";
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PaymentPage from './pages/PaymentPage';
import MoviePage from './pages/MoviePage'; // Import ถูกต้องแล้ว
import './style.css';

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return !!localStorage.getItem('jwtToken');
    });

    const login = (token) => {
        localStorage.setItem('jwtToken', token);
        setIsLoggedIn(true);
    };

    const logout = () => {
        localStorage.removeItem('jwtToken');
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
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

// ตัวจัดการ Navbar: เลือกว่าหน้าไหนจะโชว์/ไม่โชว์ Navbar กลาง
const NavbarController = () => {
    const location = useLocation();
    
    // หน้า Chatbot ไม่เอา Navbar
    if (location.pathname === '/chatbot') {
        return null;
    }

    // หน้า Movies (ในไฟล์ MoviePage.jsx มี Navbar ของตัวเองอยู่แล้ว ให้ซ่อนอันนี้เพื่อไม่ให้ซ้ำ)
    if (location.pathname === '/movies') {
        return null;
    }

    return <Navbar />;
};

function App() {
    return (
        <AuthProvider>
            <div style={{ backgroundColor: '#f3f4f6', fontFamily: 'Prompt, sans-serif' }}>
                <NavbarController />
            </div>

            <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                
                {/* เพิ่ม Route สำหรับหน้า Movies (เข้าดูได้ทุกคน ไม่ต้อง Login) */}
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