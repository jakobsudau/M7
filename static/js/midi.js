// --------------------------------------------------------------------------
// MIDI Class
// --------------------------------------------------------------------------

class Midi {
    constructor(midiAccess, mainModule) {
        this.availableOutputs = [];
        this.availableInputs = [];
        this.selectedOutput = null;
        this.selectedInput = null;
        this.selectedClockOutput = null;
        this.ppqCounter = 0;
        this.beatCoutner = 0;
        this.mainModule = mainModule;
        this.midiAccess = midiAccess;
        this.hookUpMIDIInput();
        midiAccess.onstatechange = function() {
            this.hookUpMIDIInput()}.bind(this);
    }

    hookUpMIDIInput() {
        console.log("midi inputs/outputs changed");
        let updatedAvailableInputs = [];
        let updatedAvailableOutputs = [];

        const that = this;
        const inputs = this.midiAccess.inputs.values();
        for (let input = inputs.next();
                input && !input.done;
                input = inputs.next()) {
            updatedAvailableInputs.push(input.value);
            input.value.onmidimessage = function(e) {
                that.midiMessageEventHandler(event, that)};
        }

        const outputs = this.midiAccess.outputs.values();
        for (let output = outputs.next();
                output && !output.done;
                output = outputs.next()) {
            updatedAvailableOutputs.push(output.value);
        }

        if (updatedAvailableInputs.length != this.availableInputs.length) {
            this.availableInputs = updatedAvailableInputs;
            this.selectedInput = this.availableInputs[0];
            this.mainModule.generatorPortListUpdated();
        }

        if (updatedAvailableOutputs.length != this.availableOutputs.length) {
            this.availableOutputs = updatedAvailableOutputs;
            this.selectedOutput = this.availableOutputs[0];
            this.mainModule.midiPortListUpdated();
            this.mainModule.generatorPortListUpdated();
        }
    }

    midiMessageEventHandler(event, that) {
        let input = event.currentTarget;
        // Mask off the lower nibble (MIDI channel, not used)
        switch (event.data[0] & 0xf0) {
            case 0x90:
                if (event.data[2]!=0) {  // if velocity != 0 = noteOn message
                    that.mainModule.startStopNote(
                        event.data[1], event.data[2], true, input);
                    return;
                }
                // if velocity == 0, fall thru: noteOff
            case 0x80:
                that.mainModule.startStopNote(
                    event.data[1], event.data[2], false, input);
                return;
            // case 0xFA:
            //     console.log("midi start msg"); // clock start
            //     break;
            // case 0xFC:
            //         console.log("midi stop msg"); // clock stop
            //     break;
            // case 0xF8:
            //         console.log("midi tick msg"); // clock tick, 24 / quarter
            //     break;
            // case 0xF0:
            //     console.log("midi ??? msg"); // 240, cubase tick?
            //     break;
        }
    }

    sendMIDIMetronomeMessage(isBarStart, portId, volume, midiClockStatus) {
        switch (midiClockStatus) {
            case "none":
                    this.midiAccess.outputs.get(portId).send(
                        [0x90, (isBarStart ? 90 : 80), (volume * 127)]);
                    this.midiAccess.outputs.get(portId).send(
                        [0x80, (isBarStart ? 90 : 80), (volume * 127)], (Date.now()+100));
                break;
            case "send":
                // this.sendMIDIClockMessage("tick", portId);
                break;
            case "receive":
                // this.sendMIDIClockMessage("tick", portId);
                break;
        }
    }

    sendMIDIClockMessage(command, portId) {
        let message;
        switch (command) {
            case "start": // [0xFA] midi clock start
                message = [0xFA];
                break;
            case "stop": // [0xFC] midi clock stop
                message = [0xFC];
                break;
            case "tick": // [0xF8] midi clock tick
                message = [0xF8];
                break;
        }
        this.midiAccess.outputs.get(portId).send(message);
            //omitting timestamp = send immediately
    }

    sendMIDISceneChange(number) {
        // Ableton
        // this.midiAccess.outputs.get(this.availableOutputs[3].id)
        //     .send([0xB0, 3, number]);

        // Cubase
        this.availableOutputs.forEach(output => {
            this.midiAccess.outputs.get(output.id).send([0xC0, number]);
          });

        //omitting timestamp = send immediately
    }
}