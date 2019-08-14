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
        this.chord1;
        this.chord2;
        this.chord3;
        this.chord4;
        this.bpmTextfield;
        this.maxScenes = 2;
        this.generators = new Map();
        this.connector = new Connector(this);
        this.connector.initialize(0);
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
            this.generateAllButton.disabled = false;
            this.changeForwardButton.disabled = false;
            this.playAllButton.disabled = false;
            this.stopAllButton.disabled = false;
            this.bpmTextfield.disabled = false;
            this.generateLoopButton.disabled = false;
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

    checkChords() {
        this.generators.forEach((generator, id) => {
            generator.generateButton.disabled = true;
        });

        const chords = [
            this.chord1.value,
            this.chord2.value,
            this.chord3.value,
            this.chord4.value
        ];

		const isGood = (chord) => {
            if (!chord) {return false}

            try {
                mm.chords.ChordSymbols.pitches(chord);
                return true;
            }
            catch(e) {
                return false;
		    }
		}

        let allGood = true;
		if (isGood(chords[0])) {
			this.chord1.style.color = "var(--chordsTextColor)";
		} else {
			this.chord1.style.color = 'red';
			allGood = false;
		}
		if (isGood(chords[1])) {
			this.chord2.style.color = "var(--chordsTextColor)";
		} else {
			this.chord2.style.color = 'red';
			allGood = false;
		}
		if (isGood(chords[2])) {
			this.chord3.style.color = "var(--chordsTextColor)";
		} else {
			this.chord3.style.color = 'red';
			allGood = false;
		}
		if (isGood(chords[3])) {
			this.chord4.style.color = "var(--chordsTextColor)";
		} else {
			this.chord4.style.color = 'red';
			allGood = false;
		}

        if (allGood) {
            this.generators.forEach((generator, id) => {
                generator.generateButton.disabled = false;
            });
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

    changeBpm(value, focusOut) {
        if (value >= 60 && value <= 240) {
            this.metronome.bpm = value;
            this.generators.forEach((generator, id) => {
                generator.changeBpm(value);
            });
            this.bpmTextfield.style.color = "var(--chordsTextColor)";
		} else {
            this.bpmTextfield.style.color = 'red';
            if (focusOut) {
                if (value >= 60) {
                    this.metronome.bpm = 240;
                } else if (value <= 240) {
                    this.metronome.bpm = 60;
                }
                this.bpmTextfield.value = this.metronome.bpm;
                this.bpmTextfield.style.color = "var(--chordsTextColor)";
            }
        }
    }

    generateAll() {
        this.generateAllButton.disabled = true;
        this.generateAllCounter = 0;
        const chords = [
            this.chord1.value,
            this.chord2.value,
            this.chord3.value,
            this.chord4.value
        ];

        this.generators.forEach((generator, id) => {
            generator.generateSequence(chords).then((data) => {
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
        const chords = [
            this.chord1.value,
            this.chord2.value,
            this.chord3.value,
            this.chord4.value
        ];
        this.generators.forEach((generator, id) => {
            generator.startStopListening();
            generator.mutate();
            generator.generateSequence(chords);
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
                console.log("midi map it!");
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
        mainButtonContainer.className = "mainButtonDiv";

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

        let selectChords = document.createElement("div");
        selectChords.id = "selectChords";
        selectChords.innerHTML = "Select a chord sequence:";

        let chords = document.createElement("div");
        chords.id = "chords";

        let table = document.createElement("table");
        table.className = "center";

        let tableTr = document.createElement("tr");

        let tableTd1 = document.createElement("td");
        let tableTd2 = document.createElement("td");
        let tableTd3 = document.createElement("td");
        let tableTd4 = document.createElement("td");

        const chordTitle = "Change chord according to major/minor/" +
            "augmented/diminished for all 12 root pitch classes, " +
            "e.g. C5 / Am / Eb5, ...";

        this.chord1 = document.createElement("input");
        this.chord1.id = "chord1";
        this.chord1.className = "chords";
        this.chord1.type = "text";
        this.chord1.value = "C";
        this.chord1.title = chordTitle;

        this.chord2 = document.createElement("input");
        this.chord2.id = "chord2";
        this.chord2.className = "chords";
        this.chord2.type = "text";
        this.chord2.value = "G";
        this.chord2.title = chordTitle;

        this.chord3 = document.createElement("input");
        this.chord3.id = "chord3";
        this.chord3.className = "chords";
        this.chord3.type = "text";
        this.chord3.value = "Am";
        this.chord3.title = chordTitle;

        this.chord4 = document.createElement("input");
        this.chord4.id = "chord4";
        this.chord4.className = "chords";
        this.chord4.type = "text";
        this.chord4.value = "F";
        this.chord4.title = chordTitle;

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
        clickBusText.innerHTML = "Click Out Clock";
        clickBusText.title = "Port for outgoing click messages";

        this.clickBusSelect = document.createElement("select");
        this.clickBusSelect.id = "clickBusSelect";
        this.clickBusSelect.title = "Port for outgoing click messages";

        this.clickClockSelect = document.createElement("select");
        this.clickClockSelect.id = "clickClockSelect";
        this.clickClockSelect.title = "Select whether MIDI Clock messages "
            + "should be used (instead of regular MIDI messages) and "
            + "be in send or receive state";
        this.clickClockSelect.options[0] = new Option('none');
        this.clickClockSelect.options[1] = new Option('send');
        this.clickClockSelect.options[2] = new Option('receive');

        mainModuleContainer.appendChild(mainTitleDiv);
        mainModuleContainer.appendChild(chordContainer);
        mainModuleContainer.appendChild(clickContainer);
        mainModuleContainer.appendChild(mainButtonContainer);
        clickContainer.appendChild(clickVolumeSlider);
        clickContainer.appendChild(this.clickButton);
        clickContainer.appendChild(clickBusContainer);
        clickBusContainer.appendChild(clickBusText);
        clickBusContainer.appendChild(this.clickBusSelect);
        clickBusContainer.appendChild(this.clickClockSelect);
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
        chordContainer.appendChild(selectChords);
        chordContainer.appendChild(chords);
        chords.appendChild(table);
        table.appendChild(tableTr);
        tableTr.appendChild(tableTd1);
        tableTr.appendChild(tableTd2);
        tableTr.appendChild(tableTd3);
        tableTr.appendChild(tableTd4);
        tableTd1.appendChild(this.chord1);
        tableTd2.appendChild(this.chord2);
        tableTd3.appendChild(this.chord3);
        tableTd4.appendChild(this.chord4);

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
        this.chord1.addEventListener('input', function() {
            this.checkChords()}.bind(this));
        this.chord2.addEventListener('input', function() {
            this.checkChords()}.bind(this));
        this.chord3.addEventListener('input', function() {
            this.checkChords()}.bind(this));
        this.chord4.addEventListener('input', function() {
            this.checkChords()}.bind(this));
        this.bpmTextfield.addEventListener('input', function(e) {
            this.changeBpm(e.target.value, false)}.bind(this));
        this.bpmTextfield.addEventListener('focusout', function(e) {
            this.changeBpm(e.target.value, true)}.bind(this));
        this.bpmTextfield.addEventListener('keypress', function(e) {
            if (e.keyCode == 13) {
                this.changeBpm(e.target.value, true);
                document.activeElement.blur();
            }}.bind(this));
        this.clickButton.addEventListener('click', function(){
            this.startStopClick()}.bind(this));

        // Populate the MidiOut and MidiIn lists
        this.midiPortListUpdated();
        this.clickBusSelect.addEventListener("change", function() {
            this.changeClickPort(this.clickBusSelect.selectedIndex);
        }.bind(this));
    }
}