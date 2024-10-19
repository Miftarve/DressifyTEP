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
                    // Controlla se l'email termina con "@dressify.com"
                    if (this.email.endsWith('@dressify.com')) {
                        window.location.href = 'products.html'; // Reindirizza alla pagina prodotti
                    } else {
                        window.location.href = 'noleggio-vendite.html'; // Reindirizza alla pagina noleggio-vendite
                    }
                } else {
                    alert(data.message); // Mostra il messaggio di errore
                }
            })
            .catch(err => alert('Errore: ' + err.message));
        }
    }
});
