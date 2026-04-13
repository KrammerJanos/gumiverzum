"use client";
import { useState, useEffect } from 'react';

const SLOT_LABELS = {
    '08:00': '8:00', '09:00': '9:00', '10:00': '10:00',
    '11:00': '11:00', '12:00': '12:00', '13:00': '13:00',
    '14:00': '14:00', '15:00': '15:00', '16:00': '16:00'
};

export default function Idopont() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [date, setDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [service, setService] = useState('kereccsere');
    const [statusMsg, setStatusMsg] = useState(null);
    const [minDate, setMinDate] = useState('');
    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsError, setSlotsError] = useState(false);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setMinDate(today);
    }, []);

    // Dátum választásakor lekérjük a foglalt slotokat
    const handleDateChange = async (e) => {
        const d = e.target.value;
        setDate(d);
        setSelectedTime('');
        setSlots([]);
        setSlotsError(false);
        if (!d) return;

        setSlotsLoading(true);
        try {
            const res = await fetch(`http://localhost:5012/api/bookings/slots?date=${d}`);
            if (!res.ok) throw new Error('Server error');
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setSlots(data);
            } else {
                setSlotsError(true);
            }
        } catch {
            setSlotsError(true);
        } finally {
            setSlotsLoading(false);
        }
    };

    const validateAndSubmit = async () => {
        const phoneRegex = /^06[0-9]{8,9}$/;

        if (!name || !phone || !date || !selectedTime) {
            setStatusMsg({ text: "Kérjük töltse ki az összes mezőt és válasszon időpontot!", type: "error" });
            return;
        }

        if (!phoneRegex.test(phone)) {
            setStatusMsg({ text: "Érvénytelen telefonszám! Formátum: 06301234567", type: "error" });
            return;
        }

        try {
            const res = await fetch('http://localhost:5012/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, date, time: selectedTime, service })
            });
            const data = await res.json();

            if (data.success) {
                setStatusMsg({ text: data.message, type: "success" });
                // Frissítjük a slot nézetét
                handleDateChange({ target: { value: date } });
                setName('');
                setPhone('');
                setSelectedTime('');
                setService('kereccsere');
            } else {
                setStatusMsg({ text: data.message || "Hiba történt a foglalás során.", type: "error" });
            }
        } catch {
            setStatusMsg({ text: "Hálózati hiba. Nem sikerült elérni a szervert.", type: "error" });
        }
    };

    return (
        <main className="page-section" style={{ minHeight: "80vh", display: "flex", alignItems: "center", padding: "40px 8%" }}>
            <div style={{ width: "100%", maxWidth: "700px", margin: "0 auto" }}>
                <div className="form-card" style={{ width: "100%", margin: "0 0 0 0" }}>
                    <h2>IDŐPONT <span>FOGLALÁS</span></h2>
                    <p style={{ color: "#ccc", marginBottom: "30px", fontSize: "14px" }}>
                        Kérjük, adja meg adatait a foglaláshoz!
                    </p>

                    <div className="booking-form">
                        {/* Név */}
                        <div className="form-group">
                            <label><i className="fa-solid fa-user"></i> Teljes név</label>
                            <input type="text" className="input-field" placeholder="Gipsz Jakab" value={name} onChange={e => setName(e.target.value)} />
                        </div>

                        {/* Telefon */}
                        <div className="form-group">
                            <label><i className="fa-solid fa-phone"></i> Telefonszám</label>
                            <input type="text" className="input-field" placeholder="06301234567" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>

                        {/* Dátum */}
                        <div className="form-group">
                            <label><i className="fa-solid fa-calendar-days"></i> Dátum választás</label>
                            <input
                                type="date"
                                className="input-field"
                                min={minDate}
                                value={date}
                                onChange={handleDateChange}
                            />
                        </div>

                        {/* Időpont slotok */}
                        {date && (
                            <div className="form-group">
                                <label>
                                    <i className="fa-solid fa-clock"></i> Időpont választás
                                    {selectedTime && (
                                        <span style={{ marginLeft: '12px', color: 'var(--red)', fontWeight: 'bold', textTransform: 'none' }}>
                                            — Kiválasztva: {selectedTime}
                                        </span>
                                    )}
                                </label>
                                {slotsLoading ? (
                                    <p style={{ color: '#666', fontSize: '14px' }}>
                                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Betöltés...
                                    </p>
                                ) : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                                        gap: '10px',
                                        marginTop: '8px'
                                    }}>
                                        {slotsError && (
                                            <p style={{ color: '#ff4d4d', fontSize: '13px', gridColumn: '1/-1' }}>
                                                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
                                                Nem sikerült betölteni az időpontokat. Ellenőrizd, hogy a backend fut-e!
                                            </p>
                                        )}
                                        {slots.map(slot => {
                                            const isSelected = selectedTime === slot.time;
                                            const isTaken = !slot.available;
                                            return (
                                                <button
                                                    key={slot.time}
                                                    disabled={isTaken}
                                                    onClick={() => !isTaken && setSelectedTime(slot.time)}
                                                    style={{
                                                        padding: '12px 6px',
                                                        borderRadius: '6px',
                                                        border: isSelected
                                                            ? '2px solid var(--red)'
                                                            : isTaken
                                                                ? '1px solid #2a2a2a'
                                                                : '1px solid #333',
                                                        background: isSelected
                                                            ? 'rgba(204,0,0,0.2)'
                                                            : isTaken
                                                                ? '#111'
                                                                : '#1a1a1a',
                                                        color: isSelected
                                                            ? 'var(--red)'
                                                            : isTaken
                                                                ? '#333'
                                                                : 'white',
                                                        cursor: isTaken ? 'not-allowed' : 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: isSelected ? 'bold' : 'normal',
                                                        transition: 'all 0.2s',
                                                        position: 'relative',
                                                    }}
                                                    title={isTaken ? 'Ez az időpont már foglalt' : `${slot.time} szabad`}
                                                >
                                                    {SLOT_LABELS[slot.time]}
                                                    {isTaken && (
                                                        <span style={{
                                                            display: 'block',
                                                            fontSize: '10px',
                                                            color: '#cc3333',
                                                            marginTop: '3px'
                                                        }}>Foglalt</span>
                                                    )}
                                                    {!isTaken && (
                                                        <span style={{
                                                            display: 'block',
                                                            fontSize: '10px',
                                                            color: isSelected ? 'var(--red)' : '#44aa44',
                                                            marginTop: '3px'
                                                        }}>
                                                            {isSelected ? '✓ Kiválasztva' : 'Szabad'}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Szolgáltatás */}
                        <div className="form-group">
                            <label><i className="fa-solid fa-car"></i> Szolgáltatás típusa</label>
                            <select className="input-field" value={service} onChange={e => setService(e.target.value)}>
                                <option value="kereccsere">Teljes kerékcsere</option>
                                <option value="centrirozas">Centrírozás</option>
                                <option value="javitas">Defektjavítás</option>
                                <option value="tarolas">Gumi tárolás (Hotel)</option>
                            </select>
                        </div>

                        <button
                            className="btn-red"
                            style={{ width: "100%", marginTop: "10px" }}
                            onClick={validateAndSubmit}
                        >
                            <i className="fa-solid fa-paper-plane" style={{ marginRight: '8px' }}></i>
                            FOGLALÁS ELKÜLDÉSE
                        </button>
                    </div>

                    {statusMsg && (
                        <div style={{
                            marginTop: "20px",
                            padding: "15px",
                            borderRadius: "4px",
                            background: statusMsg.type === 'error' ? "rgba(204, 0, 0, 0.2)" : "rgba(0, 204, 0, 0.15)",
                            border: statusMsg.type === 'error' ? "1px solid #cc0000" : "1px solid #00cc00",
                            color: statusMsg.type === 'error' ? "#ff4d4d" : "#4dff4d"
                        }}>
                            <i className={`fa-solid ${statusMsg.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'}`} style={{ marginRight: '8px' }}></i>
                            {statusMsg.text}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
