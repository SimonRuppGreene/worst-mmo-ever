function Vector2(x, y) {
	if(x == undefined) {
		x = 0
	}
	if(y == undefined) {
		y = 0
	}
	this.x = x;
	this.y = y;
}

Vector2.prototype.length = function() {
	return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2))
}

Vector2.prototype.addTo = function(otherVector) {
	this.x = parseFloat(this.x) +  parseFloat(otherVector.x);
	this.y = parseFloat(this.y) + parseFloat(otherVector.y);	
}

Vector2.prototype.scalarMult = function(scalar) {
	this.x = parseFloat(this.x) * scalar;
	this.y = parseFloat(this.y) * scalar;
}

function MinAndMax(val, min, max) {
	return Math.max(min, Math.min(val, max));
}


function SimulationManager() {
	this.time = {
		deltaTime: new Date().getTime(),
		deltaTimeEnd: new Date().getTime(),
		localTime: new Date().getTime(),
		timerHandle: this.startTimer(),
	}
}

SimulationManager.prototype.timerStep = function() {
	this.deltaTime = new Date().getTime() - this.deltaTimeEnd
	this.deltaTimeEnd = new Date().getTime()
	this.localTime += (this.deltaTime / 1000.0)
}

SimulationManager.prototype.startTimer = function() {
	return setInterval(this.timerStep, SimConfig.updateLoopTime)
}

if(typeof document == "undefined"){
	module.exports = {
		Vector2: Vector2,
		MinAndMax: MinAndMax
	}	
}
