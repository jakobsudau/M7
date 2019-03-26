//const modelTest = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv');

self.onmessage = function(e){
	if (e.data=="initialize") {
		console.log("modelWorker initializing...");
		// importScripts('https://cdn.jsdelivr.net/npm/@magenta/music@^1.0.0')
		postMessage("initializeDone");
	}
};