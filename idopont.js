// Dátum korlátozás: Ne lehessen a mai napnál korábbi dátumot választani
const dateInput = document.getElementById('date');
const today = new Date().toISOString().split('T')[0];
dateInput.setAttribute('min', today);

function validateAndSubmit() {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const date = document.getElementById('date').value;
    const statusMsg = document.getElementById('status-msg');

    // REGEX: 06-tal kell kezdődnie, összesen 11 számjegy (vagy 10)
    const phoneRegex = /^06[0-9]{8,9}$/;

    // Alapvető üresség ellenőrzés
    if (!name || !phone || !date) {
        showMessage("Minden mezőt ki kell tölteni!", "error");
        return;
    }

    // Telefonszám ellenőrzés
    if (!phoneRegex.test(phone)) {
        showMessage("Érvénytelen telefonszám! Formátum: 06301234567", "error");
        return;
    }

    // Ha minden jó
    showMessage("Sikeres foglalás! Hamarosan visszahívjuk.", "success");
    
    // Itt elmenthetnénk LocalStorage-ba is a vizsga kedvéért
    localStorage.setItem('utolso_foglalas', JSON.stringify({
        nev: name,
        datum: date
    }));
}

function showMessage(text, type) {
    const msgBox = document.getElementById('status-msg');
    msgBox.innerText = text;
    msgBox.style.display = 'block';
    
    if (type === "error") {
        msgBox.style.background = "rgba(204, 0, 0, 0.2)";
        msgBox.style.border = "1px solid #cc0000";
        msgBox.style.color = "#ff4d4d";
    } else {
        msgBox.style.background = "rgba(0, 204, 0, 0.2)";
        msgBox.style.border = "1px solid #00cc00";
        msgBox.style.color = "#4dff4d";
    }
}