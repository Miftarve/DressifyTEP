new Vue({
    el: '#userApp',
    data: {
        users: [],
        isOwner: false,
    },
    methods: {
        loadUsers() {
            fetch('http://localhost:3000/api/users')
                .then(response => {
                    if (!response.ok) {
                        // Lancia un errore con lo status del server per facilitare la diagnosi
                        throw new Error(`Errore ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data && data.users) {
                        this.users = data.users;
                    } else {
                        throw new Error('Formato della risposta non valido');
                    }
                })
                .catch(err => {
                    // Mostra un errore specifico con i dettagli del messaggio di errore
                    alert('Errore nel caricamento degli utenti: ' + err.message);
                });
        },
        
        removeUser(userId) {
            const requesterEmail = localStorage.getItem('email');
            if (!requesterEmail) {
                alert('Email del richiedente non trovata.');
                return;
            }
            fetch(`http://37.27.40.78:3000/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'x-user-email': requesterEmail,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Errore ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                alert(data.message);
                this.loadUsers();
            })
            .catch(err => alert('Errore nella rimozione dell\'utente: ' + err.message));
        },
        
    },
    created() {
        const userEmail = localStorage.getItem('email');
        this.isOwner = userEmail && userEmail.endsWith('@dressify.com');
        this.loadUsers();
    }
});
