document.getElementById("recoverBtn").addEventListener("click", function() {
    const email = document.getElementById("emailInput").value;

    if (!email) {
        alert("Inserisci un'email valida.");
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/recover-password", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                alert(response.message);
            } else {
                const response = JSON.parse(xhr.responseText);
                alert(response.error || "Errore durante il recupero della password.");
            }
        }
    };

    const data = JSON.stringify({ email: email });
    xhr.send(data);
});
