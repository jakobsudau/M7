class Metronome {
    constructor() {
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

        this.tempo = 120;
        this.nextClockTime = 0.0; // when the next note is due.
        this.startTime = 0;
        this.tempo = 60 / this.bpm / 24;
        this.currentTime = 0;
        
        // this.once = true;
        this.players = [];
        this.sequenceFinished = true;
        this.inputBarCounter = 0;
        this.inputBars = 4;

        this.generatedSequences = new Map();
    }

    playSequence(id, playAll) {
        console.log(this.players[id]);
        this.players[id].requestMIDIAccess().then(() => {
            
            this.sequenceFinished = false;
            this.generatedSequences.forEach((value,key) => {
                const inQueue = value[3];
                if (((id == key) || playAll) && inQueue) {
                    const seq = value[0];
                    const output = value[1];
                    const looped = value[2];
                    const playButton = value[4];
                    const messageDiv = value[5];

                    playButton.disabled = true;
                    value[3] = false;

                    this.players[id].outputs = [output]; // If you omit this, a message will be sent to all ports.
                    this.players[id].start(seq).then(() => {
                        this.sequenceFinished = true;
                        if (looped) {
                            value[3] = true;
                            this.playSequence(id, false);
                        } else {
                            playButton.disabled = false;
                            console.log(id);
                            messageDiv.innerText = 'Change chords and play again!';
                        }
                    });
                }
            });
        }); 
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
            if (beatNumber % 16 == 0){
                
                // if there is still a sequence in queue and nothing is playing right now, play the currently generated sequence
                if (this.generatedSequences.size != 0) {
                    console.log("playing sequence");
                    this.playSequence(0, true);
                }
                
                if (!this.sequenceFinished) {
                    this.inputBarCounter++
                    if (this.inputBarCounter == (this.inputBars*2)) {
                        this.inputBarCounter = 0;
                        console.log("sequence should be over now, if loop is enabled start again now");
                    }
                }

                osc.frequency.value = 880.0;
            }else{ 
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