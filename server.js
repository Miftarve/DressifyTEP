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

// Imposta la directory per i file statici
app.use(express.static(path.join(__dirname, 'public')));

// Inizializza il database SQLite
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
    if (err) {
        console.error('Errore nell\'apertura del database:', err.message);
    } else {
        console.log('Connessione al database riuscita');
    }
});

// Crea le tabelle "users" e "products" nel database
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

    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            size TEXT,
            color TEXT,
            brand TEXT,
            condition TEXT,
            price REAL
        )
    `);
});

// Modifica la struttura della tabella "products" per includere il campo "price"
db.run(`ALTER TABLE products ADD COLUMN price REAL`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
        console.error('Errore nell\'aggiunta della colonna price:', err.message);
    } 
    
});

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route per gestire la registrazione
app.post('/register', async (req, res) => {
    const { name, email, password, dob } = req.body;
    if (!name || !email || !password || !dob) {
        return res.status(400).json({ message: 'Tutti i campi sono obbligatori' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            `INSERT INTO users (name, email, password, dob) VALUES (?, ?, ?, ?)`,
            [name, email, hashedPassword, dob],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ message: 'Email già in uso' });
                    } else {
                        return res.status(500).json({ message: 'Errore durante la registrazione' });
                    }
                }
                res.status(200).json({ message: 'Registrazione avvenuta con successo!' });
            }
        );
    } catch (error) {
        res.status(500).json({ message: 'Errore nel server', error });
    }
});

// Route per gestire il login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email e password sono obbligatorie.' });
    }

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Errore nel server.' });
        }
        if (!row) {
            return res.status(401).json({ success: false, message: 'Email o password errati.' });
        }

        const match = await bcrypt.compare(password, row.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Email o password errati.' });
        }

        res.status(200).json({ success: true, message: 'Login avvenuto con successo!' });
    });
});

// Route per aggiungere un nuovo prodotto
app.post('/products', (req, res) => {
    const { category, size, color, brand, condition, price } = req.body;

    if (!category || !size || !color || !brand || !condition || price == null) {
        return res.status(400).json({ message: 'Tutti i campi sono obbligatori.' });
    }

    db.run(`INSERT INTO products (category, size, color, brand, condition, price) VALUES (?, ?, ?, ?, ?, ?)` ,
        [category, size, color, brand, condition, price],
        function(err) {
            if (err) {
                return res.status(500).json({ message: 'Errore durante l\'aggiunta del prodotto.' });
            }
            res.status(201).json({ message: 'Prodotto aggiunto con successo!', id: this.lastID });
        }
    );
});

// Route per ottenere tutti i prodotti
app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ products: rows });
    });
});

// Route per ottenere un prodotto specifico per ID
app.get('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Prodotto non trovato' });
        }
        res.status(200).json(row);
    });
});





// Route per ottenere un prodotto specifico
app.get('/products/:id', (req, res) => {
    const productId = req.params.id;
    db.get(`SELECT * FROM products WHERE id = ?`, [productId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Errore nel recupero del prodotto.' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Prodotto non trovato.' });
        }
        res.status(200).json({ product: row });
    });
});

// Route per aggiornare un prodotto
app.put('/products/:id', (req, res) => {
    const { category, size, color, brand, condition, price } = req.body;
    const productId = req.params.id;

    db.run(`UPDATE products SET category = ?, size = ?, color = ?, brand = ?, condition = ?, price = ? WHERE id = ?`,
        [category, size, color, brand, condition, price, productId],
        function(err) {
            if (err) {
                return res.status(500).json({ message: 'Errore durante l\'aggiornamento del prodotto.' });
            }
            res.status(200).json({ message: 'Prodotto aggiornato con successo!' });
        }
    );
});

// Route per rimuovere un prodotto
app.delete('/products/:id', (req, res) => {
    const productId = req.params.id;
    db.run(`DELETE FROM products WHERE id = ?`, productId, function(err) {
        if (err) {
            return res.status(500).json({ message: 'Errore durante la rimozione del prodotto.' });
        }
        res.status(200).json({ message: 'Prodotto rimosso con successo!' });
    });
});


// Avvia il server
app.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
