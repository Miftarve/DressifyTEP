document.getElementById('toggle-ricerca-filtri').addEventListener('click', function() {
    const ricercaFiltriCard = document.getElementById('ricerca-filtri-card');
    const noleggioVenditaCard = document.getElementById('noleggio-vendita-card');
    const toggleButton = document.getElementById('toggle-ricerca-filtri');
    
    if (ricercaFiltriCard.classList.contains('active')) {
        ricercaFiltriCard.classList.remove('active');
        noleggioVenditaCard.classList.add('expanded');
        toggleButton.style.display = 'block';
    } else {
        ricercaFiltriCard.classList.add('active');
        noleggioVenditaCard.classList.remove('expanded');
        toggleButton.style.display = 'none';
    }
});

function calcolaPrezzo() {
    const durata = document.getElementById('durata-noleggio').value;
    const prezzo = durata * 10; // Supponiamo che il prezzo sia 10 unità per giorno
    document.getElementById('prezzo-noleggio').innerText = `Prezzo: ${prezzo} unità`;
}
