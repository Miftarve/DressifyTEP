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
            fetch('http://37.27.40.78:3000/api/products')
                .then(response => {
                    console.log(response);
                    if (!response.ok) {
                        throw new Error('Errore nel caricamento dei prodotti');
                    }
                    return response.json();
                })
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
                headers: {
                    'Content-Type': 'application/json'
                },
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
    }
});
