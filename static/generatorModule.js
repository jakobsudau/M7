// -------------------------------------------------------------------------
// Generator Module Class
// -------------------------------------------------------------------------

class GeneratorModule {
    constructor(mainModule, id) {
        this.mainModule = mainModule;
        this.connector = new Connector(this);
        this.outputBars = 4;
        this.inputBars = 4;
        this.barCounter = 0;
        this.looping = true;
        this.playing = false;
        this.keepMutating = false;
        this.generatedSeq = null;
        this.playButton = null;
        this.generateButton = null;
        this.mutateButton = null;
        this.stopButton = null;
        this.listenButton = null;
        this.generatorModuleContainer = null;
        this.id = id;
        this.selectedOutput = this.mainModule.midi.availableOutputs[0];
        this.selectedInput = this.mainModule.midi.availableInputs[0];
        this.inQueue = false;
        this.listening = false;
        this.generationTime = Date.now();
        this.inputStartTime = Date.now();
        this.temperature = 1;
        this.player = new mm.MIDIPlayer();
        this.shouldPlay = false;
        this.inputSequence = {
            notes: [],
            quantizationInfo: {stepsPerQuarter: 4},
            totalQuantizedSteps: 1,
        };
        this.stepsPerChord = 8;
        this.stepsPerProg = 4 * this.stepsPerChord;

        this.createUIElements();

        this.playButton.disabled = true;
        this.generateButton.disabled = true;

        // ------------ Experiments with different MIDI Players ------------
        // let seq1 = {
        //     notes: [
        //         {pitch: 62, quantizedStartStep: 0, quantizedEndStep: 2},
        //         {pitch: 64, quantizedStartStep: 2, quantizedEndStep: 4},
        //         {pitch: 66, quantizedStartStep: 4, quantizedEndStep: 6},
        //         {pitch: 68, quantizedStartStep: 6, quantizedEndStep: 8},
        //         {pitch: 70, quantizedStartStep: 8, quantizedEndStep: 10},
        //         {pitch: 72, quantizedStartStep: 10, quantizedEndStep: 12},
        //         {pitch: 74, quantizedStartStep: 12, quantizedEndStep: 14},
        //     ],
        //     quantizationInfo: {stepsPerQuarter: 4},
        //     totalQuantizedSteps: 14,
        // };

        // let seq2 = {
        //     notes: [
        //         {pitch: 30, quantizedStartStep: 0, quantizedEndStep: 2},
        //         {pitch: 32, quantizedStartStep: 2, quantizedEndStep: 4},
        //         {pitch: 34, quantizedStartStep: 4, quantizedEndStep: 6},
        //     ],
        //     quantizationInfo: {stepsPerQuarter: 4},
        //     totalQuantizedSteps: 14,
        // };

        // let player1 = new mm.MIDIPlayer();
        // let player2 = new mm.MIDIPlayer();

        // player1.outputs = [this.selectedOutput];
        // player2.outputs = [this.selectedOutput];

        // player2.start(seq2).then(() => {
        //     console.log("player2 done!");
        // });

        // player1.start(seq1).then(() => {
        //     console.log("player1 done!");
        // });

        // JZZ().or('Cannot start MIDI engine!')
        //     .openMidiOut().or('Cannot open MIDI Out port!')
        //     .wait(500).send([0x90,60,127]) // note on
        //     .wait(500).send([0x80,60,0]);  // note off
        // JZZ().openMidiIn().or('Cannot open MIDI In port!')
        //     .and(function() { console.log('MIDI-In: ', this.name()); })
        //     .connect(function(msg) { console.log(msg.toString()); })
        //     .wait(10000).close();
        // -----------------------------------------------------------------
    }

