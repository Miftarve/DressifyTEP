const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Configurazione per accettare i dati in formato JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Imposta la directory per i file statici (dove si trovano i file Vue.js o HTML)
app.use(express.static(path.join(__dirname, 'public')));

// Inizializza il database SQLite
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
    if (err) {
        console.error('Errore nell\'apertura del database:', err.message);
    } else {
        console.log('Connessione al database riuscita');
    }
});

// Crea la tabella "users" nel database
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            dob TEXT
        )
    `);
});

// Route principale per il caricamento della pagina di Vue.js o HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route per gestire la registrazione
app.post('/register', async (req, res) => {
    const { name, email, password, dob } = req.body;
    console.log('Dati ricevuti dal client:', req.body); // Log dei dati ricevuti

    try {
        // Hash della password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password criptata:', hashedPassword);

        // Inserisce i dati dell'utente nel database
        db.run(
            `INSERT INTO users (name, email, password, dob) VALUES (?, ?, ?, ?)`,
            [name, email, hashedPassword, dob],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        console.error('Email già esistente:', email);
                        return res.status(400).json({ message: 'Email già in uso' });
                    } else {
                        console.error('Errore durante l\'inserimento nel database:', err.message);
                        return res.status(500).json({ message: 'Errore durante la registrazione', error: err });
                    }
                }
                console.log('Utente registrato con ID:', this.lastID); // Log per vedere se l'inserimento è andato a buon fine
                res.status(200).json({ message: 'Registrazione avvenuta con successo!' });
            }
        );
    } catch (error) {
        console.error('Errore nel server:', error.message);
        res.status(500).json({ message: 'Errore nel server', error });
    }
});

// Route per gestire il login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Verifica se l'utente esiste nel database
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Errore durante il login', error: err });
        }
        if (!user) {
            return res.status(400).json({ message: 'Email non trovata' });
        }

        // Confronta la password fornita con quella salvata
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Password errata' });
        }

        res.status(200).json({ message: 'Login avvenuto con successo!', user });
    });
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
