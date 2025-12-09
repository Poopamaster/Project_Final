// ไฟล์: src/pages/RegisterPage.jsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/userApi"; 
import "../css/LoginPage.css"; 

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

// Regex สำหรับตรวจสอบความแข็งแกร่งของรหัสผ่าน
// ต้องมี 8 ตัวอักษรขึ้นไป และประกอบด้วย: พิมพ์เล็ก, พิมพ์ใหญ่, ตัวเลข
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/; 

// ฟังก์ชันตรวจสอบความแข็งแกร่งเพื่อแสดงผล (Strength Status)
const checkPasswordStrength = (password) => {
  if (password.length < 8) return { text: "ต้องมีอย่างน้อย 8 ตัวอักษร", color: "red" };
  
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;

  if (score === 3) return { text: "แข็งแกร่งมาก", color: "green" };
  if (score === 2) return { text: "ปานกลาง (แนะนำเพิ่มพิมพ์ใหญ่/ตัวเลข)", color: "orange" };
  
  return { text: "อ่อนแอ", color: "red" };
};


const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "", 
    email: "",
    phone: "", 
    password: "",
    confirmPassword: "", // <--- เพิ่ม Field ยืนยันรหัสผ่าน
  });

  const [alertConfig, setAlertConfig] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // สถานะสำหรับแสดง Strength Status ใต้ Field รหัสผ่าน
  const strengthStatus = formData.password ? checkPasswordStrength(formData.password) : null;

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
    
    // 1. ตรวจสอบ Confirm Password Match
    if (formData.password !== formData.confirmPassword) {
      setAlertConfig({ type: 'error', message: 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน' });
      setLoading(false);
      return;
    }

    // 2. ตรวจสอบความแข็งแกร่งด้วย Regex
    if (!passwordRegex.test(formData.password)) {
      setAlertConfig({ 
          type: 'error', 
          message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และประกอบด้วยตัวอักษรพิมพ์เล็ก, พิมพ์ใหญ่, และตัวเลข' 
      });
      setLoading(false);
      return;
    }
    
    // 3. เตรียมข้อมูลสำหรับส่งไป Backend (ไม่ส่ง confirmPassword)
    const userDataToSend = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
    };
    
    try {
      const data = await registerUser(userDataToSend);

      setAlertConfig({ type: 'success', message: 'สมัครสมาชิกสำเร็จ! กำลังพาไปหน้า Login...' });

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      const errorMsg = err.response?.data?.message || "การสมัครสมาชิกผิดพลาด";
      setAlertConfig({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-bg">
      <div className="login-card-container">
        {/* ... Header & Alert Stack ... */}
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
          {/* Field: ชื่อ, อีเมล, เบอร์โทรศัพท์ (เหมือนเดิม) */}
          {/* ... */}
          
          {/* Field: ชื่อ */}
          <div className="form-group">
            <label htmlFor="name">ชื่อ-นามสกุล</label>
            <input type="text" id="name" placeholder="ชื่อเต็มของคุณ" value={formData.name} onChange={handleChange} required className="form-input" />
          </div>

          {/* Field: อีเมล */}
          <div className="form-group">
            <label htmlFor="email">อีเมล</label>
            <input type="email" id="email" placeholder="example@gmail.com" value={formData.email} onChange={handleChange} required className="form-input" />
          </div>

          {/* Field: เบอร์โทรศัพท์ */}
          <div className="form-group">
            <label htmlFor="phone">เบอร์โทรศัพท์</label>
            <input type="tel" id="phone" placeholder="08X XXXX XXXX" value={formData.phone} onChange={handleChange} required className="form-input" />
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
             {/* Feedback ความแข็งแกร่ง */}
            {strengthStatus && (
                <p style={{ 
                    color: strengthStatus.color, 
                    fontSize: '0.8rem', 
                    marginTop: '0.2rem',
                    fontWeight: 'bold'
                }}>
                    ความแข็งแกร่ง: {strengthStatus.text}
                </p>
            )}
          </div>
          
          {/* Field: ยืนยันรหัสผ่าน */}
          <div className="form-group">
            <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="ยืนยันรหัสผ่านอีกครั้ง"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="form-input"
            />
            {/* Feedback การไม่ตรงกัน */}
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    รหัสผ่านไม่ตรงกัน
                </p>
            )}
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