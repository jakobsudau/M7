// -------------------------------------------------------------------------
// Main Module Class
// -------------------------------------------------------------------------

class MainModule {
    constructor(midiAccess) {
        this.spaceSwitch = false;
        this.isDarkMode = false;
        this.midiMapMode = false;
        this.midiMapSelection;
        this.midiMapParams = new Map();
        this.clickButton;
        this.buttonGenerateAll;
        this.buttonStopAll;
        this.buttonPlayAll;
        this.buttonChangeBackward;
        this.buttonChangeForward;
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
        this.midi = new Midi(midiAccess, this);
        this.metronome = new Metronome(this);
        this.metronome.initialize();
        this.metronome.startStop();
        this.createUIElements();
        this.startStopClick();
        this.startStopClick();
    }

    addModule() {
        const generator = new GeneratorModule(this, this.generatorCounter);
        generator.initialize().then((id) => {
            this.generators.set(id, generator);
        });
        this.generatorCounter++;
        this.buttonGenerateAll.disabled = false;
        this.buttonChangeForward.disabled = false;
        this.buttonPlayAll.disabled = false;
        this.buttonStopAll.disabled = false;
        this.bpmTextfield.disabled = false;
        this.generateLoopButton.disabled = false;
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
        let darkMode = this.isDarkMode ? "white" : "black";
		if (isGood(chords[0])) {
			this.chord1.style.color = darkMode;
		} else {
			this.chord1.style.color = 'red';
			allGood = false;
		}
		if (isGood(chords[1])) {
			this.chord2.style.color = darkMode;
		} else {
			this.chord2.style.color = 'red';
			allGood = false;
		}
		if (isGood(chords[2])) {
			this.chord3.style.color = darkMode;
		} else {
			this.chord3.style.color = 'red';
			allGood = false;
		}
		if (isGood(chords[3])) {
			this.chord4.style.color = darkMode;
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
            this.bpmTextfield.style.color =
                this.isDarkMode ? "white" : "black";
		} else {
            this.bpmTextfield.style.color = 'red';
            if (focusOut) {
                if (value >= 60) {
                    this.metronome.bpm = 240;
                } else if (value <= 240) {
                    this.metronome.bpm = 60;
                }
                this.bpmTextfield.value = this.metronome.bpm;
                this.bpmTextfield.style.color = 'black';
            }
        }
    }

