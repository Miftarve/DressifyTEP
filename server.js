const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer'); 
const fileUpload = require('express-fileupload'); 



const app = express();
const PORT = 3000;
app.use(fileUpload());
app.use(express.static('public'));


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });
// Rendi la cartella assets accessibile come file statici
app.use('/public/assets', express.static(path.join(__dirname, 'assets')));

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
    // Crea la tabella users solo se non esiste
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        dob TEXT,
        phone TEXT,
        nationality TEXT
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
    db.run(`
        CREATE TABLE IF NOT EXISTS product_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            image_path TEXT,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    `);
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

// Route per aggiungere un nuovo prodotto con immagini
app.post('/products', (req, res) => {
    const { category, size, color, brand, condition, price } = req.body;
    
    // Controllo dati mancanti
    if (!category || !size || !color || !brand || !condition || price == null) {
        return res.status(400).json({ message: 'Tutti i campi sono obbligatori.' });
    }
    
    // Gestione delle immagini
    const files = req.files ? Object.values(req.files) : [];
    if (files.length > 3) {
        return res.status(400).json({ message: 'Carica massimo 3 immagini.' });
    }
    
    const imagePaths = files.map((file, index) => {
        const imagePath = `public/assets/image_${Date.now()}_${index}.jpg`;
        file.mv(path.join(__dirname, imagePath), err => {
            if (err) console.error("Errore nel salvataggio dell'immagine:", err.message);
        });
        return imagePath;
    });
    
    // Salva il prodotto
    db.run(`INSERT INTO products (category, size, color, brand, condition, price) VALUES (?, ?, ?, ?, ?, ?)`,
        [category, size, color, brand, condition, price],
        function(err) {
            if (err) {
                console.error('Errore durante l\'aggiunta del prodotto:', err.message); // Log errore
                return res.status(500).json({ message: 'Errore durante l\'aggiunta del prodotto.' });
            }
            const productId = this.lastID;

            // Salva percorsi delle immagini
            const insertImageQuery = db.prepare(`INSERT INTO product_images (product_id, image_path) VALUES (?, ?)`);
            imagePaths.forEach(imagePath => {
                insertImageQuery.run([productId, imagePath]);
            });
            insertImageQuery.finalize();

            res.status(201).json({ message: 'Prodotto aggiunto con successo!' });
        }
    );
});

// Route per ottenere i prodotti con le relative immagini
app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products', [], (err, products) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const productsWithImages = products.map(product => new Promise((resolve, reject) => {
            db.all('SELECT image_path FROM product_images WHERE product_id = ?', [product.id], (err, images) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ ...product, images: images.map(img => img.image_path) });
                }
            });
        }));

        Promise.all(productsWithImages)
            .then(results => res.status(200).json({ products: results }))
            .catch(err => res.status(500).json({ error: err.message }));
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
