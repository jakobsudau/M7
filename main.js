// ---------------------------------------------------------------------------
// Main app
// ---------------------------------------------------------------------------
//import * as mm from "@magenta/music";
class App {
    constructor(midiAccess) {
        this.context = new AudioContext();
        this.midi = new Midi(midiAccess);
        this.model = new SequenceModel();
        this.metronome = new Metronome(this.context, this.midi);
        this.player = new mm.MIDIPlayer();

        this.model.initialize();
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

    playSequence(chords) {
        console.log("generating midi sequence...");
        this.midi.mainThreadBusy = true;
        const time = Date.now();
        this.model.generateSequence(chords, this.model).then(function(seq){
            this.midi.mainThreadBusy = false;
            console.log("playing midi sequence...");
            console.log("it took: " + ((Date.now() - time)/1000) + "s");
            
            this.player.requestMIDIAccess().then(() => {
                this.player.outputs = [this.midi.selectedOutput]; // If you omit this, a message will be sent to all ports.
                this.player.start(seq).then(() => {
                    document.getElementById('play').disabled = false;
                    document.getElementById('message').innerText = 'Change chords and play again!';
                    this.model.checkChords();
                });
            }); 
        }.bind(this));
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

        document.getElementById("click").addEventListener('click', function(){
            if (main.startStopClick()) {
                document.getElementById("click").style.background = "lightgrey";
            } else {
                document.getElementById("click").style.background = "white";
            }
        });

        // eventlistener for the play model button
        document.getElementById("play").addEventListener('click', function(){
            const chords = [
                document.getElementById('chord1').value,
                document.getElementById('chord2').value,
                document.getElementById('chord3').value,
                document.getElementById('chord4').value    
            ];
            main.playSequence(chords);
        });

        // Check chords for validity when changed.
        document.getElementById('chord1').oninput = main.model.checkChords;
        document.getElementById('chord2').oninput = main.model.checkChords;
        document.getElementById('chord3').oninput = main.model.checkChords;
        document.getElementById('chord4').oninput = main.model.checkChords; 
    });
} else {
    alert("No MIDI support in your browser.");
}