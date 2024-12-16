const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware per servire file statici
app.use(express.static('public'));

// Socket.IO
io.on('connection', (socket) => {
    console.log(`User connected with ID: ${socket.id}`);

    // Ricezione di un messaggio
    socket.on('send message', (data) => {
        console.log('Message received:', data);

        // Invia il messaggio a tutti gli altri utenti, tranne al mittente
        socket.broadcast.emit('receive message', { senderId: data.senderId, message: data.message });
    });

    // Disconnessione
    socket.on('disconnect', () => {
        console.log(`User disconnected with ID: ${socket.id}`);
    });
});

// Avvio del server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Chat server running on http://localhost:${PORT}`);
});
