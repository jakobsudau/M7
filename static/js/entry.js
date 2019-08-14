// -------------------------------------------------------------------------
// Start
// -------------------------------------------------------------------------
navigator.requestMIDIAccess().then(function(midi) {
    document.documentElement.setAttribute('theme', 'light');
    const main = new MainModule(midi);
    const globalControls = new GlobalControls(main, false);
}, function(err) {
    alert("Web MIDI not supported in your browser!");
});