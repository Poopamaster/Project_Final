import React, { useState, useEffect } from 'react';
// แก้ไขการ import: ไม่ต้อง alias เป็น Router แล้ว เพราะใช้ BrowserRouter ใน main.jsx
import { Routes, Route, useLocation } from "react-router-dom"; 
import ChatBotPage from './pages/ChatBotPage';
import Homepage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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
    <> {/* ใช้ Fragment แทน Router */}
      <NavbarController />
      
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chatbot" element={<ChatBotPage />} />
      </Routes>
    </>
  );
}

export default App;