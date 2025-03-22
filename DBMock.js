const { dbConnection } = require('./database.js');
class DBMock {
    constructor() {
        // Inizializza gli utenti
        this.users = [
            { id: 1, username: 'miftar', email: 'miftar@gmail.com', nome: 'Miftar ', cognome: 'Veliqi', dataNascita: '31/07/2005', luogoNascita: 'Kosovo', ruolo: 'admin', password: '123456' },
            { id: 2, username: 'roccia', email: 'roccia@gmail.com', nome: 'Fabrizio ', cognome: 'Quarti', dataNascita: '02/04/2006', luogoNascita: 'Italia', ruolo: 'user', password: 'abcdef' },
            { id: 3, username: 'lucia83', email: 'lucia.bianchi@gmail.com', nome: 'Lucia', cognome: 'Bianchi', dataNascita: '15/03/1983', luogoNascita: 'Italia', ruolo: 'user', password: 'lucia2023' },
            { id: 4, username: 'marco_rossi', email: 'marco.rossi@gmail.com', nome: 'Marco', cognome: 'Rossi', dataNascita: '22/09/1990', luogoNascita: 'Italia', ruolo: 'user', password: 'rossi1234' },
            { id: 5, username: 'sofia_k', email: 'sofia.k@gmail.com', nome: 'Sofia', cognome: 'Kowalski', dataNascita: '07/12/1995', luogoNascita: 'Polonia', ruolo: 'moderator', password: 'sk2022!' },
            { id: 6, username: 'alex_tech', email: 'alessandro.t@gmail.com', nome: 'Alessandro', cognome: 'Tecchi', dataNascita: '18/06/1988', luogoNascita: 'Italia', ruolo: 'user', password: 'tech4ever' },
            { id: 7, username: 'carmen87', email: 'carmen.lopez@gmail.com', nome: 'Carmen', cognome: 'Lopez', dataNascita: '03/05/1987', luogoNascita: 'Spagna', ruolo: 'user', password: 'carmen123' }
        ];

        this.products = [
            { id: 1, category: 'Maglietta', size: 'S', color: 'Nera', brand: 'Nike', condition: 'Nuovo', price: 15 },
            { id: 2, category: 'Pantaloni', size: 'M', color: 'Blu', brand: 'Adidas', condition: 'Usato', price: 20 },
            { id: 3, category: 'Giacca', size: 'L', color: 'Verde', brand: 'Puma', condition: 'Nuovo', price: 150 },
            { id: 4, category: 'Camicia', size: 'M', color: 'Bianca', brand: 'Ralph Lauren', condition: 'Nuovo', price: 85 },
            { id: 5, category: 'Felpa', size: 'XL', color: 'Grigia', brand: 'Nike', condition: 'Usato', price: 35 },
            { id: 6, category: 'Jeans', size: 'S', color: 'Nero', brand: 'Levi\'s', condition: 'Nuovo', price: 70 },
            { id: 7, category: 'Abito', size: 'L', color: 'Blu scuro', brand: 'Armani', condition: 'Usato', price: 190 },
            { id: 8, category: 'Cappotto', size: 'M', color: 'Cammello', brand: 'Burberry', condition: 'Nuovo', price: 220 },
            { id: 9, category: 'Maglione', size: 'S', color: 'Rosso', brand: 'Tommy Hilfiger', condition: 'Usato', price: 45 },
            { id: 10, category: 'Scarpe', size: '42', color: 'Marrone', brand: 'Nike', condition: 'Nuovo', price: 120 },
            { id: 11, category: 'Bermuda', size: 'M', color: 'Beige', brand: 'Adidas', condition: 'Nuovo', price: 55 },
            { id: 12, category: 'Polo', size: 'L', color: 'Azzurra', brand: 'Fred Perry', condition: 'Usato', price: 40 },
            { id: 13, category: 'Giacca di pelle', size: 'XL', color: 'Nera', brand: 'Diesel', condition: 'Nuovo', price: 175 },
            { id: 14, category: 'Cardigan', size: 'M', color: 'Verde scuro', brand: 'Nike', condition: 'Usato', price: 30 },
            { id: 15, category: 'Gilet', size: 'S', color: 'Blu navy', brand: 'North Face', condition: 'Nuovo', price: 65 },
            { id: 16, category: 'T-shirt', size: 'M', color: 'Giallo', brand: 'Adidas', condition: 'Nuovo', price: 25 },
            { id: 17, category: 'Giacca sportiva', size: 'L', color: 'Rosso', brand: 'Puma', condition: 'Usato', price: 80 },
            { id: 18, category: 'Pantaloni eleganti', size: 'M', color: 'Grigio', brand: 'Armani', condition: 'Nuovo', price: 110 },
            { id: 19, category: 'Felpa con cappuccio', size: 'S', color: 'Nero', brand: 'Nike', condition: 'Nuovo', price: 60 },
            { id: 20, category: 'Scarpe da ginnastica', size: '39', color: 'Bianco', brand: 'Adidas', condition: 'Usato', price: 45 }
        ];

        // Inizializza le conversazioni (nuovo)
        this.conversations = {};

        this.userCounter = this.users.length ? this.users[this.users.length - 1].id + 1 : 1;
        this.productCounter = this.products.length ? this.products[this.products.length - 1].id + 1 : 4; // Assicurati che il contatore parta dal giusto ID per i nuovi prodotti
    }


