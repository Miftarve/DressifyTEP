const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Carica le variabili d'ambiente dal file .env
require('dotenv').config();

const mock = require('./DBMock.js');
const db = new mock();

const hbs = require('hbs');

// Definizione della SECRET_KEY per i JWT
const SECRET_KEY = process.env.SECRET_KEY || 'dressify_secret_key';

// Importa il modulo database e inizializza le tabelle
const { initDatabase } = require('./database.js');
initDatabase();

// Create express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Tracciare gli utenti connessi
const connectedUsers = new Map();

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'public')));

// Configurazione del motore di template
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerHelper('json', context => JSON.stringify(context, null, 2));

// Inizializza Passport.js (solo per OAuth)
app.use(passport.initialize());

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - nome
 *         - cognome
 *         - email
 *         - username
 *         - password
 *         - ruolo
 *       properties:
 *         id:
 *           type: integer
 *           description: ID univoco dell'utente
 *         nome:
 *           type: string
 *           description: Nome dell'utente
 *         cognome:
 *           type: string
 *           description: Cognome dell'utente
 *         email:
 *           type: string
 *           format: email
 *           description: Email dell'utente
 *         username:
 *           type: string
 *           description: Username dell'utente
 *         password:
 *           type: string
 *           description: Password dell'utente
 *         ruolo:
 *           type: string
 *           enum: [user, admin]
 *           description: Ruolo dell'utente nel sistema
 *         dataNascita:
 *           type: string
 *           format: date
 *           description: Data di nascita dell'utente
 *         luogoNascita:
 *           type: string
 *           description: Luogo di nascita dell'utente
 *         googleId:
 *           type: string
 *           description: ID di Google se registrato con Google OAuth
 *         facebookId:
 *           type: string
 *           description: ID di Facebook se registrato con Facebook OAuth
 *     Product:
 *       type: object
 *       required:
 *         - id
 *         - category
 *         - price
 *       properties:
 *         id:
 *           type: integer
 *           description: ID univoco del prodotto
 *         category:
 *           type: string
 *           description: Categoria del prodotto
 *         size:
 *           type: string
 *           description: Taglia del prodotto
 *         color:
 *           type: string
 *           description: Colore del prodotto
 *         brand:
 *           type: string
 *           description: Marca del prodotto
 *         condition:
 *           type: string
 *           description: Condizione del prodotto
 *         price:
 *           type: number
 *           description: Prezzo del prodotto
 *     Message:
 *       type: object
 *       required:
 *         - id
 *         - senderId
 *         - recipientId
 *         - text
 *         - timestamp
 *       properties:
 *         id:
 *           type: integer
 *           description: ID univoco del messaggio
 *         senderId:
 *           type: integer
 *           description: ID dell'utente che ha inviato il messaggio
 *         recipientId:
 *           type: integer
 *           description: ID dell'utente che riceve il messaggio
 *         text:
 *           type: string
 *           description: Contenuto del messaggio
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Data e ora d'invio del messaggio
 *         read:
 *           type: boolean
 *           description: Stato di lettura del messaggio
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Autenticazione basata su JWT
 *     googleOAuth:
 *       type: oauth2
 *       flows:
 *         authorizationCode:
 *           authorizationUrl: http://localhost:3000/auth/google
 *           scopes:
 *             profile: Informazioni del profilo
 *             email: Indirizzo email dell'utente
 *     facebookOAuth:
 *       type: oauth2
 *       flows:
 *         authorizationCode:
 *           authorizationUrl: http://localhost:3000/auth/facebook
 *           scopes:
 *             email: Indirizzo email dell'utente
 *             public_profile: Informazioni pubbliche del profilo
 *   responses:
 *     UnauthorizedError:
 *       description: Accesso non autorizzato
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Non sei autorizzato ad accedere a questa risorsa
 */

// Swagger Configuration
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'E-commerce e Chat API',
            version: '1.0.0',
            description: 'Documentazione completa delle API per la piattaforma di e-commerce e chat',
            contact: {
                name: 'Supporto Tecnico',
                email: 'support@example.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Server di sviluppo locale',
            },
            {
                url: 'https://api.example.com',
                description: 'Server di produzione',
            }
        ],
        tags: [
            {
                name: 'Auth',
                description: 'Operazioni di autenticazione e registrazione'
            },
            {
                name: 'Users',
                description: 'Gestione degli utenti'
            },
            {
                name: 'Products',
                description: 'Gestione dei prodotti'
            },
            {
                name: 'Rentals',
                description: 'Operazioni di noleggio dei prodotti'
            },
            {
                name: 'Chat',
                description: 'Sistema di messaggistica tra utenti'
            },
            {
                name: 'Cart',
                description: 'Gestione del carrello e checkout'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: [__filename], // Legge la documentazione Swagger da questo file
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Funzioni di utilità per Passport.js
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
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

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Inizia l'autenticazione con Google OAuth
 *     tags: [Auth]
 *     description: Reindirizza l'utente al sistema di autenticazione di Google
 *     responses:
 *       302:
 *         description: Reindirizza a Google per l'autenticazione
 */
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Callback per l'autenticazione Google OAuth
 *     tags: [Auth]
 *     description: Gestisce la risposta da Google dopo l'autenticazione
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Codice di autorizzazione fornito da Google
 *     responses:
 *       302:
 *         description: Reindirizza alla home page in caso di successo o alla pagina di login in caso di fallimento
 */
app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    (req, res) => {
        // Una volta autenticato con Google, genera un JWT
        if (req.user) {
            const token = jwt.sign({
                id: req.user.id,
                name: req.user.nome,
                email: req.user.email,
                ruolo: req.user.ruolo
            }, SECRET_KEY, {
                expiresIn: '24h' // Token valido per 24 ore
            });

            // Salva token nei cookie
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 ore
            });

            res.redirect('/home');
        } else {
            res.redirect('/login');
        }
    }
);

