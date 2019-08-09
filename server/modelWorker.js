const { workerData, parentPort, isMainThread } = require("worker_threads");
const mm = require('@magenta/music');
const id = workerData;
const improvCheckpoint = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv';
const melodyCheckpoint = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/melody_rnn';
const vaeCheckpoint = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_4bar_med_lokl_q2';
const models = [new mm.MusicRNN(improvCheckpoint),
				new mm.MusicRNN(melodyCheckpoint),
				new mm.MusicVAE(vaeCheckpoint)];

// models[0].initialize().then(() =>
// 	models[1].initialize().then(() =>
// 		models[2].initialize().then(() =>
// 			parentPort.postMessage({data: "finishedInitialization",
// 			cmd: "initDone",
// 			id: id}))));
models[0].initialize().then(() =>
	parentPort.postMessage({data: "finishedInitialization",
	cmd: "initDone",
	id: id}));



// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// let OCTAVES = 7;
// let NOTES_PER_OCTAVE = 12;
// const bonusNotes = OCTAVES > 6 ? 4 : 0;  // starts on an A, ends on a C.
//   const totalNotes = NOTES_PER_OCTAVE * OCTAVES + bonusNotes;
// let keyWhitelist = Array(totalNotes).fill().map((x,i) => {
//     if (OCTAVES > 6) return i;
// 	// Starting 3 semitones up on small screens (on a C),
// 	// and a whole octave up.
//     return i + 3 + NOTES_PER_OCTAVE;
//   });
// const genie = new mm.PianoGenie('https://storage.googleapis.com/magentadata/js/checkpoints/piano_genie/model/epiano/stp_iq_auto_contour_dt_166006');
// genie.initialize().then(() => {
// 	console.log('genie ready!');
// 	// Slow to start up, so do a fake prediction to warm up the model.
// 	const note = genie.nextFromKeyWhitelist(0, keyWhitelist, 1.0);
// 	console.log(note);
// 	genie.resetState();
//   });
// --------------------------------------------------------------------------
// --------------------------------------------------------------------------

// You can do any heavy stuff here, in a synchronous way
// without blocking the "main thread"
parentPort.on("message", message => {
    let data = JSON.parse(message);
	modelGenerate(data).then((seq) => {
		// send data and message that generation is done
		parentPort.postMessage({data: seq,
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

		// const stepsPerQuarter = data.seq.quantizationInfo.stepsPerQuarter;
		// const steps = (stepsPerQuarter * data.outputBars * 4)-1;

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

		if (data.model == 2) {
			console.log("generate with Music VAE!");
			models[data.model].sample(steps).then((contSeq) => {
				returnSeq(contSeq)});
		} else {
			models[data.model].continueSequence(
				data.seq, steps, data.temp, chords).then((contSeq) => {
					returnSeq(contSeq)});
		}
		});
	}