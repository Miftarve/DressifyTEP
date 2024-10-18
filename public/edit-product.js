new Vue({
    el: '#app',
    data: {
        product: {
            id: '',
            category: '',
            size: '',
            color: '',
            brand: '',
            condition: ''
        }
    },
    methods: {
        fetchProduct() {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id');

            fetch(`/get-product/${productId}`)
                .then(response => response.json())
                .then(data => {
                    this.product = data.product; // Load product details into the form
                })
                .catch(err => alert('Errore nel recupero del prodotto: ' + err.message));
        },

        updateProduct() {
            fetch(`/update-product`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.product)
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                window.location.href = 'products.html'; // Redirect back to product list
            })
            .catch(err => alert('Errore: ' + err.message));
        },

        goBack() {
            window.location.href = 'products.html'; // Navigate back to product list
        }
    },
    mounted() {
        this.fetchProduct(); // Fetch product details on page load
    }
});
