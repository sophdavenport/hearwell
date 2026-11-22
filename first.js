(() => {
"use strict";

const $ = (id) => document.getElementById(id);

const frequencies = [250, 500, 1000, 2000, 4000, 6000];

let audioCtx = null;
let osc = null;
let gain = null;
let stopTimer = null;
let index = 0;
let played = false;
let answers = [];

const startButton = $("start");
const playButton = $("play");
const heardButton = $("heard");
const notHeardButton = $("notheard");
const stopButton = $("stop");
const againButton = $("again");
const status = $("status");
const wave = $("wave");

function setStatus(message) {
if (status) status.textContent = message;
}

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

function stopTone() {
if (stopTimer) {
clearTimeout(stopTimer);
stopTimer = null;
}

if (gain && audioCtx) {
try {
gain.gain.cancelScheduledValues(audioCtx.currentTime);
gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.015);
} catch (error) {}
}

if (osc) {
try {
osc.stop();
} catch (error) {}
osc = null;
}

if (wave) wave.classList.remove("playing");
}

function prepareAudio() {
try {
const context = getAudioContext();

if (context.state !== "running") {
context.resume().catch((error) => {
console.error("HearWell audio resume error:", error);
setStatus("Audio could not start. Tap Start listening again.");
});
}
} catch (error) {
console.error("HearWell audio setup error:", error);
setStatus(error.message || "Audio is unavailable in this browser.");
}
}

function playTone() {
stopTone();

if (heardButton) heardButton.disabled = true;
if (notHeardButton) notHeardButton.disabled = true;

try {
const context = getAudioContext();

// Request audio playback directly from the button interaction.
const resumePromise =
context.state === "running" ? Promise.resolve() : context.resume();

osc = context.createOscillator();
gain = context.createGain();

osc.type = "sine";
osc.frequency.setValueAtTime(
frequencies[index],
context.currentTime
);

gain.gain.setValueAtTime(0, context.currentTime);
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

// Start the oscillator immediately after the user taps.
osc.start(context.currentTime);
osc.stop(context.currentTime + 1.27);

played = true;

if (playButton) playButton.disabled = true;
setStatus("Playing a brief tone…");
if (wave) wave.classList.add("playing");

resumePromise.then(() => {
if (context.state !== "running") {
setStatus("Audio is not active. Tap Play tone to try again.");
}
}).catch((error) => {
console.error("HearWell audio resume error:", error);
setStatus("Audio could not start. Please try again.");
});

stopTimer = setTimeout(() => {
if (wave) wave.classList.remove("playing");
osc = null;

setStatus("Did you hear the tone?");

if (playButton) playButton.disabled = false;
if (heardButton) heardButton.disabled = false;
if (notHeardButton) notHeardButton.disabled = false;
}, 1350);

} catch (error) {
console.error("HearWell audio error:", error);
setStatus(
error.name + ": " + error.message
);

if (playButton) playButton.disabled = false;
}
}

function updateScreen() {
const frequencyLabel = $("frequency");
const progress = $("progress");

if (frequencyLabel) {
frequencyLabel.textContent = frequencies[index] + " Hz";
}

if (progress) {
progress.textContent =
"Tone " + (index + 1) + " of " + frequencies.length;
}
}

function recordAnswer(heard) {
if (!played) return;

answers.push({
frequency: frequencies[index],
heard: heard
});

stopTone();
index++;
played = false;

if (index < frequencies.length) {
updateScreen();
setStatus("Ready for the next tone.");
if (playButton) playButton.disabled = false;
if (heardButton) heardButton.disabled = true;
if (notHeardButton) notHeardButton.disabled = true;
} else {
finishScreening();
}
}

function finishScreening() {
stopTone();

const heardCount = answers.filter(
(answer) => answer.heard
).length;

const result = $("result");
const screening = $("screening");

if (screening) screening.hidden = true;
if (result) result.hidden = false;

const resultMessage = $("result-message");

if (resultMessage) {
if (heardCount === frequencies.length) {
resultMessage.textContent =
"You reported hearing all the tones in this listening activity. This is not a medical hearing test.";
} else {
resultMessage.textContent =
"You did not report hearing every tone. Consider arranging a professional hearing evaluation with an audiologist or healthcare professional.";
}
}

setStatus("Listening activity complete.");
}

function startScreening() {
index = 0;
answers = [];
played = false;

prepareAudio();

const intro = $("intro");
const screening = $("screening");
const result = $("result");

if (intro) intro.hidden = true;
if (screening) screening.hidden = false;
if (result) result.hidden = true;

if (playButton) playButton.disabled = false;
if (heardButton) heardButton.disabled = true;
if (notHeardButton) notHeardButton.disabled = true;

updateScreen();
setStatus("Tap Play tone when you're ready.");
}

function resetScreening() {
stopTone();

index = 0;
answers = [];
played = false;

const intro = $("intro");
const screening = $("screening");
const result = $("result");

if (intro) intro.hidden = false;
if (screening) screening.hidden = true;
if (result) result.hidden = true;

setStatus("Keep your volume low and comfortable.");
}

if (startButton) {
startButton.addEventListener("click", startScreening);
}

if (playButton) {
playButton.addEventListener("click", playTone);
}

if (heardButton) {
heardButton.addEventListener("click", () => recordAnswer(true));
}

if (notHeardButton) {
notHeardButton.addEventListener("click", () => recordAnswer(false));
}

if (stopButton) {
stopButton.addEventListener("click", resetScreening);
}

if (againButton) {
againButton.addEventListener("click", resetScreening);
}

updateScreen();
})();


