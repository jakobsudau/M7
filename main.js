// ---------------------------------------------------------------------------
// Generator Module Class
// ---------------------------------------------------------------------------

class GeneratorModule {
    constructor(midiAccess) {
        this.model = new SequenceModel();
        this.midi = new Midi(midiAccess);
        
        this.createUIElements();
        
        this.metronome = new Metronome(this.midi, this.model);
        

        this.model.initialize().then(function() {
            this.model.generateSequence(["C", "Am", "G", "F"], this.model).then(function(seq){
                console.log("initialized");
                document.getElementById('play').disabled = false;
			    document.getElementById('generate').disabled = false;
                document.getElementById('message').innerText = 'Done loading model.'
            }.bind(this));
        }.bind(this));
        this.metronome.initialize();
    }

    startNote(note, velocity) {
        this.midi.sendMIDIMessage(note, velocity, true);
    }
    
    stopNote(note, velocity) {
        this.midi.sendMIDIMessage(note, velocity, false);
    }

    startStopClick() {
        this.metronome.startStop();
        return this.metronome.isPlaying;
    }

    changeCallResponseLength(length, isCall) {
        if (!isCall) {
            this.model.NUM_REPS = length;
            this.midi.callLength = length;
        };
    }

    startStopLoop() {
        this.metronome.looping = !this.metronome.looping;
        return this.metronome.looping;
    }

    changeClickVolume(volume) {
        this.metronome.gainNode.gain.value = volume;
    }

    generateSequence(chords) {
        console.log("generating midi sequence...");
        const time = Date.now();
        this.model.generateSequence(chords, this.model).then(function(seq){
            console.log("generating took: " + ((Date.now() - time)/1000) + "s");
            this.metronome.generatedSeq = seq;
            if (this.metronome.isPlaying) {this.playSequence();}
        }.bind(this));
    }

    playSequence() {
        this.metronome.sequenceQueue = true;
        if (!this.metronome.isPlaying) {
            this.metronome.playSequence(this.metronome.generatedSeq);
        }
    }

    createUIElements() {
        let mainContainer2 = document.createElement("div");
        mainContainer2.id = "mainContainer2";

        let generatorModuleContainer = document.createElement("div");
        generatorModuleContainer.id = "generatorModuleContainer";

        let titleDiv = document.createElement("div");
        titleDiv.id = "titleDiv";
        titleDiv.innerHTML = "Main Module";

        let generatorModuleTitleDiv = document.createElement("div");
        generatorModuleTitleDiv.id = "titleDiv";
        generatorModuleTitleDiv.innerHTML = "Generate Module";

        let playNotes = document.createElement("div");
        playNotes.id = "playNotes";
        playNotes.innerHTML = "Play some notes:";

        let button1 = document.createElement("button");
        button1.id = "button1";
        button1.className = "button";
        button1.innerHTML = "1";

        let button2 = document.createElement("button");
        button2.id = "button2";
        button2.className = "button";
        button2.innerHTML = "2";

        let button3 = document.createElement("button");
        button3.id = "button3";
        button3.className = "button";
        button3.innerHTML = "3";

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

        let playContainer = document.createElement("div");
        playContainer.id = "playContainer";
        playContainer.className = "container";

        let generate = document.createElement("button");
        generate.id = "generate";
        generate.innerHTML = "Generate";
        generate.disabled = true;


        let play = document.createElement("button");
        play.id = "play";
        play.innerHTML = "Play";
        play.disabled = true;

        let callContainer = document.createElement("div");
        callContainer.id = "callContainer";

        let callContainerText = document.createElement("div");
        callContainerText.innerHTML = "Call Bars";

        let callOptionsContainer = document.createElement("div");
        callOptionsContainer.id = "callOptionsContainer";

        let callOption1 = document.createElement("input");
        callOption1.className = "radioButton";
        callOption1.name = "callOption";
        callOption1.type = "radio";
        callOption1.value = "2";

        let callOption2 = document.createElement("input");
        callOption2.className = "radioButton";
        callOption2.name = "callOption";
        callOption2.type = "radio";
        callOption2.value = "4";
        callOption2.checked = "checked";

        let callOption3 = document.createElement("input");
        callOption3.className = "radioButton";
        callOption3.name = "callOption";
        callOption3.type = "radio";
        callOption3.value = "8";

        let responseContainer = document.createElement("div");
        responseContainer.id = "responseContainer";

        let responseContainerText = document.createElement("div");
        responseContainerText.innerHTML = "Response Bars";

        let responseOptionsContainer = document.createElement("div");
        responseOptionsContainer.id = "responseOptionsContainer";

        let responseOption1 = document.createElement("input");
        responseOption1.className = "radioButton";
        responseOption1.name = "responseOption";
        responseOption1.type = "radio";
        responseOption1.value = "2";

        let responseOption2 = document.createElement("input");
        responseOption2.className = "radioButton";
        responseOption2.name = "responseOption";
        responseOption2.type = "radio";
        responseOption2.value = "4";
        responseOption2.checked = "checked";

        let responseOption3 = document.createElement("input");
        responseOption3.className = "radioButton";
        responseOption3.name = "responseOption";
        responseOption3.type = "radio";
        responseOption3.value = "8";

        const responseoption1Text = document.createTextNode("2");
        const responseoption2Text = document.createTextNode("4");
        const responseoption3Text = document.createTextNode("8");

        const calloption1Text = document.createTextNode("2");
        const calloption2Text = document.createTextNode("4");
        const calloption3Text = document.createTextNode("8");

        let loop = document.createElement("button");
        loop.id = "loop";
        loop.innerHTML = "Loop";

        let message = document.createElement("div");
        message.id = "message";
        message.innerHTML = "Loading model...";

        mainContainer.appendChild(mainContainer2);
        mainContainer.appendChild(generatorModuleContainer);
        

        mainContainer2.appendChild(titleDiv);
        mainContainer2.appendChild(playNotes);
        mainContainer2.appendChild(button1);
        mainContainer2.appendChild(button2);
        mainContainer2.appendChild(button3);
        mainContainer2.appendChild(selectChords);

        mainContainer2.appendChild(chords);
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

        chords.appendChild(midiOutContainer);
        midiOutContainer.appendChild(midiText);
        midiOutContainer.appendChild(midiBusSelect);

        chords.appendChild(midiClockContainer);
        midiClockContainer.appendChild(midiClockText);
        midiClockContainer.appendChild(midiClockBusSelect);

        mainContainer2.appendChild(clickContainer);
        clickContainer.appendChild(clickVolumeSlider);
        clickContainer.appendChild(click);

        generatorModuleContainer.appendChild(generatorModuleTitleDiv);
        generatorModuleContainer.appendChild(playContainer);
        
        playContainer.appendChild(generate);
        playContainer.appendChild(play);

        playContainer.appendChild(callContainer);
        callContainer.appendChild(callContainerText);
        callContainer.appendChild(callOptionsContainer);
        callOptionsContainer.appendChild(callOption1);
        callOptionsContainer.appendChild(calloption1Text);
        callOptionsContainer.appendChild(callOption2);
        callOptionsContainer.appendChild(calloption2Text);
        callOptionsContainer.appendChild(callOption3);
        callOptionsContainer.appendChild(calloption3Text);        
        
        playContainer.appendChild(responseContainer);
        responseContainer.appendChild(responseContainerText);
        responseContainer.appendChild(responseOptionsContainer);
        responseOptionsContainer.appendChild(responseOption1);
        responseOptionsContainer.appendChild(responseoption1Text);
        responseOptionsContainer.appendChild(responseOption2);
        responseOptionsContainer.appendChild(responseoption2Text);
        responseOptionsContainer.appendChild(responseOption3);
        responseOptionsContainer.appendChild(responseoption3Text);

        playContainer.appendChild(loop);

        generatorModuleContainer.appendChild(message);

        //document.body.insertBefore(mainContainer, document.body.childNodes[0]);
        document.getElementById("mainContainer").appendChild(mainContainer2);

        let that = this;

        // creating eventlisteners for the note buttons
        const buttons = document.getElementsByClassName("button");
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('mousedown', function(){that.startNote(i+60, 100)});
            buttons[i].addEventListener('mouseup', function(){that.stopNote(i+60, 66)});
            buttons[i].addEventListener('keypress', function(){that.startNote(i+60, 100)});
            buttons[i].addEventListener('keyup', function(){that.stopNote(i+60, 66)});
        }

