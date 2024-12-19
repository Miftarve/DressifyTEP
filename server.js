const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

//const cors = require('cors');

//const sqlite3 = require('sqlite3').verbose();
//const db = new sqlite3.Database('database.db');
const mock = require('./DBMock.js');
const db = new mock();

const hbs = require('hbs');

//use sessions for tracking logins
const session = require('express-session');
const DBMock = require('./DBMock.js');

// Create express app using session
const app = express();
app.use(session({ secret: 'ssshhhhh' }));

// Configurazione del motore di template
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

hbs.registerHelper('json', context => JSON.stringify(context, null, 2));

// Body parser middleware
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.set('view engine', 'hbs')

// Set public folder
app.use('/static', express.static(path.join(__dirname, 'public')));
// Inizializza Passport e sessioni
app.use(passport.initialize());
app.use(passport.session());


// Swagger Configuration
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentazione',
            version: '1.0.0',
            description: 'Swagger per il progetto Express',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local server',
            },
        ],
    },
    apis: [__filename], // Legge la documentazione Swagger da questo file
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


passport.use(new GoogleStrategy({
    
    callbackURL: 'http://localhost:3000/auth/google/callback'
},
(accessToken, refreshToken, profile, done) => {
    // Implementa qui la logica per gestire l'utente
    const user = {
        googleId: profile.id,
        displayName: profile.displayName,
        emails: profile.emails,
    };
    return done(null, user);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Rotte di autenticazione
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/home'); // Dopo il login, vai alla pagina home
});

app.get('/login', (req, res) => {
    if (req.session.loggedin) {
        res.redirect('/home'); // Se già autenticato, reindirizza alla home
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html')); // Mostra il login
    }
});

app.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.send(`Benvenuto, ${req.user.displayName}!`);
    } else {
        res.redirect('/login'); // Redirect al login se non autenticato
    }
});


/**
 * @swagger
 * /:
 *   get:
 *     summary: Reindirizza alla pagina home
 *     responses:
 *       302:
 *         description: Redirect alla home page.
 */
app.get('/', (req, res) => {
    res.redirect('/home');
});

/**
 * @swagger
 * /login:
 *   get:
 *     summary: Mostra la pagina di login
 *     responses:
 *       200:
 *         description: Ritorna la pagina di login
 */
