"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Bejelentkezes() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5012/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'admin', password }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                // JWT token mentése localStorage-ba
                localStorage.setItem('jwt_token', data.token);
                router.push('/dashboard');
            } else {
                setError(data.message || 'Hiba a bejelentkezés során');
            }
        } catch (err) {
            setError('Hálózati hiba – a backend elérhető?');
        }
    };

    return (
        <main className="page-section" style={{ minHeight: "80vh", display: "flex", alignItems: "center" }}>
            <div className="form-card" style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}>
                <h2>BEJELENTKEZÉS</h2>
                <p style={{ color: "#ccc", marginBottom: "30px", fontSize: "14px" }}>Jelentkezzen be a további funkciókért</p>

                <form onSubmit={handleLogin} className="booking-form">
                    <div className="form-group">
                        <label><i className="fa-solid fa-user"></i> Felhasználónév</label>
                        <input type="text" className="input-field" placeholder="admin" disabled value="admin" />
                    </div>

                    <div className="form-group">
                        <label><i className="fa-solid fa-lock"></i> Jelszó</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="****"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setError(''); }}
                        />
                    </div>

                    <button type="submit" className="btn-red" style={{ width: "100%", marginTop: "10px" }}>BELÉPÉS</button>

                    {error && (
                        <div style={{ marginTop: "15px", color: "#ff4d4d", fontSize: "14px", textAlign: "center" }}>
                            {error}
                        </div>
                    )}
                </form>
            </div>
        </main>
    );
}
