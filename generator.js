// ---------------------------------------------------------------------------
// Generator Module Class
// ---------------------------------------------------------------------------

class GeneratorModule {
    constructor(mainModule, id) {
        this.mainModule = mainModule;
        this.model = new SequenceModel();
        this.outputBars = 4;
        this.inputBars = 4;
        this.looping = false;
        this.generatedSeq = null;
        this.messageDiv = null;
        this.playButton = null;
        this.generateButton = null;
        this.loopButton = null;
        this.listenButton = null;
        this.generatorModuleContainer = null;
        this.id = id;
        this.selectedOutput = this.mainModule.midi.availableOutputs[0];
        this.selectedInput = this.mainModule.midi.availableInputs[0];
        this.inQueue = false;
        this.listening = false;
        this.inputSequence = { 
            notes: [],
            quantizationInfo: {stepsPerQuarter: 4},
            totalQuantizedSteps: 1,
        };
        this.inputStartTime = Date.now();

        this.createUIElements();

        this.model.initialize().then(function() {
            this.model.generateSequence(["C", "Am", "G", "F"], this.inputSequence, this.model).then(function(seq){
                console.log("initialized");
                this.playButton.disabled = false;
			    this.generateButton.disabled = false;
                this.messageDiv.innerText = 'Done loading model.'
            }.bind(this));
        }.bind(this));
    }

    changeInputOutputBarsLength(length, isOutput) {
        if (isOutput) {
            this.model.NUM_REPS = length;
            this.outputBars = length;
        } else {
            this.inputBars = length;
        }
    }

    updateChords(chords) {
        console.log("updating chords...");
    }

    switchDarkMode() {
        if (this.listening) {
            this.listenButton.style.background = this.mainModule.isDarkMode ? "rgb(87, 87, 87)" : "lightgrey";
            this.listenButton.style.color = this.mainModule.isDarkMode ? "rgb(185, 19, 19)" : "rgb(216, 49, 49)";
        } else {
            this.listenButton.style.background = this.mainModule.isDarkMode ? "rgb(38, 38, 38)" : "white";
            this.listenButton.style.color = this.mainModule.isDarkMode ? "white" : "black";
        }

        if (this.looping) {
            this.loopButton.style.background = this.mainModule.isDarkMode ? "rgb(87, 87, 87)" : "lightgrey";
        } else {
            this.loopButton.style.background = this.mainModule.isDarkMode ? "rgb(38, 38, 38)" : "white";
        }
    }

    startStopLoop() {
        this.looping = !this.looping;
        this.mainModule.metronome.generatedSequences.set(this.id, [this.generatedSeq, this.selectedOutput, this.looping, this.inQueue, this.playButton, this.messageDiv]);
        return this.looping;
    }

    startStopListening() {
        this.listening = !this.listening;
        this.inputStartTime = Date.now();
        if (this.listening == true) {this.inputSequence.notes = [];}
        if (this.listening == false) {console.log(this.inputSequence);}
        return this.listening;
    }

    startStopNote(note, velocity, isStart) {
        console.log("note: " + note);
        console.log("velocity: " + velocity);
        console.log("isStart: " + isStart);
        
        const currentTime = Date.now();
        const bpm = 120;
        const stepsPerQuater = 4;
        const secondsPerQuater = 60 / bpm;
        const timeStep = secondsPerQuater / stepsPerQuater;
        const playedAt = ((currentTime - this.inputStartTime)/1000); // in seconds
        const playedAtQuantized = (playedAt-(playedAt%timeStep))/timeStep; // rounded

        
        console.log("played at: " + playedAt + "s");
        if (isStart) {
            this.inputSequence.notes.push({pitch: note, quantizedStartStep: playedAtQuantized, quantizedEndStep: 0});
        } else {
              const index = this.inputSequence.notes.findIndex(x => x.pitch === note);
              this.inputSequence.notes[index].quantizedEndStep = playedAtQuantized;
        }
    }

    generateSequence(chords) {
        console.log("generating midi sequence...");
        const time = Date.now();
        if (this.inputSequence.totalQuantizedSteps != 1) {this.inputSequence.totalQuantizedSteps = this.inputSequence.notes.length;}
        this.model.generateSequence(chords, this.inputSequence, this.model).then(function(seq){
            console.log("generating took: " + ((Date.now() - time)/1000) + "s");
            this.generatedSeq = seq;
            console.log(seq);
            if (this.mainModule.metronome.isPlaying) {this.playGeneratedSequence();}
        }.bind(this));
    }

