var io = require('socket.io');
var http = require('http');
var express = require('express');
var uuid = require('node-uuid');

var GameServer = require('./gameserver');

var config = {
	port: 1337
}

var app = express();
var server = http.createServer(app);
server.listen(config.port);
console.log("listening on port ", config.port);

// serve static content
app.get('/', function(req, res) {
	res.sendFile('/index.html', { root: __dirname });
});

app.get('/*', function(req, res) {
	var file = req.params[0];
	res.sendFile(__dirname + '/' + file);
});

// serve sockets
var sio = io.listen(server, {
	"authorization": function(handshakeData, callback) { callback(null, true) },
	"log level": 1
});

var gameserver = new GameServer();

sio.sockets.on('connection', function(clientSocket) {
	var clientId = uuid();
	clientSocket.id = clientId;

	clientSocket.emit('client_connected', { id: clientId });
	gameserver.onPlayerConnection(clientSocket);

	clientSocket.on('message', function(message) {
		gameserver.onMessage(clientSocket, message);
	});

	clientSocket.on('disconnect', function() {
		console.log("client '", clientId, "' disconnected");
		gameserver.onPlayerDisconnection(clientSocket);
	});
});



