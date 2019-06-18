// -------------------------------------------------------------------------
// Main Module Class
// -------------------------------------------------------------------------

class MainModule {
    constructor(midiAccess) {
        this.spaceSwitch = false;
        this.isDarkMode = false;
        this.clickButton;
        this.buttonGenerateAll;
        this.buttonStopAll;
        this.buttonPlayAll;
        this.buttonChangeBackward;
        this.buttonChangeForward;
        this.generateLoopButton;
        this.chord1;
        this.chord2;
        this.chord3;
        this.chord4;
        this.bpmTextfield;
        this.maxScenes = 2;
        this.generators = new Map();
        this.generatorCounter = 0;
        this.sceneCounter = 0;
        this.midi = new Midi(midiAccess, this);
        this.metronome = new Metronome(this);
        this.metronome.initialize();
        this.createUIElements();
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
    }

    startStopNote(note, velocity, isStart, input) {
        this.generators.forEach((generator, id) => {
            if (generator.listening &&
                (generator.selectedInput == input.value)) {
                generator.startStopNote(note, velocity, isStart);
            }
        });
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
            if (!chord) {
                return false;
            }
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

		let changed = false;
		if (this.currentChords) {
			if (chords[0] !== this.currentChords[0]) {changed = true;}
			if (chords[1] !== this.currentChords[1]) {changed = true;}
			if (chords[2] !== this.currentChords[2]) {changed = true;}
			if (chords[3] !== this.currentChords[3]) {changed = true;}
		}
		else {
			changed = true;
        }

        if (allGood) {
            this.generators.forEach((generator, id) => {
                generator.generateButton.disabled = false;
            });
        }
    }

    startStopClick() {
        this.metronome.startStop();

        if (this.metronome.isPlaying) {
            this.clickButton.className = "click enabled";
        } else {
            this.clickButton.className = "click disabled";
        }
    }

    changeClickVolume(volume) {
        this.metronome.gainNode.gain.value = volume;
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

    switchDarkMode() {
        this.isDarkMode = !this.isDarkMode;

        let chords = document.getElementsByClassName("chords");
        for(let i=0, len=chords.length; i<len; i++) {
            if (chords[i].style.color != 'red') {
                chords[i].style.color = this.isDarkMode ? "white" : "black";
            }
        }
    }

    createUIElements() {
        let mainSubContainer = document.createElement("div");
        mainSubContainer.id = "mainSubContainer";

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
        this.buttonGenerateAll.innerHTML = "ga";
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
        this.clickButton.innerHTML = "Click";
        this.clickButton.title = "Start/Stop the Click";

        mainModuleContainer.appendChild(mainTitleDiv);
        mainModuleContainer.appendChild(chordContainer);
        mainModuleContainer.appendChild(clickContainer);
        mainModuleContainer.appendChild(mainButtonContainer);
        clickContainer.appendChild(clickVolumeSlider);
        clickContainer.appendChild(this.clickButton);
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
    }
}

// -------------------------------------------------------------------------
// Start
// -------------------------------------------------------------------------

function initializeDarkModeAndUtilities(main) {
    const controlButtonDiv = document.createElement("div");
    controlButtonDiv.id = "controlButtonDiv";

    const helpButton = document.createElement("button");
    helpButton.id = "helpButton";
    helpButton.innerHTML = "?";
    helpButton.title = "Show the Help Screen";
    helpButton.addEventListener('click', function(){showHelp()});

    const fullscreenButton = document.createElement("button");
    fullscreenButton.id = "fullscreenButton";
    fullscreenButton.innerHTML = "◱";
    fullscreenButton.title = "Toggle Fullscreen on/off";

    const darkModeSwitcher = document.createElement("button");
    darkModeSwitcher.id = "darkModeSwitcher";
    darkModeSwitcher.innerHTML = "☾";
    darkModeSwitcher.title = "Switch to Dark/Light Mode";
    darkModeSwitcher.addEventListener("click", function() {
        if(document.documentElement.getAttribute('theme') == "dark"){
            document.documentElement.setAttribute('theme', 'light');
            darkModeSwitcher.innerHTML = "☾";
        } else {
            document.documentElement.setAttribute('theme', 'dark');
            darkModeSwitcher.innerHTML = "☀";
        }
        main.switchDarkMode();
    });

    fullscreenButton.addEventListener("click", function() {
        if (document.fullscreenElement) {
            fullscreenButton.innerHTML = "◱";
            document.exitFullscreen()
        } else {
            fullscreenButton.innerHTML = "◳";
            document.body.requestFullscreen();
        }
    });

    controlButtonDiv.appendChild(darkModeSwitcher);
    controlButtonDiv.appendChild(helpButton);
    controlButtonDiv.appendChild(fullscreenButton);
    document.getElementById("mainSubContainer")
        .appendChild(controlButtonDiv);

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
        "to see the tooltip.<br/><br/>This is the project M7 by Jakob " +
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
    navigator.requestMIDIAccess({sysex: false}).then(function(midiAccess) {
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
        initializeDarkModeAndUtilities(main);
    });
} else {
    alert("No MIDI support in your browser.");
}