// ---------------------------------------------------------------------------
// Main Module Class
// ---------------------------------------------------------------------------

class MainModule {
    constructor(midiAccess) {
        this.generators = new Map();
        this.generatorCounter = 0;
        this.midi = new Midi(midiAccess);
        this.metronome = new Metronome();
        this.metronome.initialize();
        this.createUIElements();    
    }

    startStopClick() {
        this.metronome.startStop();
        return this.metronome.isPlaying;
    }

    changeClickVolume(volume) {
        this.metronome.gainNode.gain.value = volume;
    }

    addModule() {
        const generator = new GeneratorModule(this, this.generatorCounter);
        this.generators.set(this.generatorCounter, generator);
        this.generatorCounter++;
    }

    deleteModule(id) {
        this.generators.delete(id);
    }

    playAll() {
        this.generators.forEach((value,key) => {
            value.playGeneratedSequence();
        });
    }

    checkChords() {
        const chords = [
            document.getElementById('chord1').value,
            document.getElementById('chord2').value,
            document.getElementById('chord3').value,
            document.getElementById('chord4').value
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
          
		var allGood = true;
		if (isGood(chords[0])) {
			document.getElementById('chord1').style.color = 'black';
		} else {
			document.getElementById('chord1').style.color = 'red';
			allGood = false;
		}
		if (isGood(chords[1])) {
			document.getElementById('chord2').style.color = 'black';
		} else {
			document.getElementById('chord2').style.color = 'red';
			allGood = false;
		}
		if (isGood(chords[2])) {
			document.getElementById('chord3').style.color = 'black';
		} else {
			document.getElementById('chord3').style.color = 'red';
			allGood = false;
		}
		if (isGood(chords[3])) {
			document.getElementById('chord4').style.color = 'black';
		} else {
			document.getElementById('chord4').style.color = 'red';
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
		//document.getElementById('play').disabled = !allGood || (!changed && this.playing);
    }

    createUIElements() {
        let mainModuleContainer = document.createElement("div");
        mainModuleContainer.id = "mainModuleContainer";

        let titleDiv = document.createElement("div");
        titleDiv.id = "titleDiv";
        titleDiv.innerHTML = "Main Module";

        let buttonAdd = document.createElement("button");
        buttonAdd.id = "buttonAdd";
        buttonAdd.innerHTML = "+";

        let buttonStop = document.createElement("button");
        buttonStop.id = "buttonStop";
        buttonStop.innerHTML = "◾";

        let buttonPlayAll = document.createElement("button");
        buttonPlayAll.id = "buttonPlayAll";
        buttonPlayAll.innerHTML = "►";

        let chordDiv = document.createElement("div");
        chordDiv.id = "chordDiv";

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

        let chord1 = document.createElement("input");
        chord1.id = "chord1";
        chord1.type = "text";
        chord1.value = "C";

        let chord2 = document.createElement("input");
        chord2.id = "chord2";
        chord2.type = "text";
        chord2.value = "G";

        let chord3 = document.createElement("input");
        chord3.id = "chord3";
        chord3.type = "text";
        chord3.value = "Am";

        let chord4 = document.createElement("input");
        chord4.id = "chord4";
        chord4.type = "text";
        chord4.value = "F";

        let midiOutContainer = document.createElement("div");
        midiOutContainer.id = "midiOutContainer";

        let midiText = document.createElement("div");
        midiText.id = "midiText";
        midiText.innerHTML = "MIDI Out";

        let midiBusSelect = document.createElement("select");
        midiBusSelect.id = "midiBusSelect";

        let midiClockContainer = document.createElement("div");
        midiClockContainer.id = "midiClockContainer";

        let midiClockText = document.createElement("div");
        midiClockText.id = "midiClockText";
        midiClockText.innerHTML = "MIDI Clock Out";

        let midiClockBusSelect = document.createElement("select");
        midiClockBusSelect.id = "midiClockBusSelect";

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

        let click = document.createElement("button");
        click.id = "click";
        click.innerHTML = "Click";

        mainModuleContainer.appendChild(titleDiv);
        mainModuleContainer.appendChild(chordDiv);

        chordDiv.appendChild(selectChords);
        chordDiv.appendChild(chords);

        chords.appendChild(table);
        table.appendChild(tableTr);
        tableTr.appendChild(tableTd1);
        tableTr.appendChild(tableTd2);
        tableTr.appendChild(tableTd3);
        tableTr.appendChild(tableTd4);
        tableTd1.appendChild(chord1);
        tableTd2.appendChild(chord2);
        tableTd3.appendChild(chord3);
        tableTd4.appendChild(chord4);

        mainModuleContainer.appendChild(clickContainer);
        clickContainer.appendChild(clickVolumeSlider);
        clickContainer.appendChild(click);

        mainModuleContainer.appendChild(midiClockContainer);
        midiClockContainer.appendChild(midiClockText);
        midiClockContainer.appendChild(midiClockBusSelect);

        mainModuleContainer.appendChild(buttonStop);
        mainModuleContainer.appendChild(buttonPlayAll);
        mainModuleContainer.appendChild(buttonAdd);
        

        document.getElementById("mainContainer").appendChild(mainModuleContainer);

        let that = this;

        // add button functionality
        buttonAdd.addEventListener('click', function(){that.addModule();});

        // stop button functionality
        buttonStop.addEventListener('click', function(){
            that.metronome.player.stop();
         });

         // stop button functionality
        buttonPlayAll.addEventListener('click', function(){
            that.playAll();
         });

        // Check chords for validity when changed
        chord1.addEventListener('input', function(){that.checkChords()});
        chord2.addEventListener('input', function(){that.checkChords()});
        chord3.addEventListener('input', function(){that.checkChords()});
        chord4.addEventListener('input', function(){that.checkChords()}); 

        // Populate the MidiOut and MidiClockOut lists
        midiClockBusSelect.innerHTML = that.midi.availableOutputs.map(i =>`<option>${i.name}</option>`).join('');
        midiClockBusSelect.addEventListener("change", function() {that.midi.selectedClockOutput = that.midi.availableOutputs[midiBusSelect.selectedIndex];});

        // click functionality
        click.addEventListener('click', function(){
            if (that.startStopClick()) {
                click.style.background = "lightgrey";
            } else {
                click.style.background = "white";
            }
        });

        // Click volume control
        clickVolumeSlider.addEventListener("input", function (e) {
            that.changeClickVolume(this.value/100);
        });
    }
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({sysex: false}).then(function(midiAccess) {
        const main = new MainModule(midiAccess);
    });
} else {
    alert("No MIDI support in your browser.");
}