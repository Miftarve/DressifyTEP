new Vue({
    el: '.container',
    data: {
        searchQuery: '',
        filterPrice: 500,
        filterSize: '',
        sortBy: 'price',
        rentalDuration: 1,
        proposedPrice: 0,
        cart: [],
        cartVisible: false,
    },
    methods: {
        toggleCart() {
            this.cartVisible = !this.cartVisible;
        },
        addToCart(product) {
            this.cart.push(product);
        },
        removeFromCart(item) {
            this.cart = this.cart.filter(p => p !== item);
        }
    },
    mounted() {
        this.fetchProducts();
    }
});
