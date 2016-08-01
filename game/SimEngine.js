var utils = require('../utils');
var config = {
	screenWidth: 500,
	screenHeight: 500,
}


var SimEngine = function() {}

// (state, action) -> (state)
SimEngine.prototype.processStateChange = function(inputState, playerState) {	
	var inputCount = inputState.inputs.length;
	var resultVector = new utils.Vector2();
	var lastProcessed = playerState.lastProcessed || 0;
	var modified;

	if(inputCount) {
		for(var i = 0; i < inputCount; i++){
			var input = inputState.inputs[i].inputs;
			var inputSequenceCount = input.length;
			var lastProcessed = inputState.inputs[i].sequence;
			modified = true;

			for(var j = 0; j < inputSequenceCount; j++){
				var key = input[j];

				if(key == 'l') {
					resultVector.addTo(new utils.Vector2(-1, 0));
				}
				if(key == 'r') {
					resultVector.addTo(new utils.Vector2(1, 0));
				}
				if(key == 'u') {
					resultVector.addTo(new utils.Vector2(0, -1));
				}
				if(key == 'd') {
					resultVector.addTo(new utils.Vector2(0, 1));
				}
			}
		}
	}

	if(modified) {
		var newX = (resultVector.x * 0.015 * playerState.speed).toFixed(3);
		var newY = (resultVector.y * 0.015 * playerState.speed).toFixed(3);
		var newResult = new utils.Vector2(newX, newY);

		var currentPosition = new utils.Vector2(playerState.position.x, playerState.position.y);

		currentPosition.addTo(newResult);
		playerState.position.x = currentPosition.x;
		playerState.position.y = currentPosition.y;

		//clamp values
		var tmp = playerState.position;
		tmp.x = utils.MinAndMax(tmp.x, 0 + (playerState.size.x/2), config.screenWidth - playerState.size.x/2);
		tmp.y = utils.MinAndMax(tmp.y, 0 + playerState.size.y/2, config.screenHeight - playerState.size.y/2);
		playerState.position = new utils.Vector2(tmp.x, tmp.y);
		//end clamp values
	}

	// return playerState.position;
	return {
		newPosition: playerState.position,
		lastProcessed: lastProcessed
	}
}

module.exports = SimEngine;