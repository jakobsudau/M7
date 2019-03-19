// ---------------------------------------------------------------------------
// Note Button Functionality
// ---------------------------------------------------------------------------

const allFrequencies = [
    8.1757989156,       8.6619572180,       9.1770239974,
    9.7227182413,       10.3008611535,      10.9133822323,
    11.5623257097,      12.2498573744,      12.9782717994,
    13.7500000000,      14.5676175474,      15.4338531643,
    16.351597831287414, 17.323914436054505, 18.354047994837977,
    19.445436482630058, 20.601722307054366, 21.826764464562746,
    23.12465141947715,  24.499714748859326, 25.956543598746574,
    27.5,               29.13523509488062,  30.86770632850775,
    32.70319566257483,  34.64782887210901,  36.70809598967594,
    38.890872965260115, 41.20344461410875,  43.653528929125486,
    46.2493028389543,   48.999429497718666, 51.91308719749314,
    55,                 58.27047018976124,  61.7354126570155,
    65.40639132514966,  69.29565774421802,  73.41619197935188,
    77.78174593052023,  82.4068892282175,   87.30705785825097,
    92.4986056779086,   97.99885899543733,  103.82617439498628,
    110,                116.54094037952248, 123.47082531403103,
    130.8127826502993,  138.59131548843604, 146.8323839587038,
    155.56349186104046, 164.81377845643496, 174.61411571650194,
    184.9972113558172,  195.99771799087463, 207.65234878997256,
    220,                233.08188075904496, 246.94165062806206,
    261.6255653005986,  277.1826309768721,  293.6647679174076,
    311.1269837220809,  329.6275569128699,  349.2282314330039,
    369.9944227116344,  391.99543598174927, 415.3046975799451,
    440,                466.1637615180899,  493.8833012561241,
    523.2511306011972,  554.3652619537442,  587.3295358348151,
    622.2539674441618,  659.2551138257398,  698.4564628660078,
    739.9888454232688,  783.9908719634985,  830.6093951598903,
    880,                932.3275230361799,  987.7666025122483,
    1046.5022612023945, 1108.7305239074883, 1174.6590716696303,
    1244.5079348883237, 1318.5102276514797, 1396.9129257320155,
    1479.9776908465376, 1567.981743926997,  1661.2187903197805,
    1760,               1864.6550460723597, 1975.533205024496,
    2093.004522404789,  2217.4610478149766, 2349.31814333926,
    2489.0158697766,    2637.02045530296,   2793.825851464031,
    2959.955381693075,  3135.9634878539946, 3322.437580639561,
    3520,               3729.3100921447194, 3951.066410048992,
    4186.009044809578,  4434.922095629953,  4698.63628667852,
    4978.031739553295,  5274.04091060592,   5587.651702928062,
    5919.91076338615,   6271.926975707989,  6644.875161279122,
    7040,               7458.620184289437,  7902.132820097988,
    8372.018089619156,  8869.844191259906,  9397.272573357044,
    9956.06347910659,   10548.081821211836, 11175.303405856126,
    11839.8215267723,   12543.853951415975];
const buttons = document.getElementsByClassName("button");
var octaveShifter = 60;

for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('mousedown', function(){startNote(i+octaveShifter, 127);});
    buttons[i].addEventListener('mouseup', function(){stopNote(i+octaveShifter, 66)});
    buttons[i].addEventListener('keypress', function(){startNote(i+octaveShifter, 127)});
    buttons[i].addEventListener('keyup', function(){stopNote(i+octaveShifter, 66)});
}

function startNote(note, velocity) {
    sendMIDIMessage(note, velocity, true);
}

function stopNote(note, velocity) {
    sendMIDIMessage(note, velocity, false);
}

// ---------------------------------------------------------------------------
// Chord Generation Functionality
// ---------------------------------------------------------------------------
var ready = false;
const modelWorker = new Worker("modelworker.js");
modelWorker.onmessage = function(e) {if (e.data == "tick") {}};
const seq = { 
  quantizationInfo: {stepsPerQuarter: 4},
  notes: [],
  totalQuantizedSteps: 1
};  

