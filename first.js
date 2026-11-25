// ==========================================
// HEARWELL CONFIGURATION
// ==========================================

const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLIC_KEY";


// ==========================================
// DATABASE CONNECTION
// ==========================================

const supabaseReady =
SUPABASE_URL.startsWith("https://") &&
!SUPABASE_URL.includes("YOUR_") &&
SUPABASE_ANON_KEY &&
!SUPABASE_ANON_KEY.includes("YOUR_");

const db = supabaseReady && window.supabase
? window.supabase.createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY
)
: null;


// ==========================================
// APP VARIABLES
// ==========================================

const $ = id => document.getElementById(id);

let signup = false;
let entries = [];
let toastTimer;


// ==========================================
// NOTIFICATIONS
// ==========================================

function toast(message) {
$("toast").textContent = message;

$("toast").classList.add("show");

clearTimeout(toastTimer);

toastTimer = setTimeout(() => {
$("toast").classList.remove("show");
}, 2800);
}


// ==========================================
// AUTHENTICATION MESSAGES
// ==========================================

function authMsg(message, error = false) {
$("authMessage").textContent = message;

$("authMessage").classList.toggle("error", error);
}


// ==========================================
// SCREEN MANAGEMENT
// ==========================================

function showAuth() {
$("authScreen").classList.remove("hidden");
$("appShell").classList.add("hidden");
}

function showApp(user) {
$("authScreen").classList.add("hidden");
$("appShell").classList.remove("hidden");

$("userEmail").textContent = user.email || "";
$("profileEmail").textContent = user.email || "";

loadAll();
}


// ==========================================
// NAVIGATION
// ==========================================

function page(name) {
document.querySelectorAll(".page").forEach(section => {
section.classList.toggle(
"active",
section.id === "page-" + name
);
});

document.querySelectorAll(".nav-item").forEach(button => {
button.classList.toggle(
"active",
button.dataset.page === name
);
});

window.scrollTo(0, 0);
}

document.addEventListener("click", event => {
const button = event.target.closest("[data-page]");

if (button) {
page(button.dataset.page);
}
});


// ==========================================
// SIGN UP / SIGN IN
// ==========================================

$("toggleAuth").onclick = () => {

signup = !signup;

$("authTitle").textContent = signup
? "Create your account"
: "Welcome to HearWell";

$("authSubmit").textContent = signup
? "Create account"
: "Sign in";

$("toggleAuth").textContent = signup
? "Already have an account? Sign in"
: "New to HearWell? Create an account";

$("password").autocomplete = signup
? "new-password"
: "current-password";

authMsg("");
};


$("authForm").onsubmit = async event => {

event.preventDefault();

if (!db) {
authMsg(
"HearWell needs its Supabase connection configured before accounts can be created.",
true
);

return;
}

const email = $("email").value.trim();
const password = $("password").value;

$("authSubmit").disabled = true;

try {

if (signup) {

const { data, error } = await db.auth.signUp({
email,
password,
options: {
emailRedirectTo: location.origin + location.pathname
}
});

if (error) throw error;

if (data.session) {
showApp(data.user);
} else {
authMsg(
"Account created! Check your email for a confirmation link before signing in."
);
}

} else {

const { data, error } = await db.auth.signInWithPassword({
email,
password
});

if (error) throw error;

showApp(data.user);

}

} catch (error) {

authMsg(error.message || "Something went wrong.", true);

} finally {

$("authSubmit").disabled = false;

}
};


// ==========================================
// SIGN OUT
// ==========================================

$("signOut").onclick = async () => {

if (db) {
const { error } = await db.auth.signOut();

if (error) {
toast("Could not sign out: " + error.message);
return;
}
}

entries = [];

showAuth();

toast("Signed out.");

};


// ==========================================
// LOAD SAVED HEALTH INFORMATION
// ==========================================

async function loadAll() {

if (!db) return;

const { data, error } = await db
.from("health_entries")
.select("*")
.order("created_at", { ascending: false })
.limit(300);

if (error) {
toast("Could not load entries: " + error.message);
return;
}

entries = data || [];

render();

}


// ==========================================
// SAVE HEALTH INFORMATION
// ==========================================

async function save(type, details) {

if (!db) {
toast("Database connection is not configured yet.");
return false;
}

const {
data: { user },
error: userError
} = await db.auth.getUser();

if (userError || !user) {
showAuth();
return false;
}

const { error } = await db
.from("health_entries")
.insert({
user_id: user.id,
entry_type: type,
details: details
});

if (error) {
toast("Save failed: " + error.message);
return false;
}

await loadAll();

toast("Saved to your HearWell account.");

return true;

}


// ==========================================
// PAIN TRACKER
// ==========================================

$("painLevel").oninput = () => {

$("painLevelValue").textContent =
$("painLevel").value;

};


$("painForm").onsubmit = async event => {

event.preventDefault();

const success = await save("pain", {

level: Number($("painLevel").value),

location: $("painLocation").value.trim(),

type: $("painType").value,

notes: $("painNotes").value.trim()

});

if (success) {

event.target.reset();

$("painLevelValue").textContent = "0";

}

};


// ==========================================
// SYMPTOM TRACKER
// ==========================================