    initialize() {
        return new Promise(function(resolve, reject) {
            console.log("initializing model with placeholder id " +
            this.id + "...");
        this.logTime = Date.now();
        this.connector.initialize(this.id).then((msg) => {
            this.generateButton.disabled = false;
            this.addBassProg = (this.id == 0);
            this.id = msg.data;
            console.log("model " + this.id + " initialization done, " +
                "it took " + ((Date.now() - this.logTime)/1000) + "s");
            resolve(this.id);
        });
        }.bind(this));
    }

    deleteModule() {
        const mainSubContainer =document.getElementById("mainSubContainer");
        mainSubContainer.removeChild(this.generatorModuleContainer);
        this.mainModule.deleteModule(this.id);
        this.connector.delete();

        delete this.mainModule;
        delete this.outputBars;
        delete this.inputBars;
        delete this.barCounter;
        delete this.looping;
        delete this.playing;
        delete this.keepMutating;
        delete this.generatedSeq;
        delete this.playButton;
        delete this.generateButton;
        delete this.mutateButton;
        delete this.stopButton;
        delete this.listenButton;
        delete this.generatorModuleContainer;
        delete this.id;
        delete this.selectedOutput;
        delete this.selectedInput;
        delete this.inQueue;
        delete this.listening;
        delete this.generationTime;
        delete this.inputStartTime;
        delete this.temperature;
        delete this.player;
        delete this.shouldPlay;
        delete this.inputSequence;
        delete this.stepsPerChord;
        delete this.stepsPerProg;
        delete this.logTime;
    }

    startStopNote(note, velocity, isStart) {
        // console.log("note: " + note);
        // console.log("velocity: " + velocity);
        // console.log("isStart: " + isStart);

        const currentTime = Date.now();
        const bpm = 120;
        const stepsPerQuater = 4;
        const secondsPerQuater = 60 / bpm;
        const timeStep = secondsPerQuater / stepsPerQuater;
        const playedAt = ((currentTime - this.inputStartTime)/1000);
            // in secs
        const playedAtQuantized=(playedAt-(playedAt%timeStep))/timeStep;
            // round

        // constraint: input notes must be between 48 and 83
        while (!(note >= 48 && note <= 83)) {
            if (note < 48) {
                note += 12;
            } else if (note > 83) {
                note -= 12;
            }
        }

        // console.log("played at: " + playedAt + "s");
        if (this.inputSequence.totalQuantizedSteps < playedAtQuantized) {
            this.inputSequence.totalQuantizedSteps = playedAtQuantized;
        }

        if (isStart) {
            this.inputSequence.notes.push(
                {pitch: note,
                quantizedStartStep: playedAtQuantized,
                quantizedEndStep: 0});
        } else {
            const idx = this.inputSequence.notes.findIndex(
                x => (x.pitch === note && x.quantizedEndStep === 0));
                if (this.inputSequence.notes[idx] != undefined) {
                this.inputSequence.notes[idx].quantizedEndStep =
                    playedAtQuantized;
            }
        }
    }

    generateSequence(chords) {
        this.generateButton.disabled = true;
        // console.log("----START----");
        // console.log("Generator Module: " + this.id);
        // console.log("generating midi sequence over: " + chords);
        // console.log("with output length: " + this.outputBars);
        // console.log("and following input sequence: ");
        // console.log(this.inputSequence);
        // console.log("--------");
        this.generationTime = Date.now();

        this.connector.generateSequence({
            cmd: "generate",
            seq: this.inputSequence,
            temp: this.temperature,
            chords: chords,
            outputBars: this.outputBars,
            id: this.id,
            addBassProg: this.addBassProg});
    }

