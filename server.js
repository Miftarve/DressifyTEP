const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

// Carica le variabili d'ambiente dal file .env
require('dotenv').config();

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
app.use(session({ 
    secret: process.env.SESSION_SECRET || 'ssshhhhh',
    resave: false,
    saveUninitialized: true
}));

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

app.use(session({
    secret: process.env.SESSION_SECRET || 'ssshhhhh',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week in milliseconds
    }
}));


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


// Serializzazione e deserializzazione utente
passport.serializeUser((user, done) => {
    // Store only the essential identifier in the session
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    // Retrieve the full user object when needed
    const user = db.getUserById(id);
    if (!user) {
        return done(new Error('User not found'), null);
    }
    done(null, user);
});

// Funzione di utilità per trovare un utente tramite email
function findUserByEmail(email) {
    const allUsers = db.getAllUsers();
    return allUsers.find(user => user.email === email);
}

// ===== GOOGLE AUTHENTICATION STRATEGY =====
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    try {
        // Verifica se l'utente esiste già nel DB utilizzando l'email
        let user = null;
        if (profile.emails && profile.emails.length > 0) {
            user = findUserByEmail(profile.emails[0].value);
        }
        
        // Se l'utente non esiste, lo creiamo
        if (!user) {
            user = db.createUser({
                nome: profile.displayName || profile.name?.givenName || 'Google User',
                cognome: profile.name?.familyName || '',
                email: profile.emails ? profile.emails[0].value : `google_${profile.id}@example.com`,
                ruolo: 'user', // Ruolo predefinito
                googleId: profile.id,
                // Aggiungi altri campi necessari con valori predefiniti
                dataNascita: new Date().toISOString().split('T')[0],
                luogoNascita: 'Non specificato',
                username: profile.emails ? profile.emails[0].value : `google_${profile.id}`,
                password: 'google-auth-' + Math.random().toString(36).substring(2)
            });
        } else {
            // Aggiorniamo il googleId se l'utente esiste
            db.updateUser(user.id, { ...user, googleId: profile.id });
        }
        
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

// ===== FACEBOOK AUTHENTICATION STRATEGY =====
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: 'http://localhost:3000/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'photos', 'email', 'name']
}, (accessToken, refreshToken, profile, done) => {
    try {
        // Verifica se l'utente esiste già nel DB
        let user = null;
        
        // Se il profilo contiene l'email, cerca l'utente per email
        if (profile.emails && profile.emails.length > 0) {
            user = findUserByEmail(profile.emails[0].value);
        }
        
        // Se non trovato per email, cerca per facebookId
        if (!user) {
            const allUsers = db.getAllUsers();
            user = allUsers.find(u => u.facebookId === profile.id);
        }
        
        // Se l'utente non esiste, lo creiamo
        if (!user) {
            user = db.createUser({
                nome: profile.displayName?.split(' ')[0] || profile.name?.givenName || 'Facebook User',
                cognome: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
                email: profile.emails ? profile.emails[0].value : `facebook_${profile.id}@example.com`,
                ruolo: 'user', // Ruolo predefinito
                facebookId: profile.id,
                // Aggiungi altri campi necessari con valori predefiniti
                dataNascita: new Date().toISOString().split('T')[0],
                luogoNascita: 'Non specificato',
                username: profile.emails ? profile.emails[0].value : `facebook_${profile.id}`,
                password: 'facebook-auth-' + Math.random().toString(36).substring(2)
            });
        } else {
            // Aggiorniamo il facebookId se l'utente esiste
            db.updateUser(user.id, { ...user, facebookId: profile.id });
        }
        
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

// ===== GOOGLE AUTHENTICATION ROUTES =====
app.get('/auth/google', passport.authenticate('google', { 
    scope: ['profile', 'email']
}));

app.get('/auth/google/callback', 
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    (req, res) => {
        // Make sure the user is properly saved in the session
        if (req.user) {
            // This sets up the session completely via passport
            req.session.loggedin = true;
            req.session.user = req.user;
            req.session.role = req.user.ruolo;
            
            // Force session save to ensure persistence
            req.session.save(err => {
                if (err) {
                    console.error('Session save error:', err);
                }
                res.redirect('/home');
            });
        } else {
            res.redirect('/login');
        }
    }
);

// ===== FACEBOOK AUTHENTICATION ROUTES =====
app.get('/auth/facebook', passport.authenticate('facebook', { 
    scope: ['email', 'public_profile']
}));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        failureRedirect: '/login'
    }),
    (req, res) => {
        if (req.user) {
            req.session.loggedin = true;
            req.session.user = req.user;
            req.session.role = req.user.ruolo;
            
            // Force session save to ensure persistence
            req.session.save(err => {
                if (err) {
                    console.error('Session save error:', err);
                }
                res.redirect('/home');
            });
        } else {
            res.redirect('/login');
        }
    }
);

