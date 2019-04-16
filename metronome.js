class Metronome {
    constructor(midi) {
        this.isPlaying = false;      //Are we currently playing?
        this.lookahead = 24.0;       //How frequently to call scheduling function (in milliseconds)
        this.scheduleAheadTime = 0.1;//How far ahead to schedule audio (sec), this is calculated from lookahead, and overlaps with next interval (in case the timer is late)
        this.nextNoteTime = 0.0;     //when the next note is due.
        this.noteLength = 0.05;      //length of "beep" (in seconds)
        this.timerWorker = null;     //The Web Worker used to fire timer messages
        this.bpm = 120;
        this.currentQuaterNote = 0;
        this.audioContext = new AudioContext();
        this.gainNode = this.audioContext.createGain();
        this.midi = midi;
        this.playPressed = false;

        this.tempo = 120;
        this.nextClockTime = 0.0; // when the next note is due.
        this.startTime = 0;
        this.tempo = 60 / this.bpm / 24;
        this.currentTime = 0;
        
        this.once = true;
        this.generatedSeq = null
        this.sequenceQueue = false;
        this.player = new mm.MIDIPlayer();
        this.isLooping = false;
        this.sequenceFinished = true;
        this.callCounter = 0;
        this.callLength = 2;
    }

    playSequence(seq) {
        this.player.requestMIDIAccess().then(() => {
            this.sequenceFinished = false;
            this.player.outputs = [this.midi.selectedOutput]; // If you omit this, a message will be sent to all ports.
            this.player.start(seq).then(() => {
                this.sequenceFinished = true;
                if (!this.isLooing) {
                    document.getElementById('play').disabled = false;
                    document.getElementById('message').innerText = 'Change chords and play again!';
                    //this.model.checkChords();
                }
            });
        }); 
    }

    loop() {
        this.isLooping = !this.isLooping;
    }

    startStop(){
        this.isPlaying = !this.isPlaying;

        if (this.isPlaying) {    //start playing
            const quatersPerSecond = 60.0 / this.bpm;
            this.currentQuaterNote = 0;
            let beatOffset = 1;

            while(beatOffset > 0) {
                beatOffset -= 0.25;
                this.currentQuaterNote++;
                if (this.currentQuaterNote == 4){this.currentQuaterNote = 0;}
            }
            
            this.nextNoteTime = this.audioContext.currentTime+(quatersPerSecond-quatersPerSecond);
            // this.once = true;
            // this.midi.sendMIDIClockMessage("start");
            this.timerWorker.postMessage("start");
        } else {
            // this.once = false;
            // this.midi.sendMIDIClockMessage("stop");
            this.timerWorker.postMessage("stop");
        }
    }

    nextNote() {                                            //Advance current note and time by a quater note...
        const secondsPerBeat = 60.0 / this.bpm;             //Notice this picks up the CURRENT bpm value to calculate beat length.
        this.nextNoteTime += secondsPerBeat;                //Add beat length to last beat time 
        this.currentTime = this.audioContext.currentTime;
        this.currentQuaterNote++;                           //Advance the beat number, wrap to zero
        if (this.currentQuaterNote == 4) {this.currentQuaterNote = 0;}
    }

    scheduleNote(beatNumber, time, data) {    //create an oscillator
        const timeDifference = (Date.now() - data)/1000;
        console.log("time difference to worker event: " + timeDifference + "s");

        // if (this.once) {
        //     this.midi.sendMIDIClockMessage("tick");
        //     this.once = false;
        // }

        if (timeDifference > 0.001) {
            console.log("Too big!!!");
        } else {
            // this.midi.sendMIDIClockMessage("tick");
            let osc = this.audioContext.createOscillator();
            osc.connect(this.gainNode);
            if (beatNumber % 16 == 0){               //beat 0 = high pitch 880
                if (this.sequenceQueue && this.sequenceFinished) {
                    this.playSequence(this.generatedSeq);
                    if (!this.isLooping) {
                        this.sequenceQueue = false;
                    }
                }
                osc.frequency.value = 880.0;
                if (!this.sequenceFinished) {
                    this.callCounter++
                    if (this.callCounter == 4) {
                        this.callCounter = 0;
                        this.callLength--;
                        console.log(this.callLength);
                        if (this.callLength == 0) {
                            console.log("call length: " + this.callLength);
                        }
                    }
                }
                console.log(this.callCounter);
            }else{                                    //other notes = low pitch 440
                osc.frequency.value = 440.0;
            }
            osc.start(time);
            osc.stop(time + this.noteLength);
        }
        // console.log(this.currentQuaterNote);
        // console.log("it took: " + ((this.audioContext.currentTime - this.currentTime)/1000) + "s");
    }

    scheduler(data) { // while there are notes that will need to play before the next interval, schedule them and advance the pointer.
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentQuaterNote, this.nextNoteTime, data);
            this.nextNote();
        }
    }

    initialize() {
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.gain.value = 0.8;
        this.timerWorker = new Worker("metronomeWorker.js");
        this.timerWorker.onmessage = function(e) {if (e.data.tick) {this.scheduler(e.data.tick);}}.bind(this);
        this.timerWorker.postMessage({"interval":this.lookahead});
    }
}