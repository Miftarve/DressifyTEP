# Dressify


# Descrizione  
Dressify è una piattaforma online per noleggiare e comprare abbigliamento di marca usato. Gli utenti possono trovare e acquistare vestiti di qualità a prezzi accessibili o noleggiare abiti per eventi speciali. Dressify rende facile gestire i prodotti, scegliere le categorie e fare acquisti o noleggi.

# Tag line
Una piattaforma digitale dedicata al noleggio e alla vendita di abbigliamento di marca di seconda mano. 

# Target
Persone appassionate di moda che cercano vestiti di marca a buon prezzo.
Utenti che vogliono noleggiare vestiti per eventi.
Venditori e acquirenti di abbigliamento usato di marca.
Problema
Dressify risolve il problema di trovare abbigliamento di marca a prezzi accessibili e rende più semplice noleggiare vestiti per eventi speciali.

# Competitor
Vinted

Depop

The RealReal

ThredUp

Poshmark

# Tecnologie
**Frontend**: HTML, CSS, Vue.js

**Backend**: Node.js, Express.js

**Database**: SQLite

**API**: RESTful API per gestire utenti, prodotti e transazioni.

# Requisiti iniziali

**Funzionalità Utente**:

**Registrazione**:Creare un account con nome, cognome, numero di telefono, età, email e password.

**Login**: email e password.

**Gestione Prodotti**:

**Categorie**: Suddividere i vestiti in gruppi (es. giacche, accessori).

**Dettagli**: Mostrare taglia, colore, marca e condizione (nuovo/usato).

**Noleggio e Vendita**:

**Noleggio**: Selezionare la durata del noleggio e calcolare il prezzo automaticamente.

**Acquisto**: Opzione per comprare i vestiti direttamente.

**Contrattazione**: Invio di proposte di prezzo ai venditori.

**Ricerca e Filtri**:

**Ricerca**: Trovare capi per nome o descrizione.

**Filtri**: Ordinare per prezzo, taglia, marca e condizioni.

**Salvataggio**: Possibilità di salvare le ricerche preferite.

**Carrello**:

**Carrello**: Aggiungere o rimuovere capi facilmente.

**Sicurezza**:

**Protezione Dati**: Usare HTTPS per la sicurezza online.

**Privacy**: Chiarezza sulle politiche di gestione dei dati.

**Feedback**:

**Recensioni**: Gli utenti possono lasciare valutazioni sui prodotti.


# Funzionalità - Raccolta dei Requisiti per Dressify
# 1. Requisiti di Dominio

**1.1. Tipi di Utenti**
**Acquirenti**: Utenti che comprano vestiti usati o noleggiano abbigliamento.

**Venditori**: Utenti che pubblicano vestiti in vendita o per noleggio.

**1.2. Struttura del Profilo**
**Profilo Utente**: Nome, cognome, numero di telefono, età, email e password.

**1.3. Prodotti**
**Categorie di Prodotti**: Giacche, accessori, ecc.

**Dettagli del Prodotto**: Taglia, colore, marca e condizione (nuovo/usato).

# 2. Requisiti Funzionali

**2.1. Creazione del Profilo Utente**
**Descrizione**: Gli utenti possono creare un profilo per vendere o comprare.

**Tipo**: Funzionale

**2.2. Ricerca e Filtri**
**Descrizione**: Gli utenti possono cercare vestiti per nome e filtrare per prezzo, taglia, marca e condizione.

**Tipo**: Funzionale

**2.3. Noleggio di Prodotti**
**Descrizione**: Gli utenti possono noleggiare vestiti scegliendo la durata e vedendo il prezzo.

**Tipo**: Funzionale

**2.4. Acquisto Diretto**
**Descrizione**: Gli utenti possono comprare i vestiti direttamente.

**Tipo**: Funzionale

**2.5. Contrattazione Prezzo**
**Descrizione**: Gli utenti possono proporre un prezzo al venditore.

**Tipo**: Funzionale

**2.6. Carrello**
**Descrizione**: Aggiungere e rimuovere prodotti dal carrello.

**Tipo**: Funzionale

**2.7. Recensioni e Feedback**
**Descrizione**: Gli utenti possono lasciare recensioni sui prodotti.

**Tipo**: Funzionale

# 3. Requisiti Non Funzionali
**3.1. Prestazioni**
**Descrizione**: Supporto fino a 1.000 utenti senza rallentamenti.

**Tipo**: Non Funzionale

**3.2. Sicurezza dei Dati**
**Descrizione**: Usare HTTPS per proteggere i dati degli utenti.

**Tipo**: Non Funzionale

**3.3. Interfaccia Responsive**
**Descrizione**: Ottimizzata per dispositivi mobili, tablet e computer.

**Tipo**: Funzionale

**3.4. Usabilità**
**Descrizione**: Interfaccia semplice e intuitiva per gestire i prodotti.

**Tipo**: Funzionale

**3.5. Scalabilità**
**Descrizione**: Il sistema deve gestire un numero crescente di utenti e prodotti.

**Tipo**: Non Funzionale

# Diagramma dei casi d'uso per Dressify
- Visualizza il diagramma dei casi d'uso: ![Casi d'Uso Dressify](http://yuml.me/mify/ildiagrammadelmifty.svg)

# REGISTRAZIONE
**Metodo register**


app.post('/register', async (req, res) => {

    const { name, email, password, dob, phone, nationality } = req.body; // Includi i nuovi campi
    
    if (!name || !email || !password || !dob || !phone || !nationality) { // Verifica che tutti i campi siano presenti
    
        return res.status(400).json({ message: 'Tutti i campi sono obbligatori' });
        
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            `INSERT INTO users (name, email, password, dob, phone, nationality) VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, dob, phone, nationality], // Includi i nuovi campi qui
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ message: 'Email già in uso' });
                    } else {
                        return res.status(500).json({ message: 'Errore durante la registrazione' });
                    }
                }
                res.status(200).json({ message: 'Registrazione avvenuta con successo!' });
            }
        );
    } catch (error) {
        res.status(500).json({ message: 'Errore nel server', error });
    }
});

**PROVA DATI**

{

  "name": "Mario Rossi",
  
  "email": "mario.rossi@example.com",
  
  "password": "Password123",
  
  "dob": "1990-01-01",
  
  "phone": "+391234567890",
  
  "nationality": "Italian"
  
}

**RISPOSTA**

{

  "message": "Registrazione avvenuta con successo!"
  
}
# LOGIN

**Metodo Login**


app.post('/login', (req, res) => {

    const { email, password } = req.body;
    
    if (!email || !password) {
    
        return res.status(400).json({ success: false, message: 'Email e password sono obbligatorie.' });
        
    }

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Errore nel server.' });
        }
        if (!row) {
            return res.status(401).json({ success: false, message: 'Email o password errati.' });
        }

        const match = await bcrypt.compare(password, row.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Email o password errati.' });
        }

        res.status(200).json({ success: true, message: 'Login avvenuto con successo!' });
    });
});

**PROVA DATI**
{

  "email": "mario.rossi@example.com",
  
  "password": "Password123"
  
}

**RISPOSTA**

{

  "success": true,
  
  "message": "Login avvenuto con successo!"
  
}

