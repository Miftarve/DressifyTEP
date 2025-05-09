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
const session = require('express-session');

// Aggiungi all'inizio del file, dopo i require e prima della definizione delle app
const SERVER_START_TIME = Date.now().toString();
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

// Arrays per archiviare noleggi e vendite
const rentals = [];
const sales = [];

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Configurazione del motore di template
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerHelper('json', context => JSON.stringify(context, null, 2));
app.use(session({
    secret: 'dressify_session_secret', // Cambia con una stringa segreta più robusta in produzione
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production', // true in produzione, false in sviluppo
      maxAge: 24 * 60 * 60 * 1000 // 24 ore in millisecondi
    }
  }));
// Inizializza Passport.js (solo per OAuth)
app.use(passport.initialize());
app.use(passport.session());

// Swagger Configuration
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Dressify - E-commerce e Chat API',
            version: '1.0.0',
            description: 'Documentazione completa delle API per la piattaforma di e-commerce di abbigliamento Dressify',
            contact: {
                name: 'Supporto Tecnico Dressify',
                email: 'support@dressify.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Server di sviluppo locale',
            },
            {
                url: 'https://api.dressify.com',
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
                description: 'Gestione degli utenti e profili'
            },
            {
                name: 'Products',
                description: 'Gestione dei prodotti di abbigliamento'
            },
            {
                name: 'Rentals',
                description: 'Operazioni di noleggio dei capi di abbigliamento'
            },
            {
                name: 'Chat',
                description: 'Sistema di messaggistica tra utenti'
            },
            {
                name: 'Cart',
                description: 'Gestione del carrello e checkout'
            },
            {
                name: 'Admin',
                description: 'Funzionalità di amministrazione'
            }
        ],
        components: {
            schemas: {
                User: {
                    type: 'object',
                    required: ['id', 'nome', 'cognome', 'email', 'username', 'password', 'ruolo'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID univoco dell\'utente'
                        },
                        nome: {
                            type: 'string',
                            description: 'Nome dell\'utente'
                        },
                        cognome: {
                            type: 'string',
                            description: 'Cognome dell\'utente'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Email dell\'utente'
                        },
                        username: {
                            type: 'string',
                            description: 'Username dell\'utente'
                        },
                        password: {
                            type: 'string',
                            description: 'Password dell\'utente',
                            format: 'password'
                        },
                        ruolo: {
                            type: 'string',
                            enum: ['user', 'admin'],
                            description: 'Ruolo dell\'utente nel sistema'
                        },
                        dataNascita: {
                            type: 'string',
                            format: 'date',
                            description: 'Data di nascita dell\'utente'
                        },
                        luogoNascita: {
                            type: 'string',
                            description: 'Luogo di nascita dell\'utente'
                        },
                        googleId: {
                            type: 'string',
                            description: 'ID di Google se registrato con Google OAuth'
                        },
                        facebookId: {
                            type: 'string',
                            description: 'ID di Facebook se registrato con Facebook OAuth'
                        }
                    },
                    example: {
                        id: 1,
                        nome: 'Mario',
                        cognome: 'Rossi',
                        email: 'mario.rossi@example.com',
                        username: 'mario.rossi',
                        password: 'password123',
                        ruolo: 'user',
                        dataNascita: '1990-01-01',
                        luogoNascita: 'Roma',
                        googleId: null,
                        facebookId: null
                    }
                },
                Product: {
                    type: 'object',
                    required: ['id', 'category', 'price'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID univoco del prodotto'
                        },
                        category: {
                            type: 'string',
                            description: 'Categoria del prodotto (es. camicia, pantalone, giacca)'
                        },
                        size: {
                            type: 'string',
                            description: 'Taglia del prodotto (es. XS, S, M, L, XL)'
                        },
                        color: {
                            type: 'string',
                            description: 'Colore del prodotto'
                        },
                        brand: {
                            type: 'string',
                            description: 'Marca del prodotto'
                        },
                        condition: {
                            type: 'string',
                            enum: ['nuovo', 'come nuovo', 'buono', 'usato'],
                            description: 'Condizione del prodotto'
                        },
                        price: {
                            type: 'number',
                            description: 'Prezzo del prodotto in euro'
                        }
                    },
                    example: {
                        id: 1,
                        category: 'Camicia',
                        size: 'M',
                        color: 'Blu',
                        brand: 'Ralph Lauren',
                        condition: 'come nuovo',
                        price: 49.99
                    }
                },
                Message: {
                    type: 'object',
                    required: ['id', 'senderId', 'recipientId', 'text', 'timestamp'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID univoco del messaggio'
                        },
                        senderId: {
                            type: 'integer',
                            description: 'ID dell\'utente che ha inviato il messaggio'
                        },
                        recipientId: {
                            type: 'integer',
                            description: 'ID dell\'utente che riceve il messaggio'
                        },
                        text: {
                            type: 'string',
                            description: 'Contenuto del messaggio'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Data e ora d\'invio del messaggio'
                        },
                        read: {
                            type: 'boolean',
                            description: 'Stato di lettura del messaggio'
                        }
                    },
                    example: {
                        id: 1,
                        senderId: 1,
                        recipientId: 2,
                        text: 'Ciao, il prodotto è ancora disponibile?',
                        timestamp: '2023-05-20T14:30:00Z',
                        read: false
                    }
                },
                Rental: {
                    type: 'object',
                    required: ['id', 'productId', 'userId', 'days', 'price', 'startDate', 'endDate'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID univoco del noleggio'
                        },
                        productId: {
                            type: 'integer',
                            description: 'ID del prodotto noleggiato'
                        },
                        userId: {
                            type: 'integer',
                            description: 'ID dell\'utente che ha effettuato il noleggio'
                        },
                        days: {
                            type: 'integer',
                            description: 'Durata del noleggio in giorni'
                        },
                        price: {
                            type: 'number',
                            description: 'Prezzo totale del noleggio'
                        },
                        startDate: {
                            type: 'string',
                            format: 'date',
                            description: 'Data di inizio noleggio'
                        },
                        endDate: {
                            type: 'string',
                            format: 'date',
                            description: 'Data di fine noleggio'
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'approved', 'rejected'],
                            description: 'Stato del noleggio'
                        }
                    },
                    example: {
                        id: 1,
                        productId: 2,
                        userId: 3,
                        days: 7,
                        price: 35.99,
                        startDate: '2023-06-10',
                        endDate: '2023-06-17',
                        status: 'approved'
                    }
                },
                Sale: {
                    type: 'object',
                    required: ['id', 'orderId', 'productId', 'userId', 'price'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID univoco della vendita'
                        },
                        orderId: {
                            type: 'string',
                            description: 'Codice univoco dell\'ordine'
                        },
                        productId: {
                            type: 'integer',
                            description: 'ID del prodotto venduto'
                        },
                        userId: {
                            type: 'integer',
                            description: 'ID dell\'utente che ha effettuato l\'acquisto'
                        },
                        price: {
                            type: 'number',
                            description: 'Prezzo dell\'acquisto'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Data e ora dell\'acquisto'
                        },
                        status: {
                            type: 'string',
                            enum: ['processing', 'completed', 'refunded'],
                            description: 'Stato dell\'ordine'
                        }
                    },
                    example: {
                        id: 1,
                        orderId: 'ORD-2023-001',
                        productId: 5,
                        userId: 2,
                        price: 89.99,
                        timestamp: '2023-05-15T10:30:00Z',
                        status: 'completed'
                    }
                }
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Inserisci il token JWT ottenuto al login'
                },
                googleOAuth: {
                    type: 'oauth2',
                    flows: {
                        authorizationCode: {
                            authorizationUrl: 'http://localhost:3000/auth/google',
                            scopes: {
                                profile: 'Informazioni del profilo',
                                email: 'Indirizzo email dell\'utente'
                            }
                        }
                    }
                },
                facebookOAuth: {
                    type: 'oauth2',
                    flows: {
                        authorizationCode: {
                            authorizationUrl: 'http://localhost:3000/auth/facebook',
                            scopes: {
                                email: 'Indirizzo email dell\'utente',
                                public_profile: 'Informazioni pubbliche del profilo'
                            }
                        }
                    }
                }
            },
            responses: {
                UnauthorizedError: {
                    description: 'Accesso non autorizzato',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    message: {
                                        type: 'string',
                                        example: 'Non sei autorizzato ad accedere a questa risorsa'
                                    }
                                }
                            }
                        }
                    }
                },
                BadRequestError: {
                    description: 'Richiesta non valida',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    message: {
                                        type: 'string',
                                        example: 'La richiesta contiene dati non validi'
                                    }
                                }
                            }
                        }
                    }
                },
                NotFoundError: {
                    description: 'Risorsa non trovata',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    message: {
                                        type: 'string',
                                        example: 'La risorsa richiesta non è stata trovata'
                                    }
                                }
                            }
                        }
                    }
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

