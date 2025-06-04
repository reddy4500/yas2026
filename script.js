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

// --- Calendar System ---
function renderCalendar() {
  // Set to May 2026 (month is 0-indexed)
  const targetYear = 2026;
  const targetMonth = 4;
  
  const firstDay = new Date(targetYear, targetMonth, 1);
  const lastDay = new Date(targetYear, targetMonth + 1, 0);

  // Update selected date to first day if not in May 2026
  if (!selectedDate.startsWith('2026-05')) {
    selectedDate = `${targetYear}-05-01`;
  }

  let html = '<table class="calendar-table"><tr>';
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => html += `<th>${d}</th>`);
  html += '</tr><tr>';

  for(let i=0; i<firstDay.getDay(); i++) html += '<td></td>';
  for(let d=1; d<=lastDay.getDate(); d++) {
    const dateStr = `${targetYear}-05-${d.toString().padStart(2,'0')}`;
    const isToday = dateStr === new Date().toISOString().slice(0,10);
    const isSelected = dateStr === selectedDate;
    
    html += `<td class="${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
              data-date="${dateStr}">${d}</td>`;
    
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
