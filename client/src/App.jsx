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
    // 1. เพิ่ม State สำหรับเก็บข้อมูล User (โหลดจาก localStorage ถ้ามี)
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // State เช็คว่า Login หรือยัง
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return !!localStorage.getItem('jwtToken');
    });

    // 2. แก้ฟังก์ชัน login ให้รับ userData ด้วย
    const login = (token, userData) => {
        localStorage.setItem('jwtToken', token);
        localStorage.setItem('user', JSON.stringify(userData)); // บันทึกข้อมูล User ลงเครื่อง
        
        setUser(userData);      // อัปเดตตัวแปร user
        setIsLoggedIn(true);    // อัปเดตสถานะ login
    };

    // 3. แก้ฟังก์ชัน logout ให้ล้างข้อมูล User ด้วย
    const logout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('user'); // ล้างข้อมูล User
        localStorage.removeItem('ChatbotHistory'); // ล้างประวัติแชทบอทด้วย
        
        setUser(null);          // เคลียร์ค่า
        setIsLoggedIn(false);   // เปลี่ยนสถานะ
    };

    return (
        // 4. ส่งค่า user ออกไปให้ Component อื่นใช้ได้
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

// ตัวจัดการ Navbar: เลือกว่าหน้าไหนจะโชว์/ไม่โชว์ Navbar กลาง
const NavbarController = () => {
    const location = useLocation();
    // ซ่อน Navbar ในหน้าแชทบอท
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
            <div style={{ fontFamily: 'Prompt' }}>
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