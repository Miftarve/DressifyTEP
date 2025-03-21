class DBMock {
    constructor() {
        // Inizializza gli utenti
        this.users = [
            { id: 1, username: 'miftar', email: 'miftar@gmail.com', nome: 'Miftar ', cognome: 'Veliqi', dataNascita: '31/07/2005', luogoNascita: 'Kosovo', ruolo: 'admin', password: '123456' },
            { id: 2, username: 'roccia', email: 'roccia@gmail.com', nome: 'Fabrizio ', cognome: 'Quarti', dataNascita: '02/04/2006', luogoNascita: 'Italia', ruolo: 'user', password: 'abcdef' },
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
}

module.exports = DBMock;
