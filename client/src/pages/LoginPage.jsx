import React, { useState } from "react";
// import axios from "axios";  <-- ลบบรรทัดนี้ออก ไม่ต้องใช้แล้วในหน้านี้
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/userApi"; // <-- 1. Import ฟังก์ชันที่เราเพิ่งสร้าง
import "../css/LoginPage.css";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
    setError(""); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await loginUser(formData.email, formData.password);

      console.log("Login Success:", data);
      alert("เข้าสู่ระบบสำเร็จ!");

      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/"); 

    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="card-header">
          <h2 className="title">Welcome Back</h2>
          <p className="subtitle">Login to manage your bookings</p>
        </div>

        {error && <div style={{ color: "red", marginBottom: "10px", textAlign: "center" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              placeholder="name@example.com" 
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Enter your password" 
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Checking..." : "Sign In"}
          </button>
        </form>

        <p className="footer-text">Don't have an account? <a href="#">Sign up</a></p>
      </div>
    </div>
  );
};

export default LoginPage;