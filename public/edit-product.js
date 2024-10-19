new Vue({
    el: '#app',
    data: {
        product: {
            id: '',
            category: '',
            size: '',
            color: '',
            brand: '',
            condition: '',
            price: '' // Aggiunto campo prezzo
        }
    },
    methods: {
        fetchProduct() {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id');

            console.log(`Fetching product with ID: ${productId}`);

            fetch(`/get-product/${productId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Prodotto non trovato');
                    }
                    return response.json();
                })
                .then(data => {
                    this.product = data.product; // Carica i dettagli del prodotto nel modulo
                })
                .catch(err => alert('Errore nel recupero del prodotto: ' + err.message));
        },

        updateProduct() {
            // Aggiungi " euro" al prezzo prima di inviare al server
            this.product.price = `${this.product.price} euro`; 
        
            fetch(`/products/${this.product.id}`, { // Modificato l'endpoint
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.product)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Errore durante l\'aggiornamento del prodotto');
                }
                return response.json();
            })
            .then(data => {
                alert(data.message);
                window.location.href = 'products.html'; // Reindirizza alla lista dei prodotti
            })
            .catch(err => alert('Errore: ' + err.message));
        },        

        goBack() {
            window.location.href = 'products.html'; // Torna alla lista dei prodotti
        }
    },
    mounted() {
        this.fetchProduct(); // Recupera i dettagli del prodotto al caricamento della pagina
    }
});