        // click functionality
        click.addEventListener('click', function(){
            if (that.startStopClick()) {
                click.style.background = "lightgrey";
            } else {
                click.style.background = "white";
            }
        });

        // loop functionality
        loop.addEventListener('click', function(){
            if (that.startStopLoop()) {
                loop.style.background = "lightgrey";
            } else {
                loop.style.background = "white";
            }
        });

        // eventlistener for the generate and play model button
        generate.addEventListener('click', function(){
            const chordValues = [
                chord1.value,
                chord2.value,
                chord3.value,
                chord4.value    
            ];
            that.generateSequence(chordValues);
        });

        play.addEventListener('click', function(){that.playSequence();});

        // Check chords for validity when changed
        chord1.oninput = this.model.checkChords;
        chord2.oninput = this.model.checkChords;
        chord3.oninput = this.model.checkChords;
        chord4.oninput = this.model.checkChords; 

        // Click volume control
        clickVolumeSlider.addEventListener("input", function (e) {
            that.changeClickVolume(this.value/100);
        });

        // call and response lengths
        let radioButtons = document.getElementsByClassName("radioButton");
        for (var i=0; i<(radioButtons.length/2); i++) {
            radioButtons[i].addEventListener("change", function(e){
                that.changeCallResponseLength(this.value, false);
            });
            radioButtons[i+3].addEventListener("change", function(e){
                that.changeCallResponseLength(this.value, false);
            });
          } 

        // Populate the <select>
        midiBusSelect.innerHTML = that.midi.availableOutputs.map(i =>`<option>${i.name}</option>`).join('');
        midiClockBusSelect.innerHTML = that.midi.availableOutputs.map(i =>`<option>${i.name}</option>`).join('');
        midiBusSelect.addEventListener("change", function() {that.midi.selectedOutput = that.midi.availableOutputs[midiBusSelect.selectedIndex];});
        midiClockBusSelect.addEventListener("change", function() {that.midi.selectedClockOutput = that.midi.availableOutputs[midiBusSelect.selectedIndex];});
    }
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({sysex: false}).then(function(midiAccess) {
        const main = new GeneratorModule(midiAccess);
    });
} else {
    alert("No MIDI support in your browser.");
}