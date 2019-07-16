// -------------------------------------------------------------------------
// Metronome Class
// -------------------------------------------------------------------------

class Metronome {
    constructor(mainModule) {
        this.isPlaying = false;         // Are we currently playing?
        this.lookahead = 24.0;          // How frequently to call scheduling
                                        // function (in milliseconds)
        this.scheduleAheadTime = 0.1;   // How far ahead to schedule audio
                                        // (sec), this is calculated from
                                        // lookahead, and overlaps with next
                                        // interval (in case the timer is
        this.nextNoteTime = 0.0;        // late) When the next note is due.
        this.noteLength = 0.05;         // Length of "beep" (in seconds)
        this.timerWorker = null;        // WebWorker used to fire timer msgs
        this.bpm = 120;
        this.currentQuaterNote = 0;
        this.outputId = "internal";
        this.playOutput = false;
        this.audioContext = new AudioContext();
        this.gainNode = this.audioContext.createGain();
        this.isSeqStart = false;
        this.startTime = 0;
        this.currentTime = 0;
        // this.once = true;
        this.mainModule = mainModule;
    }

    startStop(){
        this.isPlaying = !this.isPlaying;

        if (this.isPlaying) {
            this.currentQuaterNote = 0;
            let beatOffset = 1;

            while(beatOffset > 0) {
                beatOffset -= 0.25;
                this.currentQuaterNote++;
                if (this.currentQuaterNote == 4){this.currentQuaterNote = 0}
            }

            this.nextNoteTime = this.audioContext.currentTime;
            // this.once = true;
            // this.midi.sendMIDIClockMessage("start");
            this.timerWorker.postMessage("start");
        } else {
            // this.once = false;
            // this.midi.sendMIDIClockMessage("stop");
            this.timerWorker.postMessage("stop");
        }
    }

    setVolume(value) {
        this.gainNode.gain.value = value;
    }

    nextNote() { //Advance current note and time by a quater note...
        const secondsPerBeat = 60.0 / this.bpm; //This picks up the CURRENT
                                                // bpm value to
                                                // calculate beat length
        this.nextNoteTime += secondsPerBeat;    //Add beat length to
                                                // last beat time
        this.currentTime = this.audioContext.currentTime;
        this.currentQuaterNote++;               //Advance beat num, wrap
                                                // to zero
        if (this.currentQuaterNote == 4) {this.currentQuaterNote = 0}
    }

    scheduleNote(beatNumber, time, data) {    //create an oscillator
        const timeDifference = (Date.now() - data) / 1000;
        console.log("time difference to worker event: " +
            timeDifference + "s");

        if (timeDifference > 0.001) {
            console.log("Too big!!!");
        } else {
            if (beatNumber % 16 == 0){
                this.playClick(true, time);
                this.mainModule.playTick(true);
            }else{
                this.playClick(false, time);
                this.mainModule.playTick(false);
            }
        }
    }

    playClick(isStart, time) {
        if (this.playOutput) {
            if (this.outputId == "internal") {
                let osc;
                osc = this.audioContext.createOscillator();
                osc.connect(this.gainNode);
                osc.frequency.value = isStart ? 880.0 : 440.0;
                osc.start(time);
                osc.stop(time + this.noteLength);
                osc.onended = function() {osc.disconnect()};
            } else {
                this.mainModule.midi.sendMIDIMetronomeMessage(isStart,
                    this.outputId, this.gainNode.gain.value);
            }
        }
    }

    scheduler(data) {   // while there are notes that will need to play
                        // before the next interval, schedule them and
                        // advance the pointer.
        const time = this.audioContext.currentTime + this.scheduleAheadTime;
        while (this.nextNoteTime < time) {
            this.scheduleNote(this.currentQuaterNote,
                            this.nextNoteTime, data);
            this.nextNote();
        }
    }

    initialize() {
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.gain.value = 0.8;
        this.timerWorker = null;
        this.timerWorker = new Worker("metronomeWorker.js");
        this.timerWorker.onmessage = function(e) {
            if (e.data.tick) {this.scheduler(e.data.tick)}}.bind(this);
        this.timerWorker.postMessage({"interval": this.lookahead});
    }
}