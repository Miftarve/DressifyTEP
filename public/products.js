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
            images: []
        },
        products: []
    },
    methods: {
        loadProducts() {
            fetch('/api/products')
                .then(response => response.json())
                .then(data => {
                    this.products = data.products;
                    localStorage.setItem('products', JSON.stringify(data.products)); // Salva i dati nel Local Storage
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
                formData.append('images', image);
            });

            fetch('/products', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                this.loadProducts(); // Ricarica i prodotti e aggiorna il Local Storage
                this.resetForm();
            })
            .catch(err => alert('Errore nell\'aggiunta del prodotto: ' + err.message));
        },

        handleImageUpload(event) {
            const files = Array.from(event.target.files);
            this.newProduct.images = files.map((file, index) => {
                const fileName = `${this.newProduct.category.replace(/\s+/g, '_')}_${Date.now()}_${index}.jpg`;
                Object.defineProperty(file, 'name', { value: fileName, writable: false });
                return file;
            });
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
        },

        // Carica dati dal Local Storage se offline
        loadProductsFromLocalStorage() {
            const storedProducts = localStorage.getItem('products');
            if (storedProducts) {
                this.products = JSON.parse(storedProducts);
            }
        }
    },
    created() {
        if (navigator.onLine) {
            this.loadProducts();
        } else {
            this.loadProductsFromLocalStorage(); // Usa i dati locali se offline
        }
    }
});
