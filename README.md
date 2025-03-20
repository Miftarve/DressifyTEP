# Dressmify

## 🌟 Descrizione

**Dressmify** è una piattaforma innovativa che ti permette di affittare e comprare vestiti di marca usati. È un'opportunità unica per accedere a abiti di alta qualità a prezzi accessibili, oppure per noleggiare l'outfit perfetto per ogni occasione speciale. Dressmify combina la vendita e il noleggio, offrendo anche la possibilità di negoziare i prezzi in modo diretto, sempre con il massimo rispetto della privacy dei dati.

## ✨ Tagline

Una piattaforma digitale dedicata al noleggio e alla vendita di abbigliamento di marca di seconda mano.

## 🎯 Target
- Persone che amano la moda
- Chi fa fatica a decidere cosa mettersi
- Chi vuole provare nuovi stili
- Ragazzi e ragazze che cercano ispirazione

## 💡 Problema
DressifyTEP risolve problemi come:
- Non sapere cosa mettersi al mattino
- Ripetere sempre gli stessi outfit
- Comprare vestiti che poi non si abbinano con nulla
- Non sfruttare al massimo il proprio guardaroba

Con DressifyTEP, puoi facilmente trovare nuove combinazioni e idee per i tuoi outfit quotidiani.

## 🏆 Concorrenti
- Pureple
- Cladwell
- Stylebook
- Combyne
- Lookastic

## 🛠️ Tecnologie
- Frontend: HTML, Handlebars, JavaScript
- Stile: CSS/SCSS
- Backend: Node.js, Express
- Database: MongoDB/MySQL
- API: per gestire utenti e catalogo vestiti

## 🚀 Requisiti Iniziali

### Funzionalità principali per Dressmify:

- **Creazione Profilo Utente**:
  - Nome, cognome, email, data di nascita, luogo di nascita, password.

- **Caricamento Prodotti**:
  - Gli amministratori possono caricare prodotti per la vendita o il noleggio, con foto, descrizioni e prezzi.

- **Carrello**:
  - Aggiungi o rimuovi capi facilmente.

- **Sicurezza**:
  - Utilizzo di HTTPS per garantire la protezione online.
  - Massima trasparenza nella gestione della privacy dei dati.

- **Feedback**:
  - Gli utenti possono lasciare recensioni sui prodotti acquistati o noleggiati.

- **Interfaccia Utente**:
  - Semplice e professionale per esplorare, acquistare, vendere e noleggiare abiti.

- **Ricerca Avanzata**:
  - Filtra per categoria, marca, taglia, condizione e prezzo.

### Funzionalità Aggiuntive:

- **Pagamenti sicuri** tramite Stripe.
- **Gestione resi e reclami**.
- **Feedback e recensioni** per aumentare l'affidabilità.

## 🛠️ Requisiti Funzionali

- **Creazione e gestione del profilo utente**: Permette agli utenti di vendere, comprare e noleggiare abiti.
- **Ricerca avanzata e filtri**: Ricerca per nome, prezzo, taglia, marca, condizione.
- **Noleggio e acquisto diretto**: Scegli tra noleggio a lungo termine o acquisto diretto.
- **Contrattazione Prezzo**: Possibilità di negoziare il prezzo con il venditore.
- **Carrello**: Aggiungi e rimuovi capi.
- **Recensioni**: Gli utenti possono lasciare recensioni per migliorare la trasparenza e la qualità.

## ⚙️ Requisiti Non Funzionali

- **Prestazioni**: Supporto fino a 1.000 utenti senza rallentamenti.
- **Sicurezza**: HTTPS per proteggere i dati degli utenti.
- **Tempi di caricamento**: Le pagine devono essere caricate in meno di 2 secondi.
- **Scalabilità**: La piattaforma deve supportare un numero crescente di utenti e prodotti.
- **Usabilità**: Design intuitivo e facile da usare per tutti.

## 📥 Installazione e Configurazione

### 1. Clona il repository

```bash
git clone https://github.com/Miftarve/DressifyTEP.git
cd DressifyTEP
```

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Configura le chiavi OAuth

**IMPORTANTE: È necessario configurare le chiavi clientID e clientSecret nel file server.**

```javascript
const config = {
  clientID: 'IL_TUO_CLIENT_ID_QUI',
  clientSecret: 'IL_TUO_CLIENT_SECRET_QUI'
};
```

### 4. Avvia il progetto

Per avviare il progetto principale:
```bash
node server.js
```

Per avviare la pagina di chat:
```bash
node chat.js
```

### 6. Verifica l'installazione

```
http://localhost:3000
```

# Diagramma dei casi d'uso per Dressify
- Visualizza il diagramma dei casi d'uso: ![Casi d'Uso Dressify](https://yuml.me/mify/e4c6a5df.svg)

