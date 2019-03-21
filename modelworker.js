self.onmessage=function(e){
	if (e.data[0] == "generate") {
		console.log("generating...");
        const seq = { 
            quantizationInfo: {stepsPerQuarter: 4},
            notes: [],
            totalQuantizedSteps: 1
          };  

        // generate a sequence here (which takes time)
        // e.data[1].continueSequence(seq, /*something, chords*/);

        // once done, post the generated sequence back to main thread
        postMessage(["done", seq]);
	}
};