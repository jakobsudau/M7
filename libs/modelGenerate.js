function modelGenerate(data) {
    return new Promise(function(resolve, reject) {
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

				// Add the continuation to the original.
				contSeq.notes.forEach((note) => {
					note.quantizedStartStep += 1;
					note.quantizedEndStep += 1;
					if (note.quantizedEndStep == 64) {
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
		});
    });
}