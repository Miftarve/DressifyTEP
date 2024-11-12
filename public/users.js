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
                        throw new Error(`Errore ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Risposta ricevuta dal server:', data); // Log per verificare i dati
                    if (data && data.users) { // Verifica che "data" contenga "users"
                        this.users = data.users; // Assegna i dati degli utenti all'array "users"
                        console.log('Utenti caricati:', this.users); // Log per confermare il caricamento
                    } else {
                        throw new Error('Formato della risposta non valido');
                    }
                })
                .catch(err => {
                    alert('Errore nel caricamento degli utenti: ' + err.message);
                });
        },               

        suspendUser(userId) {
            const requesterEmail = localStorage.getItem('email');
            if (!requesterEmail) {
                alert('Email del richiedente non trovata.');
                return;
            }
            fetch(`http://localhost:3000/api/users/suspend/${userId}`, {
                method: 'POST',
                headers: {
                    'x-user-email': requesterEmail,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                this.loadUsers();
            })
            .catch(err => alert('Errore nella sospensione dell\'utente: ' + err.message));
        },

        deleteUser(userId, index) {
            if (confirm("Sei sicuro di voler eliminare questo utente?")) {
                // Elimina utente dal backend
                fetch(`/api/users/${userId}`, {
                    method: 'DELETE',
                })
                    .then(response => {
                        if (response.ok) {
                            // Elimina utente dalla lista locale
                            this.users.splice(index, 1);
                            alert("Utente eliminato con successo!");
                        } else {
                            alert("Errore durante l'eliminazione dell'utente.");
                        }
                    })
                    .catch(error => console.error("Errore nella richiesta:", error));
            }
        },
    },
    created() {
        const userEmail = localStorage.getItem('email');
        this.isOwner = userEmail && userEmail.endsWith('@dressify.com');
        this.loadUsers();
    }
});

