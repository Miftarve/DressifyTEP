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
                alert(data.message);
                if (data.message === 'Login avvenuto con successo!') {
                    window.location.href = 'products.html'; // Reindirizza alla pagina dei prodotti
                }
            })
            .catch(err => alert('Errore: ' + err.message));
        }
    }
});
