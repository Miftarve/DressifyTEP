const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware per servire file statici
app.use(express.static('public'));

// Contatore visitatori
let visitorCount = 0;

// Socket.IO
io.on('connection', (socket) => {
    // Incrementa il contatore visitatori
    visitorCount++;
    console.log(`User connected with ID: ${socket.id}`);
    console.log(`Current visitors: ${visitorCount}`);
    
    // Invia il contatore aggiornato a tutti i client
    io.emit('visitor count', visitorCount);

    // Ricezione di un messaggio
    socket.on('send message', (data) => {
        console.log('Message received:', data);

        // Invia il messaggio a tutti gli altri utenti, tranne al mittente
        socket.broadcast.emit('receive message', { senderId: data.senderId, message: data.message });
    });

    // Disconnessione
    socket.on('disconnect', () => {
        // Decrementa il contatore visitatori
        visitorCount--;
        console.log(`User disconnected with ID: ${socket.id}`);
        console.log(`Current visitors: ${visitorCount}`);
        
        // Invia il contatore aggiornato a tutti i client
        io.emit('visitor count', visitorCount);
    });
});

// Avvio del server
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Chat server running on http://localhost:${PORT}`);
});