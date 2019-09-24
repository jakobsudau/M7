// -------------------------------------------------------------------------
// Main Module Class
// -------------------------------------------------------------------------

class MainModule {
    constructor(midiAccess) {
        if (!!MainModule.instance) {
            return MainModule.instance;
        }

        MainModule.instance = this;
        this.midiMapMode = false;
        this.midiMapSelection;
        this.midiMapParams = {};
        this.clickButton;
        this.generateAllButton;
        this.stopAllButton;
        this.playAllButton;
        this.changeBackwardButton;
        this.changeForwardButton;
        this.generateLoopButton;
        this.clickVolumeSlider;
        this.clickBusSelect;
        this.selectedClickBusId = "internal";
        this.metronomeOn = false;
        this.chords = ["C", "G", "Am", "F"];
        this.chordInputs;
        this.bpmTextfield;
        this.maxScenes = 2;
        this.generators = [];
        this.generatorCounter = 1;
        this.sceneCounter = 0;
        this.generateAllCounter = 0;
        this.midi = new Midi(midiAccess, this);
        this.metronome = new Metronome(this);
        this.metronome.initialize();
        this.createUIElements();
        this.startStopClick();
        this.startStopClick();
        return this;
    }

    addModule(id, selectedOutputName, selectedInputName, outputBars, inputBars,
        selectedModel, heat, keepMutating, listening,
        generatedSeq, title) {
        const generator = new GeneratorModule(this, id, outputBars,
            inputBars, selectedModel, heat, selectedOutputName,
            selectedInputName, keepMutating, listening, generatedSeq, title);
        generator.initialize().then((id) => {
            this.generators.push(generator);
            generator.chords = this.chords;
            if (this.generators.length == 1) {
                this.generateAllButton.disabled = false;
                this.changeForwardButton.disabled = false;
                this.playAllButton.disabled = false;
                this.stopAllButton.disabled = false;
                this.bpmTextfield.disabled = false;
                this.generateLoopButton.disabled = false;
            }
        });
        this.generatorCounter++;
    }

    deleteModule(id) {
        for (let i = 0; i < this.generators.length; i++) {
            if (this.generators[i].id == id) {
                this.generators.splice(i, 1);
            }
        }
        // delete any mapped parameters
        Object.keys(this.midiMapParams).forEach((key) => {
            let button = document.getElementById(key);
            if (button == undefined) {
                delete this.midiMapParams[key];
            }
        });

        if (this.generators.length == 0) {
            this.generateAllButton.disabled = true;
            this.changeForwardButton.disabled = true;
            this.playAllButton.disabled = true;
            this.stopAllButton.disabled = true;
            this.bpmTextfield.disabled = true;
            this.generateLoopButton.disabled = true;
        }
    }

    getPersistentState() {
        return [this.midiMapParams,
            this.metronome.outputId,
            this.chords,
            this.metronome.bpm,
            this.metronome.midiClockStatus,
            this.metronome.volume,
            this.generators];
    }

    setPersistentState(persistentState) {
        while (this.generators.length != 0) {
            this.generators[0].deleteModule();
        }
        this.generatorCounter = 1;
        this.sceneCounter = 0;
        this.midiMapParams = persistentState[0];
        this.metronome.outputId = persistentState[1];
        this.chords = persistentState[2];
        this.metronome.bpm = persistentState[3];
        this.metronome.midiClockStatus = persistentState[4];
        this.metronome.volume = persistentState[5];
        let savedGenerators = persistentState[6];

        // restore midi mappings to available midi ports
        Object.keys(this.midiMapParams).forEach((key) => {
            let found = false;
            for (let i = 0; i < this.midi.availableInputs.length; i++) {
                if (this.midiMapParams[key].inputId == this.midi.availableInputs[i].id) {
                    this.midiMapParams[key].input = this.midi.availableInputs[i];
                    found = true;
                }
            }

            if (!found) {delete this.midiMapParams[key]}

        });

        // restore generator modules
        for (let i = 0; i < savedGenerators.length; i++) {
            this.addModule(this.generatorCounter,
                savedGenerators[i].selectedOutputName,
                savedGenerators[i].selectedInputName,
                savedGenerators[i].outputBars, savedGenerators[i].inputBars,
                savedGenerators[i].selectedModel, savedGenerators[i].heat,
                savedGenerators[i].keepMutating, savedGenerators[i].listening,
                savedGenerators[i].generatedSeq, savedGenerators[i].title)
        }

        for (let i = 0; i < this.chords.length; i++) {
            this.chordInputs[i].value = this.chords[i];
        }

        this.updateUI();
    }