    generateAll() {
        const chords = [
            this.chord1.value,
            this.chord2.value,
            this.chord3.value,
            this.chord4.value
        ];

        this.generators.forEach((generator, id) => {
            generator.generateSequence(chords);
        });
        this.buttonGenerateAll.style.backgroundImage =
            `linear-gradient(to bottom right, ` +
            `hsla(${Math.random() * 360}, 80%, 70%, 0.3), ` +
            `hsla(${Math.random() * 360}, 80%, 70%, 0.3))`;
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

            document.getElementById("buttonChangeBackward").disabled =
                this.sceneCounter == 0;
        }
    }

    switchDarkMode(darkMode) {
        if (this.isDarkMode != darkMode) {
            if(document.documentElement.getAttribute('theme') == "dark"){
                document.documentElement.setAttribute('theme', 'light');
                darkModeSwitcher.innerHTML = "☾";
            } else {
                document.documentElement.setAttribute('theme', 'dark');
                darkModeSwitcher.innerHTML = "☀";
            }

            this.isDarkMode = darkMode;

            let chords = document.getElementsByClassName("chords");
            for(let i=0, len=chords.length; i<len; i++) {
                if (chords[i].style.color != 'red') {
                    chords[i].style.color =
                        this.isDarkMode ? "white" : "black";
                }
            }
        }
    }

    mapMidi() {
        this.midiMapMode = !this.midiMapMode;

        if (this.midiMapMode) {
            midiMapButton.className = "midiMapButton active";
        } else {
            midiMapButton.className = "midiMapButton inactive";
        }

        const buttons = document.getElementById("mainSubContainer")
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
        let mainSubContainer = document.createElement("div");
        mainSubContainer.id = "mainSubContainer";
        mainSubContainer.className = "mainSubContainerLeftRight";

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

        this.buttonGenerateAll = document.createElement("button");
        this.buttonGenerateAll.id = "buttonGenerateAll";
        this.buttonGenerateAll.innerHTML = "☷";
        this.buttonGenerateAll.title = "Generate Sequence for all " +
            "Generator Modules";
        this.buttonGenerateAll.disabled = true;

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

        let buttonAdd = document.createElement("button");
        buttonAdd.id = "buttonAdd";
        buttonAdd.innerHTML = "+";
        buttonAdd.title = "Add a Generator Module";

        this.buttonChangeForward = document.createElement("button");
        this.buttonChangeForward.id = "buttonChangeForward";
        this.buttonChangeForward.className = "changeButton";
        this.buttonChangeForward.innerHTML = "⇥";
        this.buttonChangeForward.title = "Move one Scene (Instrument  " +
            "Presets) forward ";
        this.buttonChangeForward.disabled = true;

        this.buttonChangeBackward = document.createElement("button");
        this.buttonChangeBackward.id = "buttonChangeBackward";
        this.buttonChangeBackward.className = "changeButton";
        this.buttonChangeBackward.innerHTML = "⇤";
        this.buttonChangeBackward.title = "Move one Scene (Instrument " +
        "Presets) backward";
        this.buttonChangeBackward.disabled = true;

        this.buttonStopAll = document.createElement("button");
        this.buttonStopAll.id = "buttonStopAll";
        this.buttonStopAll.className = "buttonStop";
        this.buttonStopAll.innerHTML = "■";
        this.buttonStopAll.title = "Stop all playing Generators";
        this.buttonStopAll.disabled = true;

        this.buttonPlayAll = document.createElement("button");
        this.buttonPlayAll.id = "buttonPlayAll";
        this.buttonPlayAll.innerHTML = "▶";
        this.buttonPlayAll.title = "Play all generated Sequences";
        this.buttonPlayAll.disabled = true;

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
        this.clickClockSelect.title = "Select whether MIDI Clock should be "
            + "used and be in send or receive state";
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
        mainButtonSubContainer1.appendChild(this.buttonChangeBackward);
        mainButtonSubContainer1.appendChild(this.buttonChangeForward);
        mainButtonSubContainer1.appendChild(this.generateLoopButton);
        mainButtonSubContainer1.appendChild(this.bpmTextfield);
        mainButtonSubContainer2.appendChild(this.buttonGenerateAll);
        mainButtonSubContainer2.appendChild(this.buttonPlayAll);
        mainButtonSubContainer2.appendChild(this.buttonStopAll);
        mainButtonSubContainer2.appendChild(buttonAdd);
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
        mainContainer.appendChild(mainSubContainer);

        mainSubContainer.appendChild(mainModuleContainer);

        this.buttonGenerateAll.addEventListener('click', function() {
            this.generateAll()}.bind(this));
        this.generateLoopButton.addEventListener('click', function() {
            this.generateLoop()}.bind(this));
        buttonAdd.addEventListener('click', function() {
            this.addModule()}.bind(this));
        this.buttonStopAll.addEventListener('click', function() {
            this.stopAll()}.bind(this));
        this.buttonPlayAll.addEventListener('click', function() {
            this.playAll()}.bind(this));
        this.buttonChangeForward.addEventListener('click', function(e) {
            this.changeScene("forward", e.target)}.bind(this));
        this.buttonChangeBackward.addEventListener('click', function(e) {
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

// -------------------------------------------------------------------------
// Start
// -------------------------------------------------------------------------

function initializeDarkModeAndUtilities(main) {
    const controlButtonDiv = document.createElement("div");
    controlButtonDiv.id = "controlButtonDiv";
    controlButtonDiv.className = "left";

    const helpButton = document.createElement("button");
    helpButton.id = "helpButton";
    helpButton.innerHTML = "?";
    helpButton.title = "Show the Help Screen";
    helpButton.addEventListener('click', function(){showHelp()});

    const fullscreenButton = document.createElement("button");
    fullscreenButton.id = "fullscreenButton";
    fullscreenButton.innerHTML = "◱";
    fullscreenButton.title = "Toggle Fullscreen on/off";

    const logoButton = document.createElement("button");
    logoButton.id = "logoButton";
    logoButton.innerHTML = "◱";
    logoButton.title = "Welcome to MMAI";

    const positionButton = document.createElement("button");
    positionButton.id = "positionButton";
    positionButton.innerHTML = "◧";
    positionButton.title = "Move control button bar to top/right/left";

    const midiMapButton = document.createElement("button");
    midiMapButton.id = "midiMapButton";
    midiMapButton.className = "midiMapButton inactive";
    midiMapButton.innerHTML = "⚇";
    midiMapButton.title = "Map controls to MIDI. Click on the desired " +
        " button and play the MIDI note to map. " +
        "Double Click on mapped button to delete.";
    midiMapButton.addEventListener("click", function() {
        main.mapMidi();
    });

    const darkModeSwitcher = document.createElement("button");
    darkModeSwitcher.id = "darkModeSwitcher";
    darkModeSwitcher.innerHTML = "☾";
    darkModeSwitcher.title = "Switch to Dark/Light Mode";
    darkModeSwitcher.addEventListener("click", function() {
        main.switchDarkMode(!main.isDarkMode);
    });

    fullscreenButton.addEventListener("click", function() {
        controlButtonDiv
        if (document.fullscreenElement) {
            fullscreenButton.innerHTML = "◱";
            document.exitFullscreen()
        } else {
            fullscreenButton.innerHTML = "◳";
            document.body.requestFullscreen();
        }
    });

    positionButton.addEventListener("click", function() {
        const mainSubCon = document.getElementById("mainSubContainer");
        const mainCon = document.getElementById("mainContainer");
        switch (controlButtonDiv.className) {
            case "left":
                positionButton.innerHTML = "⬒";
                controlButtonDiv.className = "top";
                mainSubCon.className = "mainSubContainerTopBottom";
                break;
            case "top":
                positionButton.innerHTML = "◨";
                controlButtonDiv.className = "right";
                mainSubCon.className = "mainSubContainerLeftRight";
                break;
            case "right":
                positionButton.innerHTML = "⬓";
                controlButtonDiv.className = "bottom";
                mainSubCon.className = "mainSubContainerTopBottom";
                mainCon.appendChild(controlButtonDiv);
                break;
            case "bottom":
                positionButton.innerHTML = "◧";
                controlButtonDiv.className = "left";
                mainSubCon.className = "mainSubContainerLeftRight";
                mainCon.insertBefore(controlButtonDiv,mainCon.childNodes[0]);
                break;
        }
    });

    controlButtonDiv.appendChild(logoButton);
    controlButtonDiv.appendChild(darkModeSwitcher);
    controlButtonDiv.appendChild(helpButton);
    controlButtonDiv.appendChild(fullscreenButton);
    controlButtonDiv.appendChild(midiMapButton);
    controlButtonDiv.appendChild(positionButton);
    const mainCon = document.getElementById("mainContainer");
    mainCon.insertBefore(controlButtonDiv, mainCon.childNodes[0]);
    addHelp();
}

function addHelp() {
    let overlay = document.createElement("div");
    overlay.id = "overlay";

    let helpContainer = document.createElement("div");
    helpContainer.id = "helpContainer";
    helpContainer.className = "container";

    let helpTitleDiv = document.createElement("div");
    helpTitleDiv.id = "helpTitleDiv";
    helpTitleDiv.innerHTML = "Help";

    let helpTextDiv = document.createElement("div");
    helpTextDiv.id = "helpTextDiv";
    helpTextDiv.innerHTML = "Generate your own melodies in sync with " +
        "click with as many Generators as your system can handle and " +
        "send them each to any of your systems MIDI Ports so you can " +
        "listen to your own AI band!<br/><br/>Hover over any UI Element " +
        "to see the tooltip.<br/><br/>This is the project MMAI by Jakob " +
        "Sudau for his Master at the HAW Hamburg called Sound/Vision." +
        "<br/><br/><br/>Enjoy!";

    let helpBottomTextDiv = document.createElement("div");
    helpBottomTextDiv.id = "helpBottomTextDiv";
    helpBottomTextDiv.innerHTML = "Copyright © Jakob Sudau, 2019, " +
        "jakob.sudau@icloud.com";

    let deleteButton = document.createElement("button");
    deleteButton.className = "deleteButton";
    deleteButton.innerHTML = "X";
    deleteButton.title = "Close the Help Screen";
    deleteButton.addEventListener('click', function(){showHelp()});

    helpContainer.appendChild(helpTitleDiv);
    helpContainer.appendChild(helpTextDiv);
    helpContainer.appendChild(helpBottomTextDiv);
    helpContainer.appendChild(deleteButton);
    overlay.appendChild(helpContainer);
    document.body.appendChild(overlay);
}

function showHelp() {
    const mainSubContainer = document.getElementById("mainSubContainer");
    const controlButtonDiv = document.getElementById("controlButtonDiv");
    const overlay = document.getElementById("overlay");
    if (overlay.style.display == "block") {
        overlay.style.display = "none";
        mainSubContainer.style.filter = "blur(0px)";
        controlButtonDiv.style.filter = "blur(0px)";
    } else {
        overlay.style.display = "block";
        mainSubContainer.style.filter = "blur(5px)";
        controlButtonDiv.style.filter = "blur(5px)";
    }
}

var electron; // used in connector.js

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then( onMIDIInit, onMIDIReject );
} else {
    alert("No MIDI support present in your browser.");
}

function onMIDIInit(midi) {
    midiAccess = midi;

    if (isElectron) {
        electron = require('electron');
    } else {
        let socketScript = document.createElement("script");
        socketScript.type = "text/javascript";
        socketScript.src = "/socket.io/socket.io.js";
        socketScript.addEventListener("load", function() {
            console.log("done loading");
        });
        document.getElementById("mainContainer").appendChild(socketScript);
    }

    document.documentElement.setAttribute('theme', 'light');
    const main = new MainModule(midiAccess);
    midiAccess.onstatechange = function() {main.midi.hookUpMIDIInput()};
    initializeDarkModeAndUtilities(main);
}

function onMIDIReject(err) {
    alert("The MIDI system failed to start.");
}