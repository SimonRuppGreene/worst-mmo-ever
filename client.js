var game = {}
var config = {
	screenWidth: 500,
	screenHeight: 500,
}


var SimConfig = {
	updateLoopTime: 4, //ms
	updateNetworkTime: 1000,
}

function Actor(id) {
	this.position = new Vector2(250, 250);
	this.size = new Vector2(16, 16);
	this.color = "rgba(140, 140, 255, 1)";
	this.id = id;
	this.status = "offline";
	this.speed = 50;
}


function Player(id) {
	Actor.call(this);
}
Player.prototype = Object.create(Actor.prototype);

Player.prototype.Draw = function(ctx) {
	ctx.fillStyle = this.color;
	ctx.fillRect(this.position.x - this.size.x/2, this.position.y - this.size.y/2, this.size.x, this.size.y);
	ctx.fillStyle = "#fff";
	ctx.fillText(this.status, this.position.x + 10, this.position.y);
}

Player.prototype.updatePosition = function(newVectorPosition) {
	var newX = (newVectorPosition.x * 0.015 * this.speed).toFixed(3);
	var newY = (newVectorPosition.y * 0.015 * this.speed).toFixed(3);
	var newResult = new Vector2(newX, newY);
	this.position.addTo(newResult);

	//clamp values
	var tmp = this.position;
	tmp.x = MinAndMax(tmp.x, 0 + (this.size.x/2), config.screenWidth - this.size.x/2);
	tmp.y = MinAndMax(tmp.y, 0 + this.size.y/2, config.screenHeight - this.size.y/2);
	this.position = new Vector2(tmp.x, tmp.y);
	//end clamp values
}

function GameEngine(player) {
	this.ctx = null;
	this.socket = null;
	this.keyboard = new THREEx.KeyboardState();
	
	this.state = {
		player: player,
		inputState: {
			lastProcessedSequence: 0,
			lastSequence: 0,
			inputs: [],
		},
		entities: {},
		localTime: new Date().getTime(),
		socket: null,
		lastServerSequence: 0,
		connected: false
	}
	
	this.time = {
		deltaTime: new Date().getTime(),
		deltaTimeEnd: new Date().getTime(),
		localTime: new Date().getTime(),
		timerHandle: this.startSimulationTimer(),
	}

	this.id = null;

	this.networkUpdateLoop = new Timer(SimConfig.updateNetworkTime, this.sendNetworkUpdate.bind(this));
}

GameEngine.prototype.DrawEntity = function(entity) {
	this.ctx.fillStyle = entity.color;
	this.ctx.fillRect(entity.position.x - entity.size.x/2, entity.position.y - entity.size.y/2, entity.size.x, entity.size.y);
	this.ctx.fillStyle = "#fff";
	this.ctx.fillText(entity.status, entity.position.x + 10, entity.position.y);
}

GameEngine.prototype.sendNetworkUpdate = function() {
	if(!this.state.connected) {
		return;
	}


	var netPayload = this.state.inputState;
	netPayload.id = this.id;

	this.socket.emit('message', {
		type: 'client_instance_update', 
		payload: netPayload
	})

	// this.state.inputState.inputs = [];
}

GameEngine.prototype.simulationTimerStep = function() {
	this.deltaTime = new Date().getTime() - this.deltaTimeEnd;
	this.deltaTimeEnd = new Date().getTime();
	this.localTime += (this.deltaTime / 1000.0);
	this.update();
}

GameEngine.prototype.startSimulationTimer = function() {
	return setInterval(this.simulationTimerStep.bind(this), SimConfig.updateLoopTime);
}

GameEngine.prototype.update = function() {
	this.handleInput();	
	this.updateSimulation();
	this.updateGraphics();
}

GameEngine.prototype.handleInput = function() {
	var newDirection = new Vector2();
	var input = [];

	if(this.keyboard.pressed('A')) {
		newDirection.x = -1;
		input.push('l');
	}

	if(this.keyboard.pressed('D')) {
		newDirection.x = 1
		input.push('r');
	}

	if(this.keyboard.pressed('W')) {
		newDirection.y = -1;
		input.push('u');
	}

	if(this.keyboard.pressed('S')) {
		newDirection.y = 1;
		input.push('d');
	}

	if(input.length) {
		this.state.inputState.lastSequence += 1;
		this.state.inputState.inputs.push({
			inputs: input,
			sequence: this.state.inputState.lastSequence,
			time: this.state.localTime
		});
	}

	return newDirection;
}

