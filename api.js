var express = require('express')
const sqlite3 = require('sqlite3').verbose()
const DBMock = require('./DBMock');

//const db = new sqlite3.Database('database.db')
const db = new DBMock();

var app = express()

const http = require('http').createServer(app);
const io = require('socket.io')(http);


app.get('/students', function (req, res) {   
    
    let tutti = db.getAllUsers();
    res.type('application/json') // => 'application/json'
    return res.send(JSON.stringify(tutti))
    
})

app.use('/static', express.static('public'));


app.listen(3000)