/**
 * @swagger
 * /auth/facebook:
 *   get:
 *     summary: Inizia l'autenticazione con Facebook OAuth
 *     tags: [Auth]
 *     description: Reindirizza l'utente al sistema di autenticazione di Facebook
 *     responses:
 *       302:
 *         description: Reindirizza a Facebook per l'autenticazione
 */
app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['email', 'public_profile']
}));

/**
 * @swagger
 * /auth/facebook/callback:
 *   get:
 *     summary: Callback per l'autenticazione Facebook OAuth
 *     tags: [Auth]
 *     description: Gestisce la risposta da Facebook dopo l'autenticazione
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Codice di autorizzazione fornito da Facebook
 *     responses:
 *       302:
 *         description: Reindirizza alla home page in caso di successo o alla pagina di login in caso di fallimento
 */
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        failureRedirect: '/login'
    }),
    (req, res) => {
        if (req.user) {
            const token = jwt.sign({
                id: req.user.id,
                name: req.user.nome,
                email: req.user.email,
                ruolo: req.user.ruolo
            }, SECRET_KEY, {
                expiresIn: '24h' // Token valido per 24 ore
            });

            // Salva token nei cookie
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 ore
            });

            res.redirect('/home');
        } else {
            res.redirect('/login');
        }
    }
);

/**
 * @swagger
 * /api/delete-user-data:
 *   post:
 *     summary: Elimina i dati di un utente per compliance GDPR
 *     tags: [Users]
 *     description: Endpoint per eliminare i dati di un utente come richiesto da Facebook per la compliance GDPR
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: ID Facebook dell'utente da eliminare
 *             required:
 *               - user_id
 *     responses:
 *       200:
 *         description: Dati utente eliminati con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User data deleted successfully.
 *       400:
 *         description: Richiesta non valida, manca l'ID utente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User ID is required
 *       404:
 *         description: Utente non trovato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Errore del server durante l'eliminazione
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to delete user data
 */
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

// Middleware per verificare l'autenticazione con JWT
function ensureAuthenticated(req, res, next) {
    // Ottieni il token da cookie o header Authorization
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.redirect('/login');
    }

    try {
        // Verifica il token
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;

        // Funzioni per mantenere retrocompatibilità con il codice esistente
        req.isAuthenticated = () => true;

        next();
    } catch (error) {
        // Se il token non è valido, reindirizza al login
        res.clearCookie('token');
        return res.redirect('/login');
    }
}

// Middleware per controllare se l'utente è un amministratore
function ensureAdmin(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated() && req.user.ruolo === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Accesso non autorizzato' });
}

/**
 * @swagger
 * /login:
 *   get:
 *     summary: Visualizza la pagina di login
 *     tags: [Auth]
 *     description: Mostra la pagina di login o reindirizza alla home se l'utente è già autenticato
 *     responses:
 *       200:
 *         description: Pagina di login
 *       302:
 *         description: Reindirizza alla home se l'utente è già autenticato
 */
app.get('/login', (req, res) => {
    // Verifica se c'è un token valido
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, SECRET_KEY);
            return res.redirect('/home'); // Token valido, reindirizza alla home
        } catch (error) {
            // Token non valido, elimina il cookie
            res.clearCookie('token');
        }
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html')); // Mostra il login
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Reindirizza alla home page
 *     tags: [Auth]
 *     description: Reindirizza automaticamente l'utente alla home page
 *     responses:
 *       302:
 *         description: Reindirizza alla home page
 */
app.get('/', (req, res) => {
    res.redirect('/home');
});

/**
 * @swagger
 * /recuperoDati:
 *   get:
 *     summary: Pagina di recupero dati
 *     tags: [Auth]
 *     description: Visualizza la pagina per il recupero dei dati dell'account
 *     responses:
 *       200:
 *         description: Pagina di recupero dati
 */
app.get('/recuperoDati', (req, res) => {
    res.sendFile(path.join(__dirname, 'recuperDati.html'));
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Elabora il login dell'utente
 *     tags: [Auth]
 *     description: Verifica le credenziali dell'utente e genera un token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username o email dell'utente
 *               password:
 *                 type: string
 *                 description: Password dell'utente
 *             required:
 *               - username
 *               - password
 *     responses:
 *       302:
 *         description: Reindirizza alla home in caso di successo o alla pagina di errore in caso di fallimento
 */
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Recupera l'utente dal database
    const user = db.getUserByUsername(username);

    if (user && user.password === password) {
        // Genera token JWT
        const token = jwt.sign({
            id: user.id,
            name: user.nome,
            email: user.email,
            ruolo: user.ruolo
        }, SECRET_KEY, {
            expiresIn: '24h' // Token valido per 24 ore
        });

        // Salva token nei cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 ore
        });

        // Invia token e dati utente come JSON
        res.json({
            token,
            user: {
                id: user.id,
                nome: user.nome,
                cognome: user.cognome,
                email: user.email,
                ruolo: user.ruolo
            }
        });
    } else {
        res.status(401).json({ message: 'Username o password errati!' });
    }
});

