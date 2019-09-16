// -------------------------------------------------------------------------
// Generator Module Class
// -------------------------------------------------------------------------

class GeneratorModule {
    constructor(mainModule, id, outputBars = 4, inputBars = 4,
                selectedModel = 0, heat = 1.00, selectedOutputName,
                selectedInputName, keepMutating = false, listening = false,
                generatedSeq, title) {
        this.mainModule = mainModule;
        this.connector = new Connector(this);
        this.outputBars = outputBars;
        this.inputBars = inputBars;
        this.selectedModel = selectedModel;
        this.barCounter = 0;
        this.looping = true;
        this.playing = false;
        this.stopNext = false;
        this.keepMutating = keepMutating;
        this.addBassProg;
        this.generatedSeq = generatedSeq;
        this.generatedSmf;
        this.playButton;
        this.bpm = mainModule.metronome.bpm;
        this.generateButton;
        this.mutateButton;
        this.stopButton;
        this.listenButton;
        this.generatorModuleContainer;
        this.midiInBusSelect;
        this.midiOutBusSelect;
        this.modelSelect;
        this.id = id;
        this.title = title;
        this.selectedOutputName = selectedOutputName;
        for (let i = 0; i < mainModule.midi.availableOutputs; i++) {
            if (this.selectedOutputName == mainModule.midi.availableOutputs[i].name) {
                this.selectedOutput = mainModule.midi.availableOutputs[i];
                break;
            }
        }
        this.selectedInputName = selectedInputName;
        for (let i = 0; i < mainModule.midi.availableInputs; i++) {
            if (this.selectedInputName == mainModule.midi.availableInputs[i].name) {
                this.selectedInput = mainModule.midi.availableInputs[i];
                break;
            }
        }
        this.inQueue = false;
        this.listening = listening;
        this.chords;
        this.generationTime = Date.now();
        this.inputStartTime = Date.now();
        this.heat = heat;
        this.shouldPlay = false;
        this.jzzMidiOut = JZZ().openMidiOut(this.selectedOutputName);
        this.jzzPlayer;
        // this.player = new mm.MIDIPlayer();
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
    }

    initialize() {
        return new Promise(function(resolve, reject) {
            console.log("initializing model with placeholder id " +
            this.id + "...");
        const logTime = Date.now();
        this.connector.initialize(this.id).then((msg) => {
            if (this.id) {
                this.generateButton.disabled = false;
                if (this.generatedSeq) {
                    this.playButton.disabled = false;
                    this.generatedSmf = this.convertToSmf(this.generatedSeq);
                }
                this.addBassProg = (this.id == 1);
                this.id = msg.data;
                console.log("model " + this.id + " initialization done, " +
                    "it took " + ((Date.now() - logTime)/1000) + "s");
                resolve(this.id);
            }
        });
        }.bind(this));
    }

