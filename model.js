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
        const that = this;
        this.modelWorker = new Worker("modelWorker.js");
        this.modelWorker.onmessage = function(e) {if (e.data == "tick") {that.generating();}};
    }

    initialize() {
        // Initialize model then start playing.
        this.model.initialize().then(() => {
            document.getElementById('message').innerText = 'Done loading model.'
            document.getElementById('play').disabled = false;
        });
    }

    generatingDone() {
      this.modelWorker.postMessage(["generate",model]);
      this.modelWorker.onmessage = function(e) {
        if (e.data[0] == "done") {
			console.log("generating done!");
          	var seq = e.data[1];
          	// do something with the generated sequence
        }
      };
    }

    generateSequence(chordsTemp, that) {

      return new Promise(function(resolve, reject) {
        that.playing = true;
        document.getElementById('play').disabled = true;
        that.currentChords = chordsTemp;

        const chords = that.currentChords;
        let seq = { 
			notes: [],
			quantizationInfo: {stepsPerQuarter: 4},
			totalQuantizedSteps: 1,
        }; 
        
        // Prime with root note of the first chord.
        const root = mm.chords.ChordSymbols.root(chords[0]);
        
        document.getElementById('message').innerText = 'Improvising over: ' + chords;
        that.model.continueSequence(seq, that.STEPS_PER_PROG + (that.NUM_REPS-1)*that.STEPS_PER_PROG - 1, 0.9, chords).then((contSeq) => {
          
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
          console.log(seq.totalQuantizedSteps);

        // Play it!
        resolve(seq);
        })
      });
    }

    checkChords() {
        const chords = [
            document.getElementById('chord1').value,
            document.getElementById('chord2').value,
            document.getElementById('chord3').value,
            document.getElementById('chord4').value
          ]; 
         
		const isGood = (chord) => {
		if (!chord) {
			return false;
		}
		try {
			mm.chords.ChordSymbols.pitches(chord);
			return true;
		}
		catch(e) {
			return false;
		}
		}
          
		var allGood = true;
		if (isGood(chords[0])) {
			document.getElementById('chord1').style.color = 'black';
		} else {
			document.getElementById('chord1').style.color = 'red';
			allGood = false;
		}
		if (isGood(chords[1])) {
			document.getElementById('chord2').style.color = 'black';
		} else {
			document.getElementById('chord2').style.color = 'red';
			allGood = false;
		}
		if (isGood(chords[2])) {
			document.getElementById('chord3').style.color = 'black';
		} else {
			document.getElementById('chord3').style.color = 'red';
			allGood = false;
		}
		if (isGood(chords[3])) {
			document.getElementById('chord4').style.color = 'black';
		} else {
			document.getElementById('chord4').style.color = 'red';
			allGood = false;
		}
          
		var changed = false;
		if (this.currentChords) {
			if (chords[0] !== this.currentChords[0]) {changed = true;}
			if (chords[1] !== this.currentChords[1]) {changed = true;}
			if (chords[2] !== this.currentChords[2]) {changed = true;}
			if (chords[3] !== this.currentChords[3]) {changed = true;}  
		}
		else {
			changed = true;
		}
		document.getElementById('play').disabled = !allGood || (!changed && this.playing);
    }
}