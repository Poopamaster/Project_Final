import React, { useState } from 'react';
import PaymentSection from './PaymentSection'; // 👈 สำคัญมาก! เช็ค path ให้ถูกด้วยนะครับ
import { Film, Clock, Star, Calendar, CreditCard, QrCode, MapPin, ChevronRight, Trash2 } from 'lucide-react';

// 1. Movie Carousel (Design ตามต้นฉบับเป๊ะๆ)
export const MovieCarousel = ({ data, onAction }) => (
  <div style={{
    display: 'flex',
    gap: '15px',
    overflowX: 'auto',
    padding: '10px 5px',
    scrollbarWidth: 'none', /* ซ่อน scrollbar ใน Firefox */
    msOverflowStyle: 'none' /* ซ่อน scrollbar ใน IE/Edge */
  }} className="no-scrollbar">
    {data.map((movie) => (
      <div
        key={movie._id || movie.id}
        onClick={() => onAction(`สนใจดูเรื่อง ${movie.title_th || movie.title} (ID: ${movie._id || movie.id}) ครับ`)}
        style={{
          minWidth: '160px',
          backgroundColor: '#1E293B',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: 'pointer',
          border: '1px solid #334155',
          transition: 'transform 0.2s',
          flexShrink: 0
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <div style={{ height: '220px', background: movie.color || '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {movie.poster_url ?
            <img src={movie.poster_url} alt={movie.title_th} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
            <Film size={48} color="rgba(255,255,255,0.5)" />
          }
          <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
            <Star size={12} fill="#fbbf24" color="#fbbf24" /> {movie.rating || "4.5"}
          </div>
        </div>
        <div style={{ padding: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.title_th || movie.title}</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>{movie.genre}</p>
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600 }}>{movie.price || 220} ฿</span>
            <button style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', padding: '4px 10px', fontSize: '0.7rem', cursor: 'pointer' }}>เลือก</button>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// 2. Showtime Selector
// 2. Showtime Selector
export const ShowtimeSelector = ({ data, onAction }) => {
  const showtimes = Array.isArray(data) ? data : (data?.showtimes || []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '10px', width: '100%', maxWidth: '350px' }}>
      {showtimes.length === 0 ? (
        <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '15px', background: '#1E293B', borderRadius: '8px', border: '1px solid #334155' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#f87171' }}>ขออภัยครับ ไม่พบรอบฉายของสาขาและวันที่คุณเลือก 😥</p>
        </div>
      ) : (
        showtimes.map((st) => (
          <button
            key={st.showtimeId || st._id}
            // ✅ เปลี่ยนคำสั่ง onAction ให้ชัดเจนขึ้น เพื่อบังคับ AI ดึงผังที่นั่ง!
            onClick={() => onAction(
              `ดึงผังที่นั่งรอบเวลา ${st.time} (ShowtimeID: ${st.showtimeId || st._id}) เรื่อง ${data.movieName}`
            )}
            style={{
              padding: '10px', background: '#1E293B', border: '1px solid #334155', color: '#e2e8f0',
              borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#334155'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
              <Clock size={14} color="#3b82f6" /> {st.time}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{st.auditorium || 'โรงปกติ'} • {st.price || 220} ฿</span>
          </button>
        ))
      )}
    </div>
  );
};

// 3. Seat Map (Dynamic ดึงจาก Database จริง - แมปข้อมูล Mongoose อัตโนมัติ)
export const SeatMap = ({ data, onAction }) => {
  const seatsData = data.seatsData || [];
  const [selectedSeats, setSelectedSeats] = useState([]);

  const normalizedSeats = seatsData.map((seat) => {
    const row = seat.row_label || seat.row;
    const col = seat.seat_number || seat.col;

    return {
      ...seat,
      id: seat._id || seat.id,
      row,
      col,
      price:
        seat.price ||
        (seat.seat_type_id && seat.seat_type_id.price) ||
        data.basePrice ||
        220,
      type:
        seat.type ||
        (seat.seat_type_id && seat.seat_type_id.name) ||
        'Normal',
      isBooked:
        seat.isBooked ||
        seat.is_blocked ||
        (data.bookedSeats &&
          data.bookedSeats.includes(`${row}${col}`)) ||
        false
    };
  });

  const rows = normalizedSeats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const sortedRowLabels = Object.keys(rows).sort();
  const maxSeatsInRow = Math.max(
    ...sortedRowLabels.map((rowLabel) => rows[rowLabel].length),
    0
  );

  const toggleSeat = (seat) => {
    if (seat.isBooked) return;

    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.id === seat.id);
      return exists ? prev.filter((s) => s.id !== seat.id) : [...prev, seat];
    });
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const seatLabels = selectedSeats.map((s) => `${s.row}${s.col}`).join(', ');
  const seatIds = selectedSeats.map((s) => s.id).join(',');

  return (
    <div
      style={{
        background: '#1E293B',
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid #334155',
        width: '100%',
        maxWidth: '100%',
        marginTop: '10px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: '100%',
          height: '4px',
          background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
          marginBottom: '6px',
          opacity: 0.7
        }}
      />
      <p
        style={{
          textAlign: 'center',
          fontSize: '0.7rem',
          color: '#64748b',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}
      >
        SCREEN
      </p>

      {normalizedSeats.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#f87171', fontSize: '0.8rem' }}>
          ไม่พบข้อมูลที่นั่งในระบบ
        </p>
      ) : (
        <>
          <div
            className="no-scrollbar"
            style={{
              width: '100%',
              overflowX: 'auto',
              overflowY: 'hidden',
              paddingBottom: '8px',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div
              style={{
                minWidth:
                  maxSeatsInRow > 0
                    ? `${Math.max(280, maxSeatsInRow * 34 + 34)}px`
                    : '280px',
                width: 'fit-content',
                margin: '0 auto'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '18px'
                }}
              >
                {sortedRowLabels.map((rowLabel) => (
                  <div
                    key={rowLabel}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `20px repeat(${rows[rowLabel].length}, minmax(28px, 32px))`,
                      gap: '6px',
                      alignItems: 'center',
                      justifyContent: 'start'
                    }}
                  >
                    <span
                      style={{
                        color: '#94a3b8',
                        fontSize: '0.78rem',
                        textAlign: 'center'
                      }}
                    >
                      {rowLabel}
                    </span>

                    {rows[rowLabel]
                      .sort((a, b) =>
                        String(a.col).localeCompare(String(b.col), undefined, {
                          numeric: true
                        })
                      )
                      .map((seat) => {
                        const isSelected = selectedSeats.find((s) => s.id === seat.id);
                        const seatColor =
                          seat.type !== 'Normal' ? '#fbbf24' : '#334155';

                        return (
                          <button
                            key={seat.id}
                            disabled={seat.isBooked}
                            onClick={() => toggleSeat(seat)}
                            style={{
                              width: '100%',
                              aspectRatio: '1 / 1',
                              minWidth: '28px',
                              minHeight: '28px',
                              maxWidth: '32px',
                              maxHeight: '32px',
                              borderRadius: '8px 8px 4px 4px',
                              border: 'none',
                              background: seat.isBooked
                                ? '#475569'
                                : isSelected
                                  ? '#3b82f6'
                                  : seatColor,
                              cursor: seat.isBooked ? 'not-allowed' : 'pointer',
                              opacity: seat.isBooked ? 0.5 : 1,
                              boxShadow: isSelected
                                ? '0 0 10px rgba(59, 130, 246, 0.6)'
                                : 'none',
                              color:
                                seat.type !== 'Normal' &&
                                  !isSelected &&
                                  !seat.isBooked
                                  ? '#000'
                                  : 'white',
                              fontSize: '10px',
                              fontWeight: 600,
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0
                            }}
                            title={`ประเภท: ${seat.type} | ราคา: ${seat.price} ฿`}
                          >
                            {seat.col}
                          </button>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '10px 14px',
              borderTop: '1px solid #334155',
              paddingTop: '14px',
              fontSize: '0.78rem',
              color: '#94a3b8'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  background: '#334155',
                  borderRadius: '2px',
                  flexShrink: 0
                }}
              />
              ปกติ
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  background: '#fbbf24',
                  borderRadius: '2px',
                  flexShrink: 0
                }}
              />
              พิเศษ
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  background: '#3b82f6',
                  borderRadius: '2px',
                  flexShrink: 0
                }}
              />
              เลือก
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  background: '#475569',
                  borderRadius: '2px',
                  opacity: 0.5,
                  flexShrink: 0
                }}
              />
              จองแล้ว
            </div>
          </div>
        </>
      )}

      {selectedSeats.length > 0 && (
        <button
          onClick={() =>
            onAction(
              `จองที่นั่ง ${seatLabels} (IDs: ${seatIds}) ราคารวม ${totalPrice} บาท สำหรับรอบ ${data.time} (ShowtimeID: ${data.showtimeId}) เรื่อง ${data.movieName}`
            )
          }
          style={{
            width: '100%',
            marginTop: '18px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '13px 14px',
            borderRadius: '999px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.95rem',
            textAlign: 'center',
            lineHeight: 1.3,
            flexWrap: 'wrap'
          }}
        >
          ยืนยัน {selectedSeats.length} ที่นั่ง ({totalPrice} ฿)
        </button>
      )}
    </div>
  );
};

// 4. Payment Card
// 1. รับค่า isLatest เข้ามา (ถ้าไม่ส่งมา ให้ค่าเริ่มต้นเป็น false)
export const PaymentCard = ({ data, onAction, messages = [] }) => {

  // 1. ตรวจสอบว่าในประวัติแชท มีการยืนยัน BookingID นี้ไปแล้วหรือยัง
  // เราจะเช็คว่ามีข้อความจาก user ที่มี BookingID ตรงกับ Card นี้ไหม
  const isAlreadyProcessed = messages.some(msg =>
    msg.sender === 'user' && msg.text?.includes(data.bookingId)
  );

  const handleProceed = () => {
    // ถ้าเคยส่งไปแล้ว ไม่ต้องทำอะไร
    if (isAlreadyProcessed) return;

    // ถ้ายังไม่เคย ให้ส่ง Action ยืนยันชำระเงิน
    onAction(`ยืนยันการสรุปยอด และดำเนินการชำระเงินสำหรับ BookingID: ${data.bookingId} เรื่อง ${data.movieName}`);
  };

  return (
    <div style={{
      background: '#1E293B',
      padding: '20px',
      borderRadius: '16px',
      border: '1px solid #334155',
      width: '100%',
      maxWidth: '500px',
      marginTop: '10px',
      opacity: isAlreadyProcessed ? 0.7 : 1, // จางลงถ้ากดไปแล้ว
      transition: 'opacity 0.3s ease'
    }}>

      {/* ... (ส่วนแสดงรูปหนังและรายละเอียด เหมือนเดิม) ... */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
        <div style={{ width: '60px', height: '80px', background: '#334155', borderRadius: '8px', overflow: 'hidden' }}>
          {data.poster_url && <img src={data.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div>
          <h3 style={{ margin: 0, color: 'white' }}>{data.movieName}</h3>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>ที่นั่ง: {data.seats}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ color: '#cbd5e1' }}>ยอดรวมสุทธิ</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{data.price || data.totalPrice} ฿</span>
      </div>

      {/* 2. ปรับปุ่มตามสถานะ isAlreadyProcessed */}
      <button
        onClick={handleProceed}
        disabled={isAlreadyProcessed}
        style={{
          width: '100%',
          padding: '14px',
          background: isAlreadyProcessed
            ? '#334155' // สีเทาเมื่อกดแล้ว
            : 'linear-gradient(90deg, #3b82f6, #6366f1)',
          color: isAlreadyProcessed ? '#94a3b8' : 'white',
          border: 'none',
          borderRadius: '12px',
          fontWeight: 'bold',
          cursor: isAlreadyProcessed ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        {isAlreadyProcessed ? (
          'ดำเนินการเรียบร้อยแล้ว'
        ) : (
          <>ดำเนินการชำระเงิน</>
        )}
      </button>
    </div>
  );
};

// 5. Digital Ticket
export const DigitalTicket = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);

  // ดึงรูปโปสเตอร์ (ถ้าใน TICKET_SLIP มีการส่งมา ถ้าไม่มีใช้รูปสำรอง)
  const posterSrc = data.poster_url || data.movieImage || "https://placehold.co/150x225?text=No+Poster";

  // 🎟️ โครงสร้างดีไซน์ตั๋วที่ถอดแบบมาจาก TicketTemplate.jsx
  const TicketDesign = () => (
    <div style={{ width: '100%', maxWidth: '350px', backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1a1f2c', padding: '15px 0', textAlign: 'center', borderBottom: '3px solid #f1c40f' }}>
        <h1 style={{ color: '#f1c40f', margin: 0, fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>MCP CINEMA</h1>
        <p style={{ color: '#f1c40f', margin: '3px 0 0 0', fontSize: '10px', opacity: 0.9 }}>E-Ticket ยืนยันการจอง</p>
      </div>

      {/* Checkmark & Booking ID */}
      <div style={{ padding: '20px 15px', textAlign: 'center', backgroundColor: '#ffffff' }}>
        <div style={{ width: '40px', height: '40px', backgroundColor: '#27ae60', borderRadius: '50%', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '20px', marginBottom: '10px' }}>
          ✓
        </div>
        <p style={{ color: '#7f8c8d', margin: '0', fontSize: '12px' }}>รหัสการจอง (Booking ID)</p>
        <h2 style={{ color: '#2c3e50', margin: '5px 0', fontSize: '22px', letterSpacing: '1px', fontWeight: 'bold' }}>{data.bookingId}</h2>
        <p style={{ color: '#27ae60', margin: '0', fontSize: '12px', fontWeight: 'bold' }}>ชำระเงินเรียบร้อยแล้ว</p>
      </div>

      <hr style={{ border: 0, borderTop: '1px dashed #ecf0f1', margin: '0' }} />

      {/* Movie Details */}
      <div style={{ padding: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ marginRight: '15px', flexShrink: 0 }}>
            <img src={posterSrc} alt="Poster" style={{ width: '70px', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', display: 'block', objectFit: 'cover' }} />
          </div>
          <div style={{ flexGrow: 1 }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50', fontSize: '15px', fontWeight: 'bold', lineHeight: '1.2' }}>{data.movieName}</h3>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#7f8c8d', fontSize: '11px', paddingBottom: '3px', width: '60px' }}>เวลาฉาย:</td>
                  <td style={{ color: '#2c3e50', fontSize: '12px', fontWeight: 'bold', paddingBottom: '3px' }}>{data.time}</td>
                </tr>
                <tr>
                  <td style={{ color: '#7f8c8d', fontSize: '11px', paddingBottom: '3px' }}>ที่นั่ง:</td>
                  <td style={{ color: '#e74c3c', fontSize: '12px', fontWeight: 'bold', paddingBottom: '3px' }}>{data.seats}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div style={{ textAlign: 'center', padding: '10px 15px 20px 15px', backgroundColor: '#fcfcfc', borderTop: '1px solid #eee' }}>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
            `${window.location.origin}/admin/verify/${data.bookingId}` // <--- แก้ตรงนี้ครับ
          )}`}
          alt="QR Code"
          style={{ width: '100px', height: '100px', display: 'inline-block' }}
        />
        <p style={{ color: '#95a5a6', fontSize: '10px', marginTop: '8px', marginBottom: 0 }}>
          พนักงานสแกน QR Code นี้เพื่อตรวจสอบสถานะตั๋ว
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. ส่วนที่แสดงในกล่องแชท (ย่อส่วนนิดนึงให้ดูพอดี ไม่เกะกะแชท) */}
      <div
        onClick={() => setIsOpen(true)}
        style={{ cursor: 'pointer', transition: 'transform 0.2s', marginTop: '10px' }}
        title="คลิกเพื่อดูตั๋วขนาดเต็ม"
      >
        <div style={{ pointerEvents: 'none', transform: 'scale(0.9)', transformOrigin: 'top left' }}>
          <TicketDesign />
        </div>
        <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '-15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
          🔍 <span>คลิกเพื่อดูภาพตั๋ว</span>
        </div>
      </div>

      {/* 2. Modal แบบกางเต็มจอ (เมื่อถูกคลิก) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)} // คลิกพื้นที่ว่างเพื่อปิด
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()} // ป้องกันการคลิกตั๋วแล้วปิด
            style={{ position: 'relative', width: '100%', maxWidth: '380px' }}
          >
            {/* ปุ่มปิด (X) */}
            <button
              onClick={() => setIsOpen(false)}
              style={{ position: 'absolute', top: '-40px', right: '0', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '30px' }}
            >
              &times;
            </button>

            {/* ตั๋วขนาดเต็ม */}
            <div style={{ transform: 'scale(1.05)', transformOrigin: 'center' }}>
              <TicketDesign />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 6. Bulk Import Preview Grid (สำหรับ Admin ตรวจสอบไฟล์ Excel)
export const BulkImportGrid = ({ data, onAction }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ดึงข้อมูลหนังเริ่มต้น
  const initialMovies = Array.isArray(data) ? data : (data?.movies || []);
  const [movies, setMovies] = useState(initialMovies);

  // ฟิลด์ที่บังคับ
  const requiredFields = ['title_th', 'genre', 'duration_min', 'start_date', 'due_date'];

  // ลำดับคอลัมน์ที่ต้องการแสดง
  const orderedColumns = [
    'title_th',
    'title_en',
    'genre',
    'duration_min',
    'start_date',
    'due_date',
    'language',
    'poster_url'
  ];

  // กวาดคอลัมน์อื่นๆ ที่อาจหลงมา
  const allKeys = new Set([...movies.flatMap(Object.keys)]);
  const extraColumns = Array.from(allKeys).filter(
    key => !orderedColumns.includes(key) && key !== '_id' && key !== '__v'
  );
  const displayColumns = [...orderedColumns, ...extraColumns];

  // ฟังก์ชันแปลงวันที่ให้อยู่ในรูปแบบ YYYY-MM-DD สำหรับ input type="date"
  const formatDateForInput = (val) => {
    if (!val) return '';
    try {
      const dateStr = String(val).trim();
      // ถ้าเป็น YYYY-MM-DD อยู่แล้ว
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.substring(0, 10);

      // ลองแปลงด้วย Date object
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
    } catch (e) {
      return ''; // แปลงไม่ได้ปล่อยว่าง
    }
    return '';
  };

  const handleCellChange = (rowIndex, column, value) => {
    const newMovies = [...movies];
    newMovies[rowIndex] = { ...newMovies[rowIndex], [column]: value };
    setMovies(newMovies);
  };

  // 🔥 ฟังก์ชันลบแถว
  const handleDeleteRow = (indexToRemove) => {
    const newMovies = movies.filter((_, index) => index !== indexToRemove);
    setMovies(newMovies);
  };

  const getRowErrors = (movie) => {
    return requiredFields.filter(field => {
      const val = movie[field];
      return val === undefined || val === null || String(val).trim() === '';
    });
  };

  const totalErrors = movies.reduce((sum, movie) => sum + getRowErrors(movie).length, 0);

  const handleConfirm = () => {
    setIsSubmitted(true);
    onAction(`ยืนยันบันทึกข้อมูลหนัง ${movies.length} เรื่อง ข้อมูลที่ต้องการบันทึกคือ:\n\`\`\`json\n${JSON.stringify(movies, null, 2)}\n\`\`\``);
  };

  return (
    <div style={{
      background: '#1E293B', borderRadius: '16px', border: '1px solid #334155',
      width: '100%', maxWidth: '1000px', marginTop: '10px', overflow: 'hidden',
      boxShadow: '0 4px 25px rgba(0,0,0,0.4)'
    }}>
      <div style={{ padding: '15px 20px', background: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Film size={18} color="#3b82f6" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'white' }}>พรีวิวและตรวจสอบข้อมูล ({movies.length} รายการ)</span>
        </div>
        {movies.length === 0 ? (
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(148, 163, 184, 0.2)', padding: '5px 12px', borderRadius: '6px' }}>ไม่มีข้อมูล</span>
        ) : totalErrors > 0 ? (
          <span style={{ fontSize: '0.75rem', color: '#fca5a5', background: 'rgba(248, 113, 113, 0.2)', padding: '5px 12px', borderRadius: '6px', fontWeight: 'bold' }}>
            ⚠️ พบข้อมูลไม่สมบูรณ์ {totalErrors} จุด
          </span>
        ) : (
          <span style={{ fontSize: '0.75rem', color: '#86efac', background: 'rgba(134, 239, 172, 0.2)', padding: '5px 12px', borderRadius: '6px', fontWeight: 'bold' }}>
            ✅ พร้อมบันทึก
          </span>
        )}
      </div>

      <div style={{ maxHeight: '450px', overflow: 'auto', background: '#0f172a' }} className="no-scrollbar">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#1e293b', color: '#94a3b8', zIndex: 10 }}>
            <tr>
              <th style={{ padding: '12px', width: '40px', textAlign: 'center' }}>#</th>
              {displayColumns.map(col => (
                <th key={col} style={{ padding: '12px', minWidth: col.includes('title') ? '180px' : '120px' }}>
                  {col} {requiredFields.includes(col) && <span style={{ color: '#f87171' }}>*</span>}
                </th>
              ))}
              <th style={{ padding: '12px', width: '50px', textAlign: 'center', position: 'sticky', right: 0, background: '#1e293b' }}>ลบ</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie, rowIndex) => {
              const rowErrors = getRowErrors(movie);
              const hasRowError = rowErrors.length > 0;

              return (
                <tr key={rowIndex} style={{ borderBottom: '1px solid #1e293b', backgroundColor: hasRowError ? 'rgba(248, 113, 113, 0.05)' : 'transparent' }}>
                  <td style={{ padding: '12px', color: '#64748b', textAlign: 'center' }}>{rowIndex + 1}</td>

                  {displayColumns.map(col => {
                    const isRequired = requiredFields.includes(col);
                    const isError = isRequired && rowErrors.includes(col);
                    const val = movie[col] !== undefined && movie[col] !== null ? movie[col] : '';
                    const isDateField = col.includes('date');

                    return (
                      <td key={col} style={{ padding: '6px' }}>
                        <input
                          type={isDateField ? 'date' : (col === 'duration_min' ? 'number' : 'text')}
                          value={isDateField ? formatDateForInput(val) : val}
                          onChange={(e) => handleCellChange(rowIndex, col, e.target.value)}
                          placeholder={isRequired ? "ต้องระบุ..." : "-"}
                          style={{
                            width: '100%', padding: '8px', borderRadius: '6px',
                            border: isError ? '1px solid #ef4444' : '1px solid transparent',
                            background: isError ? 'rgba(239, 68, 68, 0.1)' : '#1e293b',
                            color: isError ? '#fca5a5' : '#e2e8f0',
                            outline: 'none', transition: 'all 0.2s',
                          }}
                        />
                      </td>
                    );
                  })}

                  {/* ปุ่มลบแถว */}
                  <td style={{ padding: '6px', textAlign: 'center', position: 'sticky', right: 0, background: hasRowError ? 'rgba(248, 113, 113, 0.05)' : '#0f172a' }}>
                    <button
                      onClick={() => handleDeleteRow(rowIndex)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px', borderRadius: '4px' }}
                      title="ลบข้อมูลแถวนี้"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '20px', background: '#1E293B', borderTop: '1px solid #334155' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            disabled={isSubmitted || totalErrors > 0 || movies.length === 0}
            onClick={handleConfirm}
            style={{
              flex: 2,
              background: (totalErrors > 0 || movies.length === 0) ? '#475569' : 'linear-gradient(90deg, #3b82f6, #2563eb)',
              color: (totalErrors > 0 || movies.length === 0) ? '#94a3b8' : 'white',
              border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 600,
              cursor: (totalErrors > 0 || isSubmitted || movies.length === 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', opacity: isSubmitted ? 0.7 : 1
            }}
          >
            {isSubmitted ? 'กำลังบันทึก...' : `✅ ยืนยันข้อมูลและนำเข้า Database (${movies.length} เรื่อง)`}
          </button>
          <button
            onClick={() => onAction("ยกเลิกการนำเข้า")}
            style={{ flex: 1, background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '12px', borderRadius: '10px', cursor: 'pointer' }}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};

export const BranchList = ({ data, onAction }) => {
  // ✅ 1. รองรับกรณี Backend ส่งมาเป็น Array โดยตรง หรือครอบมาใน data.branches
  const branches = Array.isArray(data) ? data : (data?.branches || []);

  return (
    <div style={{ background: '#1E293B', padding: '15px', borderRadius: '16px', border: '1px solid #334155', width: '100%', maxWidth: '350px', marginTop: '10px' }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MapPin size={18} color="#ef4444" /> เลือกสาขาที่ต้องการ
      </h3>

      {branches.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>ไม่พบข้อมูลสาขา</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {branches.map((branch, index) => (
            <button key={branch._id || branch.id || index}
              // ✅ 2. แนบ BranchID ไปด้วยเลย AI จะได้ไม่ต้องเดา และค้นหาใน DB เจอ 100%
              onClick={() => onAction(`เลือกสาขา ${branch.name} (BranchID: ${branch._id || branch.id})`)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#0f172a', border: '1px solid #334155', padding: '12px 15px',
                borderRadius: '10px', color: '#e2e8f0', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#1e293b'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.background = '#0f172a'; }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{branch.name}</span>
                {/* ✅ 3. โชว์ province แทน distance ให้ตรงกับ Schema ใน Database */}
                {branch.province && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>จังหวัด {branch.province}</span>}
              </div>
              <ChevronRight size={16} color="#64748b" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 📅 4. Date Selector (เลือกวันที่ฉาย)
export const DateSelector = ({ data, onAction }) => {
  const { movieId, movieName, branchId, availableDates } = data;

  // Helper สำหรับแปลงรูปแบบวันที่ (YYYY-MM-DD) เป็นภาษาไทยสวยๆ
  const formatDateThai = (dateString) => {
    const d = new Date(dateString);
    const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return {
      dayOfWeek: days[d.getDay()],
      date: d.getDate(),
      month: months[d.getMonth()]
    };
  };

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        padding: '5px 5px 15px 5px',
        scrollbarWidth: 'none', /* Firefox */
        msOverflowStyle: 'none' /* IE/Edge */
      }} className="no-scrollbar">

        {availableDates.map((dateStr, index) => {
          const tDate = formatDateThai(dateStr);
          return (
            <button
              key={index}
              // 🚨 สำคัญ: ส่งข้อความซ่อนกลับไปให้ AI รู้ว่าเลือกวันไหน หนังอะไร สาขาอะไร
              onClick={() => onAction(`ดูรอบฉายวันที่ ${dateStr}`)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '70px',
                height: '85px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.backgroundColor = '#2dd4bf20'; // สีฟ้าอ่อนๆ ตอน Hover
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.backgroundColor = '#1e293b';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                {tDate.dayOfWeek}
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#f8fafc', lineHeight: '1' }}>
                {tDate.date}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                {tDate.month}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 🛠️ อัปเดต REGISTRY เป็นชุดสุดท้าย
export const COMPONENT_REGISTRY = {
  'MOVIE_CAROUSEL': MovieCarousel,
  'SHOWTIME_SELECTOR': ShowtimeSelector,
  'DATE_SELECTOR': DateSelector,
  'SEAT_PICKER': SeatMap,
  'PAYMENT_SLIP': PaymentCard,
  'TICKET_SLIP': DigitalTicket,
  'BULK_IMPORT_GRID': BulkImportGrid,
  'BRANCH_LIST': BranchList,

  // 🔥 แก้บรรทัดนี้! เปลี่ยนจาก CheckoutSummary เป็น PaymentCard
  'CHECKOUT_SUMMARY': PaymentCard
};