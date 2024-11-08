new Vue({ 
    el: '#app',
    data: {
        newProduct: {
            category: '',
            size: '',
            color: '',
            brand: '',
            condition: '',
            price: ''
        },
        products: [],
        users: []  // Aggiunto array per gli utenti
    },
    methods: {
        loadProducts() {
            fetch('http://37.27.40.78:3000/api/products')
                .then(response => response.json())
                .then(data => {
                    this.products = data.products;
                })
                .catch(err => alert('Errore nel caricamento dei prodotti: ' + err.message));
        },
        
        addProduct() {
            if (!this.newProduct.price || isNaN(this.newProduct.price)) {
                alert('Per favore inserisci un prezzo valido.');
                return;
            }

            fetch('http://37.27.40.78:3000/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.newProduct)
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                this.loadProducts();
                this.resetForm();
            })
            .catch(err => alert('Errore nell\'aggiunta del prodotto: ' + err.message));
        },

        removeProduct(index) {
            const productId = this.products[index].id;
            fetch(`http://37.27.40.78:3000/products/${productId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                this.loadProducts();
            })
            .catch(err => alert('Errore nella rimozione del prodotto: ' + err.message));
        },

        editProduct(index) {
            const productId = this.products[index].id;
            window.location.href = `edit-product.html?id=${productId}`;
        },

        loadUsers() {
            fetch('http://37.27.40.78:3000/api/users')
                .then(response => response.json())
                .then(data => {
                    this.users = data.users;
                })
                .catch(err => alert('Errore nel caricamento degli utenti: ' + err.message));
        },

        viewUser(userId) {
            window.location.href = `user-details.html?id=${userId}`;  // Nuova pagina per visualizzare i dettagli utente
        },

        removeUser(userId) {
            fetch(`http://37.27.40.78:3000/users/${userId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                this.loadUsers(); // Ricarica la lista utenti
            })
            .catch(err => alert('Errore nella rimozione dell\'utente: ' + err.message));
        },

        resetForm() {
            this.newProduct = {
                category: '',
                size: '',
                color: '',
                brand: '',
                condition: '',
                price: ''
            };
        }
    },
    created() {
        this.loadProducts();
        this.loadUsers();  // Carica gli utenti all'inizio
    }
});
