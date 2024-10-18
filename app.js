new Vue({
    el: '#app',
    data: {
        email: '',
        password: '',
        name: '',
        dob: ''
    },
    methods: {
        handleSubmit() {
            const data = {
                email: this.email,
                password: this.password,
                name: this.name,
                dob: this.dob
            };

            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                if (data.message === 'Registrazione avvenuta con successo!') {
                    this.email = this.password = this.name = this.dob = '';
                }
            })
            .catch(err => alert('Errore: ' + err.message));
        }
    }
});
