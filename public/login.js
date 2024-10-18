new Vue({
    el: '#app',
    data: {
        email: '',
        password: ''
    },
    methods: {
        handleLogin() {
            const data = {
                email: this.email,
                password: this.password
            };

            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = 'products.html'; // Reindirizza alla pagina dei prodotti
                } else {
                    alert(data.message); // Mostra il messaggio di errore
                }
            })
            .catch(err => alert('Errore: ' + err.message));
        }
    }
});
