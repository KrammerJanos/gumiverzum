require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

const app = express();
const PORT = 5012;
const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_gumiverzum_key';

// Adatbázis Kapcsolat Konfigurációja .env alapján
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
    port: 52707
};

// SQL Lekérdező segédfüggvény
async function executeQuery(query, params = []) {
    try {
        let pool = await sql.connect(dbConfig);
        let request = pool.request();
        params.forEach(p => request.input(p.name, p.type, p.value));
        return (await request.query(query)).recordset;
    } catch (err) {
        console.error("SQL Error: ", err);
        throw err;
    }
}

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Gyökér végpont
app.get('/', (req, res) => {
    res.json({ status: "Gumiverzum API is running..." });
});

// Hitelesítés (Login) MSSQL-ből
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const users = await executeQuery(
            'SELECT * FROM Users WHERE Username = @username AND PasswordHash = @pass',
            [
                { name: 'username', type: sql.NVarChar, value: username },
                { name: 'pass', type: sql.NVarChar, value: password } // Itt valós rendszerben BCRYPT hash kéne!
            ]
        );

        if (users.length > 0) {
            const token = jwt.sign({ username: users[0].Username, role: users[0].RoleID }, SECRET_KEY, { expiresIn: '1h' });
            res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 3600000 });
            return res.json({ success: true, message: 'Sikeres bejelentkezés', token });
        }
        return res.status(401).json({ success: false, message: 'Hibás felhasználónév vagy jelszó' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Adatbázis hiba' });
    }
});

// Hitelesítés (Logout)
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({ success: true, message: 'Sikeres kijelentkezés' });
});

// Helper: token kinyerése cookie-ból VAGY Authorization headerből
function extractToken(req) {
    if (req.cookies && req.cookies.token) return req.cookies.token;
    const auth = req.headers['authorization'];
    if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
    return null;
}

// Státusz check
app.get('/api/auth/status', (req, res) => {
    const token = extractToken(req);
    if (!token) return res.json({ loggedIn: false });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return res.json({ loggedIn: true, user: decoded.username });
    } catch (err) {
        return res.json({ loggedIn: false });
    }
});

// Gumiabroncsok MSSQL-ből (JOIN)
app.get('/api/tires', async (req, res) => {
    try {
        const q = `
            SELECT b.BrandName as brand, t.ModelName as model, t.Size as size, t.Price as price 
            FROM Tires t
            INNER JOIN TireBrands b ON t.BrandID = b.BrandID
        `;
        const tires = await executeQuery(q);
        res.json(tires);
    } catch (e) {
        res.status(500).json([]);
    }
});

// Dinamikus árlista MSSQL-ből
app.get('/api/prices', async (req, res) => {
    try {
        const q = `
            SELECT v.TypeName as typeName, s.TaskName as task, p.Cost as cost
            FROM Prices p
            INNER JOIN VehicleTypes v ON p.VehicleTypeID = v.VehicleTypeID
            INNER JOIN Services s ON p.ServiceID = s.ServiceID
        `;
        const dbPrices = await executeQuery(q);

        // Visszaalakítás a frontend által várt formátumba: { szemely: [{task, cost}], teher: [...] }
        const formatted = { szemely: [], teher: [] };
        dbPrices.forEach(item => {
            if (formatted[item.typeName]) {
                formatted[item.typeName].push({ task: item.task, cost: item.cost });
            }
        });
        res.json(formatted);
    } catch (e) {
        res.status(500).json({ szemely: [], teher: [] });
    }
});

// Elérhető idsávok egy adott napra
const ALL_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

app.get('/api/bookings/slots', async (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date param required' });
    try {
        const booked = await executeQuery(
            "SELECT BookingTime FROM Bookings WHERE BookingDate = @date",
            [{ name: 'date', type: sql.Date, value: new Date(date) }]
        );
        const bookedTimes = booked.map(r => r.BookingTime);
        const slots = ALL_SLOTS.map(t => ({ time: t, available: !bookedTimes.includes(t) }));
        res.json(slots);
    } catch (e) {
        // Ha nincs DB kapcsolat, visszaadjuk az összes slotot elérhetőként (fallback)
        console.warn('DB nem elérhető, fallback slots visszaadva.');
        res.json(ALL_SLOTS.map(t => ({ time: t, available: true })));
    }
});