/**
 * @swagger
 * /logout:
 *   get:
 *     summary: Logout dell'utente
 *     tags: [Auth]
 *     description: Termina la sessione dell'utente e lo reindirizza alla home
 *     responses:
 *       302:
 *         description: Reindirizza alla home page dopo il logout
 */
app.get('/logout', (req, res) => {
    // Elimina il cookie del token
    res.clearCookie('token');
    res.redirect('/');
});

/**
 * @swagger
 * /home:
 *   get:
 *     summary: Home page per utenti autenticati
 *     tags: [Users]
 *     description: Mostra la home page con informazioni personalizzate in base al ruolo dell'utente
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Home page con informazioni dell'utente
 *       302:
 *         description: Reindirizza al login se l'utente non è autenticato
 */
app.get('/home', ensureAuthenticated, (req, res) => {
    // Get user from JWT
    const user = req.user;

    if (user.ruolo === 'admin') {
        const users = db.getAllUsers();
        res.render('admin/home', {
            name: user.name,
            role: user.ruolo,
            users: users
        });
    } else {
        res.render('home', {
            name: user.name,
            role: user.ruolo,
            message: `Benvenuto, ${user.name}!`
        });
    }
});

/**
 * @swagger
 * /registraUtente:
 *   post:
 *     summary: Registra un nuovo utente (funzione admin)
 *     tags: [Users]
 *     description: Permette a un amministratore di creare un nuovo utente nel sistema
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome dell'utente
 *               cognome:
 *                 type: string
 *                 description: Cognome dell'utente
 *               dataNascita:
 *                 type: string
 *                 format: date
 *                 description: Data di nascita dell'utente (formato YYYY-MM-DD)
 *               luogoNascita:
 *                 type: string
 *                 description: Luogo di nascita dell'utente
 *               ruolo:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: Ruolo dell'utente nel sistema
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email dell'utente
 *               password:
 *                 type: string
 *                 description: Password dell'utente
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
 *         description: Reindirizza alla home page con messaggio di successo o alla pagina di errore in caso di fallimento
 */
app.post('/registraUtente', ensureAuthenticated, ensureAdmin, (req, res) => {
    const { nome, cognome, dataNascita, luogoNascita, ruolo, email, password } = req.body;

    if (!nome || !cognome || !dataNascita || !luogoNascita || !ruolo || !email || !password) {
        res.render('error', { message: 'Tutti i campi sono obbligatori!' });
        return;
    }

    const user = db.createUser({ nome, cognome, dataNascita, luogoNascita, ruolo, email, password });
    res.redirect('/home');
});

/**
 * @swagger
 * /register:
 *   get:
 *     summary: Visualizza la pagina di registrazione
 *     tags: [Auth]
 *     description: Mostra il form di registrazione per nuovi utenti
 *     responses:
 *       200:
 *         description: Pagina di registrazione
 *       302:
 *         description: Reindirizza alla home se l'utente è già autenticato
 */
app.get('/register', (req, res) => {
    // Verifica se c'è un token valido
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, SECRET_KEY);
            return res.redirect('/home'); // Token valido, reindirizza alla home
        } catch (error) {
            // Token non valido, elimina il cookie
            res.clearCookie('token');
        }
    }
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Elabora la registrazione di un nuovo utente
 *     tags: [Auth]
 *     description: Crea un nuovo account utente con i dati forniti
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome dell'utente
 *               cognome:
 *                 type: string
 *                 description: Cognome dell'utente
 *               dataNascita:
 *                 type: string
 *                 format: date
 *                 description: Data di nascita dell'utente (formato YYYY-MM-DD)
 *               luogoNascita:
 *                 type: string
 *                 description: Luogo di nascita dell'utente
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email dell'utente
 *               username:
 *                 type: string
 *                 description: Username dell'utente
 *               password:
 *                 type: string
 *                 description: Password dell'utente
 *             required:
 *               - nome
 *               - cognome
 *               - email
 *               - username
 *               - password
 *     responses:
 *       302:
 *         description: Reindirizza al login in caso di successo o alla pagina di errore in caso di fallimento
 */
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

    res.redirect('/login');
});

/**
 * @swagger
 * /modificaUtente/{id}:
 *   get:
 *     summary: Visualizza il form per modificare i dati di un utente
 *     tags: [Users]
 *     description: Mostra un form precompilato con i dati dell'utente da modificare
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'utente da modificare
 *     responses:
 *       200:
 *         description: Form di modifica con i dati dell'utente
 *       302:
 *         description: Reindirizza alla pagina di errore se l'utente non è trovato
 */
