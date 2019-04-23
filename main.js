// ---------------------------------------------------------------------------
// Main app
// ---------------------------------------------------------------------------
//import * as mm from "@magenta/music";
class App {
    constructor(midiAccess) {
        this.midi = new Midi(midiAccess);
        this.model = new SequenceModel();
        this.metronome = new Metronome(this.midi, this.model);

        this.model.initialize().then(function() {
            this.model.generateSequence(["C", "Am", "G", "F"], this.model).then(function(seq){
                console.log("initialized");
                document.getElementById('play').disabled = false;
			    document.getElementById('generate').disabled = false;
                document.getElementById('message').innerText = 'Done loading model.'
            }.bind(this));
        }.bind(this));
        this.metronome.initialize();

        
    }

    startNote(note, velocity) {
        this.midi.sendMIDIMessage(note, velocity, true);
    }
    
    stopNote(note, velocity) {
        this.midi.sendMIDIMessage(note, velocity, false);
    }

    startStopClick() {
        this.metronome.startStop();
        return this.metronome.isPlaying;
    }

    changeCallResponseLength(length, isCall) {
        if (!isCall) {
            this.model.NUM_REPS = length;
            this.midi.callLength = length;
        };
    }

    startStopLoop() {
        this.metronome.loop();
        return this.metronome.isLooping;
    }

    changeClickVolume(volume) {
        this.metronome.gainNode.gain.value = volume;
    }

    generateSequence(chords) {
        console.log("generating midi sequence...");
        const time = Date.now();
        this.model.generateSequence(chords, this.model).then(function(seq){
            console.log("generating took: " + ((Date.now() - time)/1000) + "s");
            this.metronome.generatedSeq = seq;
            if (this.metronome.isPlaying) {this.playSequence();}
        }.bind(this));
    }

    playSequence() {
        this.metronome.sequenceQueue = true;
        if (!this.metronome.isPlaying) {
            this.metronome.playSequence(this.metronome.generatedSeq, this.metronome.player);
        }
    }
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({sysex: false}).then(function(midiAccess) {
        const main = new App(midiAccess);

        // creating eventlisteners for the note buttons
        const buttons = document.getElementsByClassName("button");
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('mousedown', function(){main.startNote(i+60, 100)});
            buttons[i].addEventListener('mouseup', function(){main.stopNote(i+60, 66)});
            buttons[i].addEventListener('keypress', function(){main.startNote(i+60, 100)});
            buttons[i].addEventListener('keyup', function(){main.stopNote(i+60, 66)});
        }

        // click functionality
        document.getElementById("click").addEventListener('click', function(){
            if (main.startStopClick()) {
                document.getElementById("click").style.background = "lightgrey";
            } else {
                document.getElementById("click").style.background = "white";
            }
        });

        // loop functionality
        document.getElementById("loop").addEventListener('click', function(){
            if (main.startStopLoop()) {
                document.getElementById("loop").style.background = "lightgrey";
            } else {
                document.getElementById("loop").style.background = "white";
            }
        });

        // eventlistener for the generate and play model button
        document.getElementById("generate").addEventListener('click', function(){
            const chords = [
                document.getElementById('chord1').value,
                document.getElementById('chord2').value,
                document.getElementById('chord3').value,
                document.getElementById('chord4').value    
            ];
            main.generateSequence(chords);
        });

        document.getElementById("play").addEventListener('click', function(){main.playSequence();});

        // Check chords for validity when changed
        document.getElementById('chord1').oninput = main.model.checkChords;
        document.getElementById('chord2').oninput = main.model.checkChords;
        document.getElementById('chord3').oninput = main.model.checkChords;
        document.getElementById('chord4').oninput = main.model.checkChords; 

        // Click volume control
        document.getElementById('clickVolumeSlider').addEventListener("input", function (e) {
            main.changeClickVolume(this.value/100);
        });

        // call and response lengths
        let radioButtons = document.getElementsByClassName("radioButton");
        for (var i=0; i<(radioButtons.length/2); i++) {
            radioButtons[i].addEventListener("change", function(e){
                main.changeCallResponseLength(this.value, false);
            });
            radioButtons[i+3].addEventListener("change", function(e){
                main.changeCallResponseLength(this.value, false);
            });
          } 
    });
} else {
    alert("No MIDI support in your browser.");
}