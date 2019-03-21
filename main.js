// ---------------------------------------------------------------------------
// Main app
// ---------------------------------------------------------------------------

class App {
    constructor(midiAccess) {
        this.context = new AudioContext();
        this.midi = new Midi(midiAccess);
        this.model = new SequenceModel();
        this.metronome = new Metronome(this.context);
        this.player = new mm.MIDIPlayer();

        this.model.initialize();
        this.metronome.initialize();
        this.metronome.startStop();
    }

    startNote(note, velocity) {
        this.midi.sendMIDIMessage(note, velocity, true);
    }
    
    stopNote(note, velocity) {
        this.midi.sendMIDIMessage(note, velocity, false);
    }

    startStopClick() {
        this.metronome.muteUnmute();
        return this.metronome.mute;
    }

    playSequence(chords) {
        let that = this;
        this.model.generateSequence(chords, this.model).then(function(seq){
            console.log("playing midi sequence...");
            
            that.player.requestMIDIAccess().then(() => {
                that.player.outputs = [that.midi.selectedOutput]; // If you omit this, a message will be sent to all ports.
                that.player.start(seq).then(() => {
                    document.getElementById('message').innerText = 'Change chords and play again!';
                    that.model.checkChords();
                });
            }); 
        });
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
                document.getElementById("click").style.background = "white";
            } else {
                document.getElementById("click").style.background = "lightgrey";
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
    });
} else {
    alert("No MIDI support in your browser.");
}