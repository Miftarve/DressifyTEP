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
        products: []
    },
    methods: {
        loadProducts() {
            console.log('Caricamento prodotti...');
            fetch('http://37.27.40.78:3000/api/products')
                .then(response => {
                    console.log('Risposta del server:', response);
                    if (!response.ok) {
                        throw new Error('Errore nel caricamento dei prodotti');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Prodotti ricevuti:', data);
                    this.products = data.products;
                })
                .catch(err => console.error('Errore nel caricamento dei prodotti:', err));
        },
    
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
            .then(response => {
                console.log('Risposta del server:', response);
                return response.json();
            })
            .then(data => {
                alert(data.message);
                this.loadProducts();
                this.resetForm();
            })
            .catch(err => alert('Errore nell\'aggiunta del prodotto: ' + err.message));
        },        
               
    
        removeProduct(index) {
            const productId = this.products[index].id;
            console.log('Rimozione prodotto con ID:', productId);
            fetch(`http://37.27.40.78:3000/products/${productId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                console.log('Risposta server per rimozione:', data);
                alert(data.message);
                this.loadProducts();
            })
            .catch(err => console.error('Errore nella rimozione del prodotto:', err));
        },
    
        editProduct(index) {
            const productId = this.products[index].id;
            console.log('Modifica prodotto con ID:', productId);
            window.location.href = `edit-product.html?id=${productId}`;
        },
    
        resetForm() {
            console.log('Reset modulo aggiunta prodotto.');
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
    }
});
