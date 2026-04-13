"use client";
import { useState, useEffect } from 'react';

export default function Home() {
    const [tireData, setTireData] = useState([]);
    const [pricesData, setPricesData] = useState({ szemely: [], teher: [] });

    // Webshop state
    const [searchTerm, setSearchTerm] = useState('');
    
    // Price state
    const [vehicleType, setVehicleType] = useState('szemely');

    // Calc state
    const [dotYear, setDotYear] = useState('');
    const [treadDepth, setTreadDepth] = useState('');
    const [calcResult, setCalcResult] = useState(null);

    useEffect(() => {
        fetch('http://localhost:5012/api/tires')
            .then(res => res.json())
            .then(data => setTireData(data))
            .catch(err => console.error("Tires error", err));
            
        fetch('http://localhost:5012/api/prices')
            .then(res => res.json())
            .then(data => setPricesData(data))
            .catch(err => console.error("Prices error", err));
    }, []);

    // Filter tires
    const filteredTires = tireData.filter(t => t.brand.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleCalculate = () => {
        const year = parseInt(dotYear);
        const depth = parseFloat(treadDepth);
        const currentYear = new Date().getFullYear();

        if (isNaN(year) || isNaN(depth)) {
            setCalcResult({ text: "Kérjük érvényes számokat adjon meg!", bg: "#886600" });
            return;
        }

        if (depth < 1.6 || (currentYear - year) > 10) {
            setCalcResult({ text: "ÁLLAPOT: ÉLETVESZÉLYES / CSERE ÉRET!", bg: "#660000" });
        } else if (depth < 4) {
            setCalcResult({ text: "ÁLLAPOT: FIGYELEM, HAMAROSAN CSERE!", bg: "#886600" });
        } else {
            setCalcResult({ text: "ÁLLAPOT: BIZTONSÁGOS", bg: "#004400" });
        }
    };

    return (
        <main>
            {/* HERO */}
            <section className="hero">
                <div className="hero-content">
                    <h1>PROFESSZIONÁLIS <br/><span>GUMISZERVIZ</span></h1>
                    <p>Gyorsaság. Precizitás. Biztonság az utakon.</p>
                    <div className="hero-buttons">
                        <a href="/idopont" className="btn-red">IDŐPONTOT FOGLALOK</a>
                        <a href="#features" className="btn-outline">TUDJON MEG TÖBBET</a>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="features">
                <div className="feature-card">
                    <i className="fa-solid fa-gauge-high"></i>
                    <h3>Gyors szerviz</h3>
                    <p>Akár 30 perc alatt végzünk a teljes átszereléssel.</p>
                </div>
                <div className="feature-card">
                    <i className="fa-solid fa-shield-halved"></i>
                    <h3>Garancia</h3>
                    <p>Minden elvégzett munkánkra 6 hónap garanciát vállalunk.</p>
                </div>
                <div className="feature-card">
                    <i className="fa-solid fa-warehouse"></i>
                    <h3>Gumi hotel</h3>
                    <p>Szakszerű tárolás állandó hőmérsékleten.</p>
                </div>
            </section>

            {/* EXTRA FEATURES SECTION */}
            <section className="page-section" style={{ background: "var(--dark-bg)", padding: "40px 10%" }}>
                <h2 style={{ textAlign: "center", marginBottom: "40px" }}><span style={{ color: "var(--red)" }}>EXTRA</span> FUNKCIÓK</h2>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px" }}>
                    
                    {/* ÁRLISTA */}
                    <div className="form-card" style={{ margin: 0, width: "100%" }}>
                        <h3 style={{ marginBottom: "20px" }}>Dinamikus Árlista</h3>
                        <div className="form-group">
                            <label>Jármű típusa:</label>
                            <select className="input-field" value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
                                <option value="szemely">Személyautó</option>
                                <option value="teher">Teherautó / Kisteher</option>
                            </select>
                        </div>
                        <div id="price-list">
                            {pricesData[vehicleType].map((item, idx) => (
                                <div key={idx} className="tire-card" style={{ display: "flex", justifyContent: "space-between", padding: "15px", marginBottom: "10px" }}>
                                    <span>{item.task}</span>
                                    <span style={{ color: "#cc0000", fontWeight: "bold" }}>{item.cost} Ft</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* KALKULÁTOR */}
                    <div className="form-card" style={{ margin: 0, width: "100%" }}>
                        <h3 style={{ marginBottom: "20px" }}>Abroncs Állapot Kalkulátor</h3>
                        <div className="form-group">
                            <label>Gyártási év (DOT):</label>
                            <input type="number" className="input-field" placeholder="pl. 2021" value={dotYear} onChange={e => setDotYear(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Profilmélység (mm):</label>
                            <input type="number" step="0.1" className="input-field" placeholder="pl. 5.5" value={treadDepth} onChange={e => setTreadDepth(e.target.value)} />
                        </div>
                        <button className="btn-red" style={{ width: "100%" }} onClick={handleCalculate}>Kalkuláció</button>
                        {calcResult && (
                            <div style={{ marginTop: "20px", padding: "15px", borderRadius: "4px", background: calcResult.bg, fontWeight: "bold", textAlign: "center" }}>
                                {calcResult.text}
                            </div>
                        )}
                    </div>

                </div>

                {/* WEBSHOP */}
                <div style={{ marginTop: "60px" }}>
                    <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Gumiabroncs Webshop</h3>
                    <div style={{ maxWidth: "400px", margin: "0 auto 30px" }}>
                        <input 
                            className="input-field" 
                            type="text" 
                            placeholder="Keresés márka alapján..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="tire-grid">
                        {filteredTires.length > 0 ? filteredTires.map((t, idx) => (
                            <div key={idx} className="tire-card">
                                <h3>{t.brand}</h3>
                                <p>{t.model}</p>
                                <small>{t.size}</small>
                                <div style={{ color: "var(--red)", margin: "10px 0", fontWeight: "bold" }}>{t.price.toLocaleString()} Ft</div>
                                <button className="btn-red" style={{ padding: "5px 10px", fontSize: "12px", width: "100%" }}>Kosárba</button>
                            </div>
                        )) : (
                            <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "#ccc" }}>Nincs találat a keresésre.</div>
                        )}
                    </div>
                </div>

            </section>
        </main>
    );
}