    updateUI() {
        this.clickClockSelect.checked = this.metronome.midiClockStatus;
        this.saveBpm(this.metronome.bpm);
        this.bpmTextfield.value = this.metronome.bpm;
        this.changeClickVolume(this.metronome.volume);
        this.clickVolumeSlider.value = (this.metronome.volume * 100);

        for (let i = 0; i < this.clickBusSelect.options.length; i++) {
            if (this.metronome.outputId == "internal") {
                this.clickBusSelect.selectedIndex = 0;
                break;
            }

            if (this.metronome.outputId == this.midi.availableOutputs[i].id) {
                this.clickBusSelect.selectedIndex = (i+1);
                break;
            }
        }

        for (let [i, chord] of this.chordInputs.entries()) {
            this.saveChord(chord, i);
        }
    }

    startStopNote(note, velocity, isStart, input) {
        if (this.midiMapMode) {
            if (isStart) {
                this.midiMapSelection.childNodes[1].innerHTML = note;
                this.midiMapParams[this.midiMapSelection.id] =
                    {note: note, input: input, inputId: input.id};
            }
        } else {
            for (let i = 0; i < this.generators.length; i++) {
                if (this.generators[i].listening &&
                    this.generators[i].selectedInput == input) {
                    this.generators[i].startStopNote(note, velocity, isStart);
                }
            }

            if (isStart) {
                Object.keys(this.midiMapParams).forEach((key) => {
                    if (this.midiMapParams[key].note == note &&
                        this.midiMapParams[key].input == input) {
                        document.getElementById(key).click();
                    }
                });
            }
        }
    }

    checkChord(chord, i) {
        this.generateAllButton.disabled = true;
        for (let i = 0; i < this.generators.length; i++) {
            this.generators[i].generateButton.disabled = true;
        }

		const isGood = (chordToCheck) => {
            if (!chordToCheck) {return false}

            try {
                mm.chords.ChordSymbols.pitches(chordToCheck);
                return true;
            }
            catch(e) {
                return false;
		    }
		}

        let allGood = true;
		if (isGood(chord.value)) {
			chord.style.color = "var(--chordsTextColor)";
		} else {
			chord.style.color = "var(--chordsErrorColor)";
			allGood = false;
		}

        if (allGood) {
            this.chords[i] = chord.value;
            this.generateAllButton.disabled = false;
            for (let i = 0; i < this.generators.length; i++) {
                this.generators[i].generateButton.disabled = false;
            }
            return true;
        } else {
            return false;
        }
    }

    saveChord(chord, i) {
        if (this.checkChord(chord)) {
            for (let i = 0; i < this.generators.length; i++) {
                this.generators[i].chords[i] = chord.value;
            }
        } else {
            chord.value = this.chords[i];
            this.checkChord(chord);
        }
    }

    playTick(isStart) {
        let highlight = " highlighted";
        if (isStart) {
            highlight = " highlightedStart";
            for (let i = 0; i < this.generators.length; i++) {
                this.generators[i].playTick();
            }
        }

        let clickClass = this.metronomeOn ? "click enabled":"click disabled";
        this.clickButton.className = clickClass + highlight;
        window.setTimeout(function() {
            this.clickButton.className = clickClass;
        }, 20);
    }

    changeClickPort(port) {
        if (this.clickBusSelect[port].value == "internal") {
            this.metronome.outputId = "internal";
        } else {
            this.metronome.outputId = this.midi.availableOutputs[port-1].id;
        }
    }

    changeMidiClock(msg) {
        // this.metronome.midiClockStatus = msg;
        this.metronome.midiClockStatus = msg ? "send" : "none";
    }

    midiPortListUpdated() {
        if(this.midi != undefined) {
            // move "internal" option into click midi output options
            this.clickBusSelect.innerHTML = "";
            this.clickBusSelect.options[0] = new Option('internal');
            this.clickBusSelect.innerHTML += this.midi.availableOutputs
                .map(i =>`<option>${i.name}</option>`).join('');
            this.changeClickPort(0);
        }
    }

    generatorPortListUpdated() {
        for (let i = 0; i < this.generators.length; i++) {
            this.generators[i].midiPortListUpdated();
        }
    }

    startStopClick() {
        this.metronomeOn = !this.metronomeOn;
        this.metronome.playOutput = this.metronomeOn;
        this.metronome.startStop();
        if (this.metronomeOn) {
            this.clickButton.className = "click enabled";
        } else {
            this.clickButton.className = "click disabled";
        }
    }

    changeClickVolume(volume) {
        this.metronome.setVolume(volume);
    }