GameEngine.prototype.processPlayerInput = function() {
	var inputCount = this.state.inputState.inputs.length;
	var resultVector = new Vector2();
	var lastProcessed = this.state.inputState.lastProcessedSequence;
	var inputSequence
	var modified;

	if(inputCount) {
		for(var i = lastProcessed; i < inputCount; i++){
			var input = this.state.inputState.inputs[i].inputs;
			var inputSequenceCount = input.length;
			
			inputSequence = this.state.inputState.inputs[i].sequence;
			// debugger;

			modified = true;

			for(var j = 0; j < inputSequenceCount; j++){
				var key = input[j];

				if(key == 'l') {
					resultVector.addTo(new Vector2(-1, 0));
				}
				if(key == 'r') {
					resultVector.addTo(new Vector2(1, 0));
				}
				if(key == 'u') {
					resultVector.addTo(new Vector2(0, -1));
				}
				if(key == 'd') {
					resultVector.addTo(new Vector2(0, 1));
				}
			}
		}
	}

	if(modified) {
		this.state.player.updatePosition(resultVector);
		this.state.inputState.lastProcessedSequence = inputSequence;
	}
}

GameEngine.prototype.processEntityUpdates = function(networkUpdate) {
	/*
	for i in entities {
		entity = entities[i]
		processPositionFromServer(entity)
	}
	*/
	console.log("new state from server: ", networkUpdate);
	this.state.entities = networkUpdate.entities;
	this.resetInputState();
	
	// this.purgeLocalInputUpdates(networkUpdate.entities[this.id].lastProcessed);
}

GameEngine.prototype.resetInputState = function() {
	this.state.inputState = {
		lastProcessedSequence: 0,
		lastSequence: 0,
		inputs: [],
	}
}

GameEngine.prototype.purgeLocalInputUpdates = function(lastProcessed) {
	var indexToPurge;

	for(var i = 0; i < this.state.inputState.inputs.length; i++){
		var inputStep = this.state.inputState.inputs[i];
		if(inputStep.sequence <= lastProcessed){
			indexToPurge = i;
		}
	}

	// this.state.inputState.inputs.splice(0, indexToPurge);
	// this.state.inputState.inputs = [];
}

GameEngine.prototype.updateSimulation = function() {
	// console.log("updating simulation");
	this.processPlayerInput();
	// this.processEntityUpdates();
}

GameEngine.prototype.updateGraphics = function() {
	this.ctx.clearRect(0, 0, config.screenWidth, config.screenHeight)
	this.state.player.Draw(this.ctx);

	for(var entityId in this.state.entities) {
		var entity = this.state.entities[entityId];
		
		if(entityId !== this.id) {
			entity.status = "";	
			entity.color = "rgba(255, 255, 140, 1)";
		} else {
			entity.color = "rgba(140, 140, 255, 0.2)";
			entity.status = "My Ghost";
		}
		
		this.DrawEntity(entity);
	}
}

GameEngine.prototype.attemptConnection = function() {
	this.socket = io.connect();
	this.bindNetworkHandlers();
}

GameEngine.prototype.attemptJoinGame = function() {
	console.log("attempting to join game");
	this.socket.emit('message', {
		type: 'client_join_instance',
		payload: this.state.player
	})
}

GameEngine.prototype.bindNetworkHandlers = function() {
	this.socket.on('client_connected', function(params) {
		console.log("connected to server, assigned id '" + params.id + "'");
		this.id = params.id;
		this.state.connected = true;
		this.state.player.status = "connected";
		this.attemptJoinGame();
	}.bind(this));

	this.socket.on('disconnect', function() {
		console.log("disconnected from server");
		this.state.player.status = "offline";
	}.bind(this));

	this.socket.on('SERVER_MESSAGE', function(message){
		console.log("Received server message '" + message.type + "' with payload '" + message.payload + "'");
	});

	this.socket.on('INSTANCE_UPDATE', function(payload) {
		// console.log('Received update from current game instance: ', payload);
		this.processEntityUpdates(payload);
	}.bind(this));
}

window.onload = function() {
	var player = new Player(null)
	var game = new GameEngine(player);

	var canvas = document.getElementById("viewport");
	canvas.width = config.screenWidth;
	canvas.height = config.screenHeight;
	
	game.ctx = canvas.getContext("2d");
	game.update( new Date().getTime() );
	game.attemptConnection();
}