# Dressify


# Descrizione  
Dressify è una piattaforma digitale dedicata al noleggio e alla vendita di abbigliamento di marca di seconda mano. Permette agli utenti di scoprire e acquistare capi di alta qualità a prezzi accessibili, oppure di noleggiare vestiti per occasioni speciali. Dressify semplifica la gestione dei prodotti, la selezione di categorie, e il processo di acquisto e noleggio, offrendo un’esperienza completa per chi cerca abbigliamento di qualità a prezzi vantaggiosi.

# Tag line
Una piattaforma digitale dedicata al noleggio e alla vendita di abbigliamento di marca di seconda mano. 

# Target
- Appassionati di moda in cerca di capi di marca a prezzi accessibili
- Utenti interessati al noleggio di vestiti per eventi
- Venditori e acquirenti di abbigliamento usato di marca

# Problema  
Dressify risolve il problema della disponibilità di abbigliamento di marca a prezzi accessibili, e facilita l’accesso al noleggio per eventi speciali.

# Competitor  
- Vinted
- Depop
- The RealReal
- ThredUp
- Poshmark

# Tecnologie
- **Frontend**: HTML, CSS, Vue.js
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **API**: RESTful API per la gestione degli utenti, prodotti e transazioni

# Requisiti iniziali 
**Funzionalità Utente**:
Registrazione:Creare un account con nome, cognome, numero di telefono, età, email e password.
Login: email e password.
**Gestione Prodotti**:
Categorie: Suddividere i vestiti in gruppi (es. giacche, accessori).
Dettagli: Mostrare taglia, colore, marca e condizione (nuovo/usato).
**Noleggio e Vendita**:
Noleggio: Selezionare la durata del noleggio e calcolare il prezzo automaticamente.
Acquisto: Opzione per comprare i vestiti direttamente.
Contrattazione: Invio di proposte di prezzo ai venditori.
**Ricerca e Filtri**:
Ricerca: Trovare capi per nome o descrizione.
Filtri: Ordinare per prezzo, taglia, marca e condizioni.
Salvataggio: Possibilità di salvare le ricerche preferite.
**Carrello**:
Carrello: Aggiungere o rimuovere capi facilmente.
**Sicurezza**:
Protezione Dati: Usare HTTPS per la sicurezza online.
Privacy: Chiarezza sulle politiche di gestione dei dati.
**Feedback**:
Recensioni: Gli utenti possono lasciare valutazioni sui prodotti.

### Funzionalità - Raccolta dei Requisiti per Dressify

#### 1. Requisiti di Dominio
# 1.1. Tipi di Utenti
- **Acquirenti**: Utenti che acquistano capi di seconda mano o noleggiano abbigliamento per eventi.
- **Venditori**: Utenti che pubblicano capi in vendita o disponibili per noleggio.
  
# 1.2. Struttura del Profilo
- **Profilo Utente**: Nome, cognome, numero di telefono, età, email, e password.

# 1.3. Prodotti
- **Categorie di Prodotti**: Giacche, accessori, ecc.
- **Dettagli del Prodotto**: Taglia, colore, marca, e condizione (nuovo/usato).

#### 2. Requisiti Funzionali
# 2.1. Creazione del Profilo Utente 
**Descrizione**: Gli utenti possono creare un profilo per vendere o acquistare capi.  
Tipo: Funzionale  

# 2.2. Ricerca e Filtri  
**Descrizione**: Gli utenti possono cercare capi per nome o descrizione, e filtrare per prezzo, taglia, marca e condizione.  
Tipo: Funzionale  

# 2.3. Noleggio di Prodotti
**Descrizione**: Gli utenti possono noleggiare capi selezionando la durata e visualizzando il prezzo calcolato.  
Tipo: Funzionale  

# 2.4. Acquisto Diretto  
**Descrizione**: Gli utenti hanno l'opzione di comprare i vestiti direttamente.  
Tipo: Funzionale  

# 2.5. Contrattazione Prezzo  
**Descrizione**: Gli utenti possono proporre un prezzo al venditore.  
Tipo: Funzionale  

# 2.6. Carrello  
**Descrizione**: Aggiunta e rimozione dei prodotti dal carrello.  
Tipo: Funzionale  

# 2.7. Recensioni e Feedback  
**Descrizione**: Gli utenti possono lasciare recensioni sui capi acquistati o noleggiati.  
Tipo: Funzionale  

#### 3. Requisiti Non Funzionali
# 3.1. Prestazioni  
**Descrizione**: Supporto fino a 1.000 utenti simultanei senza rallentamenti.  
Tipo: Non Funzionale  

# 3.2. Sicurezza dei Dati  
**Descrizione**: HTTPS per la protezione dei dati degli utenti.  
Tipo: Non Funzionale  

# 3.3. Interfaccia Responsive  
**Descrizione**: Ottimizzata per dispositivi mobili, tablet e desktop.  
Tipo: Funzionale  

# 3.4. Usabilità  
**Descrizione**: Interfaccia intuitiva e semplice per la gestione dei prodotti e la navigazione.  
Tipo:Funzionale  

# 3.5. Scalabilità  
**Descrizione**: Il sistema deve essere in grado di supportare un numero crescente di utenti e prodotti.  
Tipo: Non Funzionale

# Diagramma dei casi d'uso per Dressify
- Visualizza il diagramma dei casi d'uso: ![Casi d'Uso Dressify](https://yuml.me/mifty/mifty.svg)

