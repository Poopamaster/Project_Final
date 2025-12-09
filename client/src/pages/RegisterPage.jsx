// ไฟล์: src/pages/RegisterPage.jsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/userApi"; // ต้องสร้างฟังก์ชันนี้
import "../css/LoginPage.css"; // ใช้ CSS เดียวกัน

// Material UI Imports
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "", // เพิ่ม field ชื่อ
    email: "",
    phone: "", // เพิ่ม field เบอร์โทรศัพท์
    password: "",
  });

  const [alertConfig, setAlertConfig] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
    if (alertConfig.message) setAlertConfig({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertConfig({ type: '', message: '' });

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      setAlertConfig({ type: 'error', message: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' });
      setLoading(false);
      return;
    }
    
    try {
      // 1. ยิงข้อมูลไปสมัครสมาชิกที่ Backend
      const data = await registerUser(formData);

      // 2. สมัครสำเร็จ -> แสดง Alert สีเขียว
      setAlertConfig({ type: 'success', message: 'สมัครสมาชิกสำเร็จ! กำลังพาไปหน้า Login...' });

      // 3. หน่วงเวลาและเปลี่ยนไปหน้า Login
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      // 4. สมัครพลาด -> แสดง Alert สีแดง
      const errorMsg = err.response?.data?.message || "การสมัครสมาชิกผิดพลาด";
      setAlertConfig({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-bg">
      <div className="login-card-container">

        <div className="login-header">
          <h2 className="login-title">สร้างบัญชีใหม่</h2>
          <p className="login-subtitle">กรอกข้อมูลเพื่อสมัครสมาชิก</p>
        </div>

        {alertConfig.message && (
          <Stack sx={{ width: '100%', marginBottom: '1rem' }} spacing={2}>
            <Alert variant="filled" severity={alertConfig.type}>
              {alertConfig.message}
            </Alert>
          </Stack>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {/* Field: ชื่อ */}
          <div className="form-group">
            <label htmlFor="name">ชื่อ-นามสกุล</label>
            <input
              type="text"
              id="name"
              placeholder="ชื่อเต็มของคุณ"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          {/* Field: อีเมล */}
          <div className="form-group">
            <label htmlFor="email">อีเมล</label>
            <input
              type="email" 
              id="email"
              placeholder="example@gmail.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          {/* Field: เบอร์โทรศัพท์ */}
          <div className="form-group">
            <label htmlFor="phone">เบอร์โทรศัพท์</label>
            <input
              type="tel" 
              id="phone"
              placeholder="08X XXXX XXXX"
              value={formData.phone}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          {/* Field: รหัสผ่าน */}
          <div className="form-group">
            <label htmlFor="password">รหัสผ่าน</label>
            <input
              type="password"
              id="password"
              placeholder="ตั้งรหัสผ่าน"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/login" className="register-link">มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</Link>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;