    checkBpm(value) {
        if (value >= 60 && value <= 240) {
            this.bpmTextfield.style.color = "var(--chordsTextColor)";
            return true;
		} else {
            this.bpmTextfield.style.color = "var(--chordsErrorColor)";
            return false;
        }
    }

    saveBpm(value) {
        if (this.checkBpm(value)) {
            this.metronome.bpm = value;
            for (let i = 0; i < this.generators.length; i++) {
                this.generators[i].changeBpm(value);
            }
        } else {
            if (value >= 60) {
                this.metronome.bpm = 240;
            } else if (value <= 240) {
                this.metronome.bpm = 60;
            }
            this.bpmTextfield.value = this.metronome.bpm;
            this.bpmTextfield.style.color = "var(--chordsTextColor)";
        }
    }

    playAll() {
        for (let i = 0; i < this.generators.length; i++) {
            this.generators[i].setPlayActive();
        }
    }

    stopAll() {
        for (let i = 0; i < this.generators.length; i++) {
            this.generators[i].stopPlayback();
        }
    }

    generateAll() {
        this.generateAllButton.disabled = true;
        this.generateAllCounter = 0;

        for (let i = 0; i < this.generators.length; i++) {
            this.generators[i].generateSequence(this.chords).then((data) => {
                this.generateAllCounter++;

                if (this.generateAllCounter == this.generators.length) {
                    this.generateAllButton.disabled = false;
                    this.generateAllButton.style.backgroundImage =
                        `linear-gradient(to bottom right, ` +
                        `hsla(${Math.random() * 360}, 80%, 70%, 0.3), ` +
                        `hsla(${Math.random() * 360}, 80%, 70%, 0.3))`;
                }
            });
        }
    }

    generateLoop() {
        for (let i = 0; i < this.generators.length; i++) {
            this.generators[i].startStopListening();
            this.generators[i].mutate();
            this.generators[i].generateSequence(this.chords);
        }
    }

    changeScene(direction, sender) {
        if (!sender.disabled) {
            if (direction == "forward") {
                this.sceneCounter++;
                this.midi.sendMIDISceneChange(this.sceneCounter);
            } else {
                this.sceneCounter--;
                this.midi.sendMIDISceneChange(this.sceneCounter);
            }

            document.getElementById("changeBackwardButton").disabled =
                this.sceneCounter == 0;
        }
    }

    mapMidi(midiMapButton) {
        this.midiMapMode = !this.midiMapMode;

        if (this.midiMapMode) {
            midiMapButton.className = "globalControlsButton active";
        } else {
            midiMapButton.className = "globalControlsButton inactive";
        }

        const buttons = document.getElementById("modulesContainer")
            .getElementsByTagName("button");
        for (const button of buttons) {
            if (this.midiMapMode) {
                let btnOverlay = document.createElement("div");
                btnOverlay.className = "btnOverlay";
                const mapped = this.midiMapParams[button.id];
                if (mapped) {
                    btnOverlay.innerHTML = mapped.note;
                }
                btnOverlay.addEventListener("click", function(e) {
                    e.stopPropagation();
                    const overlays =
                    document.getElementsByClassName("btnOverlay selected");
                    for (const overlay of overlays) {
                        overlay.className = "btnOverlay";
                    }
                    e.target.className = "btnOverlay selected";
                    this.midiMapSelection = e.target.parentElement;
                }.bind(this));

                btnOverlay.addEventListener("dblclick", function(e) {
                    e.stopPropagation();
                    e.target.innerHTML = "";
                    delete this.midiMapParams[e.target.parentElement.id];
                }.bind(this));

                button.appendChild(btnOverlay);
            } else {
                button.removeChild(button.childNodes[1]);
            }
        }
    }

