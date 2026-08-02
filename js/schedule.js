// ==========================================
// SCHEDULE.JS
// ==========================================

initApp();

let currentWeekStart = getWeekStart(new Date());

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function prevWeek() { currentWeekStart.setDate(currentWeekStart.getDate() - 7); renderWeek(); }
function nextWeek() { currentWeekStart.setDate(currentWeekStart.getDate() + 7); renderWeek(); }
function goToday() { currentWeekStart = getWeekStart(new Date()); renderWeek(); }

function renderWeek() {
  const start = new Date(currentWeekStart);
  const end = new Date(start); end.setDate(end.getDate() + 6);

  const startStr = start.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  const endStr = end.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  document.getElementById('weekLabel').textContent = `${startStr} – ${endStr}`;

  const events = getEvents();
  const members = getMembers();
  const todayStr = new Date().toISOString().split('T')[0];
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const grid = document.getElementById('weekGrid');

  let html = '';
  for (let i = 0; i < 7; i++) {
    const day = new Date(start); day.setDate(day.getDate() + i);
    const dayStr = day.toISOString().split('T')[0];
    const isToday = dayStr === todayStr;
    const dayEvents = events.filter(e => e.date === dayStr);

    html += `<div class="week-day-col ${isToday ? 'today' : ''}">
      <div class="week-day-header">
        <div class="week-day-name">${days[i]}</div>
        <div class="week-day-num">${day.getDate()}</div>
      </div>
      <div class="week-day-events">`;

    dayEvents.sort((a, b) => (a.time || '').localeCompare(b.time || '')).forEach(ev => {
      const member = members.find(m => m.id === ev.memberId);
      const color = member ? member.color : '#94A3B8';
      html += `<div class="week-event-chip" style="background:${color}" title="${ev.title}${ev.time ? ' - ' + formatTime(ev.time) : ''}">${typeIcon(ev.type)} ${ev.title}</div>`;
    });

    html += `</div></div>`;
  }
  grid.innerHTML = html;

  renderEventsList();
}

