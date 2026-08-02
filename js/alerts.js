// ==========================================
// ALERTS.JS
// ==========================================

initApp();

let currentFilter = 'all';

function setAlertFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAlerts();
}

function markAllRead() {
  const alerts = getAlerts().map(a => ({ ...a, read: true }));
  saveAlerts(alerts);
  renderAlerts();
  updateAlertBadge();
  showToast('Todas las alertas marcadas como leídas', 'success');
}

function markRead(id) {
  const alerts = getAlerts().map(a => a.id === id ? { ...a, read: true } : a);
  saveAlerts(alerts);
  renderAlerts();
  updateAlertBadge();
}

function deleteAlert(id) {
  const alerts = getAlerts().filter(a => a.id !== id);
  saveAlerts(alerts);
  renderAlerts();
  updateAlertBadge();
}

function renderAlerts() {
  let alerts = getAlerts();

  if (currentFilter === 'unread') alerts = alerts.filter(a => !a.read);
  else if (currentFilter !== 'all') alerts = alerts.filter(a => a.type === currentFilter);

  alerts.sort((a, b) => new Date(b.time) - new Date(a.time));

  const listEl = document.getElementById('alertsPageList');
  const emptyEl = document.getElementById('alertsEmpty');

  if (alerts.length === 0) {
    listEl.innerHTML = '';
    listEl.appendChild(emptyEl);
    emptyEl.style.display = 'flex';
    return;
  }

  emptyEl.style.display = 'none';

  const html = alerts.map(a => `
    <div class="alert-item ${a.type} ${a.read ? '' : 'unread'}">
      <div class="alert-icon">${typeIcon(a.type)}</div>
      <div class="alert-body">
        <div class="alert-title">${a.title} ${!a.read ? '<span style="background:var(--coral);color:white;font-size:10px;padding:2px 6px;border-radius:10px;margin-left:6px">Nueva</span>' : ''}</div>
        <div class="alert-desc">${a.description}</div>
        <div class="alert-time">${new Date(a.time).toLocaleString('es-CO')}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
        ${!a.read ? `<button class="alert-mark" onclick="markRead('${a.id}')">✓ Leída</button>` : ''}
        <button class="alert-mark" onclick="deleteAlert('${a.id}')" style="color:#EF4444">🗑️</button>
      </div>
    </div>
  `).join('');

  listEl.innerHTML = html;
}

// Auto-generate alerts for today's upcoming events
function generateTodayAlerts() {
  const events = getEvents();
  const alerts = getAlerts();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const members = getMembers();
  const newAlerts = [];

  events.filter(e => e.date === today && e.time).forEach(ev => {
    const alertId = `today_${ev.id}`;
    if (!alerts.find(a => a.id === alertId)) {
      const member = members.find(m => m.id === ev.memberId);
      newAlerts.push({
        id: alertId,
        eventId: ev.id,
        title: ev.title,
        description: `${member ? 'Para ' + member.name + '. ' : ''}Evento hoy a las ${formatTime(ev.time)}.${ev.location ? ' Lugar: ' + ev.location : ''}`,
        type: ev.type,
        time: new Date().toISOString(),
        read: false
      });
    }
  });

  if (newAlerts.length > 0) {
    saveAlerts([...alerts, ...newAlerts]);
  }
}

generateTodayAlerts();
renderAlerts();
