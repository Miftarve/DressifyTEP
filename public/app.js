new Vue({
    el: '#app',
    data: {
        // Dati per la registrazione
        email: '',
        password: '',
        name: '',
        phone: '', // Aggiunta del campo numero di telefono
        nationality: '', // Aggiunta del campo nazionalità
        dob: '',

        // Dati per la gestione prodotti
        newProduct: {
            category: '',
            size: '',
            color: '',
            brand: '',
            condition: '',
            price: '' // Aggiungi il campo price qui
        },
        products: [] // Lista dei prodotti
    },
    methods: {
        // Funzione per gestire la registrazione degli utenti
        handleSubmit() {
            const data = {
                email: this.email,
                password: this.password,
                name: this.name,
                phone: this.phone, // Includi il numero di telefono
                nationality: this.nationality, // Includi la nazionalità
                dob: this.dob
            };

            // Log dei dati inviati
            console.log('Dati inviati:', data);

            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                // Log della risposta
                console.log('Risposta ricevuta:', data);

                alert(data.message);
                if (data.message === 'Registrazione avvenuta con successo!') {
                    this.email = this.password = this.name = this.phone = this.nationality = this.dob = ''; // Reset dei campi
                }
            })
            .catch(err => {
                // Log in caso di errore
                console.error('Errore:', err);
                alert('Errore: ' + err.message);
            });
        },

        // Funzione per aggiungere un nuovo prodotto
        addProduct() {
            // Logica per aggiungere un nuovo prodotto
        }
    }
});
