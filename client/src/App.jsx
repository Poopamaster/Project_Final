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
import './style.css';
import HistoryPage from './pages/HistoryPage';

export const AuthContext = createContext(null);

const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        // 1. แกะ Payload (ส่วนกลางของ JWT)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decoded = JSON.parse(jsonPayload);

        // 2. เช็คเวลา (exp คือวินาที ต้องคูณ 1000 เป็นมิลลิวินาที)
        // ถ้าเวลาหมดอายุ น้อยกว่า เวลาปัจจุบัน แปลว่า "หมดอายุแล้ว"
        if (!decoded.exp) return true;
        return (decoded.exp * 1000) < Date.now();

    } catch (error) {
        return true; // ถ้าแกะไม่ได้ ตีว่าหมดอายุไว้ก่อน
    }
};

const AuthProvider = ({ children }) => {
    // 🌟 1. สร้าง loading state ให้ค่าเริ่มต้นเป็น true (กำลังโหลด)
    const [loading, setLoading] = useState(true);

    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // ปรับ isLoggedIn เริ่มต้นให้เช็คจากว่ามี user ไหม
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

        // 🌟 2. เมื่อตรวจสอบทุกอย่างเสร็จแล้ว สั่งให้ loading เป็น false
        setLoading(false);
    }, []);

    return (
        // 🌟 3. อย่าลืมส่งตัวแปร loading ออกไปใน Provider ด้วย!
        <AuthContext.Provider value={{ isLoggedIn, user, login, logout, loading }}>
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

const AdminGuard = ({ children }) => {
    const { isLoggedIn, user, loading, logout } = useContext(AuthContext); // ดึง logout มาด้วย
    const token = localStorage.getItem('jwtToken');

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>กำลังตรวจสอบสิทธิ์...</div>;
    }

    // เช็คทั้งสถานะ และ เช็คว่า Token หมดอายุหรือยัง
    if (!isLoggedIn || user?.role !== 'admin' || isTokenExpired(token)) {
        if (isLoggedIn && isTokenExpired(token)) {
            alert("เซสชันหมดอายุแล้ว");
            logout();
        }
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

// --- 2. ปรับ NavbarController ---
const NavbarController = () => {
    const location = useLocation();

    // ซ่อน Navbar กลาง เมื่ออยู่หน้าเหล่านี้
    if (location.pathname === '/chatbot' ||
        location.pathname === '/movies' ||
        location.pathname === '/payment' || // <--- เพิ่ม payment เข้าไป เพื่อไม่ให้ Navbar ซ้อนกัน
        location.pathname.startsWith('/booking') ||
        location.pathname.startsWith('/admin')

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

                {/* หน้า Chatbot ยังคงต้อง Login */}
                <Route
                    path="/chatbot"
                    element={
                        <AuthGuard>
                            <ChatBotPage />
                        </AuthGuard>
                    }
                />

                {/* หน้า Admin */}
                <Route path="/admin" element={
                    <AdminGuard>
                        <AdminPage />
                    </AdminGuard>
                } />

                <Route path="/admin/verify/:bookingNumber" element={
                    <AdminGuard>
                        <AdminPage />
                    </AdminGuard>
                } />

            </Routes>
        </AuthProvider>
    );
}

export default App;