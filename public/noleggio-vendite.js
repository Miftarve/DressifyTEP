// Aggiunge un listener per il pulsante di ricerca nella pagina di noleggio
window.addEventListener('DOMContentLoaded', function() {
    document.getElementById('searchButton').addEventListener('click', function() {
        // Recupera il valore dell'input di ricerca
        const searchTerm = document.getElementById('searchInput').value;

        // Crea una richiesta AJAX con `fetch`
        fetch(`/api/products/search?q=${encodeURIComponent(searchTerm)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Errore nella risposta del server');
                }
                return response.json();
            })
            .then(data => {
                // Mostra i risultati della ricerca
                const resultsContainer = document.getElementById('results');
                resultsContainer.innerHTML = '';
                
                if (data.length === 0) {
                    resultsContainer.textContent = 'Nessun prodotto trovato';
                    return;
                }

                data.forEach(product => {
                    const productElement = document.createElement('div');
                    productElement.textContent = `${product.name} - Prezzo: €${product.price}`;
                    resultsContainer.appendChild(productElement);
                });
            })
            .catch(error => {
                console.error('Si è verificato un errore:', error);
                document.getElementById('results').textContent = 'Errore durante la ricerca dei prodotti';
            });
    });
});

function caricaProdotti() {
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            mostraProdotti(data.products);
        })
        .catch(error => console.error('Errore nel caricamento dei prodotti:', error));
}

function cercaProdotti() {
    const minPrice = document.getElementById('minPriceFilter').value;
    const maxPrice = document.getElementById('maxPriceFilter').value;
    const brand = document.getElementById('brandFilter').value;
    const size = document.getElementById('sizeFilter').value;
    const condition = document.getElementById('conditionFilter').value;
    const category = document.getElementById('categoryFilter').value;

    const params = new URLSearchParams({ minPrice, maxPrice, brand, size, condition, category });

    fetch(`/api/products/search?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            mostraProdotti(data.products);
            resetFiltri();
        })
        .catch(error => console.error('Errore nella ricerca dei prodotti:', error));
}

function mostraProdotti(prodotti) {
    const container = document.getElementById('prodotti-container');
    container.innerHTML = '';

    prodotti.forEach(prodotto => {
        const card = document.createElement('div');
        card.classList.add('prodotto-card');
        card.innerHTML = `
            <h3>${prodotto.category}</h3>
            <p>Taglia: ${prodotto.size}</p>
            <p>Colore: ${prodotto.color}</p>
            <p>Marca: ${prodotto.brand}</p>
            <p>Condizione: ${prodotto.condition}</p>
            <p>Prezzo: ${prodotto.price} €</p>
            <button onclick="aggiungiAlCarrello(${prodotto.id})">Aggiungi al Carrello</button>
        `;
        container.appendChild(card);
    });
}

function resetFiltri() {
    document.getElementById('minPriceFilter').value = '';
    document.getElementById('maxPriceFilter').value = '';
    document.getElementById('brandFilter').value = '';
    document.getElementById('sizeFilter').value = '';
    document.getElementById('conditionFilter').value = '';
    document.getElementById('categoryFilter').value = '';
}

function mostraTuttiProdotti() {
    caricaProdotti();
}
document.addEventListener("DOMContentLoaded", function () {
    const filterCard = document.querySelector("#ricerca-filtri-card");
    const productCard = document.querySelector("#noleggio-vendita-card");
    const toggleButton = document.querySelector("#toggle-filter-button");

    toggleButton.addEventListener("click", function () {
        if (filterCard.classList.contains("hidden")) {
            // Show filter card
            filterCard.classList.remove("hidden");
            productCard.classList.remove("expanded");
        } else {
            // Hide filter card
            filterCard.classList.add("hidden");
            productCard.classList.add("expanded");
        }
    });
});


const toggleRicercaFiltriButton = document.getElementById('toggle-ricerca-filtri');
const showRicercaFiltriButton = document.getElementById('show-ricerca-filtri');
const filtriCard = document.getElementById('ricerca-filtri-card');
const prodottiCard = document.getElementById('noleggio-vendita-card');

// Nasconde i filtri e espande la card dei prodotti
toggleRicercaFiltriButton.addEventListener('click', () => {
    filtriCard.classList.add('hidden'); // Nasconde i filtri
    prodottiCard.classList.add('expanded'); // Espande la card dei prodotti
    showRicercaFiltriButton.classList.add('visible'); // Mostra il pulsante di riattivazione
});

// Mostra i filtri e ripristina la dimensione della card dei prodotti
showRicercaFiltriButton.addEventListener('click', () => {
    filtriCard.classList.remove('hidden'); // Mostra i filtri
    prodottiCard.classList.remove('expanded'); // Ripristina la dimensione originale della card dei prodotti
    showRicercaFiltriButton.classList.remove('visible'); // Nasconde il pulsante di riattivazione
});
let carrello = [];


// Funzione per aggiungere un prodotto al carrello
function aggiungiAlCarrello(productId) {
  fetch(`/api/products/${productId}`)
    .then((res) => res.json())
    .then((product) => {
      carrello.push({ ...product, tipo: 'acquisto' }); // Default: acquisto
      aggiornaCarrello();
    });
}

// Funzione per aggiornare la visualizzazione del carrello
function aggiornaCarrello() {
  const container = document.getElementById('cart-items-container');
  container.innerHTML = '';

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
  aggiornaCarrello();
}

// Funzione per impostare il tipo di acquisto
function setTipo(index, tipo) {
  carrello[index].tipo = tipo;
  if (tipo === 'contrattazione') {
    const nuovaOfferta = prompt('Inserisci la tua offerta:');
    carrello[index].offerta = nuovaOfferta;
  }
  aggiornaCarrello();
}

// Funzione per rimuovere un prodotto dal carrello
function rimuoviDalCarrello(index) {
  carrello.splice(index, 1);
  aggiornaCarrello();
}

// Funzione per svuotare il carrello
document.getElementById('clear-cart').addEventListener('click', () => {
  carrello = [];
  aggiornaCarrello();
});
