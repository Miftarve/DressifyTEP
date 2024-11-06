new Vue({ 
    el: '#app',
    data: {
        newProduct: {
            category: '',
            size: '',
            color: '',
            brand: '',
            condition: '',
            price: '' // Aggiunto il campo price
        },
        products: []
    },    
    methods: {
        // Carica i prodotti esistenti dal server
        loadProducts() {
            fetch('http://37.27.40.78:3000/api/products')
                .then(response => {
                    console.log(response); // Log della risposta
                    if (!response.ok) {
                        throw new Error('Errore nel caricamento dei prodotti');
                    }
                    return response.json();
                })
                .then(data => {
                    this.products = data.products; // Aggiorna l'array dei prodotti con i dati ricevuti
                })
                .catch(err => alert('Errore nel caricamento dei prodotti: ' + err.message));
        },
        
        // Aggiunge un nuovo prodotto
        addProduct() {
            if (!this.newProduct.price || isNaN(this.newProduct.price)) {
                alert('Per favore inserisci un prezzo valido.');
                return;
            }

            fetch('http://37.27.40.78:3000/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.newProduct)
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                this.loadProducts(); // Ricarica i prodotti dopo aver aggiunto uno nuovo
                this.resetForm();
            })
            .catch(err => alert('Errore nell\'aggiunta del prodotto: ' + err.message));
        },

        // Rimuove un prodotto
        removeProduct(index) {
            const productId = this.products[index].id; // Assicurati che ci sia un ID per il prodotto
            fetch(`http://37.27.40.78:3000/products/${productId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                this.loadProducts(); // Ricarica i prodotti dopo aver rimosso uno
            })
            .catch(err => alert('Errore nella rimozione del prodotto: ' + err.message));
        },

        // Modifica un prodotto e reindirizza alla pagina di modifica
        editProduct(index) {
            const productId = this.products[index].id; // Ottieni l'ID del prodotto
            window.location.href = `edit-product.html?id=${productId}`; // Reindirizza alla pagina di modifica
        },

        // Resetta il modulo di input per l'aggiunta di nuovi prodotti
        resetForm() {
            this.newProduct = {
                category: '',
                size: '',
                color: '',
                brand: '',
                condition: '',
                price: '' // Resetta anche il campo price
            };
        }
    },

    // Chiama loadProducts quando il componente è creato per caricare i dati iniziali
    created() {
        this.loadProducts();
    }
});