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


// Carica il carrello all'avvio della pagina
aggiornaCarrello();
