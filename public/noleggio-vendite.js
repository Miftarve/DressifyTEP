document.addEventListener('DOMContentLoaded', caricaProdotti);

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
