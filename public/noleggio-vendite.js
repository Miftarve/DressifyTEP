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
