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
            condition: ''
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
            if (this.newProduct.category && this.newProduct.size && this.newProduct.color && this.newProduct.brand && this.newProduct.condition) {
                this.products.push({ ...this.newProduct }); // Aggiunge il prodotto alla lista
                this.resetForm(); // Resetta il form
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
                condition: ''
            }; // Resetta i campi del form
        }
    }
});