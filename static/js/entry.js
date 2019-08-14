// -------------------------------------------------------------------------
// Start
// -------------------------------------------------------------------------
navigator.requestMIDIAccess().then(function(midi) {
    const mainModule = new MainModule(midi);
    const globalControlModule = new GlobalControlModule();
}, function(error) {
    alert("Web MIDI not supported in your browser!");
});