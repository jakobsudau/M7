// -------------------------------------------------------------------------
// Main Module Class
// -------------------------------------------------------------------------

class MainModule {
    constructor(midiAccess) {
        if (!!MainModule.instance) {
            return MainModule.instance;
        }

        MainModule.instance = this;
        this.spaceSwitch = false;
        this.midiMapMode = false;
        this.midiMapSelection;
        this.midiMapParams = new Map();
        this.clickButton;
        this.generateAllButton;
        this.stopAllButton;
        this.playAllButton;
        this.changeBackwardButton;
        this.changeForwardButton;
        this.generateLoopButton;
        this.clickBusSelect;
        this.selectedClickBusId = "internal";
        this.metronomeOn = false;
        this.chords = ["C", "G", "Am", "F"];
        this.bpmTextfield;
        this.maxScenes = 2;
        this.generators = new Map();
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

    addModule() {
        const generator = new GeneratorModule(this, this.generatorCounter);
        generator.initialize().then((id) => {
            this.generators.set(id, generator);
            generator.chords = this.chords;
            if (this.generators.size == 1) {
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
        this.generators.delete(id);
        // delete any mapped parameters
        this.midiMapParams.forEach((noteAndInput, button) => {
            if (!(document.body.contains(button))) {
                this.midiMapParams.delete(button);
            }
        });

        if (this.generators.size == 0) {
            this.generateAllButton.disabled = true;
            this.changeForwardButton.disabled = true;
            this.playAllButton.disabled = true;
            this.stopAllButton.disabled = true;
            this.bpmTextfield.disabled = true;
            this.generateLoopButton.disabled = true;
        }
    }

    startStopNote(note, velocity, isStart, input) {
        if (this.midiMapMode) {
            if (isStart) {
                this.midiMapSelection.childNodes[1].innerHTML = note;
                this.midiMapParams.set(this.midiMapSelection,
                    {note: note, input: input});
            }
        } else {
            this.generators.forEach((generator, id) => {
                if (generator.listening &&
                    generator.selectedInput == input) {
                    generator.startStopNote(note, velocity, isStart);
                }
            });

            if (isStart) {
                this.midiMapParams.forEach((noteAndInput, button) => {
                    if (noteAndInput.note == note &&
                        noteAndInput.input == input) {
                        button.click();
                    }
                });
            }
        }
    }

    checkChord(chord, i) {
        this.generateAllButton.disabled = true;
        this.generators.forEach((generator, id) => {
            generator.generateButton.disabled = true;
        });

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
            this.generators.forEach((generator, id) => {
                generator.generateButton.disabled = false;
            });
            return true;
        } else {
            return false;
        }
    }

    saveChord(chord, i) {
        if (this.checkChord(chord)) {
            this.generators.forEach((generator, id) => {
                generator.chords[i] = chord.value;
            });
        } else {
            chord.value = this.chords[i];
            this.checkChord(chord);
        }
    }

    playTick(isStart) {
        let highlight = " highlighted";
        if (isStart) {
            highlight = " highlightedStart";
            this.generators.forEach((generator, id) => {
                generator.playTick();
            });
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
        this.metronome.midiClockStatus = msg;
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
        this.generators.forEach((generator, id) => {
            generator.midiPortListUpdated();
        });
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
            this.generators.forEach((generator, id) => {
                generator.changeBpm(value);
            });
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
        this.generators.forEach((generator, id) => {
            generator.setPlayActive();
        });
    }

    stopAll() {
        this.generators.forEach((generator, id) => {
            generator.stopPlayback();
        });
    }

    generateAll() {
        this.generateAllButton.disabled = true;
        this.generateAllCounter = 0;

        this.generators.forEach((generator, id) => {
            generator.generateSequence(this.chords).then((data) => {
                this.generateAllCounter++;

                if (this.generateAllCounter == this.generators.size) {
                    this.generateAllButton.disabled = false;
                    this.generateAllButton.style.backgroundImage =
                        `linear-gradient(to bottom right, ` +
                        `hsla(${Math.random() * 360}, 80%, 70%, 0.3), ` +
                        `hsla(${Math.random() * 360}, 80%, 70%, 0.3))`;
                }
            });
        });
    }

    generateLoop() {
        this.generators.forEach((generator, id) => {
            generator.startStopListening();
            generator.mutate();
            generator.generateSequence(this.chords);
        });
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

    mapMidi() {
        this.midiMapMode = !this.midiMapMode;

        if (this.midiMapMode) {
            midiMapButton.className = "midiMapButton active";
        } else {
            midiMapButton.className = "midiMapButton inactive";
        }

        const buttons = document.getElementById("modulesContainer")
            .getElementsByTagName("button");
        for (const button of buttons) {
            if (this.midiMapMode) {
                let btnOverlay = document.createElement("div");
                btnOverlay.className = "btnOverlay";
                const mapped = this.midiMapParams.get(button);
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
                    this.midiMapParams.delete(e.target.parentElement);
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

        let chordInputs = [];

        for (let [i, chord] of this.chords.entries()) {
        let chordInput = document.createElement("input");
        chordInput.id = "chord" + i;
        chordInput.className = "chords";
        chordInput.type = "text";
        chordInput.value = chord;
        chordInput.title = "Change chord according to major/minor/" +
        "augmented/diminished for all 12 root pitch classes, " +
        "e.g. C5 / Am / Eb5, ...";
        chordInputs.push(chordInput);
        }

        let clickContainer = document.createElement("div");
        clickContainer.id = "clickContainer";
        clickContainer.className = "container";

        let clickVolumeSlider = document.createElement("input");
        clickVolumeSlider.type = "range";
        clickVolumeSlider.className = "slider";
        clickVolumeSlider.id = "clickVolumeSlider";
        clickVolumeSlider.min = "1";
        clickVolumeSlider.max = "100";
        clickVolumeSlider.value = "80";
        clickVolumeSlider.title = "Click Volume";

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
            + "should be used (instead of regular MIDI messages)"
            /*+ " and be in send or receive state"*/;

        // this.clickClockSelect = document.createElement("select");
        this.clickClockSelect = document.createElement("input");
        this.clickClockSelect.setAttribute("type", "checkbox");
        this.clickClockSelect.id = "clickClockSelect";
        this.clickClockSelect.title = "Select whether MIDI Clock messages "
            + "should be used (instead of regular MIDI messages)"
            /*+ " and be in send or receive state"*/;
        // this.clickClockSelect.options[0] = new Option('none');
        // this.clickClockSelect.options[1] = new Option('send');
        // this.clickClockSelect.options[2] = new Option('receive');

        mainModuleContainer.appendChild(mainTitleDiv);
        mainModuleContainer.appendChild(chordContainer);
        mainModuleContainer.appendChild(clickContainer);
        mainModuleContainer.appendChild(mainButtonContainer);
        clickContainer.appendChild(clickVolumeSlider);
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
        for (let chordInput of chordInputs) {
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
            this.addModule()}.bind(this));
        this.stopAllButton.addEventListener('click', function() {
            this.stopAll()}.bind(this));
        this.playAllButton.addEventListener('click', function() {
            this.playAll()}.bind(this));
        this.changeForwardButton.addEventListener('click', function(e) {
            this.changeScene("forward", e.target)}.bind(this));
        this.changeBackwardButton.addEventListener('click', function(e) {
            this.changeScene("backward", e.target)}.bind(this));
        clickVolumeSlider.addEventListener("input", function(e) {
            this.changeClickVolume(e.target.value/100)}.bind(this));
        for (let [i, chord] of chordInputs.entries()) {
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
            this.changeMidiClock(e.target[e.target.selectedIndex].text);
        }.bind(this));
    }
}