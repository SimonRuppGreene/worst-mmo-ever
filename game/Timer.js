var Timer = function(interval, updateFunction) {
	this.deltaTime = new Date().getTime();
	this.deltaTimeEnd = new Date().getTime();
	this.localTime = new Date().getTime();
	
	this.updateInterval = interval;
	this.updateFunction = updateFunction;

	this.timerHandle = this.startTimer(this.timerStep, this.updateInterval);
}

Timer.prototype.timerStep = function() {
	this.deltaTime = new Date().getTime() - this.deltaTimeEnd;
	this.deltaTimeEnd = new Date().getTime();
	this.localTime += (this.deltaTime / 1000.0);

	this.updateFunction();
}

Timer.prototype.startTimer = function(stepfunction, interval) {
	return setInterval(stepfunction.bind(this), interval);
}

if(typeof document == "undefined") {
	module.exports = Timer;
}
