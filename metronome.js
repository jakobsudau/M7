class Metronome {
    constructor(context) {
        this.isPlaying = false;      //Are we currently playing?
        this.lookahead = 25.0;       //How frequently to call scheduling function (in milliseconds)
        this.scheduleAheadTime = 0.1;//How far ahead to schedule audio (sec), this is calculated from lookahead, and overlaps with next interval (in case the timer is late)
        this.nextNoteTime = 0.0;     //when the next note is due.
        this.noteLength = 0.05;      //length of "beep" (in seconds)
        this.timerWorker = null;     //The Web Worker used to fire timer messages
        this.tempo = 120;
        this.currentQuaterNote = 0;
        this.audioCtx = context;
        this.gain = this.audioCtx.createGain();
        this.mute = true;
    }

    startStop(){
        this.isPlaying = !this.isPlaying;

        if (this.isPlaying) {    //start playing
            var quatersPerSecond = 60.0/this.tempo;
            this.currentQuaterNote = 0;
            let beatOffset = 1;

            while(beatOffset > 0) {
                beatOffset -= 0.25;
                this.currentQuaterNote++;
                if (this.currentQuaterNote == 4){this.currentQuaterNote = 0;}
            }

            this.nextNoteTime = this.audioCtx.currentTime+(quatersPerSecond-quatersPerSecond);
            this.timerWorker.postMessage("start");
        } else {
            this.timerWorker.postMessage("stop");
        }
    }

    muteUnmute() {
        if (this.mute) {
            this.gain.gain.value = 1;
        } else {
            this.gain.gain.value = 0;
        }
        this.mute = !this.mute;
    }

    nextNote() {                                    //Advance current note and time by a quater note...
        var secondsPerBeat = 60.0 / this.tempo;    //Notice this picks up the CURRENT tempo value to calculate beat length.
        this.nextNoteTime += secondsPerBeat;           //Add beat length to last beat time

        this.currentQuaterNote++;                                //Advance the beat number, wrap to zero
        if (this.currentQuaterNote == 4) {this.currentQuaterNote = 0;}
    }

    scheduleNote(beatNumber, time) {    //create an oscillator
        var osc = this.audioCtx.createOscillator();
        osc.connect(this.gain);
        if (beatNumber % 16 == 0){               //beat 0 = high pitch
            osc.frequency.value = 880.0;
        }else{                                    //other notes = low pitch
            osc.frequency.value = 440.0;
        }
        osc.start(time);
        osc.stop(time + this.noteLength);
        if (this.ready) {
            playSeq(seq);
            this.ready = false;
        }
    }

    scheduler() { // while there are notes that will need to play before the next interval, schedule them and advance the pointer.
        while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentQuaterNote, this.nextNoteTime, this);
            this.nextNote(this);
        }
    }

    initialize() {
        this.gain.connect(this.audioCtx.destination);
        const that = this;
        this.gain.gain.value = 0
        this.timerWorker = new Worker("metronomeWorker.js");
        this.timerWorker.onmessage = function(e) {if (e.data == "tick") {that.scheduler(that);}};
        this.timerWorker.postMessage({"interval":this.lookahead});
    }
}