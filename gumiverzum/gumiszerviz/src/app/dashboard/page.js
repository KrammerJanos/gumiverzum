"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function authFetch(url, options = {}) {
    const token = localStorage.getItem('jwt_token');
    return fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            'Authorization': token ? `Bearer ${token}` : '',
        }
    });
}

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [completing, setCompleting] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (!token) { router.replace('/bejelentkezes'); return; }

        authFetch('http://localhost:5012/api/auth/status')
            .then(res => res.json())
            .then(data => {
                if (!data.loggedIn) {
                    localStorage.removeItem('jwt_token');
                    router.replace('/bejelentkezes');
                    return Promise.reject('not_logged_in');
                }
                setUser(data.user);
                return authFetch('http://localhost:5012/api/bookings');
            })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setBookings(data);
                else setError('Nem sikerült betölteni a foglalásokat.');
                setLoading(false);
            })
            .catch(err => {
                if (err !== 'not_logged_in') setError('Nem sikerült betölteni az adatokat.');
                setLoading(false);
            });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        router.replace('/bejelentkezes');
    };

    const handleComplete = async (bookingId) => {
        setCompleting(bookingId);

        // Optimistic update: azonnal tüntetjük el
        const prev = bookings;
        setBookings(current => current.filter(b => b.BookingID !== bookingId));

        try {
            const res = await authFetch(`http://localhost:5012/api/bookings/${bookingId}/complete`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });
            // Ha a DB nem elérhető, a sor már el van távolítva — ez rendben van
            if (!res.ok) {
                console.warn('PATCH sikertelen, de a sor eltávolítva.');
            }
        } catch (e) {
            console.error('Hálózati hiba az elvégezve-nél:', e);
            // Ha hálózati hiba, visszatesszük a sort
            setBookings(prev);
        } finally {
            setCompleting(null);
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('hu-HU') : '-';

    if (loading) return (
        <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#ccc', fontSize: '18px' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px', color: 'var(--red)' }}></i>
                Betöltés...
            </p>
        </main>
    );

    return (
        <main style={{ padding: '40px 8%', minHeight: '80vh' }}>

            {/* Üdvözlő kártya */}
            <div style={{
                background: 'var(--card-bg)',
                border: '1px solid #222',
                borderLeft: '4px solid var(--red)',
                borderRadius: '8px',
                padding: '30px 40px',
                marginBottom: '40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px'
            }}>
                <div>
                    <p style={{ color: '#999', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        <i className="fa-solid fa-circle-check" style={{ color: '#00cc00', marginRight: '6px' }}></i>
                        Bejelentkezve
                    </p>
                    <h1 style={{ fontSize: '32px', margin: '8px 0' }}>
                        Üdv, <span style={{ color: 'var(--red)' }}>{user}</span>!
                    </h1>
                    <p style={{ color: '#555', fontSize: '14px' }}>Gumiverzum Admin Vezérlőpult</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Link href="/idopont" className="btn-outline" style={{ padding: '10px 24px', fontSize: '14px' }}>
                        <i className="fa-solid fa-calendar-plus" style={{ marginRight: '8px' }}></i>
                        Új Foglalás
                    </Link>
                    <button onClick={handleLogout} className="btn-red" style={{ padding: '10px 24px', fontSize: '14px' }}>
                        <i className="fa-solid fa-right-from-bracket" style={{ marginRight: '8px' }}></i>
                        Kijelentkezés
                    </button>
                </div>
            </div>

            {/* Statisztikai kártyák */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                {[
                    { label: 'Összes Foglalás', value: bookings.length, icon: 'fa-calendar-check' },
                    { label: 'Jövőbeli', value: bookings.filter(b => new Date(b.BookingDate) >= new Date()).length, icon: 'fa-clock' },
                    { label: 'Egyedi Ügyfél', value: new Set(bookings.map(b => b.customerPhone)).size, icon: 'fa-users' },
                ].map((stat, i) => (
                    <div key={i} style={{
                        background: 'var(--card-bg)',
                        border: '1px solid #222',
                        borderRadius: '8px',
                        padding: '28px',
                        textAlign: 'center'
                    }}>
                        <i className={`fa-solid ${stat.icon}`} style={{ fontSize: '28px', color: 'var(--red)', marginBottom: '12px', display: 'block' }}></i>
                        <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'white', lineHeight: 1 }}>{stat.value}</div>
                        <div style={{ fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Foglalások táblázat */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid #222', overflow: 'hidden' }}>
                <div style={{ padding: '20px 30px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <i className="fa-solid fa-list" style={{ color: 'var(--red)' }}></i>
                    <h2 style={{ fontSize: '18px', margin: 0 }}>Időpontfoglalások</h2>
                    <span style={{
                        background: 'var(--red)',
                        color: 'white',
                        borderRadius: '12px',
                        padding: '2px 10px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}>{bookings.length}</span>
                </div>

                {error && (
                    <p style={{ color: '#ff4d4d', padding: '25px 30px', margin: 0 }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>{error}
                    </p>
                )}

                {!error && bookings.length === 0 && (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#444' }}>
                        <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '40px', marginBottom: '16px', display: 'block', color: '#333' }}></i>
                        <p>Még nincs egyetlen foglalás sem a rendszerben.</p>
                    </div>
                )}

                {bookings.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#0d0d0d' }}>
                                    {['#', 'Ügyfél Neve', 'Telefonszám', 'Szolgáltatás', 'Dátum', 'Időpont', 'Létrehozva', 'Művelet'].map(h => (
                                        <th key={h} style={{
                                            padding: '14px 20px',
                                            textAlign: 'left',
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1.5px',
                                            color: '#555',
                                            fontWeight: 'normal',
                                            borderBottom: '1px solid #1a1a1a'
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((b, i) => (
                                    <tr key={b.BookingID}
                                        style={{ borderBottom: '1px solid #111' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '16px 20px', color: '#333', fontSize: '13px' }}>{i + 1}</td>
                                        <td style={{ padding: '16px 20px', fontWeight: 'bold' }}>{b.customerName}</td>
                                        <td style={{ padding: '16px 20px', color: '#888', fontSize: '14px' }}>
                                            <i className="fa-solid fa-phone" style={{ marginRight: '6px', color: '#333' }}></i>
                                            {b.customerPhone}
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{
                                                background: 'rgba(204,0,0,0.12)',
                                                border: '1px solid rgba(204,0,0,0.25)',
                                                color: '#cc4444',
                                                borderRadius: '4px',
                                                padding: '4px 12px',
                                                fontSize: '13px'
                                            }}>{b.service}</span>
                                        </td>
                                        <td style={{ padding: '16px 20px', color: 'white', fontWeight: 'bold' }}>
                                            <i className="fa-solid fa-calendar" style={{ marginRight: '6px', color: 'var(--red)' }}></i>
                                            {formatDate(b.BookingDate)}
                                        </td>
                                        <td style={{ padding: '16px 20px', color: 'var(--red)', fontWeight: 'bold', fontSize: '15px' }}>
                                            <i className="fa-solid fa-clock" style={{ marginRight: '6px' }}></i>
                                            {b.BookingTime || '-'}
                                        </td>
                                        <td style={{ padding: '16px 20px', color: '#444', fontSize: '13px' }}>{formatDate(b.CreatedAt)}</td>
                                        <td style={{ padding: '12px 20px' }}>
                                            <button
                                                onClick={() => handleComplete(b.BookingID)}
                                                disabled={completing === b.BookingID}
                                                style={{
                                                    background: completing === b.BookingID ? '#1a1a1a' : 'rgba(0,180,0,0.12)',
                                                    border: '1px solid rgba(0,180,0,0.35)',
                                                    color: completing === b.BookingID ? '#444' : '#44dd44',
                                                    borderRadius: '6px',
                                                    padding: '8px 16px',
                                                    fontSize: '13px',
                                                    cursor: completing === b.BookingID ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    whiteSpace: 'nowrap',
                                                    transition: 'all 0.2s'
                                                }}
                                                title="Foglalás elvégezve – eltüntetés a listából"
                                            >
                                                {completing === b.BookingID
                                                    ? <><i className="fa-solid fa-spinner fa-spin"></i> Mentés...</>
                                                    : <><i className="fa-solid fa-circle-check"></i> Elvégezve</>
                                                }
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
}
