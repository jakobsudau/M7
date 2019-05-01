class SequenceModel {
    constructor() {
        // Number of steps to play each chord.
        this.STEPS_PER_CHORD = 8;
        this.STEPS_PER_PROG = 4 * this.STEPS_PER_CHORD;

        // Number of times to repeat chord progression.
        this.NUM_REPS = 4;

        this.model = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv');
        this.playing = false;

        // Current chords being played.
        this.currentChords = undefined;

        // worker
        this.modelWorker = new Worker("modelWorker.js");
		}

		initialize() {
			return new Promise((resolve, reject) => {
				this.modelWorker.postMessage(["initialize"]);
				
				this.model.initialize().then(() => {
					resolve("done");
				});
			})
		}

    generateSequence(chordsTemp, inputSeq, that) {
		
		this.modelWorker.postMessage(["generate"]);

		return new Promise(function(resolve, reject) {
			that.playing = true;
			that.currentChords = chordsTemp;

			const chords = that.currentChords;
			let seq = { 
				notes: [],
				quantizationInfo: {stepsPerQuarter: 4},
				totalQuantizedSteps: 1,
			}; 
			
			// Prime with root note of the first chord.
			const root = mm.chords.ChordSymbols.root(chords[0]);
			
			that.model.continueSequence(inputSeq, that.STEPS_PER_PROG + (that.NUM_REPS-1)*that.STEPS_PER_PROG - 1, 0.9, chords).then((contSeq) => {
			
			// Add the continuation to the original.
			contSeq.notes.forEach((note) => {
			note.quantizedStartStep += 1;
			note.quantizedEndStep += 1;
			seq.notes.push(note);
			});
				
			const roots = chords.map(mm.chords.ChordSymbols.root);

			for (var i=0; i<that.NUM_REPS; i++) { 
				// Add the bass progression.
				seq.notes.push({
					instrument: 1,
					program: 32,
					pitch: 36 + roots[0],
					quantizedStartStep: i*that.STEPS_PER_PROG,
					quantizedEndStep: i*that.STEPS_PER_PROG + that.STEPS_PER_CHORD
				});
				seq.notes.push({
					instrument: 1,
					program: 32,
					pitch: 36 + roots[1],
					quantizedStartStep: i*that.STEPS_PER_PROG + that.STEPS_PER_CHORD,
					quantizedEndStep: i*that.STEPS_PER_PROG + 2*that.STEPS_PER_CHORD
					});
				seq.notes.push({
					instrument: 1,
					program: 32,
					pitch: 36 + roots[2],
					quantizedStartStep: i*that.STEPS_PER_PROG + 2*that.STEPS_PER_CHORD,
					quantizedEndStep: i*that.STEPS_PER_PROG + 3*that.STEPS_PER_CHORD
				});
				seq.notes.push({
					instrument: 1,
					program: 32,
					pitch: 36 + roots[3],
					quantizedStartStep: i*that.STEPS_PER_PROG + 3*that.STEPS_PER_CHORD,
					quantizedEndStep: i*that.STEPS_PER_PROG + 4*that.STEPS_PER_CHORD
				});        
			}
			
			// Set total sequence length.
			seq.totalQuantizedSteps = that.STEPS_PER_PROG * that.NUM_REPS;

			// Play it!
			resolve(seq);
			})
		});
    }
}