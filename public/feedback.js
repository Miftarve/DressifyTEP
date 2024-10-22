document.getElementById('feedbackForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Previene il comportamento predefinito del form

    // Prendi i valori dei campi del form
    const product = document.getElementById('product').value;
    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value;

    // Simula l'invio del feedback (qui potresti fare una richiesta fetch al server)
    console.log("Recensione inviata per il prodotto:", product);
    console.log("Valutazione:", rating);
    console.log("Commento:", comment);

    // Mostra un messaggio di conferma (in questo esempio si usa un alert)
    alert('Grazie per il tuo feedback!');

    // Reset del form
    document.getElementById('feedbackForm').reset();
});
