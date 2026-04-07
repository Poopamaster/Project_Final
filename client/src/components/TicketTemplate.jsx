import React, { forwardRef } from 'react';

const TicketTemplate = forwardRef(({ ticketData }, ref) => {
    if (!ticketData) return null;

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatTime = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    };

    // 1. เปลี่ยน Placeholder เป็นเว็บที่เสถียรกว่า
    const placeholderImage = "https://placehold.co/150x225?text=No+Poster";

    // 2. แก้ CORS: เติม Query Param เพื่อป้องกัน Browser ใช้ Cache เก่าที่ไม่มี Header Access-Control
    let posterSrc = placeholderImage;
    if (ticketData.poster) {
        // เช็คว่า URL เดิมมี ? อยู่แล้วไหม ถ้ามีใช้ & ถ้าไม่มีใช้ ?
        const separator = ticketData.poster.includes('?') ? '&' : '?';
        posterSrc = `${ticketData.poster}${separator}cacheblock=${new Date().getTime()}`;
    }

    return (
        <div ref={ref} style={{ width: '550px', backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", paddingBottom: '0px' }}>

            {/* Header */}
            <div style={{ backgroundColor: '#1a1f2c', padding: '25px 0', textAlign: 'center', borderBottom: '3px solid #f1c40f' }}>
                <h1 style={{ color: '#f1c40f', margin: 0, fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>MCP CINEMA</h1>
                <p style={{ color: '#f1c40f', margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>ยืนยันการจองตั๋วภาพยนตร์</p>
            </div>

            {/* Checkmark & Booking ID (แก้ Style ให้เหมือน Backend เป๊ะๆ) */}
            <div style={{ padding: '30px 20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#27ae60',
                    borderRadius: '50%',
                    display: 'inline-block', // ใช้ inline-block เหมือน email
                    lineHeight: '50px',      // จัดกึ่งกลางแนวตั้งด้วย line-height
                    color: 'white',
                    fontSize: '30px',
                    marginBottom: '10px',
                    textAlign: 'center',
                    verticalAlign: 'middle'
                }}>
                    ✓
                </div>
                <p style={{ color: '#7f8c8d', margin: '0', fontSize: '14px' }}>รหัสการจอง (Booking ID)</p>
                <h2 style={{ color: '#2c3e50', margin: '5px 0', fontSize: '28px', letterSpacing: '1px', fontWeight: 'bold' }}>{ticketData.id}</h2>
                <p style={{ color: '#27ae60', margin: '0', fontSize: '14px', fontWeight: 'bold' }}>ชำระเงินเรียบร้อยแล้ว</p>
            </div>

            <hr style={{ border: 0, borderTop: '1px dashed #ecf0f1', margin: '0' }} />

            {/* Movie Details */}
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div style={{ marginRight: '20px', flexShrink: 0 }}>
                        <img
                            src={posterSrc}
                            alt="Movie Poster"
                            crossOrigin="anonymous"
                            onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                            style={{ width: '100px', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', display: 'block' }}
                        />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '18px', fontWeight: 'bold' }}>{ticketData.movieTitle}</h3>

                        <div style={{ marginBottom: '15px' }}>
                            <span style={{ backgroundColor: '#ecf0f1', color: '#7f8c8d', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', marginRight: '5px' }}>Digital</span>
                            <span style={{ backgroundColor: '#ecf0f1', color: '#7f8c8d', padding: '3px 8px', borderRadius: '4px', fontSize: '10px' }}>{ticketData.duration} นาที</span>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ color: '#7f8c8d', fontSize: '12px', paddingBottom: '5px', width: '80px' }}>โรงภาพยนตร์:</td>
                                    <td style={{ color: '#2c3e50', fontSize: '13px', fontWeight: 'bold', paddingBottom: '5px' }}>{ticketData.cinema}</td>
                                </tr>
                                <tr>
                                    <td style={{ color: '#7f8c8d', fontSize: '12px', paddingBottom: '5px' }}>วันที่:</td>
                                    <td style={{ color: '#2c3e50', fontSize: '13px', fontWeight: 'bold', paddingBottom: '5px' }}>{formatDate(ticketData.date)}</td>
                                </tr>
                                <tr>
                                    <td style={{ color: '#7f8c8d', fontSize: '12px', paddingBottom: '5px' }}>รอบฉาย:</td>
                                    <td style={{ color: '#2c3e50', fontSize: '13px', fontWeight: 'bold', paddingBottom: '5px' }}>{formatTime(ticketData.date)} น.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Seat Box */}
            <div style={{ margin: '0 20px 20px 20px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '15px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '50%', textAlign: 'center', borderRight: '1px solid #ddd', verticalAlign: 'middle' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: '#7f8c8d' }}>โรงที่ (Cinema)</p>
                                <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>{ticketData.cinema}</p>
                            </td>
                            <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'middle' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: '#7f8c8d' }}>ที่นั่ง (Seats)</p>
                                <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#e74c3c' }}>{ticketData.seats}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* QR Code */}
            <div style={{ textAlign: 'center', padding: '10px 20px 30px 20px' }}>
                <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        `${window.location.origin}/admin/verify/${ticketData.id}`
                    )}`}
                    alt="QR Code"
                    crossOrigin="anonymous"
                    style={{ width: '140px', height: '140px', display: 'inline-block' }}
                />
                <p style={{ color: '#95a5a6', fontSize: '11px', marginTop: '10px', textAlign: 'center' }}>
                    พนักงานสแกน QR Code นี้เพื่อตรวจสอบสถานะตั๋ว
                </p>
            </div>

            {/* Payment Details */}
            <div style={{ backgroundColor: '#fcfcfc', padding: '20px', borderTop: '1px solid #eee' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #f1c40f', display: 'inline-block', paddingBottom: '5px', fontSize: '16px' }}>รายละเอียดการชำระเงิน</h4>

                <table style={{ width: '100%', fontSize: '13px' }}>
                    <tbody>
                        <tr>
                            <td style={{ color: '#7f8c8d', padding: '5px 0' }}>ตั๋วชมภาพยนตร์ ({ticketData.seatsCount} ที่นั่ง)</td>
                            <td style={{ textAlign: 'right', color: '#2c3e50', padding: '5px 0' }}>{ticketData.totalPrice.toLocaleString()} THB</td>
                        </tr>
                        <tr>
                            <td colSpan="2"><hr style={{ border: 0, borderTop: '1px solid #eee', margin: '10px 0' }} /></td>
                        </tr>
                        <tr>
                            <td style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '16px', padding: '5px 0' }}>ยอดชำระสุทธิ (Total Amount)</td>
                            <td style={{ textAlign: 'right', color: '#2c3e50', fontWeight: 'bold', fontSize: '18px', padding: '5px 0' }}>{ticketData.totalPrice.toLocaleString()} THB</td>
                        </tr>
                    </tbody>
                </table>
                <p style={{ color: '#bdc3c7', fontSize: '10px', marginTop: '15px', textAlign: 'center' }}>Transaction ID: {ticketData.dbId}</p>
            </div>
        </div>
    );
});

export default TicketTemplate;