    // callback from server when generating is done,
    // expecting json formatted sequence
    generateSequenceCallback(data) {
        console.log("generator " + this.id + ": generating on server " +
        "took: " + ((Date.now() - this.generationTime)/1000) + "s");
        this.generatedSeq = data.data;
        // console.log("getting back this sequence: ");
        // console.log(this.generatedSeq);
        // console.log("----END----");
        this.generateButton.disabled = false;
        this.generateButton.style.background =
            `hsla(${Math.random() * 360}, 80%, 70%, 0.3)`;

        if (this.generatedSeq != null && !this.playing) {
            this.playButton.disabled = false;
        }

        // ------------ Experiments with different MIDI Players ------------
        // let midiFile = mm.sequenceProtoToMidi(this.generatedSeq);
        // console.log(midiFile);
        // var midiout = JZZ().openMidiOut();
        // var data = require('fs').readFileSync('file.mid', 'binary');
        // var smf = new JZZ.MIDI.SMF(data);
        // var player = smf.player();
        // player.connect(midiout);
        // player.play();
        // -----------------------------------------------------------------
    }

    playGeneratedSequence() {
        if (!this.playing && this.shouldPlay) {
            this.player.requestMIDIAccess().then(() => {
                if (this.keepMutating) {
                    const chords = [
                        document.getElementById("chord1").value,
                        document.getElementById("chord2").value,
                        document.getElementById("chord3").value,
                        document.getElementById("chord4").value
                    ];
                    this.generateSequence(chords);
                }

                this.playButton.disabled = true;
                this.playing = true;
                if (this.listening) {
                    this.barCounter = 0;
                    console.log(this.inputSequence);
                    this.inputStartTime = Date.now();
                    this.inputSequence.notes = [];
                    this.inputSequence.totalQuantizedSteps = 1;
                }
                this.player.outputs = [this.selectedOutput];
                // omitting player.outputs = message to all ports

                this.player.start(this.generatedSeq, this.mainModule.metronome.bpm).then(() => {
                    this.playButton.disabled = false;
                    this.playing = false;

                    if (!this.looping) {
                        this.shouldPlay = false;
                        this.stopButton.disabled = false;
                        this.looping = true;
                    }

                    if (this.looping &&
                        !this.mainModule.metronome.isPlaying) {
                        this.playGeneratedSequence();
                    }
                });
            });
        }
    }

    playTick() {
        if (this.shouldPlay) {
            this.playGeneratedSequence();
        }

        if (this.listening) {
            console.log(this.barCounter);
            if (this.barCounter == this.inputBars-1) {
                this.mainModule.metronome.isSeqStart = true;
            }
            if (this.barCounter < (this.inputBars-1)) {
                this.barCounter++
            }
        }
    }

    stopPlayback() {
        console.log("stopping...");
        this.player.stop();
        this.playButton.disabled = false;
        this.stopButton.disabled = false;
        this.playing = false;
        this.shouldPlay = false;
    }

    stopModule() {
        this.looping = false;
        this.stopButton.disabled = true;
    }

    changeBpm(value) {
        this.player.setTempo(value);
    }

    mutate() {
        this.keepMutating = !this.keepMutating;

        if (this.keepMutating) {
            this.mutateButton.className = "mutateButton enabled";
        } else {
            this.mutateButton.className = "mutateButton disabled";
        }
    }

    setPlayActive() {
        if (this.mainModule.metronome.isPlaying) {
            this.shouldPlay = true;
        } else {
            this.shouldPlay = true;
            this.playGeneratedSequence();
        }
    }

    changeInputOutputBarsLength(length, isOutput) {
        if (isOutput) {
            this.outputBars = length;
        } else {
            this.inputBars = length;
        }
    }

    startStopListening() {
        this.listening = !this.listening;
        this.inputStartTime = Date.now();
        if (this.listening == true) {
            this.listenButton.className = "listenButton enabled";
            this.inputSequence.notes = [];
            this.inputSequence.totalQuantizedSteps = 1;
        } else if (this.listening == false) {
            this.listenButton.className = "listenButton disabled";
            console.log(this.inputSequence);
            this.barCounter = 0;
        }
    }

