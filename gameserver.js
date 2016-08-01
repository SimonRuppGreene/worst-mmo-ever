var uuid = require('node-uuid');
var GameInstance = require('./game/GameInstance');
var Timer = require('./game/Timer');

var SimConfig = {
	updatePhysicsLoopTime: 4, //ms
	updateServerLoopTime: 1000, //ms
}

// function parseNetworkMessage(rawMessage) {
// 	var messageParts = rawMessage.split('.');
// 	var messageType = messageParts[0];
// 	var messageData = messageParts[1];
// 	return {
// 		type: messageType,
// 		payload: messageData
// 	}
// }

function Server() {
	this.fixedUpdateLoop = new Timer(SimConfig.updatePhysicsLoopTime, this.simulationUpdate.bind(this));
	this.serverUpdateLoop = new Timer(SimConfig.updateServerLoopTime, this.networkUpdate.bind(this));

	this.instances = {};
	this.players = {};

	this.bindNetworkHandlers();
}

Server.prototype.simulationUpdate = function() {
	//update simulation based on server's view of things
	for(var i in this.instances) {
		var instance = this.instances[i];
		instance.updateState();
	}
}

Server.prototype.networkUpdate = function() {
	//broadcast server's view of things to clients
	// this.broadcastMessage({type: 'ping', payload: 'pong'});
	for(var i in this.instances) {
		var instance = this.instances[i];
		instance.sendUpdatesToClients();
	}
}

Server.prototype.addInputToInstance = function(clientSocket, inputsToAdd) {
	var instanceIds = Object.keys(this.instances);
	if(instanceIds.indexOf(this.players[clientSocket.id].currentGameInstance) == -1) {
		return;
	}

	var instance = this.instances[this.players[clientSocket.id].currentGameInstance];
	// console.log("instances:", this.instances);
	// console.log("inputs:", inputsToAdd);
	instance.inputs.push(inputsToAdd);
}

Server.prototype.onMessage = function(clientSocket, message) {
	switch(message.type) {
		case 'input':
			this.handleInput(clientSocket, message.payload);
			break;
		case 'client_instance_update':
			this.addInputToInstance(clientSocket, message.payload);
			break;
		case 'client_join_instance':
			this.onPlayerJoinGame(clientSocket, message.payload);
		default:
			break;
	}
}

Server.prototype.broadcastMessage = function(message) {
	for(var i in this.players) {
		var client = this.players[i];
		client.emit('SERVER_MESSAGE', message);
	}
}

Server.prototype.addPlayerToGame = function(clientSocket, instanceId) {
	this.instances[instanceId].addPlayer(clientSocket);
}

Server.prototype.onPlayerConnection = function(clientSocket) {
	console.log("Player connected: ", clientSocket.id);
	this.players[clientSocket.id] = clientSocket;
}

Server.prototype.onPlayerJoinGame = function(clientSocket, playerState) {
	console.log("Player attempting to join instance");
	var instance;

	if(Object.keys(this.instances).length == 0) {
		instance = new GameInstance(uuid());
		this.instances[instance.id] = instance;
		console.log("Created new game instance with ID", instance.id);
	} else {
		instance = this.instances[Object.keys(this.instances)[0]];
	}

	this.players[clientSocket.id].currentGameInstance = instance.id;
	instance.state.entities[clientSocket.id] = playerState;
	this.addPlayerToGame(clientSocket, instance.id);
}

Server.prototype.onPlayerDisconnection = function(clientSocket) {
	console.log("Player disconnected: ", clientSocket.id);

	// var clientIndex = this.players.indexOf(clientSocket);
	// this.players.splice(clientIndex, 1);
	var instance = this.players[clientSocket.id].currentGameInstance;
	this.instances[instance].removePlayer(clientSocket);
	console.log("player left instance: ", instance);
	
	// this.instances[instance].removePlayer(clientSocket);
	// console.log("removed player from instance",this.instances[instance]);
	delete this.players[clientSocket.id];

	if(Object.keys(this.instances[clientSocket.currentGameInstance].playerSockets) == 0) {
		delete this.instances[clientSocket.currentGameInstance];
	}
}


/*
	example input data
	[ {
		seq: ['u','d','d','d'],
		time: 
	}
	]

*/

Server.prototype.handleInput = function(clientSocket, data) {
	var commands = data;
}


Server.prototype.bindNetworkHandlers = function() {

}

module.exports = Server;