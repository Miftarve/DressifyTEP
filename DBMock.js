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
            { id: 3, category: 'Giacca', size: 'L', color: 'Verde', brand: 'Puma', condition: 'Nuovo', price: 150 }
        ];  // Aggiungi alcuni prodotti di esempio

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
    updateProduct(id, updates) {
        const product = this.products.find(product => product.id === id);
        if (!product) {
            return null;
        }
        if (updates.nome) product.nome = updates.nome;
        if (updates.descrizione) product.descrizione = updates.descrizione;
        if (updates.prezzo) product.prezzo = updates.prezzo;
        return product;
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
