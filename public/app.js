Vue({
    el: '#app',
    data: {
        // Dati per la registrazione
        email: '',
        password: '',
        name: '',
        dob: '',

        // Dati per la gestione prodotti
        newProduct: {
            category: '',
            size: '',
            color: '',
            brand: '',
            condition: '',
            price: '' // Aggiungi il campo price qui
        },
        products: [] // Lista dei prodotti
    },
    methods: {
        // Funzione per gestire la registrazione degli utenti
        handleSubmit() {
            const data = {
                email: this.email,
                password: this.password,
                name: this.name,
                dob: this.dob
            };

            // Log dei dati inviati
            console.log('Dati inviati:', data);

            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                // Log della risposta
                console.log('Risposta ricevuta:', data);

                alert(data.message);
                if (data.message === 'Registrazione avvenuta con successo!') {
                    this.email = this.password = this.name = this.dob = '';
                }
            })
            .catch(err => {
                // Log in caso di errore
                console.error('Errore:', err);
                alert('Errore: ' + err.message);
            });
        },

        // Funzione per aggiungere un nuovo prodotto
        addProduct() {
            if (this.newProduct.category && this.newProduct.size && this.newProduct.color && this.newProduct.brand && this.newProduct.condition && this.newProduct.price) { // Includi il controllo per il prezzo
                this.products.push({ ...this.newProduct }); // Aggiunge il prodotto alla lista

                // Invia i dati al backend per salvarli nel database
                fetch('/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.newProduct) // Invia anche il prezzo
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Prodotto aggiunto:', data);
                    this.resetForm(); // Resetta il form
                })
                .catch(err => {
                    console.error('Errore:', err);
                });
            } else {
                alert('Per favore compila tutti i campi.');
            }
        },

        // Funzione per rimuovere un prodotto dalla lista
        removeProduct(index) {
            this.products.splice(index, 1); // Rimuove il prodotto dalla lista
        },

        // Funzione per resettare il form della gestione prodotti
        resetForm() {
            this.newProduct = {
                category: '',
                size: '',
                color: '',
                brand: '',
                condition: '',
                price: '' // Resetta anche il campo del prezzo
            }; // Resetta i campi del form
        }
    }
});
