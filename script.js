// --- Firebase SDK Setup ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5p6GARxGNch-M_7RZBV9kLRC4RhAVNrg",
  authDomain: "pg-2026.firebaseapp.com",
  projectId: "pg-2026",
  storageBucket: "pg-2026.firebasestorage.app",
  messagingSenderId: "603600776265",
  appId: "1:603600776265:web:be4cec2075c776ed13e398",
  measurementId: "G-28QT4B4TRP"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM Elements ---
const dailyGoalsList = document.getElementById('daily-goals-list');
const addGoalForm = document.getElementById('add-goal-form');
const newGoalInput = document.getElementById('new-goal-input');
const calendar = document.getElementById('calendar');
const selectedDateSpan = document.getElementById('selected-date');
const progressList = document.getElementById('progress-list');
const addProgressForm = document.getElementById('add-progress-form');
const progressInput = document.getElementById('progress-input');

let selectedDate = new Date().toISOString().slice(0,10);
let currentUser = null;

// --- Authentication State ---
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  renderGoals();
  renderCalendar();
  renderProgress();
});

// --- Goals ---
async function renderGoals() {
  if (!currentUser) return;
  dailyGoalsList.innerHTML = '';
  const goalsRef = collection(db, "users", currentUser.uid, "goals");
  const snapshot = await getDocs(goalsRef);
  snapshot.forEach(docSnap => {
    const goal = docSnap.data().text;
    const li = document.createElement('li');
    li.textContent = goal;
    const del = document.createElement('button');
    del.textContent = '✕';
    del.onclick = async () => {
      await deleteDoc(doc(db, "users", currentUser.uid, "goals", docSnap.id));
      renderGoals();
    };
    li.appendChild(del);
    dailyGoalsList.appendChild(li);
  });
}

addGoalForm.onsubmit = async e => {
  e.preventDefault();
  if (!currentUser) return;
  const text = newGoalInput.value.trim();
  if (!text) return;
  await addDoc(collection(db, "users", currentUser.uid, "goals"), { text });
  newGoalInput.value = '';
  renderGoals();
};

// --- Calendar ---
function renderCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let html = '<table class="calendar-table"><tr>';
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  days.forEach(d => html += `<th>${d}</th>`);
  html += '</tr><tr>';

  for(let i=0; i<firstDay.getDay(); i++) html += '<td></td>';
  for(let d=1; d<=lastDay.getDate(); d++) {
    let dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    let isToday = dateStr === new Date().toISOString().slice(0,10);
    let isSelected = dateStr === selectedDate;
    html += `<td class="${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">${d}</td>`;
    if((firstDay.getDay() + d) % 7 === 0) html += '</tr><tr>';
  }
  html += '</tr></table>';
  calendar.innerHTML = html;

  document.querySelectorAll('#calendar td[data-date]').forEach(td => {
    td.onclick = () => {
      selectedDate = td.getAttribute('data-date');
      renderCalendar();
      renderProgress();
    };
  });
}

// --- Progress ---
async function renderProgress() {
  if (!currentUser) return;
  selectedDateSpan.textContent = selectedDate;
  progressList.innerHTML = '';
  const progressRef = collection(db, "users", currentUser.uid, "progress");
  const snapshot = await getDocs(progressRef);
  let notes = [];
  snapshot.forEach(docSnap => {
    if (docSnap.id === selectedDate) {
      notes = docSnap.data().notes || [];
    }
  });
  notes.forEach((note, idx) => {
    const li = document.createElement('li');
    li.textContent = note;
    const del = document.createElement('button');
    del.textContent = '✕';
    del.onclick = async () => {
      const docRef = doc(db, "users", currentUser.uid, "progress", selectedDate);
      notes.splice(idx, 1);
      await setDoc(docRef, { notes }, { merge: true });
      renderProgress();
    };
    li.appendChild(del);
    progressList.appendChild(li);
  });
}

addProgressForm.onsubmit = async e => {
  e.preventDefault();
  if (!currentUser) return;
  const note = progressInput.value.trim();
  if (!note) return;
  const docRef = doc(db, "users", currentUser.uid, "progress", selectedDate);
  // Get existing notes
  let notes = [];
  const docSnap = await getDocs(collection(db, "users", currentUser.uid, "progress"));
  docSnap.forEach(snap => {
    if (snap.id === selectedDate) {
      notes = snap.data().notes || [];
    }
  });
  notes.push(note);
  await setDoc(docRef, { notes }, { merge: true });
  progressInput.value = '';
  renderProgress();
};