$("symptomSeverity").oninput = () => {

$("severityValue").textContent =
$("symptomSeverity").value;

};


$("symptomForm").onsubmit = async event => {

event.preventDefault();

const success = await save("symptom", {

name: $("symptomName").value.trim(),

severity: Number($("symptomSeverity").value),

when: $("symptomWhen").value,

notes: $("symptomNotes").value.trim()

});

if (success) {

event.target.reset();

$("severityValue").textContent = "3";

}

};


// ==========================================
// CHRONIC CONDITIONS
// ==========================================

$("conditionForm").onsubmit = async event => {

event.preventDefault();

const success = await save("condition", {

name: $("conditionName").value.trim(),

since: $("conditionSince").value.trim(),

notes: $("conditionNotes").value.trim()

});

if (success) {
event.target.reset();
}

};


// ==========================================
// MEDICATION ORGANIZER
// ==========================================

$("medicationForm").onsubmit = async event => {

event.preventDefault();

const success = await save("medication", {

name: $("medName").value.trim(),

dose: $("medDose").value.trim(),

schedule: $("medSchedule").value.trim(),

notes: $("medNotes").value.trim()

});

if (success) {
event.target.reset();
}

};


// ==========================================
// CREATE HEALTH HISTORY CARDS
// ==========================================

function makeCard(row) {

const details = row.details || {};

const date = new Date(row.created_at).toLocaleString(
[],
{
dateStyle: "medium",
timeStyle: "short"
}
);

let title = row.entry_type;
let description = "";

if (row.entry_type === "pain") {

title = `Pain · ${details.level}/10`;

description = [
details.location,
details.type,
details.notes
].filter(Boolean).join(" · ");

}

if (row.entry_type === "symptom") {

title = `${details.name} · ${details.severity}/10`;

description = [
details.when,
details.notes
].filter(Boolean).join(" · ");

}

if (row.entry_type === "medication") {

title = details.name;

description = [
details.dose,
details.schedule,
details.notes
].filter(Boolean).join(" · ");

}

if (row.entry_type === "condition") {

title = details.name;

description = [
details.since,
details.notes
].filter(Boolean).join(" · ");

}

const card = document.createElement("article");

card.className = "entry-card";

const meta = document.createElement("span");

meta.className = "entry-meta";

meta.textContent = row.entry_type + " · " + date;

const heading = document.createElement("strong");

heading.textContent = title;

const paragraph = document.createElement("p");

paragraph.textContent =
description || "No additional notes.";

card.append(meta, heading, paragraph);

return card;

}


// ==========================================
// UPDATE DASHBOARD
// ==========================================

function render() {

const medications = entries.filter(
entry => entry.entry_type === "medication"
);

const conditions = entries.filter(
entry => entry.entry_type === "condition"
);

const painEntries = entries.filter(
entry => entry.entry_type === "pain"
);

const symptomEntries = entries.filter(
entry => entry.entry_type === "symptom"
);


$("entryCount").textContent = entries.length;

$("conditionCount").textContent = conditions.length;

$("latestEntry").textContent = entries.length
? new Date(entries[0].created_at).toLocaleDateString()
: "Not yet";


$("painCount").textContent = painEntries.length;

$("symptomCount").textContent = symptomEntries.length;

$("medCount").textContent = medications.length;


$("medicationList").replaceChildren(
...medications.map(makeCard)
);

$("conditionList").replaceChildren(
...conditions.map(makeCard)
);

$("recentEntries").replaceChildren(
...entries.slice(0, 30).map(makeCard)
);

}


// ==========================================
// EXPORT HEALTH INFORMATION
// ==========================================

$("exportData").onclick = () => {

const file = new Blob(
[JSON.stringify(entries, null, 2)],
{ type: "application/json" }
);

const url = URL.createObjectURL(file);

const link = document.createElement("a");

link.href = url;

link.download = "hearwell-my-entries.json";

link.click();

URL.revokeObjectURL(url);

};


// ==========================================
// DELETE JOURNAL ENTRIES
// ==========================================

$("deleteData").onclick = async () => {

if (!db) {
toast("Database is not connected.");
return;
}

const confirmed = confirm(
"Delete all your HearWell journal entries? This cannot be undone."
);

if (!confirmed) return;

const {
data: { user },
error: userError
} = await db.auth.getUser();

if (userError || !user) {
toast("Please sign in again.");
return;
}

const { error } = await db
.from("health_entries")
.delete()
.eq("user_id", user.id);

if (error) {

toast("Could not delete entries: " + error.message);

} else {

await loadAll();

toast("Journal entries deleted.");

}

};


// ==========================================
// START HEARWELL
// ==========================================

async function init() {

if (!db) {

showAuth();

authMsg(
"Preview mode: connect your Supabase project to enable real accounts and cloud saving.",
true
);

return;

}

const {
data: { session },
error
} = await db.auth.getSession();

if (error) {
authMsg("Could not check your login. Please refresh.", true);
return;
}

if (session?.user) {

showApp(session.user);

} else {

showAuth();

}

db.auth.onAuthStateChange((event, session) => {

if (event === "SIGNED_IN" && session?.user) {
showApp(session.user);
}

if (event === "SIGNED_OUT") {
entries = [];
showAuth();
}

});

}


// RUN APPLICATION

init();
