import React from 'react';

export default function BookingPageAdmin() {
    // ข้อมูลจำลองตามตัวอย่างใน Figma
    const bookings = [
        { id: 'CB0012343', name: 'อภิญญาวุฒิ เ*****', movie: 'โดราเอมอน เดอะมู...', theater: 'Robinson (C1)', seat: 'A23, A24', time: '12:40', price: 400, status: 'ชำระแล้ว' },
        { id: 'CB0032241', name: 'ธนชัย บ*****', movie: 'Avengers End...', theater: 'Robinson (C2)', seat: 'K20, K21', time: '11:25', price: 360, status: 'ชำระแล้ว' },
        { id: 'CB0095843', name: 'ยุวดี แ*****', movie: 'Avengers End...', theater: 'Robinson (C2)', seat: 'B23, B24', time: '12:40', price: 400, status: 'ชำระแล้ว' },
        { id: 'CB005520', name: 'ปรียากร ว*****', movie: 'Avatar the way..', theater: 'Robinson (C3)', seat: 'A2, A3', time: '15:15', price: 400, status: 'รอชำระ' },
    ];

    return (
        <div className="admin-page-content-inside">
            <header className="content-header-figma">
                <div className="header-left">
                    <h1>การจอง</h1>
                    <p>รวมข้อมูลการจองทั้งหมดในระบบ...</p>
                </div>
                <div className="header-right-time">
                    <span>11 Sep 2026</span>
                    <span className="time-clock">22:41:56</span>
                </div>
            </header>

            <div className="figma-table-container">
                <h2 className="table-title">การจองทั้งหมด</h2>
                <div className="table-scroll-wrapper">
                    <table className="admin-custom-table">
                        <thead>
                            <tr>
                                <th>รหัสจอง</th>
                                <th>ชื่อ</th>
                                <th>หนัง</th>
                                <th>โรงภาพยนตร์</th>
                                <th>ที่นั่ง</th>
                                <th>เวลา</th>
                                <th>ราคา</th>
                                <th>สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.id}</td>
                                    <td>{item.name}</td>
                                    <td className="text-truncate">{item.movie}</td>
                                    <td>{item.theater}</td>
                                    <td>{item.seat}</td>
                                    <td>{item.time}</td>
                                    <td>{item.price}</td>
                                    <td>
                                        <span className={`status-pill ${item.status === 'ชำระแล้ว' ? 'paid' : 'pending'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}