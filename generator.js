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
        this.generatorModuleContainer = null;
        this.id = id;
        this.selectedOutput = this.mainModule.midi.availableOutputs[0];
        this.inQueue = false;

        this.createUIElements();

        this.model.initialize().then(function() {
            this.model.generateSequence(["C", "Am", "G", "F"], this.model).then(function(seq){
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

    startStopLoop() {
        this.looping = !this.looping;
        this.mainModule.metronome.generatedSequences.set(this.id, [this.generatedSeq, this.selectedOutput, this.looping]);
        return this.looping;
    }

    generateSequence(chords) {
        console.log("generating midi sequence...");
        const time = Date.now();
        this.model.generateSequence(chords, this.model).then(function(seq){
            console.log("generating took: " + ((Date.now() - time)/1000) + "s");
            this.generatedSeq = seq;
            if (this.mainModule.metronome.isPlaying) {this.playGeneratedSequence();}
        }.bind(this));
    }

    playGeneratedSequence() {
        this.inQueue = true;
        this.mainModule.metronome.generatedSequences.set(this.id, [this.generatedSeq, this.selectedOutput, this.looping, this.inQueue]);

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
        delete this.generatorModuleContainer;
        delete this.id;
        delete this.selectedOutput;
    }

    createUIElements() {
        this.generatorModuleContainer = document.createElement("div");
        this.generatorModuleContainer.id = "generatorModuleContainer";

        let generatorModuleTitleDiv = document.createElement("div");
        generatorModuleTitleDiv.id = "generatorTitleDiv";
        generatorModuleTitleDiv.innerHTML = "Generator " + this.id;

        let generatorButtonDiv = document.createElement("div");
        generatorButtonDiv.id = "generatorButtonDiv";

        let playContainer = document.createElement("div");
        playContainer.id = "playContainer";
        playContainer.className = "container";

        this.generateButton = document.createElement("button");
        this.generateButton.id = "generate";
        this.generateButton.innerHTML = "new";
        this.generateButton.disabled = true;

        this.playButton = document.createElement("button");
        this.playButton.id = "play";
        this.playButton.innerHTML = "►";
        this.playButton.disabled = true;

        let loop = document.createElement("button");
        loop.id = "loop";
        loop.innerHTML = "↻";

        let deleteButton = document.createElement("button");
        deleteButton.id = "delete";
        deleteButton.innerHTML = "X";

        let barsContainer = document.createElement("div");
        barsContainer.id = "barsContainer";

        let inputBarsContainer = document.createElement("div");
        inputBarsContainer.id = "inputBarsContainer";

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

        let midiText = document.createElement("div");
        midiText.id = "midiText";
        midiText.innerHTML = "MIDI Out";

        let midiBusSelect = document.createElement("select");
        midiBusSelect.id = "midiBusSelect";

        this.messageDiv = document.createElement("div");
        this.messageDiv.id = "message";
        this.messageDiv.innerHTML = "Loading model...";     

        this.generatorModuleContainer.appendChild(generatorModuleTitleDiv);

        midiOutContainer.appendChild(midiText);
        midiOutContainer.appendChild(midiBusSelect);

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

        this.generatorModuleContainer.appendChild(barsContainer);
        this.generatorModuleContainer.appendChild(midiOutContainer);
        this.generatorModuleContainer.appendChild(this.messageDiv);
        
        generatorButtonDiv.appendChild(this.generateButton);
        generatorButtonDiv.appendChild(this.playButton);
        generatorButtonDiv.appendChild(loop);
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
        loop.addEventListener('click', function(){
            if (that.startStopLoop()) {
                loop.style.background = "lightgrey";
            } else {
                loop.style.background = "white";
            }
        });

        // Populate the MidiOut and MidiClockOut lists
        midiBusSelect.innerHTML = that.mainModule.midi.availableOutputs.map(i =>`<option>${i.name}</option>`).join('');
        midiBusSelect.addEventListener("change", function() {
            that.mainModule.midi.selectedOutput = that.mainModule.midi.availableOutputs[midiBusSelect.selectedIndex];
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