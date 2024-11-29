// Recupera il carrello dal localStorage
let carrello = JSON.parse(localStorage.getItem('carrello')) || [];
console.log("Carrello caricato:", carrello); // Verifica cosa viene caricato

function aggiungiAlCarrello(productId) {
    fetch(`/api/products/${productId}`)
        .then(res => res.json())
        .then(product => {
            const prodottoEsistente = carrello.find(item => item.id === product.id);
            if (prodottoEsistente) {
                prodottoEsistente.quantita += 1; // Incrementa la quantità
            } else {
                carrello.push({ ...product, tipo: 'acquisto', quantita: 1 }); // Aggiungi nuovo prodotto
            }
            aggiornaCarrello();
        });
}

// Funzione per aggiornare la visualizzazione del carrello
function aggiornaCarrello() {
    console.log("Aggiornamento carrello in corso..."); // Debug
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';
  
    if (carrello.length === 0) {
      container.innerHTML = '<p>Il carrello è vuoto!</p>';
      return;
    }
  
    carrello.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <p>${item.name} - €${item.price}</p>
        <div class="actions">
          <label>
            Noleggio (giorni):
            <input type="number" min="1" value="1" onchange="calcolaPrezzo(${index}, this.value)" />
          </label>
          <button onclick="setTipo(${index}, 'acquisto')">Acquista</button>
          <button onclick="setTipo(${index}, 'contrattazione')">Contratta</button>
          <button onclick="rimuoviDalCarrello(${index})">Rimuovi</button>
        </div>
      `;
      container.appendChild(div);
    });
  }
  


// Funzione per calcolare il prezzo per il noleggio
function calcolaPrezzo(index, giorni) {
  const item = carrello[index];
  const prezzoBase = item.price;
  carrello[index].prezzoNoleggio = prezzoBase * giorni;
  salvaCarrello();
  aggiornaCarrello();
}

// Funzione per impostare il tipo di acquisto
function setTipo(index, tipo) {
  carrello[index].tipo = tipo;
  if (tipo === 'contrattazione') {
    const nuovaOfferta = prompt('Inserisci la tua offerta:');
    carrello[index].offerta = nuovaOfferta;
  }
  salvaCarrello();
  aggiornaCarrello();
}

// Funzione per rimuovere un prodotto dal carrello
function rimuoviDalCarrello(index) {
  carrello.splice(index, 1);
  salvaCarrello();
  aggiornaCarrello();
}

// Funzione per salvare il carrello nel localStorage
function salvaCarrello() {
    console.log("Carrello salvato:", JSON.stringify(carrello)); // Aggiungi un log per vedere cosa viene salvato
    localStorage.setItem('carrello', JSON.stringify(carrello));
  }
  
console.log(carrello);

// Funzione per svuotare il carrello
document.getElementById('clear-cart').addEventListener('click', () => {
  carrello = [];
  salvaCarrello();
  aggiornaCarrello();
});
console.log("Carrello dopo l'aggiunta: ", carrello);


// Funzione per aggiornare la visualizzazione del carrello
function aggiornaCarrello() {
  const container = document.getElementById('cart-items-container');
  container.innerHTML = '';

  if (carrello.length === 0) {
    container.innerHTML = '<p>Il carrello è vuoto!</p>';
    return;
  }

  carrello.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <p><strong>${item.name}</strong> - €${item.price}</p>
      <p>Quantità: ${item.quantita}</p>
      <div class="actions">
        <button onclick="rimuoviDalCarrello(${index})">Rimuovi</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// Funzione per rimuovere un prodotto dal carrello
function rimuoviDalCarrello(index) {
  carrello.splice(index, 1);
  localStorage.setItem('carrello', JSON.stringify(carrello)); // Aggiorna il localStorage
  aggiornaCarrello();
}

// Funzione per svuotare il carrello
document.getElementById('clear-cart').addEventListener('click', () => {
  carrello = [];
  localStorage.setItem('carrello', JSON.stringify(carrello)); // Aggiorna il localStorage
  aggiornaCarrello();
});

// Carica il carrello all'avvio della pagina
document.addEventListener('DOMContentLoaded', aggiornaCarrello);

// Carica il carrello all'avvio della pagina
aggiornaCarrello();
// Funzione per aggiungere un prodotto al carrello con dettagli
function aggiungiAlCarrello(productId) {
  fetch(`/api/products/${productId}`) // Recupera i dati del prodotto dal server
    .then((res) => res.json())
    .then((product) => {
      const prodottoEsistente = carrello.find((item) => item.id === product.id);
      if (prodottoEsistente) {
        prodottoEsistente.quantita += 1; // Incrementa la quantità se esiste già
      } else {
        // Aggiungi il prodotto al carrello con tutti i dettagli
        carrello.push({
          id: product.id,
          name: product.name,
          size: product.size, // Taglia
          color: product.color, // Colore
          brand: product.brand, // Marca
          condition: product.condition, // Condizione
          price: parseFloat(product.price), // Prezzo
          quantita: 1,
          tipo: 'acquisto', // Default: acquisto
        });
      }

      // Salva il carrello e aggiorna la UI
      localStorage.setItem('carrello', JSON.stringify(carrello));
      aggiornaContatoreCarrello();
      alert(`Prodotto "${product.name}" aggiunto al carrello!`);
    })
    .catch((error) => {
      console.error('Errore nell\'aggiunta al carrello:', error);
      alert('Errore nell\'aggiunta al carrello. Riprova.');
    });
}

// Funzione per aggiornare il contatore degli articoli nel carrello
function aggiornaContatoreCarrello() {
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
      const totaleProdotti = carrello.reduce((total, item) => total + item.quantita, 0);
      cartCount.textContent = totaleProdotti;
  } else {
      console.error("Elemento con ID 'cart-count' non trovato!");
  }
}

// Funzione per rimuovere un prodotto dal carrello
function rimuoviDalCarrello(index) {
  carrello.splice(index, 1); // Rimuove l'elemento dall'array
  localStorage.setItem('carrello', JSON.stringify(carrello)); // Salva il carrello aggiornato
  aggiornaCarrello(); // Aggiorna la visualizzazione del carrello
  aggiornaContatoreCarrello(); // Aggiorna il contatore
}

// Funzione per aggiungere un prodotto al carrello
// Funzione per aggiungere un prodotto al carrello con dettagli
function aggiungiAlCarrello(productId) {
  fetch(`/api/products/${productId}`) // Recupera i dati del prodotto dal server
    .then((res) => res.json())
    .then((product) => {
      const prodottoEsistente = carrello.find((item) => item.id === product.id);
      if (prodottoEsistente) {
        prodottoEsistente.quantita += 1; // Incrementa la quantità se esiste già
      } else {
        // Aggiungi il prodotto al carrello con tutti i dettagli
        carrello.push({
          id: product.id,
          name: product.name,
          size: product.size, // Taglia
          color: product.color, // Colore
          brand: product.brand, // Marca
          condition: product.condition, // Condizione
          price: parseFloat(product.price), // Prezzo
          quantita: 1,
          tipo: 'acquisto', // Default: acquisto
        });
      }

      // Salva il carrello e aggiorna la UI
      localStorage.setItem('carrello', JSON.stringify(carrello));
      aggiornaContatoreCarrello();
      alert(`Prodotto "${product.name}" aggiunto al carrello!`);
    })
    .catch((error) => {
      console.error('Errore nell\'aggiunta al carrello:', error);
      alert('Errore nell\'aggiunta al carrello. Riprova.');
    });
}

// Aggiorna il contatore degli articoli nel carrello
function aggiornaContatoreCarrello() {
  const cartCount = document.getElementById('cart-count');
  cartCount.textContent = carrello.reduce((total, item) => total + item.quantita, 0);
}

// Aggiorna la visualizzazione completa del carrello
function aggiornaCarrello() {
  const container = document.getElementById('cart-items-container');
  container.innerHTML = '';

  if (carrello.length === 0) {
    container.innerHTML = '<p>Il carrello è vuoto!</p>';
    return;
  }

  carrello.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <p><strong>${item.name}</strong> (${item.size}, ${item.color}, ${item.brand}, ${item.condition})</p>
      <p>Prezzo: €${item.price} - Quantità: ${item.quantita}</p>
      <div class="actions">
        <button onclick="rimuoviDalCarrello(${index})">Rimuovi</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// Carica il carrello all'avvio della pagina
document.addEventListener('DOMContentLoaded', () => {
  aggiornaCarrello();
  aggiornaContatoreCarrello();
});
