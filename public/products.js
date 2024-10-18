new Vue({
    el: '#app',
    data: {
        newProduct: {
            category: '',
            size: '',
            color: '',
            brand: '',
            condition: ''
        },
        products: []
    },
    methods: {
        addProduct() {
            if (this.newProduct.category && this.newProduct.size && this.newProduct.color && this.newProduct.brand && this.newProduct.condition) {
                this.products.push({ ...this.newProduct });
                this.resetForm();
            } else {
                alert('Per favore compila tutti i campi.');
            }
        },
        removeProduct(index) {
            this.products.splice(index, 1);
        },
        resetForm() {
            this.newProduct = {
                category: '',
                size: '',
                color: '',
                brand: '',
                condition: ''
            };
        }
    }
});
