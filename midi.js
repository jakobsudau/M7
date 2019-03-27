class Midi {
    constructor(midiAccess) {
        this.velocityHexArray = [0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9, 0xa, 0xb, 0xc, 0xd, 0xe, 0xf,
            0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f,
            0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f,
            0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b, 0x3c, 0x3d, 0x3e, 0x3f,
            0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f,
            0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x5b, 0x5c, 0x5d, 0x5e, 0x5f,
            0x60, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x6b, 0x6c, 0x6d, 0x6e, 0x6f,
            0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x78, 0x7a, 0x7b, 0x7c, 0x7d, 0x7e, 0x7f];
        this.midiAccess = midiAccess;        
        this.availableOutputs = [];
        this.selectedOutput = null;
        this.selectedClockOutput = null;
        this.ppqCounter = 0;

        const inputs = midiAccess.inputs.values();
        const that = this;
        // loop through all inputs and listen for midi messages
        for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
            input.value.onmidimessage = function(e) {
                // event.data is an array
                // event.data[0] = on (144 = 0x90) / off (128 = 0x80) / controlChange (176 = 0xb0)  / pitchBend (224 = 0xf4) / ...
                // event.data[1] = midi note
                // event.data[2] = velocity
                switch(e.data[0]) {
                    case 144:
                        // your function startNote(note, velocity)
                        //startNote(event.data[1], event.data[2]);
                        break;
                    case 128:
                        // your function stopNote(note, velocity)
                        //stopNote(event.data[1], event.data[2]);
                        break;
                    case 176:
                        // your function controlChange(controllerNr, value)
                        //controlChange(event.data[1], event.data[2]);
                        break;
                    case 224:
                        // your function pitchBend(LSB, HSB)
                        //pitchBend(event.data[1], event.data[2]);
                        break;
                    case 0xF8:
                        that.ppqCounter++;
                        if (that.ppqCounter == 23) {
                            console.log("midi clock tick");
                            that.ppqCounter = 0;
                        }
                        break;
                }
            };
        }
        
        const outputs = midiAccess.outputs.values();
        // Get all the MIDI outputs to show them in a <select> (for example)
        for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
            this.availableOutputs.push(output.value);
        }

        this.selectedOutput = this.availableOutputs[0];
        this.selectedClockOutput = this.availableOutputs[0];

        // Populate the <select>
        const midiList = document.getElementById('midiBusSelect');
        const clockList = document.getElementById('midiClockBusSelect');
        midiList.innerHTML = this.availableOutputs.map(i =>`<option>${i.name}</option>`).join('');
        clockList.innerHTML = this.availableOutputs.map(i =>`<option>${i.name}</option>`).join('');
        midiList.addEventListener("change", function() {this.selectedOutput = this.availableOutputs[midiList.selectedIndex];}.bind(this));
        clockList.addEventListener("change", function() {this.selectedClockOutput = this.availableOutputs[midiList.selectedIndex];}.bind(this));
    }

    sendMIDIMessage(note, velocity, startOrstop) {
        var message;
        if (startOrstop) {
            // [0xFA] midi clock start
            // [0xF8] midi clock advance
            // [0xFC] midi clock stop
            message = [0x90, note, this.velocityHexArray[velocity]];
        } else {
            message = [0x80, note, this.velocityHexArray[velocity]];
        }
        this.midiAccess.outputs.get(this.selectedOutput.id).send(message);  // omitting the timestamp means send immediately.
    }

    sendClockMessage(message) {
        this.midiAccess.outputs.get(this.selectedOutput.id).send(message);
    }
}