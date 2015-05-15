
var demo = {};

demo.testBlockScope = function() {
	
	var a = 1;
	if (a===2) {
		var b = {bb: 'test'};
	}
	console.log("b1: ", b);
	
	if (a===1) {
		var b = {bb2: 'test2'};
	}
	console.log("b2: ", b);
	
	// error: Uncaught ReferenceError: bnone is not defined
	//console.log("b none: ", bnone);
};

demo.testBlockScope();
