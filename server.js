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
    console.log('Richiesta ricevuta al server:', req.body); // Log dei dati ricevuti dal frontend

    const { name, email, password, dob } = req.body;
    if (!name || !email || !password || !dob) {
        console.log('Campi mancanti'); // Log in caso di campi mancanti
        return res.status(400).json({ message: 'Tutti i campi sono obbligatori' });
    }

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
                    console.error('Errore durante l\'inserimento nel database:', err.message);
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ message: 'Email già in uso' });
                    } else {
                        return res.status(500).json({ message: 'Errore durante la registrazione', error: err });
                    }
                }
                console.log('Utente registrato con ID:', this.lastID); // Log per confermare l'inserimento
                res.status(200).json({ message: 'Registrazione avvenuta con successo!' });
            }
        );
    } catch (error) {
        console.error('Errore nel server:', error.message);
        res.status(500).json({ message: 'Errore nel server', error });
    }
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
