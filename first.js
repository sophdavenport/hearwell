(() => {
"use strict";

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

// AUDIO INITIALIZATION
function getAudioContext() {
const AudioContextClass =
window.AudioContext || window.webkitAudioContext;

if (!AudioContextClass) {
throw new Error("Audio is not supported by this browser.");
}

if (!audioCtx || audioCtx.state === "closed") {
audioCtx = new AudioContextClass();
}

return audioCtx;
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

document.querySelectorAll(".steps .step").forEach((step, i) => {
step.classList.toggle("active", i <= index);
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
0.015
);
} catch (e) {}
}

if (osc) {
const oldOsc = osc;
osc = null;

try {
oldOsc.stop(audioCtx.currentTime + 0.05);
} catch (e) {}
}

wave.classList.remove("playing");
}

// PLAY SOUND FREQUENCY
function playTone() {
stopTone();

$("heard").disabled = true;
$("notheard").disabled = true;
$("play").disabled = true;

$("status").textContent = "Starting audio…";

try {
const context = getAudioContext();

// IMPORTANT:
// Call resume immediately inside the button click.
// This is especially important for iPhone Safari.
const resumePromise =
context.state === "running"
? Promise.resolve()
: context.resume();

resumePromise.then(() => {
if (context.state !== "running") {
throw new Error("Audio context did not start.");
}

// Create the tone only after audio is running.
osc = context.createOscillator();
gain = context.createGain();

osc.type = "sine";

osc.frequency.setValueAtTime(
frequencies[index],
context.currentTime
);

gain.gain.setValueAtTime(
0,
context.currentTime
);

gain.gain.linearRampToValueAtTime(
0.035,
context.currentTime + 0.04
);

gain.gain.setValueAtTime(
0.035,
context.currentTime + 1.15
);

gain.gain.linearRampToValueAtTime(
0,
context.currentTime + 1.25
);

osc.connect(gain);
gain.connect(context.destination);

osc.start(context.currentTime);
osc.stop(context.currentTime + 1.27);

played = true;

$("status").textContent = "Playing a brief tone…";
wave.classList.add("playing");

stopTimer = setTimeout(() => {
osc = null;

wave.classList.remove("playing");

$("status").textContent =
"Did you hear the tone?";

$("play").disabled = false;
$("heard").disabled = false;
$("notheard").disabled = false;
}, 1350);

}).catch(error => {
console.error("HearWell audio error:", error);

$("status").textContent =
"Audio could not start. Please tap Play tone again.";

$("play").disabled = false;
});

} catch (error) {
console.error("HearWell audio error:", error);

$("status").textContent =
error.message || "Could not start audio.";

$("play").disabled = false;
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
stopTone();
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
(a.hz >= 1000 ? (a.hz / 1000) + "k" : a.hz) +
" Hz";

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

// Prime audio during the user's tap.
try {
const context = getAudioContext();

if (context.state !== "running") {
context.resume().catch(error => {
console.error("HearWell audio setup:", error);
});
}
} catch (error) {
console.error("HearWell audio setup:", error);
}

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
stopTone();
index = 0;
answers = [];
show("intro");
});

// STOP SOUND WHEN LEAVING PAGE
window.addEventListener("pagehide", stopTone);

})();

