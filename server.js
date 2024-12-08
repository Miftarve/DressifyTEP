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
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Errore di connessione al database:', err.message);
    } else {
        console.log('Connessione al database riuscita.');
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
    // Crea la tabella "users" se non esiste
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        dob TEXT NOT NULL, -- Data di nascita
        phone TEXT NOT NULL,
        nationality TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Errore nella creazione della tabella users:', err.message);
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

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registra un nuovo utente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mario Rossi
 *               email:
 *                 type: string
 *                 example: mario.rossi@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-01
 *               phone:
 *                 type: string
 *                 example: +393401234567
 *               nationality:
 *                 type: string
 *                 example: Italian
 *     responses:
 *       200:
 *         description: Registrazione avvenuta con successo
 *       400:
 *         description: Richiesta non valida
 *       500:
 *         description: Errore del server
 */
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
            [name, email, hashedPassword, dob, phone, nationality],
            function (err) {
                if (err) {
                    console.error('Errore durante la registrazione:', err.message); // Log dettagliato
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ message: 'Email già in uso' });
                    }
                    return res.status(500).json({ message: 'Errore durante la registrazione', error: err.message });
                }
                res.status(200).json({ message: 'Registrazione avvenuta con successo!' });
            }
        );        
    } catch (error) {
        res.status(500).json({ message: 'Errore nel server', error });
    }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login di un utente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: mario.rossi@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login avvenuto con successo
 *       401:
 *         description: Credenziali errate
 *       500:
 *         description: Errore del server
 */
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

        // Includi il nome dell'utente nella risposta
        res.status(200).json({ 
            success: true, 
            message: 'Login avvenuto con successo!', 
            userName: row.name 
        });
    });
});

// Route per il logout
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Errore nel logout.' });
        }
        res.status(200).json({ message: 'Logout avvenuto con successo!' });
    });
});

// Verifica della sessione utente
app.get('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Devi effettuare il login.' });
    }

    db.get(`SELECT * FROM users WHERE id = ?`, [req.session.userId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Errore nel recupero dell\'utente.' });
        }
        res.status(200).json({ user: row });
    });
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Aggiungi un nuovo prodotto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 example: Abbigliamento
 *               size:
 *                 type: string
 *                 example: M
 *               color:
 *                 type: string
 *                 example: Rosso
 *               brand:
 *                 type: string
 *                 example: Gucci
 *               condition:
 *                 type: string
 *                 example: Nuovo
 *               price:
 *                 type: number
 *                 example: 100.99
 *     responses:
 *       201:
 *         description: Prodotto aggiunto con successo
 *       400:
 *         description: Richiesta non valida
 *       500:
 *         description: Errore del server
 */

// Aggiungi un nuovo prodotto
app.post('/products', (req, res) => {
    const { category, size, color, brand, condition, price } = req.body;

    // Controllo dei campi obbligatori
    if (!category || !size || !color || !brand || !condition || !price) {
        return res.status(400).json({ message: 'Tutti i campi sono obbligatori' });
    }

    // Definizione della query
    const query = `INSERT INTO products (category, size, color, brand, condition, price) VALUES (?, ?, ?, ?, ?, ?)`;

    // Esecuzione della query
    db.run(query, [category, size, color, brand, condition, price], function (err) {
        if (err) {
            console.error('Errore nell\'inserimento del prodotto:', err.message);
            // Invio della risposta con errore
            return res.status(500).json({ message: 'Errore nel salvataggio del prodotto', error: err.message });
        }
        console.log('Prodotto aggiunto con successo con ID:', this.lastID);
        // Invio della risposta di successo
        res.status(201).json({ message: 'Prodotto aggiunto con successo!', id: this.lastID });
    });
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Ottieni tutti i prodotti
 *     responses:
 *       200:
 *         description: Lista di tutti i prodotti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       category:
 *                         type: string
 *                         example: Abbigliamento
 *                       size:
 *                         type: string
 *                         example: M
 *                       color:
 *                         type: string
 *                         example: Rosso
 *                       brand:
 *                         type: string
 *                         example: Gucci
 *                       condition:
 *                         type: string
 *                         example: Usato
 *                       price:
 *                         type: number
 *                         example: 99.99
 */
app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) {
            console.error('Errore nel caricamento dei prodotti:', err.message);
            return res.status(500).json({ error: err.message });
        }
        //console.log('Prodotti recuperati dal database:', rows);
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

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Ottieni un prodotto specifico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prodotto
 *     responses:
 *       200:
 *         description: Dettagli del prodotto
 *       404:
 *         description: Prodotto non trovato
 *       500:
 *         description: Errore del server
 */
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

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Aggiorna un prodotto
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prodotto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 example: Abbigliamento
 *               size:
 *                 type: string
 *                 example: M
 *               color:
 *                 type: string
 *                 example: Rosso
 *               brand:
 *                 type: string
 *                 example: Gucci
 *               condition:
 *                 type: string
 *                 example: Nuovo
 *               price:
 *                 type: number
 *                 example: 99.99
 *     responses:
 *       200:
 *         description: Prodotto aggiornato con successo
 *       500:
 *         description: Errore del server
 */
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

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Aggiorna un prodotto
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prodotto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 example: Abbigliamento
 *               size:
 *                 type: string
 *                 example: M
 *               color:
 *                 type: string
 *                 example: Rosso
 *               brand:
 *                 type: string
 *                 example: Gucci
 *               condition:
 *                 type: string
 *                 example: Nuovo
 *               price:
 *                 type: number
 *                 example: 99.99
 *     responses:
 *       200:
 *         description: Prodotto aggiornato con successo
 *       500:
 *         description: Errore del server
 */
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

// Eliminazione utente
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
        if (err) {
            console.error('Errore durante l\'eliminazione dell\'utente:', err.message);
            return res.status(500).json({ message: 'Errore durante l\'eliminazione dell\'utente.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Utente non trovato.' });
        }
        res.status(200).json({ message: 'Utente eliminato con successo.' });
    });
});

