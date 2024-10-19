new Vue({
    el: '#app',
    data: {
        products: [],
        cart: [],
        searchQuery: '',
        filterCondition: '',
        filterSize: '',
        sortBy: '',
        rentalDuration: 1,
        proposedPrice: 0,
        savedSearches: []
    },
    computed: {
        filteredProducts() {
            return this.products
                .filter(product => {
                    return (
                        (!this.filterCondition || product.condition === this.filterCondition) &&
                        (!this.filterSize || product.size === this.filterSize) &&
                        (product.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                        product.description.toLowerCase().includes(this.searchQuery.toLowerCase()))
                    );
                })
                .sort((a, b) => {
                    if (this.sortBy === 'price') {
                        return a.price - b.price;
                    } else if (this.sortBy === 'brand') {
                        return a.brand.localeCompare(b.brand);
                    }
                    return 0;
                });
        }
    },
    methods: {
        fetchProducts() {
            fetch('/products')
                .then(response => response.json())
                .then(data => {
                    this.products = data.products;
                })
                .catch(err => console.error('Errore:', err));
        },
        calculateRentalPrice(basePrice) {
            return (basePrice * this.rentalDuration * 0.1).toFixed(2); // 10% del prezzo base per giorno
        },
        rentProduct(product) {
            alert(`Hai noleggiato ${product.brand} per ${this.rentalDuration} giorni.`);
        },
        buyProduct(product) {
            alert(`Hai acquistato ${product.brand} per ${product.price}€.`);
        },
        proposePrice(product) {
            alert(`Hai proposto ${this.proposedPrice}€ per ${product.brand}.`);
        },
        addToCart(product) {
            this.cart.push(product);
        },
        removeFromCart(item) {
            this.cart = this.cart.filter(product => product.id !== item.id);
        },
        saveSearch() {
            const search = {
                query: this.searchQuery,
                condition: this.filterCondition,
                size: this.filterSize,
                sortBy: this.sortBy
            };
            this.savedSearches.push(search);
            alert('Ricerca salvata.');
        }
    },
    mounted() {
        this.fetchProducts();
    }
});