// Foglalások (POST)
app.post('/api/bookings', async (req, res) => {
    const { name, phone, date, time, service } = req.body;
    if (!time) return res.status(400).json({ success: false, message: 'Kérjük válasszon időpontot!' });
    try {
        let pool = await sql.connect(dbConfig);

        // 1. Dupla foglalás ellenőrzése
        const existing = await pool.request()
            .input('date', sql.Date, new Date(date))
            .input('time', sql.NVarChar, time)
            .query('SELECT BookingID FROM Bookings WHERE BookingDate = @date AND BookingTime = @time');
        if (existing.recordset.length > 0) {
            return res.status(409).json({ success: false, message: `A(z) ${time} órai időpont már foglalt ezen a napon!` });
        }

        // 2. Vásárló keresése vagy beszúrása
        let custRes = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('phone', sql.NVarChar, phone)
            .query("IF NOT EXISTS (SELECT 1 FROM Customers WHERE Phone = @phone) INSERT INTO Customers (Name, Phone) VALUES (@name, @phone); SELECT CustomerID FROM Customers WHERE Phone = @phone;");
        const customerId = custRes.recordset[0].CustomerID;

        // 3. Szolgáltatás ID
        let serviceId = 4;
        if (service === 'centrirozas') serviceId = 1;
        if (service === 'javitas') serviceId = 2;
        if (service === 'tarolas') serviceId = 3;

        // 4. Foglalás mentése időponttal
        await pool.request()
            .input('custId', sql.Int, customerId)
            .input('servId', sql.Int, serviceId)
            .input('date', sql.Date, new Date(date))
            .input('time', sql.NVarChar, time)
            .query('INSERT INTO Bookings (CustomerID, ServiceID, BookingDate, BookingTime) VALUES (@custId, @servId, @date, @time)');

        res.json({ success: true, message: `Sikeres foglalás! ${date} – ${time} óra. Hamarosan visszahívjuk.` });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Adatbázis hiba történt a foglaláskor.' });
    }
});

// Foglalások listája (GET) - token ellenőrzéssel
app.get('/api/bookings', (req, res) => {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Nincs bejelentkezve' });

    try {
        jwt.verify(token, SECRET_KEY);
    } catch {
        return res.status(401).json({ error: 'Érvénytelen token' });
    }

    executeQuery(`
        SELECT 
            b.BookingID,
            c.Name as customerName,
            c.Phone as customerPhone,
            s.TaskName as service,
            b.BookingDate,
            b.BookingTime,
            b.Status,
            b.CreatedAt
        FROM Bookings b
        INNER JOIN Customers c ON b.CustomerID = c.CustomerID
        INNER JOIN Services s ON b.ServiceID = s.ServiceID
        WHERE b.Status = 'Pending'
        ORDER BY b.BookingDate ASC, b.BookingTime ASC
    `).then(rows => res.json(rows))
        .catch(() => res.status(500).json([]));
});

// Foglalás lezárása (PATCH) - "Elvégezve"
app.patch('/api/bookings/:id/complete', (req, res) => {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Nincs bejelentkezve' });
    try { jwt.verify(token, SECRET_KEY); } catch { return res.status(401).json({ error: 'Érvénytelen token' }); }

    const { id } = req.params;
    executeQuery(
        "UPDATE Bookings SET Status = 'Completed' WHERE BookingID = @id",
        [{ name: 'id', type: sql.Int, value: parseInt(id) }]
    ).then(() => res.json({ success: true }))
        .catch(() => res.status(500).json({ success: false }));
});

app.listen(PORT, () => {
    console.log(`Backend API fut a http://localhost:${PORT} címen`);
});
