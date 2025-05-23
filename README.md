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
  
# Diagramma dei casi d'uso per Dressify
 - Visualizza il diagramma dei casi d'uso: ![Casi d'Uso Dressify](https://yuml.me/mify/e4c6a5df.svg)

# Guida all'Installazione di DressifyTEP con Docker

Questa guida spiega come configurare e avviare l'applicazione DressifyTEP utilizzando Docker su vari sistemi operativi e su GitHub Codespaces.

## Prerequisiti

Prima di iniziare, assicurati di avere quanto segue:

- Un computer con sistema operativo Windows, Linux o macOS
- Docker e Docker Compose installati (vedi le istruzioni di installazione più avanti)

## 📥 Installazione di Docker

### Windows
1. Scarica Docker Desktop:
   - Visita la [pagina di Docker Desktop per Windows](https://www.docker.com/products/docker-desktop)
   - Scarica l'installer
2. Installa Docker:
   - Esegui l'installer scaricato e segui le istruzioni
   - Dopo l'installazione, Docker dovrebbe avviarsi automaticamente
3. Verifica l'Installazione:
   - Apri il Prompt dei comandi ed esegui: `docker --version`
   - Dovresti vedere la versione di Docker stampata nel terminale

### macOS
1. Scarica Docker Desktop:
   - Visita la [pagina di Docker Desktop per Mac](https://www.docker.com/products/docker-desktop)
   - Scarica l'installer
2. Installa Docker:
   - Apri il file scaricato e trascina l'icona di Docker nella cartella Applicazioni
   - Avvia Docker dalle Applicazioni
3. Verifica l'Installazione:
   - Apri il Terminale ed esegui: `docker --version`
   - Il comando dovrebbe restituire la versione installata di Docker

### Linux (Ubuntu)
1. Aggiorna il Database dei Pacchetti:
   ```
   sudo apt update
   ```
2. Installa Docker:
   ```
   sudo apt install docker.io
   ```
3. Abilita e Avvia Docker:
   ```
   sudo systemctl enable --now docker
   ```
4. Verifica l'Installazione:
   ```
   docker --version
   ```

## Installazione di Docker Compose

### Windows & macOS
Docker Compose è incluso in Docker Desktop. Non è necessaria un'installazione aggiuntiva.

### Linux (Ubuntu)
1. Scarica il Binario di Docker Compose:
   ```
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```
2. Verifica l'Installazione:
   ```
   docker-compose --version
   ```

## 🖥️ Utilizzo su GitHub Codespace

Se desideri eseguire DressifyTEP in un ambiente GitHub Codespace, segui questi passaggi:

1. **Clona il Repository**:
   ```bash
   git clone https://github.com/Miftarve/DressifyTEP.git
   cd DressifyTEP
   ```

2. **Configurazione del File .env**:
   Crea il file .env:
    ```bash
   touch .env
   ```   
   
   Apri il file .env con l'editor di testo e inserisci le tue credenziali OAuth:
     ```bash
   nano .env
   ```
   **Dentro il file, incolla queste righe**
   ```
   # Google OAuth credentials
   GOOGLE_CLIENT_ID=tuo_client_id_google
   GOOGLE_CLIENT_SECRET=tuo_client_secret_google

   # Facebook OAuth credentials
   FACEBOOK_APP_ID=tuo_app_id_facebook
   FACEBOOK_APP_SECRET=tuo_app_secret_facebook
   ```
   
   **IMPORTANTE**: Non committare mai il file .env su GitHub!

4. **Avvio dell'Applicazione**:
   ```bash
   docker-compose up --build -d
   ```
   
   Spiegazione dei parametri:
   - `up`: Avvia i servizi definiti nel file docker-compose.yml
   - `--build`: Ricostruisce le immagini Docker (importante se hai modificato il codice)
   - `-d`: Avvia i container in background (modalità "detached")

5. **Accesso all'Applicazione**:
   L'applicazione sarà disponibile sulla porta 3000. In un Codespace, puoi accedervi facendo clic sul link che appare nella tab "Ports" o utilizzando il pulsante "Open in Browser".

## Configurazione e Avvio di DressifyTEP (Installazione Locale)

Ci sono due metodi per configurare e avviare DressifyTEP localmente: **manuale** e **automatico**.

### Metodo 1: Configurazione Automatica (Solo Windows)

Per un'installazione rapida e guidata, puoi utilizzare il file batch incluso nel progetto:

1. Scarica il file ZIP del progetto
2. Estrai la cartella ZIP nella posizione desiderata
3. Naviga nella cartella del progetto
4. Fai doppio clic sul file `setup-dressify.bat`
5. Segui le istruzioni visualizzate nella finestra del prompt dei comandi

Il file batch eseguirà automaticamente:
- Controllo dell'installazione di Docker
- Verifica che Docker sia in esecuzione
- Creazione del file `.env` (o chiederà se sovrascrivere un file esistente)
- Ti aiuterà a inserire le credenziali OAuth
- Avvio dell'applicazione con Docker
- Offerta di aprire l'applicazione nel browser

### Metodo 2: Configurazione Manuale

#### Passaggio 1: Scarica il Progetto
1. Scarica il file ZIP del progetto
2. Estrai la cartella ZIP nella posizione desiderata

#### Passaggio 2: Configura il File .env
1. Vai alla cartella del progetto estratto
2. Fai clic con il tasto destro sulla cartella e seleziona "Apri nel terminale"
3. Nel terminale, crea il file `.env` con il seguente comando:

##### Windows (PowerShell):
```
Set-Content -Path ".env" -Value "# Google OAuth credentials`nGOOGLE_CLIENT_ID=idcliente`nGOOGLE_CLIENT_SECRET=appsecret`n`n# Facebook OAuth credentials`nFACEBOOK_APP_ID=idcliente`nFACEBOOK_APP_SECRET=appsecret"
```

##### macOS/Linux:
```
echo -e "# Google OAuth credentials\nGOOGLE_CLIENT_ID=idcliente\nGOOGLE_CLIENT_SECRET=appsecret\n\n# Facebook OAuth credentials\nFACEBOOK_APP_ID=idcliente\nFACEBOOK_APP_SECRET=appsecret" > .env
```

4. **Importante**: Modifica il file `.env` appena creato e sostituisci `idcliente` e `appsecret` con le tue credenziali OAuth reali di Google e Facebook

#### Passaggio 3: Avvia l'Applicazione
1. Nella stessa finestra del terminale, esegui il seguente comando per costruire e avviare i container Docker:
   ```
   docker-compose up -d --build
   ```
2. Attendi che il processo di build e avvio sia completato

### Passaggio 4: Accedi all'Applicazione
Una volta che i container sono in esecuzione, puoi accedere a DressifyTEP utilizzando il tuo browser web:

- Applicazione web: [http://localhost:3000](http://localhost:3000)

## Risoluzione dei Problemi

Se riscontri problemi durante l'installazione o l'avvio dell'applicazione:

1. Verifica che Docker sia in esecuzione
2. Controlla che il file `.env` sia stato creato correttamente e contenga le credenziali valide
3. Verifica eventuali errori nei log di Docker con il comando:
   ```
   docker-compose logs
   ```

## Arresto dell'Applicazione

Per arrestare l'applicazione, esegui il seguente comando nella cartella del progetto:
```
docker-compose down
```
