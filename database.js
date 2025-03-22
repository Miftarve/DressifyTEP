const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbConnection = new sqlite3.Database(path.join(__dirname, 'database.db'));

// Inizializza le tabelle se non esistono
function initDatabase() {
    dbConnection.serialize(() => {
        // Tabella messaggi
        dbConnection.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            recipient_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            is_read INTEGER DEFAULT 0
        )`);
    });
}

// Esporta il database e la funzione di inizializzazione
module.exports = { dbConnection, initDatabase };