// ===== DATA DELETION FOR FACEBOOK GDPR COMPLIANCE =====
app.post('/api/delete-user-data', async (req, res) => {
    const userId = req.body.user_id; // ID utente fornito da Facebook
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Cerca l'utente per facebookId
        const allUsers = db.getAllUsers();
        const user = allUsers.find(u => u.facebookId === userId);
        
        if (user) {
            // Elimina l'utente dal database
            const isDeleted = db.deleteUser(user.id);
            if (isDeleted) {
                res.status(200).json({ success: true, message: 'User data deleted successfully.' });
            } else {
                res.status(500).json({ error: 'Failed to delete user data' });
            }
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user data', details: error.message });
    }
});

// Middleware per verificare l'autenticazione
function ensureAuthenticated(req, res, next) {
    // First check Passport's authentication
    if (req.isAuthenticated()) {
        return next();
    }
    
    // Then check our manual session flag as backup
    if (req.session && req.session.loggedin && req.session.user) {
        // If we have session data but Passport doesn't recognize it,
        // restore the Passport session
        req.login(req.session.user, err => {
            if (err) {
                console.error('Session restoration error:', err);
                return res.redirect('/login');
            }
            return next();
        });
    } else {
        res.redirect('/login');
    }
}


/**
 * @swagger
 * /login:
 *   get:
 *     summary: Shows the login page
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Returns the login page
 *       302:
 *         description: Redirects to home if already logged in
 *   post:
 *     summary: Processes user login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *     responses:
 *       302:
 *         description: Redirects to home on success or error page on failure
 */
app.get('/login', (req, res) => {
    if (req.session.loggedin) {
        res.redirect('/home'); // Se già autenticato, reindirizza alla home
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html')); // Mostra il login
    }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Redirects to the home page
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to the home page
 */
app.get('/', (req, res) => {
    res.redirect('/home');
});

// Assuming you already have your Express app set up
app.get('/recuperoDati', (req, res) => {
    res.sendFile(path.join(__dirname, 'recuperDati.html'));
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
    const { username, password } = req.body;

    // Recupera l'utente dal database
    const user = db.getUserByUsername(username);

    if (user && user.password === password) {
        // Serializza l'utente per Passport
        req.login(user, err => {
            if (err) {
                return res.render('error', { message: 'Errore durante il login!' });
            }
            // Standardize session data structure across all login methods
            req.session.loggedin = true;
            req.session.user = user;
            req.session.role = user.ruolo; // Ensure role is saved in session
            res.redirect('/home');
        });
    } else {
        res.render('error', { message: 'Username o password errati!' });
    }
});

/**
 * @swagger
 * /logout:
 *   get:
 *     summary: Logs out the current user
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to home page after logout
 */
app.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            return res.render('error', { message: 'Errore durante il logout!' });
        }
        req.session.destroy(() => {
            res.redirect('/');
        });
    });
});

/**
 * @swagger
 * /home:
 *   get:
 *     summary: Home page for authenticated users
 *     tags: [Users]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Returns the home page with user information
 *       302:
 *         description: Redirects to login if not authenticated
 */
app.get('/home', ensureAuthenticated, (req, res) => {
    // Get user from session or passport
    const user = req.user || req.session.user;
    
    // Additional safety check
    if (!user) {
        return res.redirect('/login');
    }
    
    // Use req.session.role if available, otherwise get from user object
    const userRole = req.session.role || user.ruolo;
    
    if (userRole === 'admin') {
        const users = db.getAllUsers();
        res.render('admin/home', {
            name: user.nome,
            role: userRole,
            message: req.session.message,
            users: users
        });
    } else {
        res.render('home', {
            name: user.nome,
            role: userRole,
            message: `Benvenuto, ${user.nome}!`
        });
    }
});