    deleteModule() {
        const modulesContainer =document.getElementById("modulesContainer");
        modulesContainer.removeChild(this.generatorModuleContainer);
        this.mainModule.deleteModule(this.id);
        this.connector.delete(this.id);

        delete this.mainModule;
        delete this.connector;
        delete this.outputBars;
        delete this.inputBars;
        delete this.barCounter;
        delete this.looping;
        delete this.playing;
        delete this.stopNext;
        delete this.keepMutating;
        delete this.generatedSeq;
        delete this.generatedSmf;
        delete this.playButton;
        delete this.bpm;
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
        delete this.chords;
        delete this.generationTime;
        delete this.inputStartTime;
        delete this.heat;
        delete this.shouldPlay;
        delete this.jzzMidiOut;
        delete this.jzzPlayer;
        // delete this.player;
        delete this.inputSequence;
        delete this.stepsPerChord;
        delete this.stepsPerProg;
        delete this.midiInBusSelect;
        delete this.midiOutBusSelect;
        delete this.modelSelect;
        delete this.addBassProg;
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
            this.listenButton.className = "listenButton enabled active";
            window.setTimeout(function() {
                this.listenButton.className = "listenButton enabled";
            }.bind(this), 40);

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

    generateSequence() {
        return new Promise(function(resolve, reject) {
            this.generateButton.disabled = true;
            this.generationTime = Date.now();

            this.connector.generateSequence({
                cmd: "generate",
                seq: this.inputSequence,
                temp: this.heat,
                chords: this.chords,
                outputBars: this.outputBars,
                id: this.id,
                addBassProg: this.addBassProg,
                model: this.modelSelect.selectedIndex}).then((data) => {
                    console.log("generator " + this.id + ": generating on server " +
                    "took: " + ((Date.now() - this.generationTime)/1000) + "s");
                    this.generatedSeq = data.data;
                    this.generatedSmf = this.convertToSmf(this.generatedSeq);
                    this.generateButton.disabled = false;
                    this.generateButton.style.background =
                        `hsla(${Math.random() * 360}, 80%, 70%, 0.3)`;
                    if (this.generatedSeq != undefined && !this.playing) {
                        this.playButton.disabled = false;
                    }
                    resolve("done");
                });
        }.bind(this));
    }

    convertToSmf(seq) {
        let smf = new JZZ.MIDI.SMF(0, 96); // type 0, 96 ticks per quarter
        let trk = new JZZ.MIDI.SMF.MTrk();
        trk.add(0, JZZ.MIDI.smfSeqName('generatedSequence'));
        trk.add(0, JZZ.MIDI.smfBPM(this.bpm*4));
        smf.push(trk);
        seq.notes.forEach((note) => {
            trk.add((note.quantizedStartStep*96),
                JZZ.MIDI.noteOn(0, note.pitch, 127));
            trk.add((note.quantizedEndStep*96),
                JZZ.MIDI.noteOff(0, note.pitch, 127));
        });
        trk.add((((this.outputBars*16)-1)*96), JZZ.MIDI.smfEndOfTrack());
        return smf;
    }

    playGeneratedSequence() {
        delete this.jzzPlayer;
        this.jzzPlayer = this.generatedSmf.player();
        this.jzzPlayer.connect(this.jzzMidiOut);
        if (!this.mainModule.metronome.isPlaying) {
            this.jzzPlayer.loop(true);
        }
        this.jzzPlayer.play();

        if (!this.playing && this.shouldPlay) {
            this.playButton.disabled = true;
            this.playing = true;
            this.barCounter = 0;

            if (this.keepMutating) {
                this.generateSequence();
            }

            if (this.listening) {
                console.log(this.inputSequence);
                this.inputStartTime = Date.now();
                this.inputSequence.notes = [];
                this.inputSequence.totalQuantizedSteps = 1;
            }
        }
    }

    // playGeneratedSequence2() {
    //     if (!this.playing && this.shouldPlay) {
    //         this.player.requestMIDIAccess().then(() => {
    //             if (this.keepMutating) {
    //                 this.generateSequence();
    //             }

    //             this.playButton.disabled = true;
    //             this.playing = true;
    //             if (this.listening) {
    //                 this.barCounter = 0;
    //                 console.log(this.inputSequence);
    //                 this.inputStartTime = Date.now();
    //                 this.inputSequence.notes = [];
    //                 this.inputSequence.totalQuantizedSteps = 1;
    //             }
    //             this.player.outputs = [this.selectedOutput];
    //             // omitting player.outputs = message to all ports

    //             this.player.start(this.generatedSeq,
    //                 this.mainModule.metronome.bpm).then(() => {
    //                 this.playButton.disabled = false;
    //                 this.playing = false;

    //                 if (!this.looping) {
    //                     this.shouldPlay = false;
    //                     this.stopButton.disabled = false;
    //                     this.looping = true;
    //                 }

    //                 if (this.looping &&
    //                     !this.mainModule.metronome.isPlaying) {
    //                     this.playGeneratedSequence();
    //                 }
    //             });
    //         });
    //     }
    // }

    playTick() {
        if (this.barCounter == 0) {
            if (this.shouldPlay) {
                this.playing = false;
                this.playGeneratedSequence();
            } else if (this.stopNext) {
                this.playButton.style.background =
                    "var(--moduleBackgroundColor)";
                this.stopNext = false;
                this.playing = false;
                this.playButton.disabled = false;
                this.stopButton.disabled = false;
            }
        }
        if (this.playing) {
            this.playButton.style.background =
                "linear-gradient(90deg, var(--deleteColor) " +
                (((this.barCounter+1)/this.outputBars)*100) +
                "%, var(--moduleBackgroundColor) 0%)";
        }

        if (this.barCounter < (this.outputBars-1)) {
            this.barCounter++;
        } else if (this.barCounter == this.outputBars -1) {
            this.barCounter = 0;
        }
    }

    setPlayActive() {
        this.shouldPlay = true;
        this.playButton.disabled = true;
        if (this.mainModule.metronome.isPlaying) {
            this.barCounter = 0;
        } else {
            this.playGeneratedSequence();
        }
    }

    stopPlayback() {
        // this.player.stop();
        this.jzzPlayer.stop();
        this.playButton.disabled = false;
        this.stopButton.disabled = false;
        this.playing = false;
        this.shouldPlay = false;
        this.playButton.style.background = "var(--moduleBackgroundColor)";
    }

    changeMidiPort(isInput, port) {
        if (isInput) {
            this.selectedInput =
                this.mainModule.midi.availableInputs[port];
            this.selectedInputName = this.selectedInput.name;
        } else {
            this.selectedOutput =
                this.mainModule.midi.availableOutputs[port];
            this.selectedOutputName = this.selectedOutput.name;
            this.jzzMidiOut =
                    JZZ().openMidiOut(this.selectedOutputName);
        }
    }

    stopModule() {
        this.stopNext = true;
        this.looping = false;
        this.shouldPlay = false;
        this.stopButton.disabled = true;
    }

    changeBpm(value) {
        // this.player.setTempo(value);
        this.bpm = value;
    }

    mutate() {
        this.keepMutating = !this.keepMutating;

        if (this.keepMutating) {
            this.generateSequence();
            this.mutateButton.className = "mutateButton enabled";
        } else {
            this.mutateButton.className = "mutateButton disabled";
        }
    }

    changeInputOutputBarsLength(length, isOutput) {
        if (isOutput) {
            this.outputBars = length;
        } else {
            this.inputBars = length;
        }
    }

    midiPortListUpdated() {
        let midi = this.mainModule.midi;
        this.midiOutBusSelect.innerHTML = midi.availableOutputs
            .map(i =>`<option>${i.name}</option>`).join('');
        this.midiInBusSelect.innerHTML = midi.availableInputs
            .map(i =>`<option>${i.name}</option>`).join('');

        for (let i = 0; i < this.midiOutBusSelect.options.length; i++) {
            if (this.selectedOutputName == this.midiOutBusSelect.options[i].label) {
                this.midiOutBusSelect.selectedIndex = i;
                break;
            }
        }

        for (let i = 0; i < this.midiInBusSelect.options.length; i++) {
            if (this.selectedInputName == this.midiInBusSelect.options[i].label) {
                this.midiInBusSelect.selectedIndex = i;
                break;
            }
        }
}

    startStopListening() {
        this.listening = !this.listening;
        this.inputStartTime = Date.now();
        if (this.listening) {
            this.listenButton.className = "listenButton enabled";
            this.inputSequence.notes = [];
            this.inputSequence.totalQuantizedSteps = 1;
        } else {
            this.listenButton.className = "listenButton disabled";
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
            if (this.title) {
                generatorModuleTitleDiv.value = this.title;
            }

        let generatorButtonDivContainer = document.createElement("div");
        generatorButtonDivContainer.className = "generatorButtonDivContainer";

        let playContainer = document.createElement("div");
        playContainer.className = "container";

        this.generateButton = document.createElement("button");
        this.generateButton.className = "generateButton";
        this.generateButton.innerHTML = "☰";
        this.generateButton.title = "Generate a sequence based on an " +
            "input sequence and chords";
        this.generateButton.disabled = true;
        if (this.generatedSeq) {
            this.generateButton.style.background =
                        `hsla(${Math.random() * 360}, 80%, 70%, 0.3)`;
        }

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
        this.mutateButton.innerHTML = "↻";
        this.mutateButton.title = "Keep generating new sequences";
        if (this.keepMutating) {
            this.mutateButton.className = "mutateButton enabled";
        } else {
            this.mutateButton.className = "mutateButton disabled";
        }

        this.listenButton = document.createElement("button");
        this.listenButton.innerHTML = "●";
        this.listenButton.title = "Listen for input MIDI on the selected " +
            "MIDI In Port";
        if (this.listening) {
            this.listenButton.className = "listenButton enabled";
        } else {
            this.listenButton.className = "listenButton disabled";
        }

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

        let outputBarsContainer = document.createElement("div");
        outputBarsContainer.id = "outputBarsContainer";
        outputBarsContainer.className = "container";

        let outputBarsContainerText = document.createElement("div");
        outputBarsContainerText.innerHTML = "Output Bars";

        let outputBarsOptionsContainer = document.createElement("div");

        let inputBarsOptions = [];
        let outputBarsOptions = [];
        let optionTexts = [];

        for (const options of ["input", "output"]) {
            for (const value of ["2", "4", "8"]) {
                const option = document.createElement("input");
                option.className = "radioButton";
                option.name = options + "BarsOption" + this.id;
                option.type = "radio";
                option.value = value;
                option.title = "Bar length of the " + options + " sequences";
                optionTexts.push(document.createTextNode(value));
                if (options == "input") {
                    if (value == this.inputBars) {
                        option.checked = "checked";
                    }
                    inputBarsOptions.push(option);
                } else {
                    if (value == this.outputBars) {
                        option.checked = "checked";
                    }
                    outputBarsOptions.push(option);
                }
            }
        }

        let midiOutContainer = document.createElement("div");
        midiOutContainer.id = "midiOutContainer";
        midiOutContainer.className = "container";

        let midiContainer = document.createElement("div");
        midiContainer.className = "midiContainer";

        let midiOutText = document.createElement("div");
        midiOutText.innerHTML = "MIDI Out";
        midiOutText.title = "MIDI Port for the outgoing " +
            "generated sequence";

        this.midiOutBusSelect = document.createElement("select");
        this.midiOutBusSelect.title = "MIDI Port for the outgoing " +
            "generated sequence";

        let midiInContainer = document.createElement("div");
        midiInContainer.id = "midiInContainer";
        midiInContainer.className = "container";

        let midiInSelectContainer = document.createElement("div");
        midiInSelectContainer.className = "midiInSelectContainer";

        let midiInText = document.createElement("div");
        midiInText.innerHTML = "MIDI In";
        midiInText.title = "MIDI Port for the incoming MIDI " +
            "data to generate a new sequence";

        this.midiInBusSelect = document.createElement("select");
        this.midiInBusSelect.title = "MIDI Port for the incoming MIDI " +
            "data to generate a new sequence";

        let modelAndHeatContainer = document.createElement("div");
        modelAndHeatContainer.className = "modelAndHeatContainer";

        let modelContainer = document.createElement("div");
        modelContainer.id = "modelContainer";
        modelContainer.className = "container";

        let modelText = document.createElement("div");
        modelText.innerHTML = "Model";
        modelText.title = "Select different model for sequence generation";

        this.modelSelect = document.createElement("select");
        this.modelSelect.title = "Select different model for sequence "
            + "generation";

        this.modelSelect.add(new Option("ImprovRNN", "1"));
        this.modelSelect.add(new Option("MelodyRNN", "2"));
        // this.modelSelect.add(new Option("MusicVAE", "3"));
        this.modelSelect.selectedIndex = this.selectedModel;

        let heatContainer = document.createElement("div");
        heatContainer.id = "heatContainer";
        heatContainer.className = "container";

        let heatSlider = document.createElement("input");
        heatSlider.type = "range";
        heatSlider.className = "heatSlider";
        heatSlider.min = "0";
        heatSlider.max = "200";
        heatSlider.value = this.heat * 100;

        heatSlider.title = "Controls the heat level from " +
            "0 to 2";
        let heatTitleDiv = document.createElement("div");
        heatTitleDiv.className = "heatTitleDiv";
        heatTitleDiv.innerHTML = "Heat "+this.heat.toFixed(2);
        heatTitleDiv.title = "The heat controls how " +
            "'erratic' or 'simple' the generated sequence should be, min " +
            "is very simple and max is very erratic";

        generatorButtonDivContainer.appendChild(this.generateButton);
        generatorButtonDivContainer.appendChild(this.playButton);
        generatorButtonDivContainer.appendChild(this.stopButton);
        generatorButtonDivContainer.appendChild(this.mutateButton);
        midiOutContainer.appendChild(midiOutText);
        midiOutContainer.appendChild(this.midiOutBusSelect);
        midiInContainer.appendChild(midiInSelectContainer);
        midiInSelectContainer.appendChild(midiInText);
        midiInSelectContainer.appendChild(this.midiInBusSelect);
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
        inputBarsOptionsContainer.appendChild(optionTexts[0]);
        inputBarsOptionsContainer.appendChild(inputBarsOptions[1]);
        inputBarsOptionsContainer.appendChild(optionTexts[1]);
        inputBarsOptionsContainer.appendChild(inputBarsOptions[2]);
        inputBarsOptionsContainer.appendChild(optionTexts[2]);
        outputBarsOptionsContainer.appendChild(outputBarsOptions[0]);
        outputBarsOptionsContainer.appendChild(optionTexts[3]);
        outputBarsOptionsContainer.appendChild(outputBarsOptions[1]);
        outputBarsOptionsContainer.appendChild(optionTexts[4]);
        outputBarsOptionsContainer.appendChild(outputBarsOptions[2]);
        outputBarsOptionsContainer.appendChild(optionTexts[5]);
        heatContainer.appendChild(heatSlider);
        heatContainer.appendChild(heatTitleDiv);
        modelContainer.appendChild(modelText);
        modelContainer.appendChild(this.modelSelect);
        modelAndHeatContainer.appendChild(heatContainer);
        modelAndHeatContainer.appendChild(modelContainer);
        this.generatorModuleContainer.appendChild(generatorModuleTitleDiv);
        this.generatorModuleContainer.appendChild(barsContainer);
        this.generatorModuleContainer.appendChild(modelAndHeatContainer);
        this.generatorModuleContainer.appendChild(midiContainer);

        this.generatorModuleContainer.appendChild(generatorButtonDivContainer);
        this.generatorModuleContainer.appendChild(deleteButton);

        const modulesContainer =document.getElementById("modulesContainer");
        modulesContainer.appendChild(this.generatorModuleContainer);

        this.playButton.addEventListener('click', function() {
            this.setPlayActive()}.bind(this));
        deleteButton.addEventListener('click', function() {
            this.deleteModule()}.bind(this));
        heatSlider.addEventListener("input", function(e) {
            this.heat = (e.target.value/100);
            heatTitleDiv.innerHTML = "Heat " +
                this.heat.toFixed(2);

        }.bind(this));

        generatorModuleTitleDiv.addEventListener("input", function(e) {
            this.title = e.target.value;
        }.bind(this));

        this.stopButton.addEventListener('click', function(){
            this.stopModule()}.bind(this));

        this.mutateButton.addEventListener('click', function(){
            this.mutate()}.bind(this));

        // listen for input functionality
        this.listenButton.addEventListener('click', function(){
            this.startStopListening()}.bind(this));

        this.modelSelect.addEventListener("change", function() {
            this.selectedModel = this.modelSelect.selectedIndex;
        }.bind(this));

        // Populate the MidiOut and MidiIn lists
        this.midiPortListUpdated();
        this.midiOutBusSelect.addEventListener("change", function() {
            this.changeMidiPort(false, this.midiOutBusSelect.selectedIndex);
        }.bind(this));
        this.midiInBusSelect.addEventListener("change", function() {
            this.changeMidiPort(true, this.midiInBusSelect.selectedIndex);
        }.bind(this));

        // eventlistener for the generate and play model button
        this.generateButton.addEventListener('click', function(){
            this.generateSequence()}.bind(this));

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