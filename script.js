// --- Goals ---
let goals = JSON.parse(localStorage.getItem('goals')) || [];
const dailyGoalsList = document.getElementById('daily-goals-list');
const addGoalForm = document.getElementById('add-goal-form');
const newGoalInput = document.getElementById('new-goal-input');

function renderGoals() {
  dailyGoalsList.innerHTML = '';
  goals.forEach((goal, idx) => {
    const li = document.createElement('li');
    li.textContent = goal;
    const del = document.createElement('button');
    del.textContent = '✕';
    del.onclick = () => {
      goals.splice(idx, 1);
      localStorage.setItem('goals', JSON.stringify(goals));
      renderGoals();
    };
    li.appendChild(del);
    dailyGoalsList.appendChild(li);
  });
}
addGoalForm.onsubmit = e => {
  e.preventDefault();
  goals.push(newGoalInput.value.trim());
  localStorage.setItem('goals', JSON.stringify(goals));
  newGoalInput.value = '';
  renderGoals();
};
renderGoals();

// --- Calendar ---
const calendar = document.getElementById('calendar');
const selectedDateSpan = document.getElementById('selected-date');
const progressList = document.getElementById('progress-list');
const addProgressForm = document.getElementById('add-progress-form');
const progressInput = document.getElementById('progress-input');

let progressData = JSON.parse(localStorage.getItem('progressData')) || {};
let selectedDate = new Date().toISOString().slice(0,10);

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

function renderProgress() {
  selectedDateSpan.textContent = selectedDate;
  const notes = progressData[selectedDate] || [];
  progressList.innerHTML = '';
  notes.forEach((note, idx) => {
    const li = document.createElement('li');
    li.textContent = note;
    const del = document.createElement('button');
    del.textContent = '✕';
    del.onclick = () => {
      notes.splice(idx, 1);
      progressData[selectedDate] = notes;
      localStorage.setItem('progressData', JSON.stringify(progressData));
      renderProgress();
    };
    li.appendChild(del);
    progressList.appendChild(li);
  });
}
addProgressForm.onsubmit = e => {
  e.preventDefault();
  if(!progressData[selectedDate]) progressData[selectedDate] = [];
  progressData[selectedDate].push(progressInput.value.trim());
  localStorage.setItem('progressData', JSON.stringify(progressData));
  progressInput.value = '';
  renderProgress();
};

renderCalendar();
renderProgress();
