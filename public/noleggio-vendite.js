new Vue({
    el: '.container',
    data: {
        products: [],
        searchQuery: '',
        filterPrice: 500,
        displayedPrice: 500,
        filterSize: '',
        sortBy: 'price',
        rentalDuration: 1,
        proposedPrice: 0,
        cart: [],
        cartVisible: false,
    },
    computed: {
        filteredProducts() {
            let filtered = this.products;

            // Filtra per nome o descrizione
            if (this.searchQuery) {
                filtered = filtered.filter(product =>
                    product.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    product.description.toLowerCase().includes(this.searchQuery.toLowerCase())
                );
            }

            // Filtra per prezzo massimo
            filtered = filtered.filter(product => product.price <= this.filterPrice);

            // Filtra per taglia
            if (this.filterSize) {
                filtered = filtered.filter(product => product.size === this.filterSize);
            }

            // Ordina i prodotti
            if (this.sortBy === 'price') {
                filtered.sort((a, b) => a.price - b.price);
            } else if (this.sortBy === 'brand') {
                filtered.sort((a, b) => a.brand.localeCompare(b.brand));
            } else if (this.sortBy === 'condition') {
                filtered.sort((a, b) => a.condition.localeCompare(b.condition));
            }

            return filtered;
        }
    },
    methods: {
        updatePrice() {
            this.displayedPrice = this.filterPrice; // Aggiorna il prezzo mostrato
        },
        fetchProducts() {
            fetch('/api/products')  // Assumi che esista un endpoint API per recuperare i prodotti
                .then(response => response.json())
                .then(data => {
                    this.products = data;
                })
                .catch(error => console.error('Errore:', error));
        },
        rentProduct(product) {
            alert(`Hai noleggiato ${product.name} per ${this.rentalDuration} giorni.`);
        },
        buyProduct(product) {
            alert(`Hai comprato ${product.name}.`);
        },
        proposePrice(product) {
            alert(`Hai proposto ${this.proposedPrice} € per ${product.name}.`);
        }
    },
    mounted() {
        this.fetchProducts();
    }
});
