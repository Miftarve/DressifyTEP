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
            images: [] // Campo per le immagini multiple
        },
        products: []
    },
    methods: {
        loadProducts() {
            fetch('/api/products')
                .then(response => response.json())
                .then(data => {
                    this.products = data.products;
                });
        },
        
        addProduct() {
            if (!this.newProduct.price || isNaN(this.newProduct.price)) {
                alert('Per favore inserisci un prezzo valido.');
                return;
            }

            const formData = new FormData();
            formData.append('category', this.newProduct.category);
            formData.append('size', this.newProduct.size);
            formData.append('color', this.newProduct.color);
            formData.append('brand', this.newProduct.brand);
            formData.append('condition', this.newProduct.condition);
            formData.append('price', this.newProduct.price);

            this.newProduct.images.forEach((image, index) => {
                formData.append(`images`, image);
            });

            fetch('/products', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                this.loadProducts();
                this.resetForm();
            })
            .catch(err => alert('Errore nell\'aggiunta del prodotto: ' + err.message));
        },

        handleImageUpload(event) {
            this.newProduct.images = Array.from(event.target.files); // Gestisce immagini multiple
        },

        resetForm() {
            this.newProduct = {
                category: '',
                size: '',
                color: '',
                brand: '',
                condition: '',
                price: '',
                images: []
            };
        }
    },
    created() {
        this.loadProducts();
    }
});
