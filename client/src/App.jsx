import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"; // 1. เพิ่ม useLocation
import ChatBotPage from './pages/ChatBotPage';
import Homepage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import Navbar from "./components/Navbar";
import './style.css';

// 2. สร้างตัวคุม Navbar (เขียนไว้ตรงนี้เลย ง่ายดี)
const NavbarController = () => {
  const location = useLocation();
  // ถ้า path ปัจจุบันคือ '/chatbot' ให้ return null (ไม่โชว์อะไรเลย)
  if (location.pathname === '/chatbot') {
    return null;
  }
  // ถ้าเป็นหน้าอื่น ให้โชว์ Navbar ปกติ
  return <Navbar />;
};

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/api/hello')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error(err));
  }, []);

  return (
    <Router>
      {/* 3. เรียกใช้ตัวคุม Navbar แทนการใส่ <Navbar /> ตรงๆ */}
      <NavbarController />
      
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chatbot" element={<ChatBotPage />} />
      </Routes>
    </Router>
  );
}

export default App;