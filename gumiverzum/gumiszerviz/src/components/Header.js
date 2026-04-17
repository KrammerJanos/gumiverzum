"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (!token) { setUser(null); return; }

        fetch('http://localhost:5012/api/auth/status', {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).then(data => {
            if (data.loggedIn) setUser(data.user);
            else { setUser(null); localStorage.removeItem('jwt_token'); }
        }).catch(() => setUser(null));
        setIsMenuOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        setUser(null);
        router.push('/bejelentkezes');
    };

    return (
        <header className="header">
            <div className="logo" style={{ cursor: "pointer" }}>
                <Link href="/" style={{ all: "unset" }}>
                    GUMIVERZUM<span>.HU</span>
                </Link>
            </div>
            <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
            </div>
            <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                <Link href="/" className={pathname === "/" ? "active" : ""}>
                    Kezdőlap
                </Link>
                <Link href="/#features">
                    Szolgáltatások
                </Link>
                <Link href="/idopont" className={pathname === "/idopont" ? "active" : ""}>
                    Időpontfoglalás
                </Link>

                {user && (
                    <Link href="/dashboard" className={pathname === "/dashboard" ? "active" : ""}>
                        <i className="fa-solid fa-calendar-check" style={{ marginRight: '6px', color: 'var(--red)' }}></i>
                        Időpontok
                    </Link>
                )}

                {user ? (
                    <div className="user-links-group">
                        <Link href="/dashboard" style={{ color: 'white', fontSize: '14px', textDecoration: 'none' }}>
                            <i className="fa-solid fa-gauge" style={{ color: 'var(--red)', marginRight: '6px' }}></i>
                            Üdv, <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>{user}</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="btn-login"
                            style={{ background: 'transparent', color: 'white', cursor: 'pointer', border: '1px solid var(--red)' }}
                        >
                            KILÉPÉS <i className="fa-solid fa-right-from-bracket"></i>
                        </button>
                    </div>
                ) : (
                    <Link href="/bejelentkezes" className="btn-login">
                        BEJELENTKEZÉS <i className="fa-solid fa-right-to-bracket"></i>
                    </Link>
                )}
            </nav>
        </header>
    );
}