app.get('/modificaUtente/:id', ensureAuthenticated, ensureAdmin, (req, res) => {
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
 *   post:
 *     summary: Aggiorna i dati di un utente
 *     tags: [Users]
 *     description: Elabora i dati del form e aggiorna le informazioni dell'utente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'utente da modificare
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome dell'utente
 *               cognome:
 *                 type: string
 *                 description: Cognome dell'utente
 *               dataNascita:
 *                 type: string
 *                 format: date
 *                 description: Data di nascita dell'utente (formato YYYY-MM-DD)
 *               ruolo:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: Ruolo dell'utente nel sistema
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email dell'utente
 *               password:
 *                 type: string
 *                 description: Password dell'utente
 *             required:
 *               - nome
 *               - cognome
 *               - dataNascita
 *               - ruolo
 *               - email
 *               - password
 *     responses:
 *       302:
 *         description: Reindirizza alla home page in caso di successo o alla pagina di errore in caso di fallimento
 */
app.post('/modificaUtente/:id', ensureAuthenticated, ensureAdmin, (req, res) => {
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
 *     summary: Elimina un utente
 *     tags: [Users]
 *     description: Rimuove un utente dal sistema
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'utente da eliminare
 *     responses:
 *       302:
 *         description: Reindirizza alla home page in caso di successo o alla pagina di errore in caso di fallimento
 */
app.get('/eliminaUtente/:id', ensureAuthenticated, ensureAdmin, (req, res) => {
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
 *     summary: Ottiene la lista dei prodotti (solo admin)
 *     tags: [Products]
 *     description: Visualizza tutti i prodotti nel sistema, accessibile solo agli amministratori
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista dei prodotti
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       302:
 *         description: Reindirizza al login se non autenticato o non admin
 */
app.get('/prodotti', ensureAuthenticated, ensureAdmin, (req, res) => {
    const products = db.getAllProducts();
    res.render('prodotti', { products });
});

/**
 * @swagger
 * /prodotti:
 *   post:
 *     summary: Aggiunge un nuovo prodotto (solo admin)
 *     tags: [Products]
 *     description: Crea un nuovo prodotto nel sistema
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 description: Categoria del prodotto
 *               size:
 *                 type: string
 *                 description: Taglia del prodotto
 *               color:
 *                 type: string
 *                 description: Colore del prodotto
 *               brand:
 *                 type: string
 *                 description: Marca del prodotto
 *               condition:
 *                 type: string
 *                 description: Condizione del prodotto
 *               price:
 *                 type: number
 *                 description: Prezzo del prodotto
 *             required:
 *               - category
 *               - price
 *     responses:
 *       302:
 *         description: Reindirizza alla pagina dei prodotti in caso di successo
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 */
app.post('/prodotti', ensureAuthenticated, ensureAdmin, (req, res) => {
    const { category, size, color, brand, condition, price } = req.body;
    const product = db.createProduct({ category, size, color, brand, condition, price });
    res.redirect('/prodotti');
});

/**
 * @swagger
 * /modificaProdotto/{id}:
 *   get:
 *     summary: Visualizza il form per modificare un prodotto
 *     tags: [Products]
 *     description: Mostra un form precompilato con i dati del prodotto da modificare
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prodotto da modificare
 *     responses:
 *       200:
 *         description: Form di modifica con i dati del prodotto
 *       302:
 *         description: Reindirizza alla pagina di errore se il prodotto non è trovato
 */
app.get('/modificaProdotto/:id', ensureAuthenticated, ensureAdmin, (req, res) => {
    const { id } = req.params;
    const product = db.getProductById(Number(id));

    if (!product) {
        return res.render('error', { message: 'Prodotto non trovato!' });
    }

    res.render('modificaProdotti', { product });
});

/**
 * @swagger
 * /modificaProdotto/{id}:
 *   post:
 *     summary: Aggiorna i dati di un prodotto
 *     tags: [Products]
 *     description: Elabora i dati del form e aggiorna le informazioni del prodotto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prodotto da modificare
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 description: Categoria del prodotto
 *               size:
 *                 type: string
 *                 description: Taglia del prodotto
 *               color:
 *                 type: string
 *                 description: Colore del prodotto
 *               brand:
 *                 type: string
 *                 description: Marca del prodotto
 *               condition:
 *                 type: string
 *                 description: Condizione del prodotto
 *               price:
 *                 type: number
 *                 description: Prezzo del prodotto
 *             required:
 *               - category
 *               - price
 *     responses:
 *       302:
 *         description: Reindirizza alla pagina dei prodotti in caso di successo o alla pagina di errore in caso di fallimento
 */
app.post('/modificaProdotto/:id', ensureAuthenticated, ensureAdmin, (req, res) => {
    const { id } = req.params;
    const { category, size, color, brand, condition, price } = req.body;

    const updatedProduct = db.updateProduct(Number(id), { category, size, color, brand, condition, price });

    if (!updatedProduct) {
        return res.render('error', { message: 'Prodotto non trovato!' });
    }

    res.redirect('/prodotti');
});

/**
 * @swagger
 * /eliminaProdotto/{id}:
 *   get:
 *     summary: Visualizza la pagina di conferma per eliminare un prodotto
 *     tags: [Products]
 *     description: Mostra una pagina di conferma prima di eliminare il prodotto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prodotto da eliminare
 *     responses:
 *       200:
 *         description: Pagina di conferma eliminazione
 *       302:
 *         description: Reindirizza alla pagina di errore se il prodotto non è trovato
 */
app.get('/eliminaProdotto/:id', ensureAuthenticated, ensureAdmin, (req, res) => {
    const { id } = req.params;
    const product = db.getProductById(Number(id));

    if (!product) {
        return res.render('error', { message: 'Prodotto non trovato!' });
    }

    res.render('cancellaProdotto', { product });
});

/**
 * @swagger
 * /eliminaProdotto/{id}:
 *   post:
 *     summary: Elimina un prodotto
 *     tags: [Products]
 *     description: Rimuove definitivamente un prodotto dal sistema
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prodotto da eliminare
 *     responses:
 *       302:
 *         description: Reindirizza alla pagina dei prodotti in caso di successo o alla pagina di errore in caso di fallimento
 */
app.post('/eliminaProdotto/:id', ensureAuthenticated, ensureAdmin, (req, res) => {
    const { id } = req.params;
    const isDeleted = db.deleteProduct(Number(id));

    if (!isDeleted) {
        return res.render('error', { message: 'Prodotto non trovato!' });
    }

    res.redirect('/prodotti');
});

/**
 * @swagger
 * /noleggio/{id}:
 *   get:
 *     summary: Visualizza il form per noleggiare un prodotto specifico
 *     tags: [Rentals]
 *     description: Mostra una pagina con i dettagli del prodotto e un form per il noleggio
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prodotto da noleggiare
 *     responses:
 *       200:
 *         description: Form di noleggio
 *       302:
 *         description: Reindirizza alla pagina di errore se il prodotto non è trovato
 */
app.get('/noleggio/:id', ensureAuthenticated, (req, res) => {
    const productId = parseInt(req.params.id);
    const product = db.getProductById(productId);

    if (!product) {
        return res.render('error', { message: 'Prodotto non trovato!' });
    }

    res.render('noleggio', { product });
});

/**
 * @swagger
 * /noleggio/{id}:
 *   post:
 *     summary: Calcola il prezzo del noleggio per un prodotto specifico
 *     tags: [Rentals]
 *     description: Elabora i dati del form e calcola il prezzo del noleggio in base alla durata
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prodotto da noleggiare
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 description: Durata del noleggio in giorni
 *             required:
 *               - days
 *     responses:
 *       200:
 *         description: Pagina di conferma con il prezzo calcolato
 *       302:
 *         description: Reindirizza alla pagina di errore se la validazione fallisce
 */
app.post('/noleggio/:id', ensureAuthenticated, (req, res) => {
    const productId = parseInt(req.params.id);
    const { days } = req.body;

    if (!days || days <= 0) {
        return res.render('error', { message: 'Durata del noleggio non valida!' });
    }

    const price = db.calculateRentalPrice(productId, days);
    if (price === null) {
        return res.render('error', { message: 'Prodotto non trovato!' });
    }

    // Memorizza i dati del noleggio nell'oggetto req.rental invece che in session
    req.rental = { productId, days, price };
    res.render('confermaNoleggio', { productId, days, price });
});

/**
 * @swagger
 * /completa:
 *   post:
 *     summary: Completa il processo di noleggio o acquisto
 *     tags: [Rentals, Products]
 *     description: Finalizza il noleggio o l'acquisto di un prodotto
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [rental, purchase]
 *                 description: Azione da completare (noleggio o acquisto)
 *               productId:
 *                 type: integer
 *                 description: ID del prodotto
 *               days:
 *                 type: integer
 *                 description: Durata del noleggio in giorni
 *               price:
 *                 type: number
 *                 description: Prezzo calcolato
 *             required:
 *               - action
 *               - productId
 *               - price
 *     responses:
 *       200:
 *         description: Pagina di successo con conferma dell'operazione
 *       302:
 *         description: Reindirizza alla pagina di errore se l'azione non è valida
 */
app.post('/completa', ensureAuthenticated, (req, res) => {
    const { action, productId, days, price } = req.body;

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
 *     summary: Calcola il prezzo del noleggio
 *     tags: [Rentals]
 *     description: Calcola il prezzo del noleggio in base alla durata specificata
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               durata:
 *                 type: integer
 *                 description: Durata del noleggio in giorni
 *             required:
 *               - durata
 *     responses:
 *       200:
 *         description: Pagina di noleggio con il prezzo calcolato
 */
app.post('/calcolaPrezzo', ensureAuthenticated, (req, res) => {
    const durata = parseInt(req.body.durata);
    const prezzoPerGiorno = 10; // Esempio di prezzo giornaliero
    const totale = durata * prezzoPerGiorno;

    res.render('noleggio', {
        prezzo: totale,
    });
});

/**
 * @swagger
 * /noleggio:
 *   get:
 *     summary: Visualizza i prodotti disponibili per il noleggio con opzioni di filtro
 *     tags: [Rentals]
 *     description: Mostra una lista di prodotti che possono essere noleggiati, con possibilità di filtrare per vari criteri
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filtra i prodotti per marca
 *       - in: query
 *         name: colore
 *         schema:
 *           type: string
 *         description: Filtra i prodotti per colore
 *       - in: query
 *         name: condizione
 *         schema:
 *           type: string
 *         description: Filtra i prodotti per condizione
 *       - in: query
 *         name: prezzoMin
 *         schema:
 *           type: number
 *         description: Prezzo minimo per il filtro
 *       - in: query
 *         name: prezzoMax
 *         schema:
 *           type: number
 *         description: Prezzo massimo per il filtro
 *     responses:
 *       200:
 *         description: Lista filtrata di prodotti
 */
app.get('/noleggio', ensureAuthenticated, (req, res) => {
    let filteredProducts = db.getAllProducts();

    // Parametri di query
    const { brand, colore, condizione, prezzoMin, prezzoMax } = req.query;
    // Filtro per brand
    if (brand) {
        filteredProducts = filteredProducts.filter(product =>
            product.brand.toLowerCase().includes(brand.toLowerCase())
        );
    }

    // Filtro per colore
    if (colore) {
        filteredProducts = filteredProducts.filter(product =>
            product.color.toLowerCase() === colore.toLowerCase()
        );
    }

    // Filtro per condizione
    if (condizione) {
        filteredProducts = filteredProducts.filter(product =>
            product.condition.toLowerCase() === condizione.toLowerCase()
        );
    }

    // Filtro per prezzo minimo
    if (prezzoMin) {
        filteredProducts = filteredProducts.filter(product =>
            product.price >= parseFloat(prezzoMin)
        );
    }

    // Filtro per prezzo massimo
    if (prezzoMax) {
        filteredProducts = filteredProducts.filter(product =>
            product.price <= parseFloat(prezzoMax)
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

/**
 * @swagger
 * /noleggio:
 *   post:
 *     summary: Calcola il prezzo del noleggio in base alla durata
 *     tags: [Rentals]
 *     description: Calcola il prezzo totale del noleggio per un prodotto specifico basato sulla durata richiesta
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: ID del prodotto da noleggiare
 *               durata:
 *                 type: integer
 *                 description: Durata del noleggio in giorni
 *             required:
 *               - id
 *               - durata
 *     responses:
 *       200:
 *         description: Pagina di noleggio con il prezzo calcolato
 */
app.post('/noleggio', ensureAuthenticated, (req, res) => {
    const { id, durata } = req.body;
    const product = db.getProductById(Number(id));
    const prezzo = product ? product.price * durata : null;
    res.render('noleggio', { prezzo, products: db.getAllProducts() });
});

/**
 * @swagger
 * /acquista:
 *   post:
 *     summary: Elabora l'acquisto di un prodotto
 *     tags: [Products]
 *     description: Gestisce il processo di acquisto di un prodotto selezionato
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: ID del prodotto da acquistare
 *             required:
 *               - id
 *     responses:
 *       200:
 *         description: Pagina di conferma acquisto con dettagli del prodotto
 *       404:
 *         description: Prodotto non trovato
 */
app.post('/acquista', ensureAuthenticated, (req, res) => {
    const { id } = req.body;
    const product = db.getProductById(Number(id));
    res.render('acquista', { product });
});

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Aggiunge un prodotto al carrello
 *     tags: [Cart]
 *     description: Aggiunge un prodotto al carrello dell'utente (gestito lato client con localStorage)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: ID del prodotto da aggiungere al carrello
 *               quantity:
 *                 type: integer
 *                 description: Quantità del prodotto da aggiungere
 *                 default: 1
 *             required:
 *               - productId
 *     responses:
 *       200:
 *         description: Prodotto aggiunto al carrello con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 */
app.post('/api/cart/add', ensureAuthenticated, (req, res) => {
    res.json({ success: true });
});

/**
 * @swagger
 * /api/cart/remove:
 *   post:
 *     summary: Rimuove un prodotto dal carrello
 *     tags: [Cart]
 *     description: Rimuove un prodotto dal carrello dell'utente (gestito lato client con localStorage)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: ID del prodotto da rimuovere dal carrello
 *             required:
 *               - productId
 *     responses:
 *       200:
 *         description: Prodotto rimosso dal carrello con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 */
app.post('/api/cart/remove', ensureAuthenticated, (req, res) => {
    res.json({ success: true });
});

/**
 * @swagger
 * /checkout:
 *   get:
 *     summary: Visualizza la pagina di checkout
 *     tags: [Cart]
 *     description: Mostra la pagina per completare l'ordine
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pagina di checkout
 *       302:
 *         description: Reindirizza al login se l'utente non è autenticato
 */
app.get('/checkout', ensureAuthenticated, (req, res) => {
    res.render('checkout', {
        title: 'Completa il tuo ordine',
        user: req.user
    });
});

/**
 * @swagger
 * /api/checkout:
 *   post:
 *     summary: Elabora il checkout e crea un ordine
 *     tags: [Cart]
 *     description: Finalizza l'ordine con gli articoli nel carrello
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cartItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     price:
 *                       type: number
 *             required:
 *               - cartItems
 *     responses:
 *       200:
 *         description: Ordine completato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 orderId:
 *                   type: integer
 *                   example: 1234567890
 *                 message:
 *                   type: string
 *                   example: Ordine completato con successo!
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 */
// API per completare l'ordine
app.post('/api/checkout', ensureAuthenticated, (req, res) => {
    const { cartItems } = req.body;

    // Qui potresti implementare la logica per salvare l'ordine nel database
    // Per ora restituiamo una risposta di successo

    res.json({
        success: true,
        orderId: Date.now(), // Simuliamo un ID ordine
        message: 'Ordine completato con successo!'
    });
});

/**
 * @swagger
 * /chat:
 *   get:
 *     summary: Visualizza la pagina della chat
 *     tags: [Chat]
 *     description: Mostra l'interfaccia della chat per comunicare con altri utenti
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Pagina della chat
 *       302:
 *         description: Reindirizza al login se l'utente non è autenticato
 */
// Rotta per la pagina della chat (accessibile solo agli utenti autenticati)
app.get('/chat', ensureAuthenticated, (req, res) => {
    // Ottieni l'utente corrente
    const currentUser = req.user || req.session.user;

    // Ottieni tutti gli utenti (per mostrare la lista)
    const allUsers = db.getAllUsers().filter(user => user.id !== currentUser.id);

    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Ottiene la lista degli utenti
 *     tags: [Users, Chat]
 *     description: Restituisce la lista di tutti gli utenti tranne quello corrente
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista degli utenti
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nome:
 *                     type: string
 *                   cognome:
 *                     type: string
 *                   username:
 *                     type: string
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 */
// Rotta per ottenere la lista degli utenti (per l'API)
app.get('/api/users', ensureAuthenticated, (req, res) => {
    const currentUser = req.user || req.session.user;
    const users = db.getAllUsers().filter(user => user.id !== currentUser.id);

    // Invia solo le informazioni necessarie
    const safeUsers = users.map(user => ({
        id: user.id,
        nome: user.nome,
        cognome: user.cognome,
        username: user.username
    }));

    res.json(safeUsers);
});

/**
 * @swagger
 * /api/messages/{userId}:
 *   get:
 *     summary: Ottiene i messaggi di una conversazione
 *     tags: [Chat]
 *     description: Restituisce tutti i messaggi scambiati tra l'utente corrente e un altro utente
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'altro utente nella conversazione
 *     responses:
 *       200:
 *         description: Lista dei messaggi della conversazione
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 *       500:
 *         description: Errore del server durante il recupero dei messaggi
 */
app.get('/api/messages/:userId', ensureAuthenticated, async (req, res) => {
    const currentUser = req.user || req.session.user;
    const otherUserId = parseInt(req.params.userId);

    try {
        // Recupera i messaggi dal database
        const messages = await db.getConversation(currentUser.id, otherUserId);

        // Segna i messaggi ricevuti come letti
        db.markMessagesAsRead(otherUserId, currentUser.id);

        res.json(messages);
    } catch (error) {
        console.error('Errore nel recupero messaggi:', error);
        res.json([]);  // In caso di errore, restituisci un array vuoto
    }
});

/**
 * @swagger
 * /api/currentUser:
 *   get:
 *     summary: Ottiene l'utente corrente
 *     tags: [Users, Chat]
 *     description: Restituisce i dati dell'utente attualmente autenticato
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Dati dell'utente corrente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nome:
 *                   type: string
 *                 cognome:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 */
// Rotta per ottenere l'utente corrente
app.get('/api/currentUser', ensureAuthenticated, (req, res) => {
    const user = req.user || req.session.user;

    // Invia informazioni sicure dell'utente
    const safeUser = {
        id: user.id,
        nome: user.nome,
        cognome: user.cognome,
        username: user.username,
        email: user.email
    };

    res.json(safeUser);
});

/**
 * @swagger
 * components:
 *   schemas:
 *     SocketMessage:
 *       type: object
 *       required:
 *         - recipientId
 *         - text
 *       properties:
 *         recipientId:
 *           type: integer
 *           description: ID dell'utente che riceve il messaggio
 *         text:
 *           type: string
 *           description: Contenuto del messaggio
 *     MessageSaved:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         senderId:
 *           type: integer
 *         recipientId:
 *           type: integer
 *         text:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *         read:
 *           type: boolean
 */

// Socket.IO gestione
io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    const username = socket.handshake.auth.username;

    if (!userId) {
        return next(new Error("Autenticazione richiesta"));
    }

    // Converte l'ID utente in numero per garantire consistenza
    socket.userId = parseInt(userId, 10);
    socket.username = username;

    console.log(`Utente connesso: ID=${socket.userId}, Username=${socket.username}`);
    next();
});

io.on('connection', (socket) => {
    // Associa l'utente al socket usando l'ID convertito in stringa
    const userId = socket.userId;
    console.log(`Connessione stabilita per l'utente ID=${userId}`);

    // Usa sempre toString() per le chiavi della mappa
    connectedUsers.set(userId.toString(), socket.id);

    // Log degli utenti connessi per debug
    console.log("Utenti connessi:", Array.from(connectedUsers.keys()));

    // Invia la lista degli utenti connessi
    const users = [];
    const allUsers = db.getAllUsers();

    allUsers.forEach(user => {
        users.push({
            id: user.id,
            username: user.username,
            nome: user.nome + ' ' + user.cognome,
            connected: connectedUsers.has(user.id.toString())
        });
    });

    socket.emit('users', users);

    // Gestione messaggi privati migliorata
    socket.on('private message', async ({ recipientId, text }) => {
        const senderId = socket.userId;

        // Converti sempre recipientId in numero
        const recipientIdInt = parseInt(recipientId, 10);

        console.log(`Messaggio da ${senderId} a ${recipientIdInt}: ${text}`);

        try {
            // Salva il messaggio nel database
            const message = await db.saveMessage(senderId, recipientIdInt, text);

            // Conferma al mittente che il messaggio è stato salvato
            socket.emit('message_saved', message);

            // Invia il messaggio al destinatario se è online
            const recipientSocketId = connectedUsers.get(recipientIdInt.toString());
            if (recipientSocketId) {
                console.log(`Destinatario ${recipientIdInt} è online, invio messaggio`);
                socket.to(recipientSocketId).emit('private message', message);
            } else {
                console.log(`Destinatario ${recipientIdInt} non è online`);
            }
        } catch (error) {
            console.error('Errore nell\'invio/salvataggio del messaggio:', error);
            socket.emit('message_error', { error: 'Errore nell\'invio del messaggio' });
        }
    });

    // Disconnessione con log migliorato
    socket.on('disconnect', () => {
        console.log(`Utente disconnesso: ID=${socket.userId}`);
        connectedUsers.delete(socket.userId.toString());

        // Notifica gli altri utenti della disconnessione
        socket.broadcast.emit('user_disconnected', socket.userId);
    });
});

app.get('/noleggi', (req, res) => {
    res.render('admin/noleggi'); // Esto busca views/admin/noleggi.hbs
});

app.get('/vendite', (req, res) => {
    res.render('admin/vendite'); // Esto busca views/admin/vendite.hbs
});

// Arrays para armazenar aluguéis e vendas
const rentals = [];
const sales = [];

// Criar aluguel e incrementar ID
function createRental(data) {
  const newRental = {
    id: rentals.length + 1,
    ...data,
    timestamp: new Date().toISOString(),
    status: 'pending' // pending, approved, rejected
  };
  rentals.push(newRental);
  return newRental;
}

// Criar venda e incrementar ID
function createSale(data) {
  const newSale = {
    id: sales.length + 1,
    orderId: `ORD-${new Date().getFullYear()}-${String(sales.length + 1).padStart(3, '0')}`,
    ...data,
    timestamp: new Date().toISOString(),
    status: 'processing' // processing, completed, refunded
  };
  sales.push(newSale);
  return newSale;
}

// Obter todos os aluguéis
function getAllRentals() {
  return rentals;
}

// Obter todas as vendas
function getAllSales() {
  return sales;
}

// Atualizar status do aluguel
function updateRentalStatus(id, status) {
  const rental = rentals.find(r => r.id === id);
  if (rental) {
    rental.status = status;
    return rental;
  }
  return null;
}

// Atualizar status da venda
function updateSaleStatus(id, status) {
  const sale = sales.find(s => s.id === id);
  if (sale) {
    sale.status = status;
    return sale;
  }
  return null;
}

// Adicione suporte para JSON no endpoint completa
app.use(express.json());

// Modifique o endpoint /completa para processar requisições JSON
app.post('/completa', ensureAuthenticated, (req, res) => {
    const { action, productId, days, price, startDate, endDate } = req.body;
    const product = db.getProductById(Number(productId));
    
    if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado!' });
    }
    
    // Obter dados do usuário atual
    const user = req.user;
    
    if (action === 'purchase') {
        // Criar um novo registro de venda
        const sale = createSale({
            productId: Number(productId),
            product: product,
            userId: user.id,
            user: {
                id: user.id,
                nome: user.name || user.nome,
                email: user.email
            },
            price: parseFloat(price)
        });
        
        return res.json({ 
            success: true, 
            message: 'Acquisto completato con successo!', 
            orderId: sale.orderId 
        });
    } else if (action === 'rental') {
        // Criar um novo registro de aluguel
        const rental = createRental({
            productId: Number(productId),
            product: product,
            userId: user.id,
            user: {
                id: user.id,
                nome: user.name || user.nome,
                email: user.email
            },
            days: Number(days),
            price: parseFloat(price),
            startDate: startDate || new Date().toISOString(),
            endDate: endDate || new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000).toISOString()
        });
        
        return res.json({ 
            success: true, 
            message: `Noleggio completato per ${days} giorni! Prezzo totale: €${price}` 
        });
    } else {
        return res.status(400).json({ error: 'Ação não válida!' });
    }
});

// Rotas para sucesso e checkout
app.get('/success', ensureAuthenticated, (req, res) => {
    res.render('success');
});

app.get('/checkout', ensureAuthenticated, (req, res) => {
    res.render('checkout', { user: req.user });
});

// Rotas admin para obter dados
app.get('/api/rentals', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.json(getAllRentals());
});

app.get('/api/sales', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.json(getAllSales());
});

// Atualizar noleggi e vendite para usar dados reais
app.get('/noleggi', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('admin/noleggi', { rentals: getAllRentals() });
});

app.get('/vendite', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('admin/vendite', { sales: getAllSales() });
});

// Endpoint para atualizar status do aluguel
app.post('/api/rentals/:id/status', ensureAuthenticated, ensureAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status não válido' });
    }
    
    const updatedRental = updateRentalStatus(id, status);
    
    if (!updatedRental) {
        return res.status(404).json({ error: 'Aluguel não encontrado' });
    }
    
    res.json(updatedRental);
});

// Endpoint para atualizar status da venda
app.post('/api/sales/:id/status', ensureAuthenticated, ensureAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status || !['processing', 'completed', 'refunded'].includes(status)) {
        return res.status(400).json({ error: 'Status não válido' });
    }
    
    const updatedSale = updateSaleStatus(id, status);
    
    if (!updatedSale) {
        return res.status(404).json({ error: 'Venda não encontrada' });
    }
    
    res.json(updatedSale);
});

// Adicione estes helpers para formatação
hbs.registerHelper('eq', function (a, b) {
    return a === b;
});

hbs.registerHelper('firstLetter', function (str) {
    return str ? str.charAt(0).toUpperCase() : '';
});

hbs.registerHelper('formatDate', function (dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
});

hbs.registerHelper('formatPrice', function (price) {
    return parseFloat(price).toFixed(2);
});
// Registra gli helper personalizzati per Handlebars
module.exports = function(hbs) {
    hbs.registerHelper('eq', function(a, b) {
      return a === b;
    });
  
    hbs.registerHelper('lt', function(a, b) {
      return parseFloat(a) < parseFloat(b);
    });
  
    hbs.registerHelper('gt', function(a, b) {
      return parseFloat(a) > parseFloat(b);
    });
  
    hbs.registerHelper('multiply', function(a, b) {
      return (parseFloat(a) * parseFloat(b)).toFixed(2);
    });
  
    hbs.registerHelper('getProductImage', function(category, color, brand) {
      // Genera un ID univoco per rendere diverse le immagini
      const uniqueId = category.charCodeAt(0) + (color ? color.charCodeAt(0) : 0) + (brand ? brand.length : 0);
      
      // URL di alta qualità per le immagini di abbigliamento
      return `https://source.unsplash.com/500x600/?${encodeURIComponent(category.toLowerCase())},${color ? encodeURIComponent(color.toLowerCase()) : 'clothing'},fashion&sig=${uniqueId}`;
    });
  };
// Start server
const port = 3000;
server.listen(port, () => console.log(`Server started on port ${port}. 
Vai su http://localhost:${port}.
Vai su http://localhost:${port}/api-docs per vedere la documentazione Swagger.`)); 