app.post('/recover-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email è richiesta.' });
    }

    db.get(`SELECT password FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Errore durante l\'accesso al database.' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Utente non trovato.' });
        }
        // Nota: la password viene mostrata direttamente per semplicità, ma in un'applicazione reale non si dovrebbero mai inviare password non criptate.
        res.status(200).json({ message: `La tua password è: ${row.password}` });
    });
});
const cart = { items: [] };

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Aggiungi un prodotto al carrello
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *                 example: 1
 *               rentalDays:
 *                 type: integer
 *                 example: 7
 *               rentalPrice:
 *                 type: number
 *                 example: 50.99
 *     responses:
 *       200:
 *         description: Prodotto aggiunto al carrello
 *       404:
 *         description: Prodotto non trovato
 *       500:
 *         description: Errore del server
 */
app.post('/api/cart/add', (req, res) => {
  const { productId, rentalDays, rentalPrice } = req.body;

  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
    if (err) return res.status(500).json({ error: "Errore nel database" });
    if (!product) return res.status(404).json({ error: "Prodotto non trovato" });

    const cartItem = {
      id: product.id,
      name: product.category + " - " + product.brand,
      rentalPrice: rentalPrice || product.price,
    };
    cart.items.push(cartItem);
    res.status(200).json({ cart });
  });
});

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Visualizza il contenuto del carrello
 *     responses:
 *       200:
 *         description: Contenuto del carrello
 */
app.get('/api/cart', (req, res) => {
  res.status(200).json(cart);
});

/**
 * @swagger
 * /api/cart/checkout:
 *   post:
 *     summary: Effettua il checkout del carrello
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               carrello:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Checkout completato con successo
 */
// Salva il carrello e processa il checkout
app.post('/api/cart/checkout', (req, res) => {
    const { carrello } = req.body;
  
    // Simula il salvataggio e restituisce una risposta
    console.log('Carrello ricevuto:', carrello);
    res.status(200).json({ message: 'Ordine processato con successo!' });
  });
  
  
// In-memory storage per le proposte (può essere sostituito con un database)
let propostePrezzo = [];

// Endpoint per inviare una proposta di prezzo
app.post('/api/proposte', (req, res) => {
    const proposta = req.body;
    if (!proposta.cliente || !proposta.prodotto || !proposta.prezzoProposto) {
        return res.status(400).json({ error: 'Dati mancanti nella proposta' });
    }
    propostePrezzo.push(proposta);
    res.status(201).json({ message: 'Proposta salvata con successo', proposta });
});

// Endpoint per ottenere tutte le proposte
app.get('/api/proposte', (req, res) => {
    res.json(propostePrezzo);
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
    console.log(`Swagger disponibile su http://localhost:${PORT}/api-docs`);
});