// ===== HELPER FUNCTIONS =====

// Registra helpers per Handlebars
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

hbs.registerHelper('firstLetter', function(str) {
    return str ? str.charAt(0).toUpperCase() : '';
});

hbs.registerHelper('formatDate', function(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
});

hbs.registerHelper('formatPrice', function(price) {
    return parseFloat(price).toFixed(2);
});

hbs.registerHelper('getProductImage', function(category, color, brand) {
    // Genera un ID univoco per rendere diverse le immagini
    const uniqueId = category.charCodeAt(0) + (color ? color.charCodeAt(0) : 0) + (brand ? brand.length : 0);
    
    // URL di alta qualità per le immagini di abbigliamento
    return `https://source.unsplash.com/500x600/?${encodeURIComponent(category.toLowerCase())},${color ? encodeURIComponent(color.toLowerCase()) : 'clothing'},fashion&sig=${uniqueId}`;
});

// Funzioni di utilità per gestire gli utenti
function findUserByEmail(email) {
    const allUsers = db.getAllUsers();
    return allUsers.find(user => user.email === email);
}

// Funzioni di utilità per noleggi e vendite
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

function getAllRentals() {
    return rentals;
}

function getAllSales() {
    return sales;
}

function updateRentalStatus(id, status) {
    const rental = rentals.find(r => r.id === id);
    if (rental) {
        rental.status = status;
        return rental;
    }
    return null;
}

function updateSaleStatus(id, status) {
    const sale = sales.find(s => s.id === id);
    if (sale) {
        sale.status = status;
        return sale;
    }
    return null;
}

// ===== PASSPORT CONFIGURATION =====

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

// Google Authentication Strategy
// Modifica la strategia di autenticazione Google per gestire meglio gli errori
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Profilo Google ricevuto:', profile.displayName);
        
        // Verifica se l'utente esiste già nel DB utilizzando l'email
        let user = null;
        if (profile.emails && profile.emails.length > 0) {
            const email = profile.emails[0].value;
            console.log('Ricerca utente con email:', email);
            user = findUserByEmail(email);
        }

        // Se l'utente non esiste, lo creiamo
        if (!user) {
            console.log('Creazione nuovo utente con profilo Google');
            const firstName = profile.name?.givenName || profile.displayName.split(' ')[0] || 'Utente';
            const lastName = profile.name?.familyName || (profile.displayName.split(' ').length > 1 ? profile.displayName.split(' ')[1] : 'Google');
            
            user = db.createUser({
                nome: firstName,
                cognome: lastName,
                email: profile.emails ? profile.emails[0].value : `google_${profile.id}@example.com`,
                ruolo: 'user',
                googleId: profile.id,
                dataNascita: new Date().toISOString().split('T')[0],
                luogoNascita: 'Non specificato',
                username: profile.emails ? profile.emails[0].value : `google_${profile.id}`,
                password: 'google-auth-' + Math.random().toString(36).substring(2)
            });
            console.log('Nuovo utente creato con ID:', user.id);
        } else {
            console.log('Utente trovato:', user.id, user.nome);
            // Aggiorniamo il googleId se l'utente esiste
            if (user.googleId !== profile.id) {
                console.log('Aggiornamento googleId per utente esistente');
                db.updateUser(user.id, { ...user, googleId: profile.id });
            }
        }

        return done(null, user);
    } catch (error) {
        console.error('Errore durante autenticazione Google:', error);
        return done(error, null);
    }
}));

