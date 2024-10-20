// Funzione per ottenere i prodotti dal server
function caricaProdotti() {
    fetch('/api/products')  // Usa la rotta API esistente nel server
        .then(response => response.json())
        .then(data => {
            mostraProdotti(data.products);
        })
        .catch(error => {
            console.error('Errore nel caricamento dei prodotti:', error);
        });
}

// Funzione per generare una card prodotto
function creaCardProdotto(prodotto) {
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
    return card;
}

// Funzione per visualizzare i prodotti nel contenitore
function mostraProdotti(prodotti) {
    const container = document.getElementById('prodotti-container');
    container.innerHTML = '';  // Pulisce il contenitore prima di inserire nuovi prodotti

    prodotti.forEach(prodotto => {
        const card = creaCardProdotto(prodotto);
        container.appendChild(card);
    });
}

// Funzione per aggiungere un prodotto al carrello
let carrello = [];

function aggiungiAlCarrello(idProdotto) {
    const prodotto = prodotti.find(p => p.id === idProdotto);
    carrello.push(prodotto);
    mostraCarrello();
}

// Funzione per mostrare il carrello
function mostraCarrello() {
    const carrelloContainer = document.getElementById('carrello-items');
    carrelloContainer.innerHTML = '';  // Pulisce il contenitore del carrello

    carrello.forEach(item => {
        const div = document.createElement('div');
        div.textContent = `${item.category} - ${item.price} €`;
        carrelloContainer.appendChild(div);
    });
}

// Funzione per svuotare il carrello
document.getElementById('rimuovi-carrello').addEventListener('click', function() {
    carrello = [];  // Svuota il carrello
    mostraCarrello();  // Aggiorna la visualizzazione del carrello
});

// Avvia il caricamento dei prodotti quando la pagina è pronta
document.addEventListener('DOMContentLoaded', caricaProdotti);
