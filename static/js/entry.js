// -------------------------------------------------------------------------
// Entry to initialize the system
// -------------------------------------------------------------------------

navigator.requestMIDIAccess().then(function(midi) {
    const mainModule = new MainModule(midi);
    const globalControlsModule = new GlobalControlsModule(mainModule);
}, function(error) {
    alert("Web MIDI not supported in your browser!");
});