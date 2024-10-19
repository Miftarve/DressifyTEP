new Vue({
    el: '#app',
    data: {
        newProduct: {
            category: '',
            size: '',
            color: '',
            brand: '',
            condition: '',
            price: '' // Aggiungi il campo price qui
        },
        products: []
    },    
    methods: {
        loadProducts() {
            fetch('/products')
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
        addProduct() {
            fetch('/products', {
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
        removeProduct(index) {
            const productId = this.products[index].id; // Assicurati che ci sia un ID per il prodotto
            fetch(`/products/${productId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                this.loadProducts(); // Ricarica i prodotti dopo aver rimosso uno
            })
            .catch(err => alert('Errore nella rimozione del prodotto: ' + err.message));
        },
        editProduct(index) {
            const productId = this.products[index].id; // Ottieni l'ID del prodotto
            window.location.href = `edit-product.html?id=${productId}`; // Reindirizza alla pagina di modifica
        },
        resetForm() {
            this.newProduct = {
                category: '',
                size: '',
                color: '',
                brand: '',
                condition: ''
            }; // Resetta i campi del form
        }
    },
    created() {
        this.loadProducts(); // Chiama loadProducts quando il componente è creato
    }
});