    calculateRentalPrice(productId, days) {
        const product = this.getProductById(productId);
        if (!product) return null;
        return product.dailyRentalPrice * days;
    }

    // Ottieni tutti gli utenti
    getAllUsers() {
        return this.users.map(user => ({ ...user, password: undefined })); // Escludi la password
    }

    // Ottieni tutti i prodotti
    getAllProducts() {
        console.log('Tutti i prodotti:', this.products); // Debug per controllare i dati
        return this.products;
    }


    // Aggiungi un nuovo prodotto
    createProduct(product) {
        const newProduct = {
            id: this.productCounter++, // Incrementa il contatore per ID unico
            category: product.category,
            size: product.size,
            color: product.color,
            brand: product.brand,
            condition: product.condition,
            price: product.price
        };
        this.products.push(newProduct);
        return newProduct;
    }

    getAllProducts() {
        return this.products;
    }

    // Ottieni un prodotto per ID
    getProductById(id) {
        return this.products.find(product => product.id === id);
    }

    // Aggiorna un prodotto esistente
    updateProduct(id, updatedData) {
        const productIndex = this.products.findIndex(product => product.id === id);
        if (productIndex === -1) {
            return null; // Prodotto non trovato
        }
        this.products[productIndex] = { ...this.products[productIndex], ...updatedData };
        return this.products[productIndex];
    }


    // Elimina un prodotto
    deleteProduct(id) {
        const productIndex = this.products.findIndex(product => product.id === id);
        if (productIndex === -1) {
            return false;
        }
        this.products.splice(productIndex, 1);
        return true;
    }

    // Ottieni un utente per ID
    getUserById(id) {
        const user = this.users.find(user => user.id === id);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        return null;
    }

    // Crea un nuovo utente
    createUser({ nome, cognome, dataNascita, luogoNascita, ruolo, email, username, password }) {
        const newUser = {
            id: this.userCounter++,
            nome,
            cognome,
            dataNascita,
            luogoNascita,
            ruolo,
            email,
            username,
            password,
        };
        this.users.push(newUser);
        return newUser;
    }

    // Ottieni un utente per username
    getUserByUsername(identifier) {
        return this.users.find(user => user.username === identifier || user.email === identifier);
    }

    // Aggiorna un utente esistente
    updateUser(id, updates) {
        const user = this.users.find(user => user.id === id);
        if (!user) {
            return null;
        }
        if (updates.username) user.username = updates.username;
        if (updates.nome) user.nome = updates.nome;
        if (updates.ruolo) user.ruolo = updates.ruolo;
        if (updates.dataNascita) user.dataNascita = updates.dataNascita;
        if (updates.password) user.password = updates.password;
        return user;
    }

    // Elimina un utente
    deleteUser(id) {
        const userIndex = this.users.findIndex(user => user.id === id);
        if (userIndex === -1) {
            return false;
        }
        this.users.splice(userIndex, 1);
        return true;
    }

    // NUOVI METODI PER LE CONVERSAZIONI

    // Ottieni messaggi tra due utenti
    getConversation(user1Id, user2Id) {
        return new Promise((resolve, reject) => {
            // Query che ottiene i messaggi tra i due utenti
            const query = `
            SELECT * FROM messages 
            WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
            ORDER BY timestamp ASC
        `;

            dbConnection.all(query, [user1Id, user2Id, user2Id, user1Id], (err, rows) => {
                if (err) {
                    console.error('Errore nel recupero conversazione:', err);
                    return resolve([]); // In caso di errore, restituisci array vuoto
                }

                // Converte le righe del DB nel formato atteso dall'app
                const messages = rows.map(row => ({
                    senderId: row.sender_id,
                    recipientId: row.recipient_id,
                    text: row.text,
                    timestamp: row.timestamp,
                    isRead: row.is_read === 1
                }));

                resolve(messages);
            });
        });
    }

    // Per compatibilità con il codice esistente (funzione sincrona)
    getConversationSync(user1Id, user2Id) {
        // La versione sincrona restituisce un array vuoto, 
        // i dati verranno caricati asincronamente
        return [];
    }

    // Salva un messaggio nella conversazione
    saveMessage(senderId, recipientId, text) {
        const timestamp = new Date().toISOString();
        const message = {
            senderId: parseInt(senderId),
            recipientId: parseInt(recipientId),
            text,
            timestamp
        };

        // Inserisce il messaggio nel database
        dbConnection.run(
            `INSERT INTO messages (sender_id, recipient_id, text, timestamp) VALUES (?, ?, ?, ?)`,
            [senderId, recipientId, text, timestamp],
            (err) => {
                if (err) {
                    console.error('Errore nel salvataggio messaggio:', err);
                }
            }
        );

        return message; // Ritorna il messaggio per compatibilità
    }

    // Segna i messaggi come letti
    // Modifica solo alla funzione markMessagesAsRead
    // Versione con Promise
    markMessagesAsRead(senderId, recipientId) {
        return new Promise((resolve, reject) => {
            dbConnection.run(
                `UPDATE messages SET is_read = 1 WHERE sender_id = ? AND recipient_id = ? AND is_read = 0`,
                [senderId, recipientId],
                function (err) {
                    if (err) {
                        console.error('Errore nell\'aggiornamento dei messaggi letti:', err);
                        reject(err);
                    } else {
                        resolve({ updated: this.changes });
                    }
                }
            );
        });
    }
}


module.exports = DBMock;