// Aggiungi questa route di debug per verificare l'autenticazione
app.get('/auth-debug', (req, res) => {
    const token = req.cookies.token;
    const userLocalStorage = `
        <script>
            document.write('<p>LocalStorage user: ' + (localStorage.getItem('user') ? JSON.stringify(JSON.parse(localStorage.getItem('user'))) : 'non presente') + '</p>');
        </script>
    `;
    
    if (!token) {
        res.send(`
            <h1>Diagnostica Autenticazione</h1>
            <p style="color: red;">Nessun token JWT presente nei cookies</p>
            ${userLocalStorage}
            <p><a href="/login">Vai alla pagina di login</a></p>
        `);
        return;
    }
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const tokenServerTime = decoded.serverStartTime || 'non presente';
        const currentServerTime = SERVER_START_TIME || 'non presente';
        const tokenIsValid = tokenServerTime === currentServerTime;
        
        res.send(`
            <h1>Diagnostica Autenticazione</h1>
            <p style="color: ${tokenIsValid ? 'green' : 'red'};">
                Token JWT: PRESENTE E ${tokenIsValid ? 'VALIDO' : 'NON VALIDO'}
            </p>
            <p>Token server time: ${tokenServerTime}</p>
            <p>Current server time: ${currentServerTime}</p>
            <p>Dati utente dal token:</p>
            <pre>${JSON.stringify(decoded, null, 2)}</pre>
            ${userLocalStorage}
            <p><a href="/home">Vai alla home</a></p>
        `);
    } catch (error) {
        res.send(`
            <h1>Diagnostica Autenticazione</h1>
            <p style="color: red;">Token JWT presente ma non valido</p>
            <p>Errore: ${error.message}</p>
            ${userLocalStorage}
            <p><a href="/login">Vai alla pagina di login</a></p>
        `);
    }
});
// Facebook Authentication Strategy
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

// ===== MIDDLEWARE =====

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

// Middleware per verificare ruolo admin
function ensureAdmin(req, res, next) {
    if (req.user && req.user.ruolo === 'admin') {
        return next();
    }
    return res.status(403).render('error', { message: 'Accesso negato. Richiesti privilegi di amministratore.' });
}

// Rotta per visualizzare tutti gli ordini (admin)
app.get('/admin/ordini', ensureAuthenticated, ensureAdmin, (req, res) => {
    try {
        // Ottieni i filtri dalla query string
        const filters = {
            type: req.query.type || 'all',
            status: req.query.status || 'all',
            period: req.query.period || 'all',
            search: req.query.search || ''
        };
        
        // Recupera gli ordini filtrati
        const orders = db.filterOrders(filters);
        
        // Prepara le statistiche per la dashboard
        const stats = {
            totalOrders: db.getAllOrders().length,
            activeRentals: db.getAllOrders().filter(o => o.type === 'rental' && o.status === 'completed').length,
            monthlyRevenue: db.getAllOrders()
                .filter(o => {
                    const orderDate = new Date(o.timestamp);
                    const now = new Date();
                    return orderDate.getMonth() === now.getMonth() && 
                           orderDate.getFullYear() === now.getFullYear();
                })
                .reduce((total, order) => total + order.total, 0)
                .toFixed(2),
            activeUsers: [...new Set(db.getAllOrders().map(o => o.userId))].length
        };
        
        res.render('admin-orders', { 
            user: req.user,
            orders: orders,
            stats: stats,
            filters: filters,
            currentDate: new Date().toISOString()
        });
    } catch (error) {
        console.error("Errore nel recupero degli ordini:", error);
        res.status(500).render('error', { message: 'Si è verificato un errore durante il recupero degli ordini.' });
    }
});

// API per recuperare i dettagli di un ordine specifico
app.get('/api/admin/orders/:orderId', ensureAuthenticated, ensureAdmin, (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = db.getOrderById(orderId);
        
        if (!order) {
            return res.status(404).json({ success: false, error: 'Ordine non trovato' });
        }
        
        res.json({ success: true, order: order });
    } catch (error) {
        console.error("Errore nel recupero dei dettagli dell'ordine:", error);
        res.status(500).json({ success: false, error: 'Errore interno del server' });
    }
});

// API per aggiornare lo stato di un ordine
app.put('/api/admin/orders/:orderId/status', ensureAuthenticated, ensureAdmin, (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ success: false, error: 'Stato non fornito' });
        }
        
        // Trova l'ordine e aggiorna lo stato
        const order = db.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Ordine non trovato' });
        }
        
        // Aggiorna lo stato dell'ordine
        order.status = status;
        
        // Aggiorna anche negli array originali (sales/rentals)
        if (order.type === 'purchase') {
            const sale = db.sales.find(s => s.orderId === orderId);
            if (sale) sale.status = status;
        } else {
            const rental = db.rentals.find(r => r.orderId === orderId);
            if (rental) rental.status = status;
        }
        
        // Aggiorna anche nell'array adminOrders
        const adminOrder = db.adminOrders.find(o => o.orderId === orderId);
        if (adminOrder) adminOrder.status = status;
        
        res.json({ success: true, message: 'Stato dell\'ordine aggiornato con successo', order: order });
    } catch (error) {
        console.error("Errore nell'aggiornamento dello stato dell'ordine:", error);
        res.status(500).json({ success: false, error: 'Errore interno del server' });
    }
});

