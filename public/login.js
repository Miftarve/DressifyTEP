new Vue({
    el: '#app',
    data: {
        email: '',
        password: ''
    },
    // users.js
    loadUsers() {
        fetch('http://localhost:3000/api/users') // Usa localhost:3000 se è lì che gira il server
            .then(response => {
                if (!response.ok) {
                    throw new Error('Errore nel caricamento degli utenti');
                }
                return response.json();
            })
            .then(data => {
                this.users = data.users;
            })
            .catch(err => alert('Errore nel caricamento degli utenti: ' + err.message));
    },

    methods: {
        handleLogin() {
            const data = {
                email: this.email,
                password: this.password,
            };
    
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Salva il nome e l'email dell'utente nel localStorage
                        localStorage.setItem('utenteLoggato', JSON.stringify({ 
                            nome: data.userName, 
                            email: this.email 
                        }));
    
                        // Reindirizza in base al tipo di utente
                        if (this.email.endsWith('@dressify.com')) {
                            window.location.href = 'products.html';
                        } else {
                            window.location.href = 'noleggio-vendite.html';
                        }
                    } else {
                        alert(data.message); // Mostra il messaggio di errore
                    }
                })
                .catch(err => alert('Errore: ' + err.message));
        },
    }    
});
