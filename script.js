// ADATOK
const tireData = [
    { brand: "Michelin", model: "Pilot Sport 5", size: "225/45 R17", price: 48500 },
    { brand: "Continental", model: "WinterContact", size: "205/55 R16", price: 39900 },
    { brand: "Hankook", model: "Ventus Prime", size: "195/65 R15", price: 24500 },
    { brand: "Bridgestone", model: "Blizzak", size: "225/50 R17", price: 42000 }
];

const prices = {
    szemely: [
        { task: "Szerelés + Centrírozás", cost: 4500 },
        { task: "Defektjavítás", cost: 5500 },
        { task: "Tárolás / szezon", cost: 12000 }
    ],
    teher: [
        { task: "Szerelés + Centrírozás", cost: 9500 },
        { task: "Defektjavítás", cost: 12000 },
        { task: "Tárolás / szezon", cost: 25000 }
    ]
};

// BELÉPÉS KEZELÉSE
function handleLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (pass === "1234") {
        document.getElementById('login-overlay').style.fadeOut = "slow";
        document.getElementById('login-overlay').style.display = 'none';
        document.querySelector('.header').style.display = 'flex';
        document.getElementById('main-content').style.display = 'block';
        showSection('home');
        renderTires(tireData);
        updatePrices();
    } else {
        alert("Hibás jelszó! (Próbáld: 1234)");
    }
}

// NAVIGÁCIÓ
function showSection(id) {
    document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
    window.scrollTo(0, 0);
}

// DINAMIKUS ÁRLISTA
function updatePrices() {
    const type = document.getElementById('vehicle-type').value;
    const container = document.getElementById('price-list');
    container.innerHTML = prices[type].map(item => `
        <div class="tire-card" style="display: flex; justify-content: space-between; padding: 15px;">
            <span>${item.task}</span>
            <span style="color: #cc0000; font-weight: bold;">${item.cost} Ft</span>
        </div>
    `).join('');
}

// WEBSHOP SZŰRÉS
function renderTires(data) {
    const grid = document.getElementById('tire-grid');
    grid.innerHTML = data.map(t => `
        <div class="tire-card">
            <h3>${t.brand}</h3>
            <p>${t.model}</p>
            <small>${t.size}</small>
            <div style="color: var(--red); margin: 10px 0; font-weight:bold;">${t.price.toLocaleString()} Ft</div>
            <button class="btn-red" style="padding: 5px 10px; font-size: 12px;">Kosárba</button>
        </div>
    `).join('');
}

function filterTires() {
    const val = document.getElementById('tire-search').value.toLowerCase();
    const filtered = tireData.filter(t => t.brand.toLowerCase().includes(val));
    renderTires(filtered);
}

// KALKULÁTOR LOGIKA
function calculateTireState() {
    const year = parseInt(document.getElementById('dot-year').value);
    const depth = parseFloat(document.getElementById('tread-depth').value);
    const result = document.getElementById('calc-result');
    const currentYear = new Date().getFullYear();

    result.style.display = 'block';
    
    if (depth < 1.6 || (currentYear - year) > 10) {
        result.innerHTML = "ÁLLAPOT: ÉLETVESZÉLYES / CSERE ÉRET!";
        result.style.background = "#660000";
    } else if (depth < 4) {
        result.innerHTML = "ÁLLAPOT: FIGYELEM, HAMAROSAN CSERE!";
        result.style.background = "#886600";
    } else {
        result.innerHTML = "ÁLLAPOT: BIZTONSÁGOS";
        result.style.background = "#004400";
    }
}

// IDŐPONT FOGLALÁS + VALIDÁCIÓ (REGEX)
function submitBooking() {
    const phone = document.getElementById('book-phone').value;
    const date = document.getElementById('book-date').value;
    const phoneRegex = /^06[0-9]{8,9}$/;
    
    const selectedDate = new Date(date);
    const today = new Date();

    if (!phoneRegex.test(phone)) {
        alert("Hiba: A telefonszámnak 06-tal kell kezdődnie (pl: 06301234567)");
        return;
    }

    if (selectedDate < today) {
        alert("Hiba: Nem foglalhatsz múltbéli időpontot!");
        return;
    }

    alert("Sikeres foglalás! Munkatársunk keresni fogja a " + phone + " számon.");
}

// GALÉRIA
function openGallery(src) {
    const modal = document.getElementById('gallery-modal');
    document.getElementById('modal-img').src = src;
    modal.style.display = 'flex';
}

// TÉMA VÁLTÓ
function toggleTheme() {
    document.body.classList.toggle('carbon-fiber');
    document.body.classList.toggle('deep-black');
}