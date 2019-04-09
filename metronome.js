class Metronome {
    constructor(context, midi) {
        this.isPlaying = false;      //Are we currently playing?
        this.lookahead = 24.0;       //How frequently to call scheduling function (in milliseconds)
        this.scheduleAheadTime = 0.1;//How far ahead to schedule audio (sec), this is calculated from lookahead, and overlaps with next interval (in case the timer is late)
        this.nextNoteTime = 0.0;     //when the next note is due.
        this.noteLength = 0.05;      //length of "beep" (in seconds)
        this.timerWorker = null;     //The Web Worker used to fire timer messages
        this.bpm = 120;
        this.currentQuaterNote = 0;
        this.audioContext = context;
        this.gain = this.audioContext.createGain();
        this.midi = midi;
        this.playPressed = false;

        this.tempo = 120;
        this.nextClockTime = 0.0; // when the next note is due.
        this.startTime = 0;
        this.tempo = 60 / this.bpm / 24;
        this.currentTime = 0;
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
            this.timerWorker.postMessage("start");
        } else {
            this.timerWorker.postMessage("stop");
        }
    }

    nextNote() {                                    //Advance current note and time by a quater note...
        const secondsPerBeat = 60.0 / this.bpm;           //Notice this picks up the CURRENT bpm value to calculate beat length.
        this.nextNoteTime += secondsPerBeat;            //Add beat length to last beat time 
        this.currentTime = this.audioContext.currentTime;
        this.currentQuaterNote++;                                //Advance the beat number, wrap to zero
        if (this.currentQuaterNote == 4) {this.currentQuaterNote = 0;}
    }

    scheduleNote(beatNumber, time, data) {    //create an oscillator
        const timeDifference = (Date.now() - data)/1000;
        console.log("time difference to worker event: " + timeDifference);
        if (timeDifference > 0.001) {
            console.log("Too big!!!");
        } else {
            if (!this.midi.mainThreadBusy) {
                var osc = this.audioContext.createOscillator();
            osc.connect(this.gain);
            if (beatNumber % 16 == 0){               //beat 0 = high pitch 880
                osc.frequency.value = 440.0;
            }else{                                    //other notes = low pitch 440
                osc.frequency.value = 440.0;
            }
            osc.start(time);
            osc.stop(time + this.noteLength);
            }
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
        this.gain.connect(this.audioContext.destination);
        this.gain.gain.value = 0.8;
        this.timerWorker = new Worker("metronomeWorker.js");
        this.timerWorker.onmessage = function(e) {if (e.data.tick) {this.scheduler(e.data.tick);}}.bind(this);
        this.timerWorker.postMessage({"interval":this.lookahead});
    }
    
    
    //------------------------------------------------------------------------------------------------------------------------------------
    play() {
        if (this.isPlaying) {
            //toggle icon to arrow
            this.isPlaying = false;
            this.stop();
        }
        else {
            this.playPressed = true;
            this.isPlaying = true;
            //toggle icon to square
            this.nextClockTime = 0;
            this.tempo = 60 / this.bpm / 24;
            this.startTime = this.audioContext.currentTime + 0.005;
            this.scheduleClock();
        }
    }

    //Stops the MIDI clock
    stop() {
        this.midi.midiAccess.outputs.get(this.midi.selectedClockOutput.id).send([0xFC]);
        window.clearTimeout(timerID);
    }

    //schedules when the next clock should fire
    scheduleClock() {
        const currentTime = this.audioContext.currentTime;
        currentTime -= this.startTime;

        while (this.nextClockTime < currentTime + this.scheduleAheadTime) {
            if (this.playPressed) {
                setTimeout(function() {
                    //send midi clock start only the first beat! 
                    //timeout needed to avoid quick first pulse
                    this.playPressed = false;
                    this.midi.midiAccess.outputs.get(this.midi.selectedClockOutput.id).send([0xFA]);
                    this.midi.midiAccess.outputs.get(this.midi.selectedClockOutput.id).send([0xF8]);
                }.bind(this), currentTime + this.nextClockTime);
            }
            
            this.midi.midiAccess.outputs.get(this.midi.selectedClockOutput.id).send([0xF8]);
            this.nextClockTime += this.tempo;

        }
        timerID = setTimeout(function(){this.scheduleClock();}.bind(this), 0);
    }
}