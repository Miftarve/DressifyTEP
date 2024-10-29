new Vue({
    el: '#app',
    data: {
        newProduct: {
            category: '',
            size: '',
            color: '',
            brand: '',
            condition: '',
            price: '',
            image: '' // Campo per l'immagine del prodotto
        },
        products: []
    },    
    methods: {
        // Carica i prodotti esistenti dal server
        loadProducts() {
            fetch('/api/products')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Errore nel caricamento dei prodotti');
                    }
                    return response.json();
                })
                .then(data => {
                    this.products = data.products; // Aggiorna l'array dei prodotti
                })
                .catch(err => alert('Errore nel caricamento dei prodotti: ' + err.message));
        },
        
        // Aggiunge un nuovo prodotto
        addProduct() {
            if (!this.newProduct.price || isNaN(this.newProduct.price)) {
                alert('Per favore inserisci un prezzo valido.');
                return;
            }
            if (!this.newProduct.category || !this.newProduct.size || !this.newProduct.color || 
                !this.newProduct.brand || !this.newProduct.condition || !this.newProduct.price) {
                alert("Tutti i campi sono obbligatori.");
                return; // Esci se ci sono campi vuoti
            }

            this.products.push({...this.newProduct});
            this.newProduct = {};
            
            const formData = new FormData(); // Usato per caricare file
            formData.append('category', this.newProduct.category);
            formData.append('size', this.newProduct.size);
            formData.append('color', this.newProduct.color);
            formData.append('brand', this.newProduct.brand);
            formData.append('condition', this.newProduct.condition);
            formData.append('price', this.newProduct.price);
            formData.append('image', this.newProduct.image); // Aggiungi immagine

            fetch('/products', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                this.loadProducts(); // Ricarica i prodotti dopo l'aggiunta
                this.resetForm();
            })
            .catch(err => alert('Errore nell\'aggiunta del prodotto: ' + err.message));
        },

        // Rimuove un prodotto
        removeProduct(index) {
            const productId = this.products[index].id; // Assicurati che ci sia un ID per il prodotto
            fetch(`/products/${productId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                this.loadProducts(); // Ricarica i prodotti dopo la rimozione
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
                price: '',
                image: '' // Resetta anche il campo immagine
            };
        },

        // Funzione per caricare l'immagine
        handleImageUpload(event) {
            this.newProduct.image = event.target.files[0]; // Salva il file dell'immagine
        }
    },

    // Chiama loadProducts quando il componente è creato per caricare i dati iniziali
    created() {
        this.loadProducts();
    }
});
