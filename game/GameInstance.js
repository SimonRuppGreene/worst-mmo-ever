var SimEngine = require('./SimEngine');

var GameInstance = function(id) {
	this.entities = [];
	this.playerSockets = {};
	this.state = {
		entities: {}
	};
	this.inputs = [];
	this.SimEngine = new SimEngine();
	this.id = id;
}

GameInstance.prototype.sendUpdatesToClients = function() {
	var instanceState = this.state;
	// console.log("broadcasting new instance state: ", instanceState);
	this.broadcast('INSTANCE_UPDATE', instanceState);
}

GameInstance.prototype.updateState = function() {
	for(i in this.inputs) {
		// try {
			var inputToProcess = this.inputs[i];
			var playerToUpdate = inputToProcess.id;

			var simResult = this.SimEngine.processStateChange(inputToProcess, this.state.entities[playerToUpdate]);
			this.state.entities[playerToUpdate].position = simResult.newPosition;
			this.state.entities[playerToUpdate].lastProcessed = simResult.lastProcessed;
			this.inputs = [];
		// } catch (e) {
		// 	console.log("got error trying to update state: ", e);
		// 	console.log("skipping exception cuz its probably fine");
		// }
		
	}
}

GameInstance.prototype.broadcast = function(type, message) {
	for(var client in this.playerSockets) {
		var clientSocket = this.playerSockets[client];
		clientSocket.emit(type, message);
	}
}

GameInstance.prototype.addPlayer = function(player) {
	this.playerSockets[player.id] = player;
	this.broadcast('player_join', player.id);
	console.log("GameInstance", this.id, "::PLAYER_JOIN::", player.id, "::",this.state.entities[player.id]);
}

GameInstance.prototype.removePlayer = function(player) {
	// this.state.players.splice(this.players.indexOf(player), 1);
	console.log("removing player: ", player.id);
	console.log(this.playerSockets[player.id]);
	// delete this.playerSockets[player.id];
	// delete this.state.entities[player.id];
	this.broadcast('player_leave', player);
}

module.exports = GameInstance;