new Vue({
    el: '#userApp',
    data: {
        users: [],
        isOwner: false,
    },
    methods: {
        loadUsers() {
            fetch('http://localhost:3000/api/users')
                .then(response => response.json())
                .then(data => {
                    if (data && Array.isArray(data.users)) {
                        this.users = data.users.map(user => ({
                            ...user,
                            is_suspended: user.is_suspended || 0 // Assicura che il campo sia presente
                        }));
                    } else {
                        throw new Error('Formato dei dati non valido');
                    }
                })
                .catch(err => alert('Errore nel caricamento degli utenti: ' + err.message));
        },
                            

        suspendUser(userId) {
            fetch(`http://localhost:3000/api/users/suspend/${userId}`, {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                this.loadUsers(); // Ricarica gli utenti aggiornati
            })
            .catch(err => alert('Errore nella sospensione dell\'utente: ' + err.message));
        },        
        deleteUser(userId, index) {
            if (confirm("Sei sicuro di voler eliminare questo utente?")) {
                fetch(`http://localhost:3000/users/${userId}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Errore ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    alert(data.message);
                    this.users.splice(index, 1); // Aggiorna la lista locale
                })
                .catch(err => alert('Errore durante l\'eliminazione: ' + err.message));
            }
        },        
    },
    created() {
        const userEmail = localStorage.getItem('email');
        this.isOwner = userEmail && userEmail.endsWith('@dressify.com');
        this.loadUsers();
    }
});

