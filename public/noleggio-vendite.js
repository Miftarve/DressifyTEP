new Vue({
    el: '.container',
    data: {
        products: [
            { id: 1, brand: 'Temperley London', category: 'Abito Lungo', size: '36', condition: 'Nuovo', price: 2295, image: 'path/to/image1.jpg' },
            { id: 2, brand: 'Ilkyaz Ozel', category: 'Abito Piume', size: '38', condition: 'Nuovo', price: 1000, image: 'path/to/image2.jpg' },
            { id: 3, brand: 'Badgley Mischka', category: 'Completo Velluto', size: '40', condition: 'Usato', price: 1177, image: 'path/to/image3.jpg' }
        ],
        cart: [],
        searchQuery: '',
        filterPrice: 2000,
        filterSize: '',
        sortBy: '',
        rentalDuration: 1,
        proposedPrice: 0
    },
    computed: {
        filteredProducts() {
            return this.products
                .filter(product => product.price <= this.filterPrice &&
                    (!this.filterSize || product.size === this.filterSize) &&
                    (product.brand.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                     product.category.toLowerCase().includes(this.searchQuery.toLowerCase())))
                .sort((a, b) => this.sortBy === 'price' ? a.price - b.price : a.brand.localeCompare(b.brand));
        }
    },
    methods: {
        calculateRentalPrice(price) {
            return (price * this.rentalDuration * 0.1).toFixed(2);
        },
        rentProduct(product) {
            alert(`Hai noleggiato ${product.brand} per ${this.rentalDuration} giorni.`);
        },
        buyProduct(product) {
            alert(`Hai acquistato ${product.brand} per ${product.price}€.`);
        },
        proposePrice(product) {
            alert(`Proposta inviata: ${this.proposedPrice}€ per ${product.brand}.`);
        },
        addToCart(product) {
            this.cart.push(product);
        },
        removeFromCart(item) {
            this.cart = this.cart.filter(p => p.id !== item.id);
        },
        saveSearch() {
            alert('Ricerca salvata con successo!');
        }
    },
    mounted() {
        this.fetchProducts();
    }
});
