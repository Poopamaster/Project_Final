import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"; // 1. เพิ่ม useLocation
import ChatBotPage from './pages/ChatBotPage';
import Homepage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import Navbar from "./components/Navbar";
import './style.css';

const NavbarController = () => {
  const location = useLocation();
  if (location.pathname === '/chatbot') {
    return null;
  }
  return <Navbar />;
};

function App() {
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