    createUIElements() {
        let modulesContainer = document.createElement("div");
        modulesContainer.id = "modulesContainer";
        modulesContainer.className = "modulesContainerLeftRight";

        let mainModuleContainer = document.createElement("div");
        mainModuleContainer.id = "mainModuleContainer";
        mainModuleContainer.className = "container";

        let mainTitleDiv = document.createElement("div");
        mainTitleDiv.id = "mainTitleDiv";
        mainTitleDiv.innerHTML = "Main Module";

        let mainButtonContainer = document.createElement("div");
        mainButtonContainer.id = "mainButtonContainer";

        let mainButtonSubContainer1 = document.createElement("div");
        mainButtonSubContainer1.id = "mainButtonSubContainer1";
        mainButtonSubContainer1.className = "mainButtonDiv";

        let mainButtonSubContainer2 = document.createElement("div");
        mainButtonSubContainer2.id = "mainButtonSubContainer2";
        mainButtonSubContainer2.className = "mainButtonDiv";

        this.generateAllButton = document.createElement("button");
        this.generateAllButton.id = "generateAllButton";
        this.generateAllButton.innerHTML = "☷";
        this.generateAllButton.title = "Generate Sequence for all " +
            "Generator Modules";
        this.generateAllButton.disabled = true;

        this.bpmTextfield = document.createElement("input");
        this.bpmTextfield.type = "number";
        this.bpmTextfield.min = 60;
        this.bpmTextfield.max = 240;
        this.bpmTextfield.id = "bpmTextfield";
        this.bpmTextfield.value = "120";
        this.bpmTextfield.title = "Change the bpm: min 60, max 240";
        this.bpmTextfield.disabled = true;

        this.generateLoopButton = document.createElement("button");
        this.generateLoopButton.id = "generateLoopButton";
        this.generateLoopButton.innerHTML = "∞";
        this.generateLoopButton.title = "Magical generate loop!";
        this.generateLoopButton.disabled = true;

        let addButton = document.createElement("button");
        addButton.id = "addButton";
        addButton.innerHTML = "+";
        addButton.title = "Add a Generator Module";

        this.changeForwardButton = document.createElement("button");
        this.changeForwardButton.id = "changeForwardButton";
        this.changeForwardButton.className = "changeButton";
        this.changeForwardButton.innerHTML = "⇥";
        this.changeForwardButton.title = "Move one Scene (Instrument  " +
            "Presets) forward ";
        this.changeForwardButton.disabled = true;

        this.changeBackwardButton = document.createElement("button");
        this.changeBackwardButton.id = "changeBackwardButton";
        this.changeBackwardButton.className = "changeButton";
        this.changeBackwardButton.innerHTML = "⇤";
        this.changeBackwardButton.title = "Move one Scene (Instrument " +
        "Presets) backward";
        this.changeBackwardButton.disabled = true;

        this.stopAllButton = document.createElement("button");
        this.stopAllButton.id = "stopAllButton";
        this.stopAllButton.className = "buttonStop";
        this.stopAllButton.innerHTML = "■";
        this.stopAllButton.title = "Stop all playing Generators";
        this.stopAllButton.disabled = true;

        this.playAllButton = document.createElement("button");
        this.playAllButton.id = "playAllButton";
        this.playAllButton.innerHTML = "▶";
        this.playAllButton.title = "Play all generated Sequences";
        this.playAllButton.disabled = true;

        let chordContainer = document.createElement("div");
        chordContainer.id = "chordContainer";

        let chordTitleDiv = document.createElement("div");
        chordTitleDiv.id = "chordTitleDiv";
        chordTitleDiv.innerHTML = "Select a chord sequence:";

        let chordsDiv = document.createElement("div");
        chordsDiv.id = "chordsDiv";

        this.chordInputs = [];

        for (let [i, chord] of this.chords.entries()) {
        let chordInput = document.createElement("input");
        chordInput.id = "chord" + i;
        chordInput.className = "chords";
        chordInput.type = "text";
        chordInput.value = chord;
        chordInput.title = "Change chord according to major/minor/" +
        "augmented/diminished for all 12 root pitch classes, " +
        "e.g. C5 / Am / Eb5, ...";
        this.chordInputs.push(chordInput);
        }

        let clickContainer = document.createElement("div");
        clickContainer.id = "clickContainer";
        clickContainer.className = "container";

        this.clickVolumeSlider = document.createElement("input");
        this.clickVolumeSlider.type = "range";
        this.clickVolumeSlider.className = "slider";
        this.clickVolumeSlider.id = "clickVolumeSlider";
        this.clickVolumeSlider.min = "1";
        this.clickVolumeSlider.max = "100";
        this.clickVolumeSlider.value = "80";
        this.clickVolumeSlider.title = "Click Volume";

        this.clickButton = document.createElement("button");
        this.clickButton.id = "clickButton";
        this.clickButton.innerHTML = "◭";
        this.clickButton.title = "Start/Stop the Click";

        let clickBusContainer = document.createElement("div");
        clickBusContainer.id = "clickBusContainer";

        let clickBusText = document.createElement("div");
        clickBusText.innerHTML = "Click Out";
        clickBusText.title = "Port for outgoing click messages";

        this.clickBusSelect = document.createElement("select");
        this.clickBusSelect.id = "clickBusSelect";
        this.clickBusSelect.title = "Port for outgoing click messages";

        let clickClockContainer = document.createElement("div");
        clickClockContainer.id = "clickClockContainer";

        let clickClockText = document.createElement("div");
        clickClockText.innerHTML = "Clock";
        clickClockText.title = "Select whether MIDI Clock messages "
            + "should be used (instead of regular MIDI messages)";

        this.clickClockSelect = document.createElement("input");
        this.clickClockSelect.setAttribute("type", "checkbox");
        this.clickClockSelect.id = "clickClockSelect";
        this.clickClockSelect.title = "Select whether MIDI Clock messages "
            + "should be used (instead of regular MIDI messages)"

        mainModuleContainer.appendChild(mainTitleDiv);
        mainModuleContainer.appendChild(chordContainer);
        mainModuleContainer.appendChild(clickContainer);
        mainModuleContainer.appendChild(mainButtonContainer);
        clickContainer.appendChild(this.clickVolumeSlider);
        clickContainer.appendChild(this.clickButton);
        clickContainer.appendChild(clickBusContainer);
        clickContainer.appendChild(clickClockContainer);
        clickBusContainer.appendChild(clickBusText);
        clickBusContainer.appendChild(this.clickBusSelect);
        clickClockContainer.appendChild(clickClockText);
        clickClockContainer.appendChild(this.clickClockSelect);
        mainButtonContainer.appendChild(mainButtonSubContainer1);
        mainButtonContainer.appendChild(mainButtonSubContainer2);
        mainButtonSubContainer1.appendChild(this.changeBackwardButton);
        mainButtonSubContainer1.appendChild(this.changeForwardButton);
        mainButtonSubContainer1.appendChild(this.generateLoopButton);
        mainButtonSubContainer1.appendChild(this.bpmTextfield);
        mainButtonSubContainer2.appendChild(this.generateAllButton);
        mainButtonSubContainer2.appendChild(this.playAllButton);
        mainButtonSubContainer2.appendChild(this.stopAllButton);
        mainButtonSubContainer2.appendChild(addButton);
        chordContainer.appendChild(chordTitleDiv);
        chordContainer.appendChild(chordsDiv);
        for (let chordInput of this.chordInputs) {
            chordsDiv.appendChild(chordInput);
        }

        const mainContainer = document.getElementById("mainContainer");
        mainContainer.appendChild(modulesContainer);

        modulesContainer.appendChild(mainModuleContainer);

        this.generateAllButton.addEventListener('click', function() {
            this.generateAll()}.bind(this));
        this.generateLoopButton.addEventListener('click', function() {
            this.generateLoop()}.bind(this));
        addButton.addEventListener('click', function() {
            this.addModule(this.generatorCounter,
                            this.midi.availableOutputs[0].name,
                            this.midi.availableInputs[0].name)}.bind(this));
        this.stopAllButton.addEventListener('click', function() {
            this.stopAll()}.bind(this));
        this.playAllButton.addEventListener('click', function() {
            this.playAll()}.bind(this));
        this.changeForwardButton.addEventListener('click', function(e) {
            this.changeScene("forward", e.target)}.bind(this));
        this.changeBackwardButton.addEventListener('click', function(e) {
            this.changeScene("backward", e.target)}.bind(this));
        this.clickVolumeSlider.addEventListener("input", function(e) {
            this.changeClickVolume(e.target.value/100)}.bind(this));
        for (let [i, chord] of this.chordInputs.entries()) {
            chord.addEventListener('input', function(e) {
                this.checkChord(e.target, i)}.bind(this));
            chord.addEventListener('focusout', function(e) {
                this.saveChord(e.target, i)}.bind(this));
                chord.addEventListener('keypress', function(e) {
                if (e.keyCode == 13) {
                    this.saveChord(e.target, i);
                    document.activeElement.blur();
                }}.bind(this));
        }
        this.bpmTextfield.addEventListener('input', function(e) {
            this.checkBpm(e.target.value)}.bind(this));
        this.bpmTextfield.addEventListener('focusout', function(e) {
            this.saveBpm(e.target.value)}.bind(this));
        this.bpmTextfield.addEventListener('keypress', function(e) {
            if (e.keyCode == 13) {
                this.saveBpm(e.target.value);
                document.activeElement.blur();
            }}.bind(this));
        this.clickButton.addEventListener('click', function(){
            this.startStopClick()}.bind(this));

        // Populate the MidiOut and MidiIn lists
        this.midiPortListUpdated();
        this.clickBusSelect.addEventListener("change", function() {
            this.changeClickPort(this.clickBusSelect.selectedIndex);
        }.bind(this));

        this.clickClockSelect.addEventListener("change", function(e) {
            this.changeMidiClock(e.target.checked);
        }.bind(this));
    }
}