app.get('/login', (req, res) => {
    if (req.session.loggedin) {
        res.redirect('/home');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

/**
 * @swagger
 * /registraUtente:
 *   post:
 *     summary: Registra un nuovo utente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               cognome:
 *                 type: string
 *               dataNascita:
 *                 type: string
 *               luogoNascita:
 *                 type: string
 *               ruolo:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       302:
 *         description: Redirect alla home page con messaggio di successo
 */
app.post('/registraUtente', (req, res) => {
    const { nome, cognome, dataNascita, luogoNascita, ruolo, email, password } = req.body;

    if (!nome || !cognome || !dataNascita || !luogoNascita || !ruolo || !email || !password) {
        res.render('error', { message: 'Tutti i campi sono obbligatori!' });
        return;
    }

    const user = db.createUser({ nome, cognome, dataNascita, luogoNascita, ruolo, email, password });
    req.session.message = `Utente con id: (${user.id}) creato con successo`;
    res.redirect('/home');
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Esegue il login dell'utente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       302:
 *         description: Login effettuato con successo, redirect alla home
 */
app.post('/login', (req, res) => {
    const identifier = req.body.username;
    const password = req.body.password;

    const user = db.getUserByUsername(identifier);

    if (user && user.password === password) {
        req.session.loggedin = true;
        req.session.name = user.nome;
        req.session.role = user.ruolo;
        res.redirect('/home');
    } else {
        res.render('error', { message: 'Username o email e/o password errati!' });
    }
});

app.get('/logout', (req, res) => {
    req.session.loggedin = false;
    res.redirect('/login');
});

/**
 * @swagger
 * /home:
 *   get:
 *     summary: Pagina home per utenti autenticati
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Pagina home con messaggi di benvenuto.
 *       401:
 *         description: Utente non autenticato.
 */
app.get('/home', (req, res) => {
    if (req.isAuthenticated()) {
        if (req.session.role === 'admin') {
            const users = db.getAllUsers(); // Recupera gli utenti dal DBMock
            res.render('admin/home', { 
                name: req.session.name, 
                role: req.session.role, 
                message: req.session.message, 
                users: users 
            });
        } else {
            res.render('home', { 
                name: req.session.name, 
                role: req.session.role, 
                message: `Benvenuto, ${req.session.name}!` 
            });
        }
    } else {
        res.redirect('/login'); // Redirect al login se non autenticato
    }
});


// Pagina di registrazione
app.get('/register', (req, res) => {
    if (req.session.loggedin) {
        return res.redirect('/home'); // Se l'utente è loggato, reindirizzalo alla home
    }
    res.sendFile(path.join(__dirname, 'public', 'register.html')); // Serve la pagina di registrazione
});

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registra un nuovo utente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               cognome:
 *                 type: string
 *               dataNascita:
 *                 type: string
 *                 format: date
 *               luogoNascita:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utente registrato con successo.
 *       400:
 *         description: Email o username già in uso.
 */
// Gestione della registrazione
app.post('/register', (req, res) => {
    const { nome, cognome, dataNascita, luogoNascita, email, username, password } = req.body;

    // Controlla se esiste già un utente con lo stesso email o username
    const existingUser = db.getUserByUsername(username) || db.getUserByUsername(email);
    if (existingUser) {
        return res.render('error', { message: 'Email o username già in uso!' });
    }

    // Crea un nuovo utente con il ruolo predefinito "user"
    const newUser = db.createUser({
        nome,
        cognome,
        dataNascita,
        luogoNascita,
        ruolo: 'user',
        email,
        username,
        password,
    });

    req.session.message = `Registrazione completata con successo! Benvenuto ${newUser.nome}.`;
    res.redirect('/login');
});

// Modifica un utente
app.get('/modificaUtente/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = db.getUserById(userId);

    if (!user) {
        return res.render('error', { message: 'Utente non trovato!' });
    }

    res.render('admin/modificaUtente', {
        user: user
    });
});


// Modifica i dati dell'utente
app.post('/modificaUtente/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const { nome, cognome, dataNascita, ruolo, email, password } = req.body;

    const updatedUser = db.updateUser(userId, { nome, cognome, dataNascita, ruolo, email, password });

    if (!updatedUser) {
        return res.render('error', { message: 'Impossibile modificare l\'utente!' });
    }

    res.redirect('/home');
});

// Elimina un utente
app.get('/eliminaUtente/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const success = db.deleteUser(userId);

    if (!success) {
        return res.render('error', { message: 'Impossibile eliminare l\'utente!' });
    }

    res.redirect('/home');
});

hbs.registerHelper('eq', function (a, b) {
    return a === b;
});


// Visualizza tutti i prodotti (solo admin)
app.get('/prodotti', (req, res) => {
    if (!req.session.loggedin || req.session.role !== 'admin') {
        return res.redirect('/login'); // Se non è loggato o non è admin, redirigi al login
    }
    const products = db.getAllProducts();
    res.render('prodotti', { products });
});

/**
 * @swagger
 * /prodotti:
 *   get:
 *     summary: Ottiene la lista dei prodotti (solo admin)
 *     tags: [Prodotti]
 *     responses:
 *       200:
 *         description: Ritorna la lista dei prodotti.
 *       401:
 *         description: Non autorizzato.
 *   post:
 *     summary: Aggiunge un nuovo prodotto (solo admin)
 *     tags: [Prodotti]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               size:
 *                 type: string
 *               color:
 *                 type: string
 *               brand:
 *                 type: string
 *               condition:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Prodotto creato con successo.
 *       401:
 *         description: Non autorizzato.
 */
// Aggiungi un prodotto (solo admin)
app.get('/prodotti', (req, res) => {
    if (!req.session.loggedin || req.session.role !== 'admin') {
        return res.redirect('/login');
    }
    const products = db.getAllProducts(); // Recupera la lista aggiornata
    res.render('prodotti', { products });
});


app.get('/modificaProdotto/:id', (req, res) => {
    const { id } = req.params;
    const product = db.getProductById(Number(id)); // Trova il prodotto dal database

    if (!product) {
        return res.render('error', { message: 'Prodotto non trovato!' });
    }

    res.render('modificaProdotti', { product }); // Renderizza la vista di modifica
});

app.post('/modificaProdotto/:id', (req, res) => {
    const { id } = req.params;
    const { category, size, color, brand, condition, price } = req.body;

    const updatedProduct = db.updateProduct(Number(id), { category, size, color, brand, condition, price });

    if (!updatedProduct) {
        return res.render('error', { message: 'Prodotto non trovato!' });
    }

    res.redirect('/prodotti'); // Reindirizza alla pagina prodotti
});



// Elimina un prodotto (solo admin)
app.get('/eliminaProdotto/:id', (req, res) => {
    if (!req.session.loggedin || req.session.role !== 'admin') {
        return res.redirect('/login');
    }
    const { id } = req.params;
    const isDeleted = db.deleteProduct(Number(id));
    if (isDeleted) {
        res.redirect('/prodotti');
    } else {
        res.send('Prodotto non trovato');
    }
});

app.get('/modificaProdotto/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const product = db.getProductById(Number(id));

    if (!product) {
        return res.render('error', { message: 'Prodotto non trovato!' });
    }

    res.render('modificaProdotti', { product });
});

// Aggiorna un prodotto
app.post('/modificaProdotto/:id', (req, res) => {
    const { id } = req.params;
    const { category, size, color, brand, condition, price } = req.body;

    const updatedProduct = db.updateProduct(Number(id), { category, size, color, brand, condition, price });

    if (!updatedProduct) {
        return res.render('error', { message: 'Prodotto non trovato!' });
    }

    res.redirect('/prodotti');  // Reindirizza alla lista dei prodotti dopo la modifica
});

// Conferma eliminazione prodotto
app.get('/eliminaProdotto/:id', (req, res) => {
    const { id } = req.params;
    const product = db.getProductById(Number(id));  // Trova il prodotto dal mock DB

    if (!product) {
        return res.render('error', { message: 'Prodotto non trovato!' });
    }

    res.render('cancellaProdotto', { product });  // Passa il prodotto alla vista per la conferma
});

// Elimina un prodotto
app.post('/eliminaProdotto/:id', (req, res) => {
    const { id } = req.params;
    const isDeleted = db.deleteProduct(Number(id));  // Elimina il prodotto dal mock DB

    if (!isDeleted) {
        return res.render('error', { message: 'Prodotto non trovato!' });
    }

    res.redirect('/prodotti');  // Reindirizza alla lista dei prodotti dopo la cancellazione
});

// Middleware per verificare se l'utente è autenticato
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();  // Se l'utente è autenticato, continua con la rotta
    }
    return res.redirect('/modificaProdotti');  // Altrimenti, reindirizza alla pagina di login
}