// Number of steps to play each chord.
STEPS_PER_CHORD = 8;
STEPS_PER_PROG = 4 * STEPS_PER_CHORD;

// Number of times to repeat chord progression.
NUM_REPS = 4;

// Set up Improv RNN model
const model = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv');
var playing = false;

// Current chords being played.
var currentChords = undefined;

// Sample over chord progression.
const playOnce = () => {
  const chords = currentChords;
  
  // Prime with root note of the first chord.
  const root = mm.chords.ChordSymbols.root(chords[0]);
  
  document.getElementById('message').innerText = 'Improvising over: ' + chords;
  model.continueSequence(seq, STEPS_PER_PROG + (NUM_REPS-1)*STEPS_PER_PROG - 1, 0.9, chords)
    .then((contSeq) => {
      // Add the continuation to the original.
      contSeq.notes.forEach((note) => {
        note.quantizedStartStep += 1;
        note.quantizedEndStep += 1;
        seq.notes.push(note);
      });
    
      const roots = chords.map(mm.chords.ChordSymbols.root);
      for (var i=0; i<NUM_REPS; i++) { 
        // Add the bass progression.
        seq.notes.push({
          instrument: 1,
          program: 32,
          pitch: 36 + roots[0],
          quantizedStartStep: i*STEPS_PER_PROG,
          quantizedEndStep: i*STEPS_PER_PROG + STEPS_PER_CHORD
        });
        seq.notes.push({
          instrument: 1,
          program: 32,
          pitch: 36 + roots[1],
          quantizedStartStep: i*STEPS_PER_PROG + STEPS_PER_CHORD,
          quantizedEndStep: i*STEPS_PER_PROG + 2*STEPS_PER_CHORD
        });
        seq.notes.push({
          instrument: 1,
          program: 32,
          pitch: 36 + roots[2],
          quantizedStartStep: i*STEPS_PER_PROG + 2*STEPS_PER_CHORD,
          quantizedEndStep: i*STEPS_PER_PROG + 3*STEPS_PER_CHORD
        });
        seq.notes.push({
          instrument: 1,
          program: 32,
          pitch: 36 + roots[3],
          quantizedStartStep: i*STEPS_PER_PROG + 3*STEPS_PER_CHORD,
          quantizedEndStep: i*STEPS_PER_PROG + 4*STEPS_PER_CHORD
        });        
      }
    
      // Set total sequence length.
      seq.totalQuantizedSteps = STEPS_PER_PROG * NUM_REPS;

      // Play it!
      //playSeq(seq);
    })
}  

// Check chords for validity and highlight invalid chords.
const checkChords = () => {
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
  
  var changed = false;
  if (currentChords) {
    if (chords[0] !== currentChords[0]) {changed = true;}
    if (chords[1] !== currentChords[1]) {changed = true;}
    if (chords[2] !== currentChords[2]) {changed = true;}
    if (chords[3] !== currentChords[3]) {changed = true;}  
  }
  else {changed = true;}
  document.getElementById('play').disabled = !allGood || (!changed && playing);
}

// Initialize model then start playing.
model.initialize().then(() => {
  document.getElementById('message').innerText = 'Done loading model.'
  document.getElementById('play').disabled = false;
});

// Play when play button is clicked.
document.getElementById('play').onclick = () => {
  playing = true;
  document.getElementById('play').disabled = true;
  currentChords = [
      document.getElementById('chord1').value,
      document.getElementById('chord2').value,
      document.getElementById('chord3').value,
      document.getElementById('chord4').value    
  ];
  playOnce();


  // generating();
  // ready = true;
}

const  generating = () => {
  modelWorker.postMessage(["generate",model]);
  modelWorker.onmessage = function(e) {
    if (e.data[0] == "done") {
      var seq = e.data[1];
      // do something with the generated sequence
    }
  };
  //playOnce();
}

// Check chords for validity when changed.
document.getElementById('chord1').oninput = checkChords;
document.getElementById('chord2').oninput = checkChords;
document.getElementById('chord3').oninput = checkChords;
document.getElementById('chord4').oninput = checkChords;

const audioContext = new AudioContext();
const metronome = new Metronome(audioContext);
metronome.init(metronome);
//metronome.playMetronome(metronome);