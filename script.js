// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyD5p6GARxGNch-M_7RZBV9kLRC4RhAVNrg",
  authDomain: "pg-2026.firebaseapp.com",
  projectId: "pg-2026",
  storageBucket: "pg-2026.firebasestorage.app",
  messagingSenderId: "603600776265",
  appId: "1:603600776265:web:be4cec2075c776ed13e398",
  measurementId: "G-28QT4B4TRP"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  initApp();
});

// --- App Initialization ---
function initApp() {
  renderGoals();
  renderCalendar();
  renderProgress();
  
  // Real-time updates
  db.collection("users").doc(currentUser.uid).collection("goals")
    .onSnapshot(() => renderGoals());
  
  db.collection("users").doc(currentUser.uid).collection("progress")
    .onSnapshot(() => renderProgress());
}

// --- Goals System ---
function renderGoals() {
  if (!currentUser) return;
  
  dailyGoalsList.innerHTML = '';
  db.collection("users").doc(currentUser.uid).collection("goals")
    .orderBy("createdAt", "desc")
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const li = document.createElement('li');
        li.textContent = doc.data().text;
        
        const del = document.createElement('button');
        del.textContent = '✕';
        del.onclick = () => db.collection("users").doc(currentUser.uid)
          .collection("goals").doc(doc.id).delete();
        
        li.appendChild(del);
        dailyGoalsList.appendChild(li);
      });
    });
}

addGoalForm.onsubmit = e => {
  e.preventDefault();
  const text = newGoalInput.value.trim();
  if (!text || !currentUser) return;

  db.collection("users").doc(currentUser.uid).collection("goals").add({
    text: text,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => newGoalInput.value = '');
};

// --- Calendar System with Navigation ---

let calendarYear = 2024; // Start year
let calendarMonth = 5;   // Start month (0-indexed, so 5 = June)

const minYear = 2024, minMonth = 5; // June 2024
const maxYear = 2026, maxMonth = 4; // May 2026

function renderCalendar() {
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);

  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <button id="prevMonth" ${calendarYear === minYear && calendarMonth === minMonth ? 'disabled' : ''}>&lt;</button>
      <span style="font-weight:bold;">${firstDay.toLocaleString('default', { month: 'long' })} ${calendarYear}</span>
      <button id="nextMonth" ${calendarYear === maxYear && calendarMonth === maxMonth ? 'disabled' : ''}>&gt;</button>
    </div>
    <table class="calendar-table"><tr>
  `;
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  days.forEach(d => html += `<th>${d}</th>`);
  html += '</tr><tr>';

  for(let i=0; i<firstDay.getDay(); i++) html += '<td></td>';
  for(let d=1; d<=lastDay.getDate(); d++) {
    let dateStr = `${calendarYear}-${String(calendarMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    let isToday = dateStr === new Date().toISOString().slice(0,10);
    let isSelected = dateStr === selectedDate;
    html += `<td class="${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">${d}</td>`;
    if((firstDay.getDay() + d) % 7 === 0) html += '</tr><tr>';
  }
  html += '</tr></table>';
  calendar.innerHTML = html;

  // Navigation handlers
  document.getElementById('prevMonth').onclick = () => {
    if (calendarMonth === 0) {
      calendarMonth = 11;
      calendarYear--;
    } else {
      calendarMonth--;
    }
    renderCalendar();
    renderProgress();
  };
  document.getElementById('nextMonth').onclick = () => {
    if (calendarMonth === 11) {
      calendarMonth = 0;
      calendarYear++;
    } else {
      calendarMonth++;
    }
    renderCalendar();
    renderProgress();
  };

  // Date selection
  document.querySelectorAll('#calendar td[data-date]').forEach(td => {
    td.onclick = () => {
      selectedDate = td.getAttribute('data-date');
      renderCalendar();
      renderProgress();
    };
  });
}

// Set initial calendar to June 2024
calendarYear = 2024;
calendarMonth = 5;
renderCalendar();


// --- Progress Tracking ---
function renderProgress() {
  if (!currentUser) return;
  
  progressList.innerHTML = '';
  selectedDateSpan.textContent = selectedDate;
  
  db.collection("users").doc(currentUser.uid).collection("progress")
    .doc(selectedDate).get()
    .then(docSnap => {
      const notes = docSnap.exists ? docSnap.data().notes : [];
      
      notes.forEach((note, index) => {
        const li = document.createElement('li');
        li.textContent = note;
        
        const del = document.createElement('button');
        del.textContent = '✕';
        del.onclick = () => {
          const updatedNotes = notes.filter((_, i) => i !== index);
          db.collection("users").doc(currentUser.uid).collection("progress")
            .doc(selectedDate).set({ notes: updatedNotes });
        };
        
        li.appendChild(del);
        progressList.appendChild(li);
      });
    });
}

addProgressForm.onsubmit = e => {
  e.preventDefault();
  const note = progressInput.value.trim();
  if (!note || !currentUser) return;

  db.collection("users").doc(currentUser.uid).collection("progress")
    .doc(selectedDate).set({
      notes: firebase.firestore.FieldValue.arrayUnion(note)
    }, { merge: true }).then(() => progressInput.value = '');
};