// Visualizza la pagina per noleggiare un prodotto
app.get('/noleggio/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = db.getProductById(productId);

    if (!product) {
        return res.render('error', { message: 'Prodotto non trovato!' });
    }

    res.render('noleggio', { product });
});

// Calcola il prezzo del noleggio
app.post('/noleggio/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const { days } = req.body;

    if (!days || days <= 0) {
        return res.render('error', { message: 'Durata del noleggio non valida!' });
    }

    const price = db.calculateRentalPrice(productId, days);
    if (price === null) {
        return res.render('error', { message: 'Prodotto non trovato!' });
    }

    req.session.rental = { productId, days, price };
    res.render('confermaNoleggio', { productId, days, price });
});

// Conferma noleggio o acquisto
app.post('/completa', (req, res) => {
    const { action } = req.body; // 'rental' o 'purchase'
    const { productId, days, price } = req.session.rental || {};

    if (action === 'purchase') {
        res.render('success', { message: 'Acquisto completato con successo!', price });
    } else if (action === 'rental') {
        res.render('success', { message: `Noleggio completato per ${days} giorni! Prezzo totale: €${price}` });
    } else {
        res.render('error', { message: 'Azione non valida!' });
    }
});

app.post('/calcolaPrezzo', (req, res) => {
    const durata = parseInt(req.body.durata);
    const prezzoPerGiorno = 10; // Esempio di prezzo giornaliero
    const totale = durata * prezzoPerGiorno;

    res.render('noleggio', {
        prezzo: totale,
    });
});


app.use(express.urlencoded({ extended: true }));

// Rotta per la pagina del catalogo
app.get('/noleggio', (req, res) => {
    let filteredProducts = db.getAllProducts(); // Prendi tutti i prodotti dal DBMock

    // Parametri di query
    const { brand, colore, condizione, prezzoMin, prezzoMax } = req.query;
    // Filtro per brand
    if (brand) {
        filteredProducts = filteredProducts.filter(product =>
            product.brand.toLowerCase().includes(brand.toLowerCase()) // Confronto case-insensitive
        );
    }

    // Filtro per colore
    if (colore) {
        filteredProducts = filteredProducts.filter(product =>
            product.color.toLowerCase() === colore.toLowerCase() // Confronto esatto per colore
        );
    }

    // Filtro per condizione
    if (condizione) {
        filteredProducts = filteredProducts.filter(product =>
            product.condition.toLowerCase() === condizione.toLowerCase() // Confronto esatto per condizione
        );
    }

    // Filtro per prezzo minimo
    if (prezzoMin) {
        filteredProducts = filteredProducts.filter(product =>
            product.price >= parseFloat(prezzoMin) // Confronto per prezzo minimo
        );
    }

    // Filtro per prezzo massimo
    if (prezzoMax) {
        filteredProducts = filteredProducts.filter(product =>
            product.price <= parseFloat(prezzoMax) // Confronto per prezzo massimo
        );
    }

    // Rendiamo il template passando i prodotti filtrati
    res.render('noleggio', {
        products: filteredProducts,
        brand,
        colore,
        condizione,
        prezzoMin,
        prezzoMax
    });
});

// Route per calcolare il prezzo del noleggio
app.post('/noleggio', (req, res) => {
    const { id, durata } = req.body; // Ottieni l'ID prodotto e la durata dal form
    const product = db.getProductById(Number(id));
    const prezzo = product ? product.price * durata : null; // Prezzo = prezzo prodotto x giorni
    res.render('noleggio', { prezzo, products: db.getAllProducts() });
});

// Route per la pagina di acquisto
app.post('/acquista', (req, res) => {
    const { id } = req.body; // Ottieni l'ID prodotto dal form
    const product = db.getProductById(Number(id));
    res.render('acquista', { product }); // Mostra i dettagli del prodotto acquistato
});

// Start server
const port = 3000;
app.listen(port, () => console.log(`Server started on port ${port}. 
Vai su http://localhost:${port}.
Vai su http://localhost:${port}/api-docs per vedere la documentazione Swagger.`));
