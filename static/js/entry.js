// -------------------------------------------------------------------------
// Start
// -------------------------------------------------------------------------
navigator.requestMIDIAccess().then(function(midi) {
    const mainModule = new MainModule(midi);
    const globalControlsModule = new GlobalControlsModule();
}, function(error) {
    alert("Web MIDI not supported in your browser!");
});