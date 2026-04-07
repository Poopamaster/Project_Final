// src/pages/SeatSelectionPage.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function SeatSelectionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // รับข้อมูลที่ส่งมาจากหน้า Booking
  const { movie, selectedDate, selectedTime } = location.state || {};

  return (
    <div style={{ backgroundColor: '#0B1120', minHeight: '100vh', color: 'white' }}>
      <Navbar />
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>เลือกที่นั่ง</h1>
        
        {/* แสดงข้อมูลเพื่อเช็คว่ารับค่ามาถูกไหม */}
        {movie && (
          <div style={{ margin: '20px 0', padding: '20px', background: '#1a1a1a', borderRadius: '10px' }}>
             <h2>🎬 เรื่อง: {movie.title}</h2>
             <p>📅 วันที่: {selectedDate?.date} {selectedDate?.day}</p>
             <p>⏰ เวลา: {selectedTime}</p>
          </div>
        )}

        <div style={{ marginTop: '50px' }}>
            <p>(ส่วนจำลองผังที่นั่ง - เดี๋ยวค่อยทำต่อ)</p>
            <button 
                onClick={() => alert("ไปหน้าชำระเงินต่อ...")}
                style={{ padding: '10px 30px', background: 'gold', border:'none', borderRadius:'5px', cursor:'pointer' }}
            >
                ยืนยันการเลือกที่นั่ง
            </button>
        </div>
      </div>
    </div>
  );
}

export default SeatSelectionPage;