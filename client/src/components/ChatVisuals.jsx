import React, { useState } from 'react';
import { Film, Clock, Star, Calendar, CreditCard, QrCode, MapPin, ChevronRight } from 'lucide-react';

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
            onClick={() => onAction(`กรุณาเรียกใช้คำสั่ง select_seat เพื่อดึงผังที่นั่งของรอบฉายเวลา ${st.time} (ShowtimeID: ${st.showtimeId || st._id}) เรื่อง ${data.movieName || 'ที่เลือก'}`)}
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

  // ✅ 1. Normalization: แปลงข้อมูลจาก MongoDB (Mongoose) ให้เป็น Format ที่ Component เข้าใจ
  const normalizedSeats = seatsData.map(seat => {
    const row = seat.row_label || seat.row;
    const col = seat.seat_number || seat.col;
    return {
      ...seat,
      // จับคู่ฟิลด์ให้ตรงกับที่ Mongoose ส่งมา
      id: seat._id || seat.id, 
      row: row,
      col: col,
      // ดึงราคาจากที่ populate มา หรือถ้าไม่มีให้ใช้ basePrice ของรอบฉาย
      price: seat.price || (seat.seat_type_id && seat.seat_type_id.price) || data.basePrice || 220,
      type: seat.type || (seat.seat_type_id && seat.seat_type_id.name) || 'Normal',
      // เช็คสถานะการจอง (รองรับทั้ง isBooked, is_blocked หรืออาร์เรย์ bookedSeats)
      isBooked: seat.isBooked || seat.is_blocked || (data.bookedSeats && data.bookedSeats.includes(`${row}${col}`)) || false
    };
  });

  // ✅ 2. จัดกลุ่มที่นั่งตามแถว (Row)
  const rows = normalizedSeats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const toggleSeat = (seat) => {
    if (seat.isBooked) return;
    if (selectedSeats.find((s) => s.id === seat.id)) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const seatLabels = selectedSeats.map((s) => `${s.row}${s.col}`).join(', ');
  const seatIds = selectedSeats.map((s) => s.id).join(',');

  return (
    <div style={{ background: '#1E293B', padding: '20px', borderRadius: '16px', border: '1px solid #334155', width: '100%', maxWidth: '400px', marginTop: '10px' }}>
      <div style={{ width: '100%', height: '4px', background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)', marginBottom: '5px', opacity: 0.7 }}></div>
      <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#64748b', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>SCREEN</p>

      {normalizedSeats.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#f87171', fontSize: '0.8rem' }}>ไม่พบข้อมูลที่นั่งในระบบ</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
          {Object.keys(rows).sort().map((rowLabel) => (
            <div key={rowLabel} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', width: '15px' }}>{rowLabel}</span>
              {rows[rowLabel]
                // sort ตัวเลขแบบ localeCompare ทำให้เลข 1, 2, 10 เรียงถูกต้อง (ไม่เอา 1, 10, 2)
                .sort((a, b) => a.col.localeCompare(b.col, undefined, { numeric: true }))
                .map((seat) => {
                  const isSelected = selectedSeats.find(s => s.id === seat.id);
                  const seatColor = seat.type !== 'Normal' ? '#fbbf24' : '#334155';

                  return (
                    <button
                      key={seat.id}
                      disabled={seat.isBooked}
                      onClick={() => toggleSeat(seat)}
                      style={{
                        width: '32px', height: '32px',
                        borderRadius: '8px 8px 4px 4px', border: 'none',
                        background: seat.isBooked ? '#475569' : isSelected ? '#3b82f6' : seatColor,
                        cursor: seat.isBooked ? 'not-allowed' : 'pointer',
                        opacity: seat.isBooked ? 0.5 : 1,
                        boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.6)' : 'none',
                        color: seat.type !== 'Normal' && !isSelected && !seat.isBooked ? '#000' : 'white', 
                        fontSize: '10px', transition: 'all 0.2s'
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
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '15px', fontSize: '0.8rem', color: '#94a3b8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', background: '#334155', borderRadius: '2px' }}></div> ปกติ</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', background: '#fbbf24', borderRadius: '2px' }}></div> พิเศษ</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px' }}></div> เลือก</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', background: '#475569', borderRadius: '2px', opacity: 0.5 }}></div> จองแล้ว</div>
      </div>

      {selectedSeats.length > 0 && (
        <button
          // ✅ ตอนนี้ IDs และ totalPrice จะไม่ว่างเปล่าและไม่เป็น 0 อีกต่อไป
          onClick={() => onAction(`จองที่นั่ง ${seatLabels} (IDs: ${seatIds}) ราคารวม ${totalPrice} บาท สำหรับรอบ ${data.time} (ShowtimeID: ${data.showtimeId}) เรื่อง ${data.movieName}`)}
          style={{ width: '100%', marginTop: '20px', background: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: '50px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          ยืนยัน {selectedSeats.length} ที่นั่ง ({totalPrice} ฿)
        </button>
      )}
    </div>
  );
};

// 4. Payment Card
export const PaymentCard = ({ data, onAction }) => (
  <div style={{ background: '#1E293B', padding: '20px', borderRadius: '16px', border: '1px solid #334155', width: '100%', maxWidth: '350px', marginTop: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
      <div style={{ width: '60px', height: '80px', background: '#334155', borderRadius: '8px', flexShrink: 0, overflow: 'hidden' }}>
        {/* ถ้ามีรูปโปสเตอร์ให้ใส่ตรงนี้ */}
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{data.movieName}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94a3b8', marginTop: '5px' }}>
          <Calendar size={12} /> วันนี้ <span style={{ opacity: 0.5 }}>|</span> <Clock size={12} /> {data.time}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '5px' }}>
          ที่นั่ง: <span style={{ color: '#3b82f6' }}>{data.seats}</span>
        </div>
      </div>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
      <span style={{ color: '#cbd5e1' }}>ยอดรวมสุทธิ</span>
      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{data.price} ฿</span>
    </div>

    <button
      onClick={() => onAction(`ชำระเงินเรียบร้อย! BookingID: ${data.bookingId}, หนัง: ${data.movieName}, รอบ: ${data.time}, ที่นั่ง: ${data.seats}`)}
      style={{ width: '100%', background: 'linear-gradient(90deg, #3b82f6, #6366f1)', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}
    >
      <CreditCard size={18} /> ชำระเงินทันที
    </button>
  </div>
);

// 5. Digital Ticket
export const DigitalTicket = ({ data }) => (
  <div style={{ background: 'white', color: '#0f172a', borderRadius: '20px', width: '100%', maxWidth: '320px', overflow: 'hidden', marginTop: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative' }}>
    <div style={{ padding: '20px', background: '#3b82f6', color: 'white' }}>
      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{data.movieName}</h2>
      <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>Digital Ticket</p>
    </div>

    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Time</span>
          <p style={{ margin: 0, fontWeight: 700 }}>{data.time}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Seats</span>
          <p style={{ margin: 0, fontWeight: 700, color: '#3b82f6' }}>{data.seats}</p>
        </div>
      </div>

      <div style={{ borderTop: '2px dashed #e2e8f0', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Booking ID</span>
          <p style={{ margin: 0, fontSize: '0.8rem', fontFamily: 'monospace' }}>#{data.bookingId}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
        <QrCode size={90} color="#1e293b" />
      </div>
      <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', marginTop: '10px' }}>Scan this QR code at entrance</p>
    </div>

    {/* Ticket circles */}
    <div style={{ position: 'absolute', top: '85px', left: '-10px', width: '20px', height: '20px', background: '#0B1120', borderRadius: '50%' }}></div>
    <div style={{ position: 'absolute', top: '85px', right: '-10px', width: '20px', height: '20px', background: '#0B1120', borderRadius: '50%' }}></div>
  </div>
);

// 6. Bulk Import Preview Grid (สำหรับ Admin ตรวจสอบไฟล์ Excel)
export const BulkImportGrid = ({ data, onAction }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ข้อมูลหนังที่ส่งมาจาก Backend (Parsed from Excel)
  const movies = Array.isArray(data) ? data : (data?.movies || []);
  const total = movies.length;
  // ตรวจสอบเบื้องต้นว่ามี Row ไหนข้อมูลไม่ครบไหม
  const errors = movies.filter(m => !m.title_th || !m.genre).length;

  const handleConfirm = () => {
    setIsSubmitted(true);
    // ส่ง Action กลับไปหา AI เพื่อบันทึกลง Database
    onAction(`ยืนยันบันทึกข้อมูลหนัง ${total} เรื่องจากไฟล์ Excel ลงระบบ`);
  };

  return (
    <div style={{
      background: '#1E293B',
      borderRadius: '16px',
      border: '1px solid #334155',
      width: '100%',
      maxWidth: '600px',
      marginTop: '10px',
      overflow: 'hidden',
      boxShadow: '0 4px 25px rgba(0,0,0,0.4)'
    }}>
      {/* Header */}
      <div style={{ padding: '15px 20px', background: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Film size={18} color="#3b82f6" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>พรีวิวรายการนำเข้า ({total})</span>
        </div>
        {errors > 0 && (
          <span style={{ fontSize: '0.7rem', color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
            พบข้อผิดพลาด {errors} จุด
          </span>
        )}
      </div>

      {/* Table Area */}
      <div style={{ maxHeight: '250px', overflowY: 'auto', background: '#0f172a' }} className="no-scrollbar">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#1e293b', color: '#94a3b8' }}>
            <tr>
              <th style={{ padding: '12px' }}>ชื่อภาษาไทย</th>
              <th style={{ padding: '12px' }}>หมวดหมู่</th>
              <th style={{ padding: '12px' }}>ราคา</th>
              <th style={{ padding: '12px' }}>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #1e293b', color: '#e2e8f0' }}>
                <td style={{ padding: '12px' }}>{movie.title_th || <span style={{ color: '#f87171' }}>ข้อมูลหาย!</span>}</td>
                <td style={{ padding: '12px', color: '#94a3b8' }}>{movie.genre || 'N/A'}</td>
                <td style={{ padding: '12px', color: '#3b82f6' }}>{movie.price || 220}</td>
                <td style={{ padding: '12px' }}>
                  {!movie.title_th ? '❌' : '✅'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer / Action */}
      <div style={{ padding: '20px', background: '#1E293B', borderTop: '1px solid #334155' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            disabled={isSubmitted || errors > 0}
            onClick={handleConfirm}
            style={{
              flex: 2,
              background: errors > 0 ? '#475569' : 'linear-gradient(90deg, #3b82f6, #2563eb)',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: errors > 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            {isSubmitted ? 'กำลังบันทึก...' : 'ยืนยันนำเข้าข้อมูล'}
          </button>
          <button
            onClick={() => onAction("ยกเลิกการนำเข้า")}
            style={{ flex: 1, background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '12px', borderRadius: '10px', cursor: 'pointer' }}
          >
            ยกเลิก
          </button>
        </div>
        <p style={{ margin: '12px 0 0 0', fontSize: '0.65rem', color: '#64748b', textAlign: 'center' }}>
          * ข้อมูลจะถูกบันทึกเข้าคอลเลกชัน Movies ของระบบทันที
        </p>
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

// 🛠️ อัปเดต REGISTRY เป็นชุดสุดท้าย
export const COMPONENT_REGISTRY = {
  'MOVIE_CAROUSEL': MovieCarousel,
  'SHOWTIME_SELECTOR': ShowtimeSelector,
  'SEAT_PICKER': SeatMap,
  'PAYMENT_SLIP': PaymentCard,
  'TICKET_SLIP': DigitalTicket,
  'BULK_IMPORT_GRID': BulkImportGrid, // ✅ เพิ่มตัวนี้สำหรับการจัดการ Excel
  'BRANCH_LIST': BranchList,
};