function renderEventsList() {
  const allEvents = getEvents();
  const members = getMembers();

  const filterMember = document.getElementById('filterMember').value;
  const filterType = document.getElementById('filterType').value;

  let filtered = allEvents.filter(e => !e.isExpanded); // show originals only in list
  if (filterMember) filtered = filtered.filter(e => e.memberId === filterMember);
  if (filterType) filtered = filtered.filter(e => e.type === filterType);

  filtered.sort((a, b) => {
    const da = a.date + (a.time || '');
    const db = b.date + (b.time || '');
    return da.localeCompare(db);
  });

  const el = document.getElementById('eventsList');
  if (filtered.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><p>No hay eventos registrados</p></div>';
    return;
  }

  el.innerHTML = filtered.map(ev => {
    const member = members.find(m => m.id === ev.memberId);
    const done = ev.type === 'task' && isTaskDone(ev);
    return `<div class="event-item">
      ${ev.type === 'task' ? `<input type="checkbox" class="task-check" ${done ? 'checked' : ''} onchange="toggleTaskDone('${ev.baseId || ev.id}', '${ev.date}'); renderEventsList();"/>` : `<div class="event-type-icon">${typeIcon(ev.type)}</div>`}
      <div class="event-info">
        <div class="event-title" style="${done ? 'text-decoration:line-through;color:var(--gray-400)' : ''}">${ev.title}</div>
        <div class="event-meta">
          ${formatDate(ev.date)}${ev.time ? ' · ' + formatTime(ev.time) : ''}
          ${member ? ` · <span style="color:${member.color}">⬤</span> ${member.name}` : ''}
          ${ev.location ? ` · 📍 ${ev.location}` : ''}
          ${ev.repeat && ev.repeat !== 'none' ? ` · 🔁 ${repeatLabel(ev.repeat)}` : ''}
        </div>
        ${ev.note ? `<div class="event-meta" style="margin-top:4px;font-style:italic">${ev.note}</div>` : ''}
      </div>
      <div class="event-actions">
        <button class="event-action-btn" onclick="openEventModal('${ev.id}')" title="Editar">✏️</button>
        <button class="event-action-btn" onclick="deleteEvent('${ev.id}')" title="Eliminar">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function repeatLabel(r) {
  return { daily:'Diario', weekly:'Semanal', weekdays:'L-V' }[r] || '';
}

function filterEvents() { renderEventsList(); }

function loadMemberFilter() {
  const members = getMembers();
  const sel = document.getElementById('filterMember');
  sel.innerHTML = '<option value="">Todos los miembros</option>' +
    members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

  const evMemberSel = document.getElementById('eventMember');
  if (evMemberSel) {
    evMemberSel.innerHTML = '<option value="">— Sin asignar —</option>' +
      members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  }
}

function openEventModal(editId = null) {
  loadMemberFilter();
  document.getElementById('eventModal').style.display = 'flex';
  document.getElementById('eventFormError').style.display = 'none';
  document.getElementById('eventModalTitle').textContent = editId ? 'Editar evento' : 'Nuevo evento';
  document.getElementById('eventEditId').value = editId || '';

  if (editId) {
    const events = getRawEvents();
    const ev = events.find(e => e.id === editId);
    if (!ev) return;
    document.getElementById('eventTitle').value = ev.title;
    document.getElementById('eventType').value = ev.type;
    document.getElementById('eventMember').value = ev.memberId || '';
    document.getElementById('eventDate').value = ev.date;
    document.getElementById('eventTime').value = ev.time || '';
    document.getElementById('eventLocation').value = ev.location || '';
    document.getElementById('eventNote').value = ev.note || '';
    document.getElementById('alert15').checked = ev.alert15 !== false;
    document.getElementById('alert30').checked = !!ev.alert30;
    document.getElementById('alert60').checked = !!ev.alert60;
    document.getElementById('alertDay').checked = !!ev.alertDay;
    document.getElementById('eventRepeat').value = ev.repeat || 'none';
  } else {
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventType').value = 'pickup';
    document.getElementById('eventMember').value = '';
    document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('eventTime').value = '';
    document.getElementById('eventLocation').value = '';
    document.getElementById('eventNote').value = '';
    document.getElementById('alert15').checked = true;
    document.getElementById('alert30').checked = false;
    document.getElementById('alert60').checked = false;
    document.getElementById('alertDay').checked = false;
    document.getElementById('eventRepeat').value = 'none';
  }
}

function closeEventModal() {
  document.getElementById('eventModal').style.display = 'none';
}

function saveEvent() {
  const title = document.getElementById('eventTitle').value.trim();
  const type = document.getElementById('eventType').value;
  const memberId = document.getElementById('eventMember').value;
  const date = document.getElementById('eventDate').value;
  const time = document.getElementById('eventTime').value;
  const location = document.getElementById('eventLocation').value.trim();
  const note = document.getElementById('eventNote').value.trim();
  const alert15 = document.getElementById('alert15').checked;
  const alert30 = document.getElementById('alert30').checked;
  const alert60 = document.getElementById('alert60').checked;
  const alertDay = document.getElementById('alertDay').checked;
  const repeat = document.getElementById('eventRepeat').value;
  const editId = document.getElementById('eventEditId').value;
  const errEl = document.getElementById('eventFormError');

  if (!title || !date) {
    errEl.textContent = 'El título y la fecha son requeridos.';
    errEl.style.display = 'block';
    return;
  }

  const events = getRawEvents();
  const evData = { title, type, memberId, date, time, location, note, alert15, alert30, alert60, alertDay, repeat };

  if (editId) {
    const idx = events.findIndex(e => e.id === editId);
    if (idx !== -1) events[idx] = { ...events[idx], ...evData };
  } else {
    events.push({ id: 'e_' + Date.now(), ...evData, createdAt: new Date().toISOString() });
  }

  saveEvents(events);
  closeEventModal();
  renderWeek();
  showToast(editId ? 'Evento actualizado ✓' : 'Evento guardado ✓', 'success');
}

function deleteEvent(id) {
  if (!confirm('¿Eliminar este evento?')) return;
  let events = getRawEvents();
  events = events.filter(e => e.id !== id);
  saveEvents(events);
  renderWeek();
  showToast('Evento eliminado', 'info');
}

loadMemberFilter();
renderWeek();
