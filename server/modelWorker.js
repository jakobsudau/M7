// -------------------------------------------------------------------------
// Music generation code
// -------------------------------------------------------------------------

// required modules and globals for music generation
const { workerData, parentPort, isMainThread } = require("worker_threads");
const id = workerData;
const mm = require('@magenta/music');
const improvCheckpoint = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv';
const melodyCheckpoint = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/melody_rnn';
const models = [new mm.MusicRNN(improvCheckpoint),
				new mm.MusicRNN(melodyCheckpoint)];

// initialize the models recursively, return success once finished
function initializeModel(index) {
	if (index > 0) {
		console.log("init model");
		models[index-1].initialize().then(() => initializeModel(index-1));
	} else {
		parentPort.postMessage({
			data: "finishedInitialization",
			cmd: "initDone",
			id: id});
	}
}
initializeModel(models.length);

// generate task
parentPort.on("message", message => {
    let data = JSON.parse(message);
	modelGenerate(data).then((seq) => {
		// send data and message that generation is done
		parentPort.postMessage({
			data: seq,
			cmd: "generateDone",
			id: id })
	});
});

parentPort.postMessage({ start: workerData, isMainThread });

function modelGenerate(data) {
    return new Promise(function(resolve, reject) {
       // Number of steps to play each chord.
		let stps_p_chrd = 8;
		let stps_p_prog = 4 * stps_p_chrd;

		// Number of times to repeat chord progression.
		let NUM_REPS = data.outputBars / 2;

		console.log("generating with model " + data.model);

		const chords = data.model == 0 ? data.chords : undefined;

		const steps = stps_p_prog + (NUM_REPS-1)*stps_p_prog - 1;

		function returnSeq(contSeq) {
			let seq = {
				notes: [],
				quantizationInfo: {stepsPerQuarter: 4},
				totalQuantizedSteps: 1,
			};

			let loopThreshold = steps+1;

			// Add the continuation to the original.
			contSeq.notes.forEach((note) => {
				note.quantizedStartStep += 1;
				note.quantizedEndStep += 1;
				if (note.quantizedEndStep == loopThreshold) {
					// for looping to work, can't have an endstep
					// on 32/64/128
					note.quantizedEndStep -= 1;
				}
				seq.notes.push(note);
				});

			if (data.addBassProg) {
				const roots = data.chords.map(
					mm.chords.ChordSymbols.root);

				for (var i=0; i<NUM_REPS; i++) {
					// Add the bass progression.
					seq.notes.push({
						instrument: 1,
						program: 32,
						pitch: 36 + roots[0],
						quantizedStartStep: i*stps_p_prog,
						quantizedEndStep: i*stps_p_prog + stps_p_chrd
					});
					seq.notes.push({
						instrument: 1,
						program: 32,
						pitch: 36 + roots[1],
						quantizedStartStep: i*stps_p_prog + stps_p_chrd,
						quantizedEndStep: i*stps_p_prog + 2*stps_p_chrd
						});
					seq.notes.push({
						instrument: 1,
						program: 32,
						pitch: 36 + roots[2],
						quantizedStartStep: i*stps_p_prog +2*stps_p_chrd,
						quantizedEndStep: i*stps_p_prog +3*stps_p_chrd
					});
					seq.notes.push({
						instrument: 1,
						program: 32,
						pitch: 36 + roots[3],
						quantizedStartStep: i*stps_p_prog +3*stps_p_chrd,
						quantizedEndStep: i*stps_p_prog +4*stps_p_chrd -1
					});
				}
			}

			// Set total sequence length.
			seq.totalQuantizedSteps = (stps_p_prog * NUM_REPS) -1;

			resolve(seq);
		}

		models[data.model].continueSequence(data.seq, steps, data.temp, chords)
		.then((contSeq) => {returnSeq(contSeq)})});
	}