    playGeneratedSequence() {
        console.log(this.selectedOutput);
        this.inQueue = true;
        this.mainModule.metronome.generatedSequences.set(this.id, [this.generatedSeq, this.selectedOutput, this.looping, this.inQueue, this.playButton, this.messageDiv]);

        if (!this.mainModule.metronome.isPlaying) {
            this.mainModule.metronome.playSequence(this.id, false);
        }
    }

    deleteModule() {
        document.getElementById("mainContainer").removeChild(this.generatorModuleContainer);
        this.mainModule.deleteModule(this.id);
        
        delete this.mainModule;
        delete this.model;
        delete this.outputBars;
        delete this.inputBars;
        delete this.looping;
        delete this.generatedSeq;
        delete this.messageDiv;
        delete this.playButton;
        delete this.generateButton;
        delete this.loopButton;
        delete this.listenButton;
        delete this.generatorModuleContainer;
        delete this.id;
        delete this.selectedOutput;
        delete this.selectedInput;
        delete this.inQueue;
        delete this.listening;
        delete this.inputSequence;
        delete this.inputStartTime;
    }

    createUIElements() {
        this.generatorModuleContainer = document.createElement("div");
        this.generatorModuleContainer.id = "generatorModuleContainer";
        this.generatorModuleContainer.className = "container";

        let generatorModuleTitleDiv = document.createElement("input");
        generatorModuleTitleDiv.type = "text";
        generatorModuleTitleDiv.id = "generatorTitleDiv";
        generatorModuleTitleDiv.placeholder = "Generator " + this.id;

        let generatorButtonDiv = document.createElement("div");
        generatorButtonDiv.id = "generatorButtonDiv";

        let playContainer = document.createElement("div");
        playContainer.id = "playContainer";
        playContainer.className = "container";

        this.generateButton = document.createElement("button");
        this.generateButton.id = "generate";
        this.generateButton.innerHTML = "g";
        this.generateButton.disabled = true;

        this.playButton = document.createElement("button");
        this.playButton.id = "play";
        this.playButton.innerHTML = "►";
        this.playButton.disabled = true;

        this.loopButton = document.createElement("button");
        this.loopButton.id = "loop";
        this.loopButton.innerHTML = "↻";

        this.listenButton = document.createElement("button");
        this.listenButton.id = "listen";
        this.listenButton.innerHTML = "●";

        let deleteButton = document.createElement("button");
        deleteButton.id = "deleteButton";
        deleteButton.innerHTML = "X";

        let barsContainer = document.createElement("div");
        barsContainer.id = "barsContainer";

        let inputBarsContainer = document.createElement("div");
        inputBarsContainer.id = "inputBarsContainer";
        inputBarsContainer.className = "container";

        let inputBarsContainerText = document.createElement("div");
        inputBarsContainerText.innerHTML = "Input Bars";

        let inputBarsOptionsContainer = document.createElement("div");
        inputBarsOptionsContainer.id = "inputBarsOptionsContainer";

        let inputBarsOption1 = document.createElement("input");
        inputBarsOption1.className = "radioButton";
        inputBarsOption1.name = "inputBarsOption" + this.id;
        inputBarsOption1.type = "radio";
        inputBarsOption1.value = "2";

        let inputBarsOption2 = document.createElement("input");
        inputBarsOption2.className = "radioButton";
        inputBarsOption2.name = "inputBarsOption" + this.id;
        inputBarsOption2.type = "radio";
        inputBarsOption2.value = "4";
        inputBarsOption2.checked = "checked";

        let inputBarsOption3 = document.createElement("input");
        inputBarsOption3.className = "radioButton";
        inputBarsOption3.name = "inputBarsOption" + this.id;
        inputBarsOption3.type = "radio";
        inputBarsOption3.value = "8";

        let outputBarsContainer = document.createElement("div");
        outputBarsContainer.id = "outputBarsContainer";
        outputBarsContainer.className = "container";

        let outputBarsContainerText = document.createElement("div");
        outputBarsContainerText.innerHTML = "Output Bars";

        let outputBarsOptionsContainer = document.createElement("div");
        outputBarsOptionsContainer.id = "outputBarsOptionsContainer";

        let outputBarsOption1 = document.createElement("input");
        outputBarsOption1.className = "radioButton";
        outputBarsOption1.name = "outputBarsOption" + this.id;
        outputBarsOption1.type = "radio";
        outputBarsOption1.value = "2";

        let outputBarsOption2 = document.createElement("input");
        outputBarsOption2.className = "radioButton";
        outputBarsOption2.name = "outputBarsOption" + this.id;
        outputBarsOption2.type = "radio";
        outputBarsOption2.value = "4";
        outputBarsOption2.checked = "checked";

        let outputBarsOption3 = document.createElement("input");
        outputBarsOption3.className = "radioButton";
        outputBarsOption3.name = "outputBarsOption" + this.id;
        outputBarsOption3.type = "radio";
        outputBarsOption3.value = "8";

        const outputBarsOption1Text = document.createTextNode("2");
        const outputBarsOption2Text = document.createTextNode("4");
        const outputBarsOption3Text = document.createTextNode("8");

        const inputBarsOption1Text = document.createTextNode("2");
        const inputBarsOption2Text = document.createTextNode("4");
        const inputBarsOption3Text = document.createTextNode("8");

        let midiOutContainer = document.createElement("div");
        midiOutContainer.id = "midiOutContainer";
        midiOutContainer.className = "container";
        
        let midiContainer = document.createElement("div");
        midiContainer.id = "midiContainer";

        let midiOutText = document.createElement("div");
        midiOutText.id = "midiOutText";
        midiOutText.innerHTML = "MIDI Out";

        let midiOutBusSelect = document.createElement("select");
        midiOutBusSelect.id = "midiOutBusSelect";

        let midiInContainer = document.createElement("div");
        midiInContainer.id = "midiInContainer";
        midiInContainer.className = "container";

        let midiInText = document.createElement("div");
        midiInText.id = "midiInText";
        midiInText.innerHTML = "MIDI In";

        let midiInBusSelect = document.createElement("select");
        midiInBusSelect.id = "midiInBusSelect";

        let temperatureContainer = document.createElement("div");
        temperatureContainer.id = "temperatureContainer";
        temperatureContainer.className = "container";

        let temperatureVolumeSlider = document.createElement("input");
        temperatureVolumeSlider.type = "range";
        temperatureVolumeSlider.className = "slider";
        temperatureVolumeSlider.id = "temperatureVolumeSlider";
        temperatureVolumeSlider.min = "1";
        temperatureVolumeSlider.max = "100";
        temperatureVolumeSlider.value = "80";

        let temperatureTitleDiv = document.createElement("div");
        temperatureTitleDiv.id = "temperatureTitleDiv";
        temperatureTitleDiv.innerHTML = "temperature";

        this.messageDiv = document.createElement("div");
        this.messageDiv.id = "messageDiv";
        this.messageDiv.innerHTML = "Loading model...";     

        this.generatorModuleContainer.appendChild(generatorModuleTitleDiv);

        midiOutContainer.appendChild(midiOutText);
        midiOutContainer.appendChild(midiOutBusSelect);

        midiInContainer.appendChild(midiInText);
        midiInContainer.appendChild(midiInBusSelect);

        midiContainer.appendChild(midiOutContainer);
        midiContainer.appendChild(midiInContainer);

        barsContainer.appendChild(inputBarsContainer);
        inputBarsContainer.appendChild(inputBarsContainerText);
        inputBarsContainer.appendChild(inputBarsOptionsContainer);
        inputBarsOptionsContainer.appendChild(inputBarsOption1);
        inputBarsOptionsContainer.appendChild(inputBarsOption1Text);
        inputBarsOptionsContainer.appendChild(inputBarsOption2);
        inputBarsOptionsContainer.appendChild(inputBarsOption2Text);
        inputBarsOptionsContainer.appendChild(inputBarsOption3);
        inputBarsOptionsContainer.appendChild(inputBarsOption3Text);        
        
        barsContainer.appendChild(outputBarsContainer);
        outputBarsContainer.appendChild(outputBarsContainerText);
        outputBarsContainer.appendChild(outputBarsOptionsContainer);
        outputBarsOptionsContainer.appendChild(outputBarsOption1);
        outputBarsOptionsContainer.appendChild(outputBarsOption1Text);
        outputBarsOptionsContainer.appendChild(outputBarsOption2);
        outputBarsOptionsContainer.appendChild(outputBarsOption2Text);
        outputBarsOptionsContainer.appendChild(outputBarsOption3);
        outputBarsOptionsContainer.appendChild(outputBarsOption3Text);

        
        temperatureContainer.appendChild(temperatureVolumeSlider);
        temperatureContainer.appendChild(temperatureTitleDiv);

        this.generatorModuleContainer.appendChild(barsContainer);
        this.generatorModuleContainer.appendChild(midiContainer);
        this.generatorModuleContainer.appendChild(temperatureContainer);
        this.generatorModuleContainer.appendChild(this.messageDiv);
        
        generatorButtonDiv.appendChild(this.generateButton);
        generatorButtonDiv.appendChild(this.playButton);
        generatorButtonDiv.appendChild(this.loopButton);
        generatorButtonDiv.appendChild(this.listenButton);
        this.generatorModuleContainer.appendChild(generatorButtonDiv);
        this.generatorModuleContainer.appendChild(deleteButton);

        document.getElementById("mainContainer").appendChild(this.generatorModuleContainer);

        let that = this;

        // delete functionality
        deleteButton.addEventListener('click', function(){
            // delete self
            that.deleteModule();
        });

        // loop functionality
        this.loopButton.addEventListener('click', function(){
            if (that.startStopLoop()) {
                that.loopButton.style.background = that.mainModule.isDarkMode ? "rgb(87, 87, 87)" : "lightgrey";
            } else {
                that.loopButton.style.background = that.mainModule.isDarkMode ? "rgb(38, 38, 38)" : "white";
            }
        });

        // listen for input functionality
        this.listenButton.addEventListener('click', function(){
            if (that.startStopListening()) {
                that.listenButton.style.background = that.mainModule.isDarkMode ? "rgb(87, 87, 87)" : "lightgrey";
                that.listenButton.style.color = that.mainModule.isDarkMode ? "rgb(185, 19, 19)" : "rgb(216, 49, 49)";
            } else {
                that.listenButton.style.background = that.mainModule.isDarkMode ? "rgb(38, 38, 38)" : "white";
                that.listenButton.style.color = that.mainModule.isDarkMode ? "white" : "black";
            }
        });

        // Populate the MidiOut and MidiIn lists
        midiOutBusSelect.innerHTML = that.mainModule.midi.availableOutputs.map(i =>`<option>${i.name}</option>`).join('');
        midiOutBusSelect.addEventListener("change", function() {
            that.selectedOutput = that.mainModule.midi.availableOutputs[midiOutBusSelect.selectedIndex];
        });

        midiInBusSelect.innerHTML = that.mainModule.midi.availableInputs.map(i =>`<option>${i.name}</option>`).join('');
        midiInBusSelect.addEventListener("change", function() {
            that.selectedInput = that.mainModule.midi.availableInputs[midiInBusSelect.selectedIndex];
        });

        // eventlistener for the generate and play model button
        this.generateButton.addEventListener('click', function(){
            const chordValues = [
                chord1.value,
                chord2.value,
                chord3.value,
                chord4.value    
            ];
            that.generateSequence(chordValues);
        });

        this.playButton.addEventListener('click', function(){that.playGeneratedSequence();});

        // Check chords for validity when changed
        chord1.oninput = this.model.checkChords;
        chord2.oninput = this.model.checkChords;
        chord3.oninput = this.model.checkChords;
        chord4.oninput = this.model.checkChords; 

        // input and output bars lengths
        let radioButtons = document.getElementsByClassName("radioButton");
        for (var i=0; i<(radioButtons.length/2); i++) {
            radioButtons[i].addEventListener("change", function(e){
                that.changeInputOutputBarsLength(this.value, false);
            });
            radioButtons[i+3].addEventListener("change", function(e){
                that.changeInputOutputBarsLength(this.value, true);
            });
        } 
    }
}