    createUIElements() {
        this.generatorModuleContainer = document.createElement("div");
        this.generatorModuleContainer.id = "generatorModuleContainer";
        this.generatorModuleContainer.className = "container";

        let generatorModuleTitleDiv = document.createElement("input");
        generatorModuleTitleDiv.type = "text";
        generatorModuleTitleDiv.className = "generatorTitleDiv";
        generatorModuleTitleDiv.placeholder = "Generator " + this.id;
        generatorModuleTitleDiv.title = "Set your custom name for this " +
            "Generator Module";

        let generatorButtonDiv = document.createElement("div");
        generatorButtonDiv.className = "generatorButtonDiv";

        let playContainer = document.createElement("div");
        playContainer.className = "container";

        this.generateButton = document.createElement("button");
        this.generateButton.className = "generateButton";
        this.generateButton.innerHTML = "☰";
        this.generateButton.title = "Generate a sequence based on an " +
            "input sequence and chords";
        this.generateButton.disabled = true;

        this.playButton = document.createElement("button");
        this.playButton.className = "playButton";
        this.playButton.innerHTML = "►";
        this.playButton.title = "Play the generated sequence";
        this.playButton.disabled = true;

        this.stopButton = document.createElement("button");
        this.stopButton.id = "stopButton";
        this.stopButton.className = "stopButton";
        this.stopButton.innerHTML = "■";
        this.stopButton.title = "Stop playback of this Generator Module " +
            "after sequence is finished";

        this.mutateButton = document.createElement("button");
        this.mutateButton.className = "mutateButton";
        this.mutateButton.innerHTML = "↻";
        this.mutateButton.title = "Keep generating new sequences";

        this.listenButton = document.createElement("button");
        this.listenButton.className = "listenButton";
        this.listenButton.innerHTML = "●";
        this.listenButton.title = "Listen for input MIDI on the selected " +
            "MIDI In Port";

        let deleteButton = document.createElement("button");
        deleteButton.className = "deleteButton";
        deleteButton.innerHTML = "X";
        deleteButton.title = "Delete this Generator Module";

        let barsContainer = document.createElement("div");
        barsContainer.className = "barsContainer";

        let inputBarsContainer = document.createElement("div");
        inputBarsContainer.id = "inputBarsContainer";
        inputBarsContainer.className = "container";

        let inputBarsContainerText = document.createElement("div");
        inputBarsContainerText.innerHTML = "Input Bars";

        let inputBarsOptionsContainer = document.createElement("div");

        const inputBarsTitle = "Bar length of the input sequences";

        let inputBarsOptions = [];

        inputBarsOptions[0] = document.createElement("input");
        inputBarsOptions[0].className = "radioButton";
        inputBarsOptions[0].name = "inputBarsOption" + this.id;
        inputBarsOptions[0].type = "radio";
        inputBarsOptions[0].value = "2";
        inputBarsOptions[0].title = inputBarsTitle;

        inputBarsOptions[1] = document.createElement("input");
        inputBarsOptions[1].className = "radioButton";
        inputBarsOptions[1].name = "inputBarsOption" + this.id;
        inputBarsOptions[1].type = "radio";
        inputBarsOptions[1].value = "4";
        inputBarsOptions[1].checked = "checked";
        inputBarsOptions[1].title = inputBarsTitle;

        inputBarsOptions[2] = document.createElement("input");
        inputBarsOptions[2].className = "radioButton";
        inputBarsOptions[2].name = "inputBarsOption" + this.id;
        inputBarsOptions[2].type = "radio";
        inputBarsOptions[2].value = "8";
        inputBarsOptions[2].title = inputBarsTitle;

        let outputBarsContainer = document.createElement("div");
        outputBarsContainer.id = "outputBarsContainer";
        outputBarsContainer.className = "container";

        let outputBarsContainerText = document.createElement("div");
        outputBarsContainerText.innerHTML = "Output Bars";

        let outputBarsOptionsContainer = document.createElement("div");

        const outputBarsTitle = "Bar length of the output sequences";

        let outputBarsOptions = [];

        outputBarsOptions[0] = document.createElement("input");
        outputBarsOptions[0].className = "radioButton";
        outputBarsOptions[0].name = "outputBarsOption" + this.id;
        outputBarsOptions[0].type = "radio";
        outputBarsOptions[0].value = "2";
        outputBarsOptions[0].title = outputBarsTitle;

        outputBarsOptions[1] = document.createElement("input");
        outputBarsOptions[1].className = "radioButton";
        outputBarsOptions[1].name = "outputBarsOption" + this.id;
        outputBarsOptions[1].type = "radio";
        outputBarsOptions[1].value = "4";
        outputBarsOptions[1].checked = "checked";
        outputBarsOptions[1].title = outputBarsTitle;

        outputBarsOptions[2] = document.createElement("input");
        outputBarsOptions[2].className = "radioButton";
        outputBarsOptions[2].name = "outputBarsOption" + this.id;
        outputBarsOptions[2].type = "radio";
        outputBarsOptions[2].value = "8";
        outputBarsOptions[2].title = outputBarsTitle;

        let outputBarsOption1Text = document.createTextNode("2");
        let outputBarsOption2Text = document.createTextNode("4");
        let outputBarsOption3Text = document.createTextNode("8");

        let inputBarsOption1Text = document.createTextNode("2");
        let inputBarsOption2Text = document.createTextNode("4");
        let inputBarsOption3Text = document.createTextNode("8");

        let midiOutContainer = document.createElement("div");
        midiOutContainer.id = "midiOutContainer";
        midiOutContainer.className = "container";

        let midiContainer = document.createElement("div");
        midiContainer.className = "midiContainer";

        let midiOutText = document.createElement("div");
        midiOutText.innerHTML = "MIDI Out";

        let midiOutBusSelect = document.createElement("select");
        midiOutBusSelect.title = "MIDI Port for the outgoing " +
            "generated sequence";

        let midiInContainer = document.createElement("div");
        midiInContainer.id = "midiInContainer";
        midiInContainer.className = "container";

        let midiInSelectContainer = document.createElement("div");
        midiInSelectContainer.className = "midiInSelectContainer";

        let midiInText = document.createElement("div");
        midiInText.innerHTML = "MIDI In";

        let midiInBusSelect = document.createElement("select");
        midiInBusSelect.title = "MIDI Port for the incoming MIDI data to " +
            "generate a new sequence";

        let temperatureContainer = document.createElement("div");
        temperatureContainer.id = "temperatureContainer";
        temperatureContainer.className = "container";

        let temperatureSlider = document.createElement("input");
        temperatureSlider.type = "range";
        temperatureSlider.className = "temperatureSlider";
        temperatureSlider.min = "0";
        temperatureSlider.max = "200";
        temperatureSlider.value = "100";

        temperatureSlider.title = "Controls the temperature level from " +
            "0 to 2";
        let temperatureTitleDiv = document.createElement("div");
        temperatureTitleDiv.className = "temperatureTitleDiv";
        temperatureTitleDiv.innerHTML = "Temperature 1.0";
        temperatureTitleDiv.title = "The temperature controls how " +
            "'erratic' or 'simple' the generated sequence should be, min " +
            "is very simple and max is very erratic";

        generatorButtonDiv.appendChild(this.generateButton);
        generatorButtonDiv.appendChild(this.playButton);
        generatorButtonDiv.appendChild(this.stopButton);
        generatorButtonDiv.appendChild(this.mutateButton);
        midiOutContainer.appendChild(midiOutText);
        midiOutContainer.appendChild(midiOutBusSelect);
        midiInContainer.appendChild(midiInSelectContainer);
        midiInSelectContainer.appendChild(midiInText);
        midiInSelectContainer.appendChild(midiInBusSelect);
        midiInContainer.appendChild(this.listenButton);
        midiContainer.appendChild(midiOutContainer);
        midiContainer.appendChild(midiInContainer);
        barsContainer.appendChild(inputBarsContainer);
        barsContainer.appendChild(outputBarsContainer);
        inputBarsContainer.appendChild(inputBarsContainerText);
        inputBarsContainer.appendChild(inputBarsOptionsContainer);
        outputBarsContainer.appendChild(outputBarsContainerText);
        outputBarsContainer.appendChild(outputBarsOptionsContainer);
        inputBarsOptionsContainer.appendChild(inputBarsOptions[0]);
        inputBarsOptionsContainer.appendChild(inputBarsOption1Text);
        inputBarsOptionsContainer.appendChild(inputBarsOptions[1]);
        inputBarsOptionsContainer.appendChild(inputBarsOption2Text);
        inputBarsOptionsContainer.appendChild(inputBarsOptions[2]);
        inputBarsOptionsContainer.appendChild(inputBarsOption3Text);
        outputBarsOptionsContainer.appendChild(outputBarsOptions[0]);
        outputBarsOptionsContainer.appendChild(outputBarsOption1Text);
        outputBarsOptionsContainer.appendChild(outputBarsOptions[1]);
        outputBarsOptionsContainer.appendChild(outputBarsOption2Text);
        outputBarsOptionsContainer.appendChild(outputBarsOptions[2]);
        outputBarsOptionsContainer.appendChild(outputBarsOption3Text);
        temperatureContainer.appendChild(temperatureSlider);
        temperatureContainer.appendChild(temperatureTitleDiv);
        this.generatorModuleContainer.appendChild(generatorModuleTitleDiv);
        this.generatorModuleContainer.appendChild(barsContainer);
        this.generatorModuleContainer.appendChild(temperatureContainer);
        this.generatorModuleContainer.appendChild(midiContainer);

        this.generatorModuleContainer.appendChild(generatorButtonDiv);
        this.generatorModuleContainer.appendChild(deleteButton);

        const mainSubContainer =document.getElementById("mainSubContainer");
        mainSubContainer.appendChild(this.generatorModuleContainer);

        this.playButton.addEventListener('click', function() {
            this.setPlayActive()}.bind(this));
        deleteButton.addEventListener('click', function() {
            this.deleteModule()}.bind(this));
        temperatureSlider.addEventListener("input", function(e) {
            this.temperature = (e.target.value/100);
            temperatureTitleDiv.innerHTML = "Temperature " +
                this.temperature;

        }.bind(this));

        this.stopButton.addEventListener('click', function(){
            this.stopModule()}.bind(this));

        this.mutateButton.addEventListener('click', function(){
            this.mutate()}.bind(this));

        // listen for input functionality
        this.listenButton.addEventListener('click', function(){
            this.startStopListening()}.bind(this));

        // Populate the MidiOut and MidiIn lists
        midiOutBusSelect.innerHTML = this.mainModule.midi.availableOutputs
            .map(i =>`<option>${i.name}</option>`).join('');
        midiOutBusSelect.addEventListener("change", function() {
            const selOut = midiOutBusSelect.selectedIndex;
            this.selectedOutput=this.mainModule.midi
                .availableOutputs[selOut];
        }.bind(this));

        midiInBusSelect.innerHTML = this.mainModule.midi.availableInputs
            .map(i =>`<option>${i.name}</option>`).join('');
        midiInBusSelect.addEventListener("change", function() {
            const selIn = midiInBusSelect.selectedIndex;
            this.selectedInput = this.mainModule.midi
                .availableInputs[selIn];
        }.bind(this));

        // eventlistener for the generate and play model button
        this.generateButton.addEventListener('click', function(){
            this.generateSequence([document.getElementById("chord1").value,
                document.getElementById("chord2").value,
                document.getElementById("chord3").value,
                document.getElementById("chord4").value]);}.bind(this));

        // input and output bars lengths
        const that = this;
        for (let i=0; i<(inputBarsOptions.length); i++) {
            inputBarsOptions[i].addEventListener("change", function(e){
                that.changeInputOutputBarsLength(this.value, false);
            });
            outputBarsOptions[i].addEventListener("change", function(e){
                that.changeInputOutputBarsLength(this.value, true);
            });
        }
    }
}