// Include alle benodigde modules
var express = require("express");
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

//All visitors and their positions;
var chatMap = function () {

    var chatPositions = [];
    return {
        add: function (username, position, time) {
            var userExists = false;
            for (x = 0; x < chatPositions.length; x++) {
                if (chatPositions[x].username == username) {
                    chatPositions[x].position = position;
                    chatPositions[x].time = time;
                    userExists = true;
                }
            }
            if (!userExists) {
                chatPositions.push({ username: username, position: position, time: time });
            }
        },
        get: function () {
            return chatPositions;
        },
        debug: function () {
            for (x = 0; x < chatPositions.length; x++) {
                console.log(chatPositions[x].username + " " + chatPositions[x].position.lat + "," + chatPositions[x].position.lon);
            }
        }
    }


};

var myChatMap = chatMap();

// Configureer de template engine
// Embedded Javascript
app.set('view engine', 'ejs');

// Maak de folder bower_components publiekelijk
// beschikbaar via de url /components
app.use('/components', express.static('public'));

// Controller voor de url /
// Rendert de home pagina die in views/home.ejs staat
app.get("/", function(req, res){
    res.render('home', {
        titel: 'Chatmap'
    });
});

// De socket.io (chatserver)
io.on('connection', function (socket) {

    // Deze functie wordt uitgevoerd wanneer een gebruiker
    // met de chatserver is verbonden

    socket.username = "Anonymous";

    // Luister naar een binnenkomend bericht
    socket.on('message', function (data) {
        // io.socket.emit = verstuur bericht naar alle verbonden gebruikers
        io.sockets.emit('message', {
            message: data.message,
            username: socket.username
        });
    });

    // Luister naar het veranderen van een username
    socket.on('set user', function (data) {

        // Verstuur een bericht dat zojuist een gebruiker zijn naam heeft aangepast
        io.sockets.emit('message', {
            message: data.username + ' meldt zich.',
            username: socket.username
        });

        // Sla de nieuwe username op in de socket
        socket.username = data.username;
    });

    // Luister naar het binnenkomen van een positie van een bezoeker
    socket.on('new position', function (data) {

        myChatMap.add(data.username, data.position, data.time);
        //myChatMap.debug();
        // Verstuur de positie aan alle clients
        io.sockets.emit('position', myChatMap.get() );

    });
});

// Start de server op poort 3000
server.listen(3000);
console.log('listening on ' + 3000);
