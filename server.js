const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
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

// Body parser middleware
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.set('view engine', 'hbs')

// Set public folder
app.use('/static', express.static(path.join(__dirname, 'public')));

// route

// Reindirizza la root ("/") a "/home"
app.get('/', (req, res) => {
    res.redirect('/home');
});


// Login Page
app.get('/login', (req, res) => {
    //
    if (req.session.loggedin) {
        res.redirect('/home');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
})

// Registra Utente da admin
app.post('/registraUtente', (req, res) => {
    // Leggi i dati dal form
    const { nome, cognome, dataNascita, luogoNascita, ruolo, email, password } = req.body;

    // Controlla che tutti i campi siano stati forniti
    if (!nome || !cognome || !dataNascita || !luogoNascita || !ruolo || !email || !password) {
        res.render('error', {
            message: 'Tutti i campi sono obbligatori!'
        });
        return;
    }

    // Salva l'utente nel database mock
    const user = db.createUser({
        nome,
        cognome,
        dataNascita,
        luogoNascita,
        ruolo,
        email,
        password
    });

    // Messaggio di successo
    req.session.message = `Utente con id: (${user.id}) creato con successo`;
    res.redirect('/home');
});


// Login Post
app.post('/login', (req, res) => {
    if (req.body === undefined) {
        res.send('Undefined body');
        return;
    }

    // Leggi l'username/email e la password dal form HTML
    const identifier = req.body.username; // può essere username o email
    const password = req.body.password;

    // Cerca l'utente per username o email
    const user = db.getUserByUsername(identifier);

    if (user && user.password === password) {
        req.session.loggedin = true;
        req.session.name = user.nome;
        req.session.role = user.ruolo;
        res.redirect('/home');
    } else {
        res.render('error', {
            message: 'Username o email e/o password errati!'
        });
    }
});


app.get('/logout', (req, res) => {
    req.session.loggedin = false;
    res.redirect('/login');
});

app.get('/home', (req, res) => {
    if (req.session.loggedin) {
        if (req.session.role === 'admin') {
            // Ottieni tutti gli utenti dal DB mock
            const users = db.getAllUsers(); // Recupera tutti gli utenti senza la password

            // Passa l'array di utenti alla vista
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
                message: 'Benvenuto, ' + req.session.name + '!'
            });
        }
    } else {
        res.redirect('/login');
    }
});

// Pagina di registrazione
app.get('/register', (req, res) => {
    if (req.session.loggedin) {
        return res.redirect('/home'); // Se l'utente è loggato, reindirizzalo alla home
    }
    res.sendFile(path.join(__dirname, 'public', 'register.html')); // Serve la pagina di registrazione
});

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

// Aggiungi un prodotto (solo admin)
app.post('/prodotti', (req, res) => {
    if (!req.session.loggedin || req.session.role !== 'admin') {
        return res.redirect('/login');
    }
    const { category, size, color, brand, condition, price } = req.body;
    db.createProduct({ category, size, color, brand, condition, price });
    res.redirect('/prodotti');
});

// Modifica un prodotto (solo admin)
app.post('/modificaProdotto/:id', (req, res) => {
    if (!req.session.loggedin || req.session.role !== 'admin') {
        return res.redirect('/login');
    }
    const { id } = req.params;
    const { category, size, color, brand, condition, price } = req.body;
    const updatedProduct = db.updateProduct(Number(id), { category, size, color, brand, condition, price });
    if (updatedProduct) {
        res.redirect('/prodotti');
    } else {
        res.send('Prodotto non trovato');
    }
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

app.get('/noleggio', (req, res) => {
    const products = db.getAllProducts(); // Ottieni i prodotti dal mock del database
    res.render('noleggio', { products }); // Passa i prodotti al template
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
app.listen(port, () => console.log(`Server started on port ${port}`));

