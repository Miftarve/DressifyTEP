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
const rentals = [];
const sales = [];

// Create rental and increment ID
function createRental(data) {
  const newRental = {
    id: rentals.length + 1,
    ...data,
    timestamp: new Date().toISOString(),
    status: 'pending' // pending, approved, rejected
  };
  rentals.push(newRental);
  return newRental;
}

// Create sale and increment ID
function createSale(data) {
  const newSale = {
    id: sales.length + 1,
    orderId: `ORD-${new Date().getFullYear()}-${String(sales.length + 1).padStart(3, '0')}`,
    ...data,
    timestamp: new Date().toISOString(),
    status: 'processing' // processing, completed, refunded
  };
  sales.push(newSale);
  return newSale;
}

// Get all rentals
function getAllRentals() {
  return rentals;
}

// Get all sales
function getAllSales() {
  return sales;
}

// Update rental status
function updateRentalStatus(id, status) {
  const rental = rentals.find(r => r.id === id);
  if (rental) {
    rental.status = status;
    return rental;
  }
  return null;
}

// Update sale status
function updateSaleStatus(id, status) {
  const sale = sales.find(s => s.id === id);
  if (sale) {
    sale.status = status;
    return sale;
  }
  return null;
}

module.exports = {
  createRental,
  createSale,
  getAllRentals,
  getAllSales,
  updateRentalStatus,
  updateSaleStatus
};

// Esporta il database e la funzione di inizializzazione
module.exports = { dbConnection, initDatabase };