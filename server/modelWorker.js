const { workerData, parentPort, isMainThread } = require("worker_threads");
const mm = require('@magenta/music');
// const JZZ = require('jzz');
// require('jzz-midi-smf')(JZZ);
const id = workerData;
const improvCheckpoint = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv';
const improvRNN = new mm.MusicRNN(improvCheckpoint);
improvRNN.initialize().then(() =>
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

	// if (message == "play") {
	// 	console.log("playit!!!");
	// 	var midiout = JZZ().openMidiOut();
	// 	var player = smf.player();
	// 	player.connect(midiout);
	// 	player.play();
	// 	return;
	// }

    let data = JSON.parse(message);

    // Number of steps to play each chord.
    let stps_p_chrd = 8;
    let stps_p_prog = 4 * stps_p_chrd;

    // Number of times to repeat chord progression.
    let NUM_REPS = data.outputBars / 2;

    // const stepsPerQuarter = data.seq.quantizationInfo.stepsPerQuarter;
    // const steps = (stepsPerQuarter * data.outputBars * 4)-1;

    const steps = stps_p_prog + (NUM_REPS-1)*stps_p_prog - 1;
    improvRNN.continueSequence(data.seq, steps, data.temp, data.chords)
        .then((contSeq) => {
            let seq = {
				notes: [],
				quantizationInfo: {stepsPerQuarter: 4},
				totalQuantizedSteps: 1,
			};

			// let smf = new JZZ.MIDI.SMF(0, 96); // type 0, 96 ticks per quarter note
			// let trk = new JZZ.MIDI.SMF.MTrk();
			// trk.add(0, JZZ.MIDI.smfSeqName('generatedSequence'));
			// trk.add(0, JZZ.MIDI.smfBPM(120*4));
			// smf.push(trk);

			let loopThreshold = steps+1;

            // Add the continuation to the original.
			contSeq.notes.forEach((note) => {
                note.quantizedStartStep += 1;
                note.quantizedEndStep += 1;
                // if (note.quantizedEndStep == loopThreshold) {
				// 	// for looping to work, can't have an endstep
				// 	// on 32/64/128
				// 	note.quantizedEndStep -= 1;
				// 	// trk.add((note.quantizedEndStep*96), JZZ.MIDI.smfEndOfTrack());
				// }
				// trk.add((note.quantizedStartStep*96), JZZ.MIDI.noteOn(0, note.pitch, 127));
				// trk.add((note.quantizedEndStep*96), JZZ.MIDI.noteOff(0, note.pitch, 127));
                seq.notes.push(note);
				});

			if (data.addBassProg) {
				const roots = data.chords.map(mm.chords.ChordSymbols.root);

				for (var i=0; i<NUM_REPS; i++) {
					// Add the bass progression.
					seq.notes.push({
						instrument: 1,
						program: 32,
						pitch: 36 + roots[0],
						quantizedStartStep: i*stps_p_prog,
						quantizedEndStep: i*stps_p_prog + stps_p_chrd
					});
					// trk.add((i*stps_p_prog*96), JZZ.MIDI.noteOn(0, 36 + roots[0], 127));
					// trk.add((i*stps_p_prog + stps_p_chrd*96), JZZ.MIDI.noteOff(0, 36 + roots[0], 127));
					seq.notes.push({
						instrument: 1,
						program: 32,
						pitch: 36 + roots[1],
						quantizedStartStep: i*stps_p_prog + stps_p_chrd,
						quantizedEndStep: i*stps_p_prog + 2*stps_p_chrd
						});
					// trk.add((i*stps_p_prog + stps_p_chrd*96), JZZ.MIDI.noteOn(0, 36 + roots[1], 127));
					// trk.add((i*stps_p_prog + 2*stps_p_chrd*96), JZZ.MIDI.noteOff(0, 36 + roots[1], 127));
					seq.notes.push({
						instrument: 1,
						program: 32,
						pitch: 36 + roots[2],
						quantizedStartStep: i*stps_p_prog + 2*stps_p_chrd,
						quantizedEndStep: i*stps_p_prog + 3*stps_p_chrd
					});
					// trk.add((i*stps_p_prog + 2*stps_p_chrd*96), JZZ.MIDI.noteOn(0, 36 + roots[2], 127));
					// trk.add((i*stps_p_prog + 3*stps_p_chrd*96), JZZ.MIDI.noteOff(0, 36 + roots[2], 127));
					seq.notes.push({
						instrument: 1,
						program: 32,
						pitch: 36 + roots[3],
						quantizedStartStep: i*stps_p_prog + 3*stps_p_chrd,
						quantizedEndStep: i*stps_p_prog + 4*stps_p_chrd - 1
					});
					// trk.add((i*stps_p_prog + 3*stps_p_chrd*96), JZZ.MIDI.noteOn(0, 36 + roots[3], 127));
					// trk.add(((i*stps_p_prog + 4*stps_p_chrd - 1)*96), JZZ.MIDI.noteOff(0, 36 + roots[3], 127));
				}
			}

			// Set total sequence length.
			seq.totalQuantizedSteps = (stps_p_prog * NUM_REPS) -1;

			parentPort.postMessage({data: seq,
                cmd: "generateDone",
				id: id})
		});

		// modelGenerate(data).then(() => {
		// 	// send data and message that generation is done
		// 	parentPort.postMessage({data: seq,
		// 		cmd: "generateDone",
		// 		id: id })
		// });
});

parentPort.postMessage({ start: workerData, isMainThread });
