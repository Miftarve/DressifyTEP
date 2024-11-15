const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();
const PORT = 3000;

// Configurazione per accettare i dati in formato JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Imposta la directory per i file statici
app.use(express.static(path.join(__dirname, 'public')));

// Configurazione per accettare richieste da qualsiasi origine
app.use(cors());

// Inizializza il database SQLite
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
    if (err) {
        console.error('Errore nell\'apertura del database:', err.message);
    } else {
        console.log('Connessione al database riuscita');
    }
});

// Configurazione Swagger
const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "API Noleggio e Vendita Abbigliamento",
            version: "1.0.0",
            description: "Documentazione delle API per la gestione di prodotti",
        },
    },
    apis: ["./server.js"],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Crea le tabelle "users" e "products" nel database
db.serialize(() => {

        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            size TEXT,
            color TEXT,
            brand TEXT,
            condition TEXT,
            price REAL
        )`, (err) => {
            if (err) {
                console.error('Errore nella creazione della tabella products:', err.message);
            }
        });



    // Crea la tabella "products" se non esiste
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT,
        size TEXT,
        color TEXT,
        brand TEXT,
        condition TEXT,
        price REAL
    )`, (err) => {
        if (err) {
            console.error('Errore nella creazione della tabella products:', err.message);
        }
    });
});

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route per gestire la registrazione
app.post('/register', async (req, res) => {
    const { name, email, password, dob, phone, nationality } = req.body; // Includi i nuovi campi
    if (!name || !email || !password || !dob || !phone || !nationality) { // Verifica che tutti i campi siano presenti
        return res.status(400).json({ message: 'Tutti i campi sono obbligatori' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            `INSERT INTO users (name, email, password, dob, phone, nationality) VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, dob, phone, nationality], // Includi i nuovi campi qui
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

// Aggiungi un nuovo prodotto
app.post('/products', (req, res) => {
    const { category, size, color, brand, condition, price } = req.body;
    
    if (!category || !size || !color || !brand || !condition || !price) {
        return res.status(400).json({ message: 'Tutti i campi sono obbligatori' });
    }

    db.run(`INSERT INTO products (category, size, color, brand, condition, price) VALUES (?, ?, ?, ?, ?, ?)`, 
    [category, size, color, brand, condition, price], 
    function (err) {
        if (err) {
            console.error('Errore nell\'inserimento del prodotto:', err.message);
            return res.status(500).json({ message: 'Errore interno del server' });
        }
        res.status(201).json({ message: 'Prodotto aggiunto con successo', id: this.lastID });
    });
});





/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Ottiene tutti i prodotti
 *     responses:
 *       200:
 *         description: Lista di prodotti
 */
app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ products: rows });
    });
});

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Cerca prodotti in base ai filtri
 *     parameters:
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Prezzo minimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Prezzo massimo
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filtra per marca
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *         description: Filtra per taglia
 *       - in: query
 *         name: condition
 *         schema:
 *           type: string
 *         description: Filtra per condizione
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtra per categoria
 *     responses:
 *       200:
 *         description: Prodotti filtrati
 */
app.get('/api/products/search', (req, res) => {
    const { minPrice, maxPrice, brand, size, condition, category } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (minPrice) { query += ' AND price >= ?'; params.push(minPrice); }
    if (maxPrice) { query += ' AND price <= ?'; params.push(maxPrice); }
    if (brand) { query += ' AND brand LIKE ?'; params.push(`%${brand}%`); }
    if (size) { query += ' AND size = ?'; params.push(size); }
    if (condition) { query += ' AND condition = ?'; params.push(condition); }
    if (category) { query += ' AND category LIKE ?'; params.push(`%${category}%`); }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
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

// Rotta per ottenere tutti gli utenti
app.get('/api/users', (req, res) => {
    db.all('SELECT id, name, email, phone, nationality FROM users', [], (err, rows) => {
        if (err) {
            console.error('Errore nel recupero degli utenti:', err.message);
            return res.status(500).json({ message: 'Errore nel recupero degli utenti.' });
        }
        res.status(200).json({ users: rows });
    });
});




// Rotta per eliminare un utente
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Errore nella rimozione dell\'utente.' });
        }
        res.status(200).json({ message: 'Utente rimosso con successo.' });
    });
});


app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;

    // Trova l'indice dell'utente nel database
    const index = users.findIndex(user => user.id === parseInt(userId));
    if (index !== -1) {
        users.splice(index, 1); // Rimuovi l'utente
        res.status(200).send({ message: "Utente eliminato con successo!" });
    } else {
        res.status(404).send({ message: "Utente non trovato." });
    }
});


// Avvia il server
app.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
