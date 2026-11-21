(() => {

const frequencies = [250, 500, 1000, 2000, 4000, 6000];

let index = 0;
let answers = [];
let audioCtx = null;
let osc = null;
let gain = null;
let stopTimer = null;
let played = false;

const $ = id => document.getElementById(id);

const intro = $("intro");
const test = $("test");
const results = $("results");
const wave = $("wave");

// CREATE SOUND WAVE ANIMATION

for (let i = 0; i < 25; i++) {
const bar = document.createElement("span");

bar.style.height =
(12 + Math.abs(Math.sin(i * .72)) * 28) + "px";

wave.appendChild(bar);
}

// SWITCH BETWEEN SCREENS

function show(which) {

intro.classList.toggle("hidden", which !== "intro");

test.classList.toggle("hidden", which !== "test");

results.classList.toggle("show", which === "results");

}

// UPDATE TEST PROGRESS

function update() {

$("toneNumber").textContent =
(index + 1) + " of " + frequencies.length;

$("frequency").innerHTML =
frequencies[index] + " <small>Hz</small>";

$("progressText").textContent =
index + " of " + frequencies.length;

$("progress").style.width =
(index / frequencies.length * 100) + "%";

document.querySelectorAll(".steps .step").forEach((s, i) => {
s.classList.toggle("active", i <= index);
});

$("status").textContent =
"Keep your volume low and comfortable.";

$("play").disabled = false;
$("heard").disabled = true;
$("notheard").disabled = true;

played = false;

}

// STOP AUDIO

function stopTone() {

if (stopTimer) {
clearTimeout(stopTimer);
stopTimer = null;
}

if (gain && audioCtx) {

try {
gain.gain.cancelScheduledValues(audioCtx.currentTime);

gain.gain.setTargetAtTime(
0,
audioCtx.currentTime,
.015
);

} catch (e) {}

}

if (osc && audioCtx) {

try {
osc.stop(audioCtx.currentTime + .08);
} catch (e) {}

osc = null;

}

wave.classList.remove("playing");

}

// PLAY SOUND FREQUENCY

async function playTone() {

stopTone();

$("heard").disabled = true;
$("notheard").disabled = true;

try {

const AudioContext =
window.AudioContext || window.webkitAudioContext;

if (!AudioContext) {

$("status").textContent =
"Audio playback is not supported in this browser.";

return;

}

audioCtx = audioCtx || new AudioContext();

if (audioCtx.state === "suspended") {
await audioCtx.resume();
}

osc = audioCtx.createOscillator();
gain = audioCtx.createGain();

osc.type = "sine";

osc.frequency.value = frequencies[index];

// Fixed low digital output level.
// Device volume controls still apply.

gain.gain.setValueAtTime(
0,
audioCtx.currentTime
);

gain.gain.linearRampToValueAtTime(
.035,
audioCtx.currentTime + .04
);

gain.gain.setValueAtTime(
.035,
audioCtx.currentTime + 1.15
);

gain.gain.linearRampToValueAtTime(
0,
audioCtx.currentTime + 1.25
);

osc.connect(gain);
gain.connect(audioCtx.destination);

osc.start();

osc.stop(audioCtx.currentTime + 1.27);

played = true;

$("play").disabled = true;

$("status").textContent =
"Playing a brief tone…";

wave.classList.add("playing");

stopTimer = setTimeout(() => {

wave.classList.remove("playing");

osc = null;

$("status").textContent =
"Did you hear the tone?";

$("play").disabled = false;

$("heard").disabled = false;
$("notheard").disabled = false;

}, 1350);

} catch (e) {

$("status").textContent =
"Could not play audio. Check your browser settings and try again.";

}

}

// RECORD ANSWER

function answer(value) {

if (!played) return;

stopTone();

answers.push({

hz: frequencies[index],

heard: value

});

index++;

if (index >= frequencies.length) {

finish();

return;

}

update();

}

// DISPLAY RESULTS

function finish() {

show("results");

const heard = answers.filter(a => a.heard).length;

const missed = answers.length - heard;

$("score").textContent =
heard + " / " + answers.length;

$("heardCount").textContent = heard;

$("missedCount").textContent = missed;

$("summary").textContent = missed > 0

? "You reported hearing " + heard +
" of the " + answers.length +
" tones. Consider following up with a professional."

: "You reported hearing all the tones in this activity. This does not rule out a hearing concern.";

// SHOW RECOMMENDATION IF ANY TONES WERE NOT HEARD

$("followup").classList.toggle(
"hidden",
missed === 0
);

$("progress").style.width = "100%";

$("progressText").textContent =
answers.length + " of " + answers.length;

// DISPLAY INDIVIDUAL RESPONSES

$("history").innerHTML = "";

answers.forEach(a => {

const cell = document.createElement("div");

cell.className = a.heard ? "heard" : "missed";

cell.textContent =
(a.hz >= 1000 ? (a.hz / 1000) + "k" : a.hz) + " Hz";

cell.title = a.heard
? "Reported heard"
: "Not reported heard";

$("history").appendChild(cell);

});

}

// BUTTON EVENTS

$("start").addEventListener("click", () => {

index = 0;
answers = [];

show("test");

update();

});

$("play").addEventListener("click", playTone);

$("heard").addEventListener("click", () => {
answer(true);
});

$("notheard").addEventListener("click", () => {
answer(false);
});

$("stop").addEventListener("click", () => {

stopTone();

show("intro");

});

$("again").addEventListener("click", () => {

index = 0;
answers = [];

show("intro");

});

// STOP SOUND WHEN LEAVING PAGE

window.addEventListener("pagehide", stopTone);

})();