// Aggiungere questo helper in server.js
hbs.registerHelper('formatDate', function(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

// Per formattare il prezzo
hbs.registerHelper('formatPrice', function(price) {
    if (price === undefined || price === null) return '0,00 €';
    return parseFloat(price).toFixed(2).replace('.', ',') + ' €';
});

// Rotta per confermare che l'ordine è stato ricevuto e visualizzato dall'utente
app.post('/api/confirm-order', ensureAuthenticated, (req, res) => {
    try {
        const { orderId, items, details } = req.body;
        
        // Trova l'ordine nel database
        const order = db.getOrderById(orderId);
        
        if (!order) {
            console.warn(`Ordine ${orderId} non trovato nel database durante la conferma`);
            return res.json({ success: false, error: 'Ordine non trovato' });
        }
        
        // Aggiorna eventualmente ulteriori dettagli dell'ordine
        if (details) {
            order.shippingDetails = {
                ...order.shippingAddress,
                ...details
            };
            
            // Aggiorna anche il metodo di pagamento se disponibile
            if (details.cardNumber) {
                order.paymentMethod = {
                    type: 'Carta di Credito',
                    lastFour: details.cardNumber
                };
            }
        }
        
        // Aggiorna lo stato dell'ordine se necessario
        if (order.status === 'pending') {
            order.status = 'completed';
        }
        
        // Salva l'ora di visualizzazione della conferma
        order.confirmedAt = new Date().toISOString();
        
        
        res.json({ success: true, message: 'Conferma ordine registrata con successo' });
    } catch (error) {
        console.error("Errore nella conferma dell'ordine:", error);
        res.status(500).json({ success: false, error: 'Errore interno del server' });
    }
});

// ===== AUTHENTICATION ROUTES =====

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
 *       200:
 *         description: Login effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT da utilizzare per le richieste autenticate
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     cognome:
 *                       type: string
 *                     email:
 *                       type: string
 *                     ruolo:
 *                       type: string
 *       401:
 *         description: Username o password errati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Username o password errati!
 */
// Modifica la generazione del token JWT nella route /login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Recupera l'utente dal database
    const user = db.getUserByUsername(username);

    if (user && user.password === password) {
        // Genera token JWT CON SERVER_START_TIME
        const token = jwt.sign({
            id: user.id,
            name: user.nome,
            email: user.email,
            ruolo: user.ruolo,
            serverStartTime: SERVER_START_TIME // Aggiungi questa riga
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

// Modifica anche la funzione ensureAuthenticated per verificare il SERVER_START_TIME
function ensureAuthenticated(req, res, next) {
    // Ottieni il token da cookie o header Authorization
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.redirect('/login');
    }

    try {
        // Verifica il token
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // Verifica se il token è stato generato con lo stesso SERVER_START_TIME
        if (decoded.serverStartTime !== SERVER_START_TIME) {
            res.clearCookie('token');
            return res.redirect('/login');
        }
        
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
 *         description: Reindirizza al login in caso di successo
 *       400:
 *         description: Errore di validazione o utente già esistente
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
// 1. Modifica il callback di Google OAuth aggiungendo SERVER_START_TIME
app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    (req, res) => {
        // Una volta autenticato con Google, genera un JWT che include SERVER_START_TIME
        if (req.user) {
            const token = jwt.sign({
                id: req.user.id,
                name: req.user.nome,
                email: req.user.email,
                ruolo: req.user.ruolo,
                serverStartTime: SERVER_START_TIME  // Aggiungi questa riga!
            }, SECRET_KEY, {
                expiresIn: '24h' // Token valido per 24 ore
            });

            // Salva token nei cookie
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 ore
            });

            // Reindirizza a una pagina intermediaria che salverà i dati utente in localStorage
            const userData = {
                id: req.user.id,
                nome: req.user.nome || '',
                cognome: req.user.cognome || '',
                email: req.user.email || '',
                ruolo: req.user.ruolo || 'user'
            };

            res.redirect(`/auth-success?user=${encodeURIComponent(JSON.stringify(userData))}`);
        } else {
            res.redirect('/login');
        }
    }
);

// 2. Aggiungi la nuova rotta per la pagina di successo dell'autenticazione
app.get('/auth-success', (req, res) => {
    // Questa pagina HTML prenderà i dati dall'URL e li salverà in localStorage
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Autenticazione completata</title>
            <style>
                body {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #f6f9fc, #eef2f7);
                    color: #1e293b;
                }
                .loader {
                    border: 5px solid rgba(99, 102, 241, 0.1);
                    border-top: 5px solid #6366f1;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }
                .container {
                    text-align: center;
                    padding: 30px 40px;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
                }
                h2 {
                    margin-bottom: 10px;
                    color: #0f172a;
                }
                p {
                    margin-bottom: 20px;
                    color: #64748b;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="loader"></div>
                <h2>Autenticazione riuscita!</h2>
                <p>Ti stiamo reindirizzando...</p>
            </div>

            <script>
                // Estrae i parametri dall'URL
                const urlParams = new URLSearchParams(window.location.search);
                const userData = urlParams.get('user');
                
                if (userData) {
                    // Salva i dati dell'utente nel localStorage
                    localStorage.setItem('user', userData);
                    console.log('Dati utente salvati:', userData);
                }
                
                // Reindirizza alla home dopo un breve ritardo
                setTimeout(() => {
                    window.location.href = '/home';
                }, 1500);
            </script>
        </body>
        </html>
    `);
});

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
 *       404:
 *         description: Utente non trovato
 *       500:
 *         description: Errore del server durante l'eliminazione
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

// ===== USER ROUTES =====

/**
 * @swagger
 * /:
 *   get:
 *     summary: Reindirizza alla home page
 *     tags: [Users]
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
 * /api/users:
 *   get:
 *     summary: Ottiene la lista degli utenti
 *     tags: [Users, Chat]
 *     description: Restituisce la lista di tutti gli utenti tranne quello corrente
 *     security:
 *       - bearerAuth: []
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
 * /api/currentUser:
 *   get:
 *     summary: Ottiene l'utente corrente
 *     tags: [Users, Chat]
 *     description: Restituisce i dati dell'utente attualmente autenticato
 *     security:
 *       - bearerAuth: []
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

// ===== ADMIN USER MANAGEMENT =====

/**
 * @swagger
 * /registraUtente:
 *   post:
 *     summary: Registra un nuovo utente (funzione admin)
 *     tags: [Admin, Users]
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
 *         description: Reindirizza alla home page con messaggio di successo
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
 *       400:
 *         description: Dati mancanti o non validi
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
 * /modificaUtente/{id}:
 *   get:
 *     summary: Visualizza il form per modificare i dati di un utente
 *     tags: [Admin, Users]
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
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
 *       404:
 *         description: Utente non trovato
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
 *     tags: [Admin, Users]
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
 *         description: Reindirizza alla home page in caso di successo
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
 *       404:
 *         description: Utente non trovato
 */
// Trova questa funzione nel tuo server.js e modificala così:
app.post('/modificaUtente/:id', ensureAuthenticated, ensureAdmin, (req, res) => {
    const userId = parseInt(req.params.id);
    const { nome, cognome, dataNascita, luogoNascita, ruolo, email, username, password } = req.body;

    // Costruisci l'oggetto utente da aggiornare
    const userData = { 
        nome, 
        cognome, 
        dataNascita, 
        luogoNascita, // Aggiungi questo campo
        ruolo, 
        email,
        username // Aggiungi questo campo
    };
    
    // Aggiungi la password solo se è stata fornita
    if (password && password.trim() !== '') {
        userData.password = password;
    }

    const updatedUser = db.updateUser(userId, userData);

    if (!updatedUser) {
        return res.render('error', { message: 'Impossibile modificare l\'utente!' });
    }

    // Reindirizza alla home page dopo una modifica riuscita
    res.redirect('/home');
});

/**
 * @swagger
 * /eliminaUtente/{id}:
 *   get:
 *     summary: Elimina un utente
 *     tags: [Admin, Users]
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
 *         description: Reindirizza alla home page in caso di successo
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
 *       404:
 *         description: Utente non trovato
 */
app.get('/eliminaUtente/:id', ensureAuthenticated, ensureAdmin, (req, res) => {
    const userId = parseInt(req.params.id);
    const success = db.deleteUser(userId);

    if (!success) {
        return res.render('error', { message: 'Impossibile eliminare l\'utente!' });
    }

    res.redirect('/home');
});

// ===== PRODUCTS ROUTES =====

/**
 * @swagger
 * /prodotti:
 *   get:
 *     summary: Ottiene la lista dei prodotti (solo admin)
 *     tags: [Admin, Products]
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
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
 */
app.get('/prodotti', ensureAuthenticated, ensureAdmin, (req, res) => {
    try {
        
        // Ottieni i prodotti dal database
        const products = db.getAllProducts();
        
        // Renderizza la pagina con i prodotti
        res.render('prodotti', { 
            products: products,
            user: req.user
        });
    } catch (error) {
        res.render('error', { message: 'Errore nel caricamento dei prodotti: ' + error.message });
    }
});

app.get('/reset-products', ensureAuthenticated, ensureAdmin, (req, res) => {
    db.resetProducts();
    res.redirect('/prodotti');
});
if (hbs && hbs.registerHelper) {
    hbs.registerHelper('eq', function (a, b) {
        return a === b;
    });
} else {
    console.warn("ATTENZIONE: Impossibile registrare l'helper 'eq'. L'oggetto hbs non è disponibile o non ha il metodo registerHelper.");
}
/**
 * @swagger
 * /prodotti:
 *   post:
 *     summary: Aggiunge un nuovo prodotto (solo admin)
 *     tags: [Admin, Products]
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
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
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
 *     tags: [Admin, Products]
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
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
 *       404:
 *         description: Prodotto non trovato
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
 *     tags: [Admin, Products]
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
 *         description: Reindirizza alla pagina dei prodotti in caso di successo
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
 *       404:
 *         description: Prodotto non trovato
 */
// Aggiorna questa route nel tuo server.js
app.post('/modificaProdotto/:id', ensureAuthenticated, ensureAdmin, (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        const { category, size, color, brand, condition, price } = req.body;
        
        // Converti price a numero
        const priceNum = parseFloat(price);
        
        const updatedProduct = db.updateProduct(productId, { 
            category, 
            size, 
            color, 
            brand, 
            condition, 
            price: priceNum 
        });
        
        if (!updatedProduct) {
            return res.render('error', { message: 'Prodotto non trovato!' });
        }
        
        // Redirect dopo un aggiornamento riuscito
        res.redirect('/prodotti');
    } catch (error) {
        console.error("Errore durante l'aggiornamento del prodotto:", error);
        res.render('error', { message: 'Errore durante l\'aggiornamento: ' + error.message });
    }
});

/**
 * @swagger
 * /eliminaProdotto/{id}:
 *   get:
 *     summary: Visualizza la pagina di conferma per eliminare un prodotto
 *     tags: [Admin, Products]
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
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
 *       404:
 *         description: Prodotto non trovato
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
 *     tags: [Admin, Products]
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
 *         description: Reindirizza alla pagina dei prodotti in caso di successo
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
 *       404:
 *         description: Prodotto non trovato
 */
app.post('/eliminaProdotto/:id', ensureAuthenticated, ensureAdmin, (req, res) => {
    const { id } = req.params;
    const isDeleted = db.deleteProduct(Number(id));

    if (!isDeleted) {
        return res.render('error', { message: 'Prodotto non trovato!' });
    }

    res.redirect('/prodotti');
});

// ===== RENTAL ROUTES =====

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
 *       401:
 *         description: Non autorizzato, richiede autenticazione
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
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 */
app.post('/noleggio', ensureAuthenticated, (req, res) => {
    const { id, durata } = req.body;
    const product = db.getProductById(Number(id));
    const prezzo = product ? product.price * durata : null;
    res.render('noleggio', { prezzo, products: db.getAllProducts() });
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
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 *       404:
 *         description: Prodotto non trovato
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
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 *       400:
 *         description: Durata del noleggio non valida
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
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 */
app.post('/calcolaPrezzo', ensureAuthenticated, (req, res) => {
    const durata = parseInt(req.body.durata);
    const prezzoPerGiorno = 10; // Esempio di prezzo giornaliero
    const totale = durata * prezzoPerGiorno;

    res.render('noleggio', {
        prezzo: totale,
    });
});

// ===== CART & CHECKOUT ROUTES =====

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
 *       401:
 *         description: Non autorizzato, richiede autenticazione
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
 *       401:
 *         description: Non autorizzato, richiede autenticazione
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
 *       401:
 *         description: Non autorizzato, richiede autenticazione
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
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 */
app.get('/checkout', ensureAuthenticated, (req, res) => {
    res.render('checkout', { user: req.user });
});

/**
 * @swagger
 * /api/checkout:
 *   post:
 *     summary: Elabora il checkout e crea un ordine
 *     tags: [Cart]
 *     description: Finalizza l'ordine con gli articoli nel carrello
 *     security:
 *       - bearerAuth: []
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
 * /success:
 *   get:
 *     summary: Visualizza la pagina di conferma ordine
 *     tags: [Cart]
 *     description: Mostra una pagina di conferma dopo un acquisto o noleggio completato con successo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *         description: Identificatore dell'ordine (opzionale)
 *     responses:
 *       200:
 *         description: Pagina di conferma successo
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 */
app.get('/success', ensureAuthenticated, (req, res) => {
    try {
        // Ottieni l'ID dell'ordine dai parametri di query (se presente)
        const orderId = req.query.orderId || Date.now();
        
        // Ottieni eventualmente i dati del carrello (se passati come query parameter)
        const cartData = req.query.cart || '';
        
        // Renderizza la vista success con i dati necessari
        res.render('success', { 
            orderId: orderId,
            user: req.user,
            cartData: cartData,
            message: 'Operazione completata con successo!'
        });
    } catch (error) {
        console.error("Errore nel renderizzare la pagina di successo:", error);
        res.status(500).render('error', { message: 'Si è verificato un errore nella pagina di successo.' });
    }
});
/**
 * @swagger
 * /order/:id:
 *   get:
 *     summary: Visualizza i dettagli di un ordine specifico
 *     tags: [Orders]
 *     description: Mostra una pagina dettagliata con tutte le informazioni relative a un ordine
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'ordine da visualizzare
 *     responses:
 *       200:
 *         description: Pagina dettagli ordine
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 *       404:
 *         description: Ordine non trovato
 */
app.get('/order/:id', ensureAuthenticated, (req, res) => {
    try {
        const orderId = req.params.id;
        
        // Recupera i dati dell'utente
        const user = req.user;
        
        // Recupera l'ordine dal database usando il nuovo metodo
        const orderData = db.getOrderById(orderId);
        
        if (!orderData) {
            // Se l'ordine non è trovato nel database, prova a crearne uno fittizio con i dati dalla query string
            if (req.query.items) {
                // Crea un ordine fittizio con i dati dalla query string
                const date = new Date();
                
                const fakeOrder = {
                    orderId: orderId,
                    date: date.toISOString().split('T')[0],
                    items: [],
                    total: 0,
                    subtotal: 0,
                    shipping: 0,
                    status: 'completed',
                    type: 'purchase',
                    shippingAddress: {
                        street: 'Via Roma 123',
                        city: 'Milano',
                        zip: '20100',
                        country: 'Italia'
                    },
                    paymentMethod: {
                        type: 'Carta di Credito',
                        lastFour: '1234',
                        expiry: '12/25'
                    }
                };
                
                // Tenta di recuperare i dati dalla query string
                const cartItems = JSON.parse(decodeURIComponent(req.query.items));
                
                if (cartItems && cartItems.length > 0) {
                    fakeOrder.items = cartItems.map(item => {
                        return {
                            ...item,
                            price: parseFloat(item.price),
                            type: item.type || 'purchase'
                        };
                    });
                    
                    // Calcola i totali
                    fakeOrder.subtotal = fakeOrder.items.reduce((total, item) => {
                        return total + (item.type === 'rental' 
                            ? parseFloat(item.price) * parseInt(item.duration)
                            : parseFloat(item.price));
                    }, 0);
                    
                    fakeOrder.shipping = 0;
                    fakeOrder.total = fakeOrder.subtotal + fakeOrder.shipping;
                }
                
                // Renderizza la pagina con l'ordine fittizio
                return res.render('order-details', { 
                    order: formatOrderForView(fakeOrder),
                    user: user
                });
            }
            
            // Se non ci sono dati nella query string, mostra un errore
            return res.status(404).render('error', { message: 'Ordine non trovato!' });
        }
        
        // Renderizza la pagina con l'ordine trovato
        res.render('order-details', { 
            order: formatOrderForView(orderData),
            user: user
        });
        
    } catch (error) {
        console.error("Errore nella visualizzazione dei dettagli dell'ordine:", error);
        res.status(500).render('error', { 
            message: 'Si è verificato un errore durante il recupero dei dettagli dell\'ordine.' 
        });
    }
});

// Funzione helper per formattare i dati dell'ordine per la vista
function formatOrderForView(orderData) {
    return {
        orderId: orderData.orderId,
        date: orderData.timestamp ? new Date(orderData.timestamp).toLocaleDateString('it-IT') : new Date().toLocaleDateString('it-IT'),
        items: orderData.items || [
            {
                id: orderData.productId,
                category: orderData.product?.category || 'Abbigliamento',
                brand: orderData.product?.brand || 'Dressimify',
                size: orderData.product?.size || 'M',
                color: orderData.product?.color || 'N/D',
                type: orderData.type || 'purchase',
                price: orderData.price,
                duration: orderData.days,
                startDate: orderData.startDate ? new Date(orderData.startDate).toLocaleDateString('it-IT') : '',
                endDate: orderData.endDate ? new Date(orderData.endDate).toLocaleDateString('it-IT') : ''
            }
        ],
        subtotal: orderData.subtotal || orderData.price || 0,
        shipping: orderData.shipping || 0,
        total: orderData.total || orderData.price || 0,
        status: orderData.status || 'completed',
        shippingAddress: orderData.shippingAddress || {
            street: 'Via Roma 123',
            city: 'Milano',
            zip: '20100',
            country: 'Italia'
        },
        paymentMethod: orderData.paymentMethod || {
            type: 'Carta di Credito',
            lastFour: '1234',
            expiry: '12/25'
        }
    };
}
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
 *         application/json:
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
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Data di inizio noleggio
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Data di fine noleggio
 *             required:
 *               - action
 *               - productId
 *               - price
 *     responses:
 *       200:
 *         description: Operazione completata con successo
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
 *                   example: Acquisto completato con successo!
 *                 orderId:
 *                   type: string
 *                   example: ORD-2023-001
 *       400:
 *         description: Azione non valida o dati mancanti
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 *       404:
 *         description: Prodotto non trovato
 */
app.post('/completa', ensureAuthenticated, (req, res) => {
    try {
        const { action, productId, days, price, startDate, endDate } = req.body;
        
        // Verifica che i dati necessari siano presenti
        if (!action || !productId || !price) {
            return res.status(400).json({ success: false, error: 'Dati mancanti nella richiesta' });
        }
        
        // Ottieni il prodotto dal database
        const product = db.getProductById(Number(productId));
        
        if (!product) {
            return res.status(404).json({ success: false, error: 'Prodotto non trovato!' });
        }
        
        // Ottieni dati dell'utente attuale
        const user = req.user;
        
        // Crea un ID univoco per l'ordine basato su timestamp e utente
        const timestamp = Date.now();
        
        // Fix: Gestisci correttamente user.id che potrebbe non essere una stringa
        let userIdPart = 'USER';
        if (user && user.id) {
            userIdPart = typeof user.id === 'string' 
                ? user.id.substring(0, 4) 
                : String(user.id).substring(0, 4);
        } else if (user && user.email) {
            userIdPart = user.email.substring(0, 4);
        }
        
        const orderId = `${action === 'purchase' ? 'P' : 'R'}-${timestamp}-${userIdPart}`;
        
        // Preparazione dati ordine comuni
        let orderData = {
            orderId: orderId,
            userId: user.id || 0,
            userName: user.nome && user.cognome ? `${user.nome} ${user.cognome}` : (user.username || 'Utente'),
            userEmail: user.email || 'email@esempio.com',
            timestamp: new Date().toISOString(),
            status: 'completed',
            paymentMethod: 'card'
        };
        
        // Inizializza array per ordini admin se non esiste
        if (!db.adminOrders) {
            db.adminOrders = [];
        }
        
        if (action === 'purchase') {
            // Salva i dettagli dell'acquisto
            try {
                // Aggiungi l'ordine alla lista degli ordini amministrativi
                db.adminOrders.push({
                    ...orderData,
                    type: 'purchase',
                    products: [{
                        id: product.id,
                        name: product.name || `${product.brand} ${product.category}`,
                        brand: product.brand,
                        category: product.category,
                        price: parseFloat(price),
                        image: product.image || null
                    }],
                    total: parseFloat(price)
                });
                
                return res.json({ 
                    success: true, 
                    message: 'Acquisto completato con successo!', 
                    orderId: orderId 
                });
            } catch (err) {
                return res.status(500).json({ success: false, error: 'Errore nel salvataggio dell\'acquisto' });
            }
        } else if (action === 'rental') {
            // Verifica che i dati del noleggio siano presenti
            if (!days) {
                return res.status(400).json({ success: false, error: 'Durata del noleggio mancante' });
            }
            
            // Salva i dettagli del noleggio
            try {
                // Gestione delle date
                const rentalStartDate = startDate || new Date().toISOString();
                const rentalEndDate = endDate || new Date(Date.now() + (parseInt(days) * 24 * 60 * 60 * 1000)).toISOString();
                
                // Aggiungi l'ordine alla lista degli ordini amministrativi
                db.adminOrders.push({
                    ...orderData,
                    type: 'rental',
                    products: [{
                        id: product.id,
                        name: product.name || `${product.brand} ${product.category}`,
                        brand: product.brand,
                        category: product.category,
                        price: parseFloat(price),
                        duration: Number(days),
                        startDate: rentalStartDate,
                        endDate: rentalEndDate,
                        image: product.image || null
                    }],
                    rentalDuration: Number(days),
                    startDate: rentalStartDate,
                    endDate: rentalEndDate,
                    total: parseFloat(price)
                });
                
                return res.json({ 
                    success: true, 
                    message: `Noleggio completato per ${days} giorni! Prezzo totale: €${price}`,
                    orderId: orderId
                });
            } catch (err) {
                return res.status(500).json({ success: false, error: 'Errore nel salvataggio del noleggio' });
            }
        } else {
            return res.status(400).json({ success: false, error: 'Azione non valida!' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Errore interno del server: ' + error.message });
    }
});

// Assicurati che questa route sia presente nel tuo server.js
app.get('/my-orders', ensureAuthenticated, (req, res) => {
    try {
        const user = req.user;
        
        // Recupera vendite e noleggi dal database
        const sales = db.getAllSales ? db.getAllSales().filter(sale => sale.userId === user.id) : [];
        const rentals = db.getAllRentals ? db.getAllRentals().filter(rental => rental.userId === user.id) : [];
        
        
        // Formatta i dati per la visualizzazione
        const purchaseOrders = sales.map(sale => {
            return {
                orderId: sale.orderId || sale.id,
                date: new Date(sale.timestamp || Date.now()).toLocaleDateString('it-IT'),
                status: sale.status || 'completed',
                statusLabel: 'Completato', // O usa una funzione getStatusLabel
                total: sale.price,
                items: [
                    {
                        category: sale.product?.category || 'Abbigliamento',
                        brand: sale.product?.brand || 'Dressimify',
                        type: 'purchase'
                    }
                ]
            };
        });
        
        const rentalOrders = rentals.map(rental => {
            return {
                orderId: rental.orderId || rental.id,
                date: new Date(rental.timestamp || Date.now()).toLocaleDateString('it-IT'),
                status: rental.status || 'completed',
                statusLabel: 'Completato', // O usa una funzione getStatusLabel
                total: rental.price,
                items: [
                    {
                        category: rental.product?.category || 'Abbigliamento',
                        brand: rental.product?.brand || 'Dressimify',
                        type: 'rental',
                        startDate: rental.startDate ? new Date(rental.startDate).toLocaleDateString('it-IT') : '',
                        endDate: rental.endDate ? new Date(rental.endDate).toLocaleDateString('it-IT') : ''
                    }
                ]
            };
        });
        
        // Combina gli ordini e ordina per data (più recenti prima)
        const allOrders = [...purchaseOrders, ...rentalOrders].sort((a, b) => {
            return new Date(b.date.split('/').reverse().join('-')) - 
                   new Date(a.date.split('/').reverse().join('-'));
        });
        
        // Renderizza la pagina con i dati
        res.render('my-orders', {
            user: user,
            orders: allOrders
        });
    } catch (error) {
        console.error("Errore nel recupero degli ordini:", error);
        res.status(500).render('error', { message: 'Si è verificato un errore durante il recupero degli ordini.' });
    }
});

// Funzione helper per tradurre lo stato dell'ordine
function getStatusLabel(status) {
    const statusMap = {
        'completed': 'Completato',
        'processing': 'In elaborazione',
        'shipped': 'Spedito',
        'cancelled': 'Annullato',
        'approved': 'Approvato',
        'pending': 'In attesa',
        'rejected': 'Rifiutato'
    };
    
    return statusMap[status] || 'Sconosciuto';
}

// ===== CHAT ROUTES =====

/**
 * @swagger
 * /chat:
 *   get:
 *     summary: Visualizza la pagina della chat
 *     tags: [Chat]
 *     description: Mostra l'interfaccia della chat per comunicare con altri utenti
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pagina della chat
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 */
app.get('/chat', ensureAuthenticated, (req, res) => {
    // Ottieni l'utente corrente
    const currentUser = req.user || req.session.user;

    // Ottieni tutti gli utenti (per mostrare la lista)
    const allUsers = db.getAllUsers().filter(user => user.id !== currentUser.id);

    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * @swagger
 * /api/messages/{userId}:
 *   get:
 *     summary: Ottiene i messaggi di una conversazione
 *     tags: [Chat]
 *     description: Restituisce tutti i messaggi scambiati tra l'utente corrente e un altro utente
 *     security:
 *       - bearerAuth: []
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

// ===== ADMIN DASHBOARD ROUTES =====

/**
 * @swagger
 * /noleggi:
 *   get:
 *     summary: Visualizza tutti i noleggi (admin)
 *     tags: [Admin, Rentals]
 *     description: Mostra la lista di tutti i noleggi effettuati dagli utenti
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pagina con la lista dei noleggi
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
 */
app.get('/noleggi', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('admin/noleggi', { rentals: getAllRentals() });
});

/**
 * @swagger
 * /vendite:
 *   get:
 *     summary: Visualizza tutte le vendite (admin)
 *     tags: [Admin, Products]
 *     description: Mostra la lista di tutte le vendite effettuate
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pagina con la lista delle vendite
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
 */
app.get('/vendite', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('admin/vendite', { sales: getAllSales() });
});

/**
 * @swagger
 * /api/rentals:
 *   get:
 *     summary: Ottiene tutti i noleggi (admin)
 *     tags: [Admin, Rentals]
 *     description: Restituisce la lista di tutti i noleggi in formato JSON
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista dei noleggi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Rental'
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
 */
app.get('/api/rentals', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.json(getAllRentals());
});

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Ottiene tutte le vendite (admin)
 *     tags: [Admin, Products]
 *     description: Restituisce la lista di tutte le vendite in formato JSON
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista delle vendite
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sale'
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
 */
app.get('/api/sales', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.json(getAllSales());
});

/**
 * @swagger
 * /api/rentals/{id}/status:
 *   post:
 *     summary: Aggiorna lo stato di un noleggio (admin)
 *     tags: [Admin, Rentals]
 *     description: Permette all'amministratore di cambiare lo stato di un noleggio
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del noleggio da aggiornare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *                 description: Nuovo stato del noleggio
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Noleggio aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rental'
 *       400:
 *         description: Stato non valido
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
 *       404:
 *         description: Noleggio non trovato
 */
app.post('/api/rentals/:id/status', ensureAuthenticated, ensureAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status non valido' });
    }
    
    const updatedRental = updateRentalStatus(id, status);
    
    if (!updatedRental) {
        return res.status(404).json({ error: 'Aluguel não encontrado' });
    }
    
    res.json(updatedRental);
});

/**
 * @swagger
 * /api/sales/{id}/status:
 *   post:
 *     summary: Aggiorna lo stato di una vendita (admin)
 *     tags: [Admin, Products]
 *     description: Permette all'amministratore di cambiare lo stato di una vendita
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID della vendita da aggiornare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [processing, completed, refunded]
 *                 description: Nuovo stato della vendita
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Vendita aggiornata con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sale'
 *       400:
 *         description: Stato non valido
 *       401:
 *         description: Non autorizzato, richiede autenticazione
 *       403:
 *         description: Accesso non autorizzato, solo per amministratori
 *       404:
 *         description: Vendita non trovata
 */
app.post('/api/sales/:id/status', ensureAuthenticated, ensureAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status || !['processing', 'completed', 'refunded'].includes(status)) {
        return res.status(400).json({ error: 'Status non valido' });
    }
    
    const updatedSale = updateSaleStatus(id, status);
    
    if (!updatedSale) {
        return res.status(404).json({ error: 'Venda não encontrada' });
    }
    
    res.json(updatedSale);
});

// ===== SOCKET.IO CONFIGURATION =====

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

    next();
});

io.on('connection', (socket) => {
    // Associa l'utente al socket usando l'ID convertito in stringa
    const userId = socket.userId;

    // Usa sempre toString() per le chiavi della mappa
    connectedUsers.set(userId.toString(), socket.id);


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

        try {
            // Salva il messaggio nel database
            const message = await db.saveMessage(senderId, recipientIdInt, text);

            // Conferma al mittente che il messaggio è stato salvato
            socket.emit('message_saved', message);

            // Invia il messaggio al destinatario se è online
            const recipientSocketId = connectedUsers.get(recipientIdInt.toString());
            if (recipientSocketId) {
                socket.to(recipientSocketId).emit('private message', message);
            } else {
            }
        } catch (error) {
            socket.emit('message_error', { error: 'Errore nell\'invio del messaggio' });
        }
    });

    // Disconnessione con log migliorato
    socket.on('disconnect', () => {
        connectedUsers.delete(socket.userId.toString());

        // Notifica gli altri utenti della disconnessione
        socket.broadcast.emit('user_disconnected', socket.userId);
    });
});

// ===== SERVER STARTUP =====

// Start server
const port = 3000;
server.listen(port, () => console.log(`Server started on port ${port}. 
Vai su http://localhost:${port}.
Vai su http://localhost:${port}/api-docs per vedere la documentazione Swagger.`)); 