/**
 * @swagger
 * /login:
 *   get:
 *     summary: Shows the login page
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Returns the login page
 *       302:
 *         description: Redirects to home if already logged in
 *   post:
 *     summary: Processes user login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *     responses:
 *       302:
 *         description: Redirects to home on success or error page on failure
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
 *     summary: Registers a new user (admin function)
 *     tags: [Users]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
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
 *               ruolo:
 *                 type: string
 *                 enum: [user, admin]
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             required:
 *               - nome
 *               - cognome
 *               - dataNascita
 *               - luogoNascita
 *               - ruolo
 *               - email
 *               - password
 *     responses:
 *       302:
 *         description: Redirects to home page with success message
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
 * /register:
 *   get:
 *     summary: Shows the registration page
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Returns the registration page
 *       302:
 *         description: Redirects to home if already logged in
 *   post:
 *     summary: Registers a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
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
 *             required:
 *               - nome
 *               - cognome
 *               - email
 *               - username
 *               - password
 *     responses:
 *       302:
 *         description: Redirects to login on success or error page on failure
 */
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

/**
 * @swagger
 * /modificaUtente/{id}:
 *   get:
 *     summary: Shows form to modify user data
 *     tags: [Users]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Returns the form to modify user data
 *       302:
 *         description: Redirects to error page if user not found
 *   post:
 *     summary: Updates user data
 *     tags: [Users]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
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
 *               ruolo:
 *                 type: string
 *                 enum: [user, admin]
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             required:
 *               - nome
 *               - cognome
 *               - dataNascita
 *               - ruolo
 *               - email
 *               - password
 *     responses:
 *       302:
 *         description: Redirects to home page on success or error page on failure
 */
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

/**
 * @swagger
 * /eliminaUtente/{id}:
 *   get:
 *     summary: Deletes a user
 *     tags: [Users]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       302:
 *         description: Redirects to home page on success or error page on failure
 */
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

/**
 * @swagger
 * /prodotti:
 *   get:
 *     summary: Gets the list of products (admin only)
 *     tags: [Products]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Returns the list of products
 *       302:
 *         description: Redirects to login if not authenticated or not admin
 */
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
    if (!req.session.loggedin || !req.session.user || req.session.user.ruolo !== 'admin') {
        return res.redirect('/login');
    }
    const products = db.getAllProducts();
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

/**
 * @swagger
 * /eliminaProdotto/{id}:
 *   get:
 *     summary: Shows confirmation for product deletion
 *     tags: [Products]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Returns confirmation page
 *       302:
 *         description: Redirects to error page if product not found
 *   post:
 *     summary: Deletes a product
 *     tags: [Products]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       302:
 *         description: Redirects to products page on success or error page on failure
 */
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

/**
 * @swagger
 * /noleggio/{id}:
 *   get:
 *     summary: Shows rental form for a specific product
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Returns rental form
 *       302:
 *         description: Redirects to error page if product not found
 *   post:
 *     summary: Calculates rental price for a specific product
 *     tags: [Rentals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 description: Rental duration in days
 *             required:
 *               - days
 *     responses:
 *       200:
 *         description: Returns confirmation page with calculated price
 *       302:
 *         description: Redirects to error page if validation fails
 */
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

/**
 * @swagger
 * /calcolaPrezzo:
 *   post:
 *     summary: Calculates rental price
 *     tags: [Rentals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               durata:
 *                 type: integer
 *                 description: Rental duration in days
 *             required:
 *               - durata
 *     responses:
 *       200:
 *         description: Returns rental page with calculated price
 */

app.post('/calcolaPrezzo', (req, res) => {
    const durata = parseInt(req.body.durata);
    const prezzoPerGiorno = 10; // Esempio di prezzo giornaliero
    const totale = durata * prezzoPerGiorno;

    res.render('noleggio', {
        prezzo: totale,
    });
});


app.use(express.urlencoded({ extended: true }));

/**
 * @swagger
 * /noleggio:
 *   get:
 *     summary: Shows products available for rental with filtering options
 *     tags: [Rentals]
 *     parameters:
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter products by brand
 *       - in: query
 *         name: colore
 *         schema:
 *           type: string
 *         description: Filter products by color
 *       - in: query
 *         name: condizione
 *         schema:
 *           type: string
 *         description: Filter products by condition
 *       - in: query
 *         name: prezzoMin
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: prezzoMax
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *     responses:
 *       200:
 *         description: Returns filtered list of products
 *   post:
 *     summary: Calculates rental price based on duration
 *     tags: [Rentals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Product ID
 *               durata:
 *                 type: integer
 *                 description: Rental duration in days
 *             required:
 *               - id
 *               - durata
 *     responses:
 *       200:
 *         description: Returns rental page with calculated price
 */
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


/**
 * @swagger
 * /acquista:
 *   post:
 *     summary: Process product purchase
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Product ID
 *             required:
 *               - id
 *     responses:
 *       200:
 *         description: Returns purchase confirmation page
 */
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