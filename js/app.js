// ==========================================
// APP.JS — Shared utilities & data layer
// ==========================================

// ---- DATA HELPERS ----
function getUserKey(suffix) {
  const user = getCurrentUser();
  return user ? `fb_${user.id}_${suffix}` : null;
}

function migrateChildrenToMembers() {
  const oldKey = getUserKey('children');
  const newKey = getUserKey('members');
  if (!oldKey || !newKey) return;
  if (localStorage.getItem(newKey) === null && localStorage.getItem(oldKey) !== null) {
    localStorage.setItem(newKey, localStorage.getItem(oldKey));
  }
}

function getMembers() {
  migrateChildrenToMembers();
  const key = getUserKey('members');
  return key ? JSON.parse(localStorage.getItem(key) || '[]') : [];
}

function saveMembers(members) {
  const key = getUserKey('members');
  if (key) localStorage.setItem(key, JSON.stringify(members));
}

function getShopping() {
  const key = getUserKey('shopping');
  return key ? JSON.parse(localStorage.getItem(key) || '[]') : [];
}

function saveShopping(items) {
  const key = getUserKey('shopping');
  if (key) localStorage.setItem(key, JSON.stringify(items));
}

function getExpenses() {
  const key = getUserKey('expenses');
  return key ? JSON.parse(localStorage.getItem(key) || '[]') : [];
}

function saveExpenses(expenses) {
  const key = getUserKey('expenses');
  if (key) localStorage.setItem(key, JSON.stringify(expenses));
}

function getPets() {
  const key = getUserKey('pets');
  return key ? JSON.parse(localStorage.getItem(key) || '[]') : [];
}

function savePets(pets) {
  const key = getUserKey('pets');
  if (key) localStorage.setItem(key, JSON.stringify(pets));
}

function getSettings() {
  const key = getUserKey('settings');
  const defaults = { showExpenses: true };
  if (!key) return defaults;
  return { ...defaults, ...JSON.parse(localStorage.getItem(key) || '{}') };
}

function saveSettings(settings) {
  const key = getUserKey('settings');
  if (key) localStorage.setItem(key, JSON.stringify(settings));
}

function isTaskDone(ev) {
  return !!(ev.doneDates && ev.doneDates.includes(ev.date));
}

function toggleTaskDone(baseId, date) {
  const events = getRawEvents();
  const idx = events.findIndex(e => e.id === baseId);
  if (idx === -1) return;
  const doneDates = events[idx].doneDates || [];
  const pos = doneDates.indexOf(date);
  if (pos === -1) doneDates.push(date); else doneDates.splice(pos, 1);
  events[idx] = { ...events[idx], doneDates };
  saveEvents(events);
}

function getEvents() {
  const key = getUserKey('events');
  const events = key ? JSON.parse(localStorage.getItem(key) || '[]') : [];
  // Expand repeated events for display
  return expandRepeatedEvents(events);
}

function getRawEvents() {
  const key = getUserKey('events');
  return key ? JSON.parse(localStorage.getItem(key) || '[]') : [];
}

function saveEvents(events) {
  const key = getUserKey('events');
  if (key) localStorage.setItem(key, JSON.stringify(events));
}

function getAlerts() {
  const key = getUserKey('alerts');
  return key ? JSON.parse(localStorage.getItem(key) || '[]') : [];
}

function saveAlerts(alerts) {
  const key = getUserKey('alerts');
  if (key) localStorage.setItem(key, JSON.stringify(alerts));
}

function expandRepeatedEvents(events) {
  const expanded = [];
  const today = new Date();
  const future = new Date(); future.setDate(future.getDate() + 30);

  events.forEach(ev => {
    expanded.push(ev);
    if (!ev.repeat || ev.repeat === 'none') return;

    const base = new Date(ev.date + 'T12:00:00');
    let current = new Date(base);
    current.setDate(current.getDate() + 1);

    while (current <= future) {
      const dayOfWeek = current.getDay(); // 0=Sun
      let include = false;

      if (ev.repeat === 'daily') include = true;
      else if (ev.repeat === 'weekly') include = current.getDay() === base.getDay();
      else if (ev.repeat === 'weekdays') include = dayOfWeek >= 1 && dayOfWeek <= 5;

      if (include) {
        expanded.push({
          ...ev,
          id: ev.id + '_' + current.toISOString().split('T')[0],
          baseId: ev.id,
          date: current.toISOString().split('T')[0],
          isExpanded: true
        });
      }

      current.setDate(current.getDate() + 1);
    }
  });

  return expanded;
}

// ---- UI HELPERS ----
function showToast(msg, type = 'info', duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, duration);
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayH = hour % 12 || 12;
  return `${displayH}:${m} ${ampm}`;
}

function typeIcon(type) {
  const icons = {
    pickup: '🚗', task: '📚', activity: '🎨',
    appointment: '🏥', sport: '⚽', other: '📌'
  };
  return icons[type] || '📌';
}

function typeLabel(type) {
  const labels = {
    pickup: 'Recogida', task: 'Tarea', activity: 'Actividad',
    appointment: 'Cita', sport: 'Deporte', other: 'Otro'
  };
  return labels[type] || 'Evento';
}

function roleLabel(role) {
  return { nino: 'Niño(a)', adulto: 'Adulto', otro: 'Otro' }[role] || 'Miembro';
}

// ---- ALERT CHECKER (runs every minute) ----
function checkUpcomingAlerts() {
  const user = getCurrentUser();
  if (!user) return;

  const events = getEvents();
  const existingAlerts = getAlerts();
  const newAlerts = [];
  const now = new Date();

  events.forEach(ev => {
    if (!ev.date || !ev.time) return;
    const eventDate = new Date(`${ev.date}T${ev.time}`);
    const diff = (eventDate - now) / 60000; // minutes

    const alertOffsets = [];
    if (ev.alert15 !== false) alertOffsets.push(15);
    if (ev.alert30) alertOffsets.push(30);
    if (ev.alert60) alertOffsets.push(60);
    if (ev.alertDay) alertOffsets.push(1440);

    alertOffsets.forEach(offset => {
      if (diff > 0 && diff <= offset + 1 && diff > offset - 1) {
        const alertId = `${ev.id}_${offset}`;
        if (!existingAlerts.find(a => a.id === alertId)) {
          const member = getMembers().find(m => m.id === ev.memberId);
          newAlerts.push({
            id: alertId,
            eventId: ev.id,
            title: ev.title,
            description: `${member ? 'Para ' + member.name + '. ' : ''}${offset < 60 ? offset + ' min' : offset / 60 + ' hora(s)'} para el evento.`,
            type: ev.type,
            time: new Date().toISOString(),
            read: false
          });
        }
      }
    });
  });

  if (newAlerts.length > 0) {
    const all = [...existingAlerts, ...newAlerts];
    saveAlerts(all);
    updateAlertBadge();

    // In-app WhatsApp-style toast (always, tab is open)
    newAlerts.forEach(a => showWhatsAppNotification(a.title, a.description));

    // Native OS notification (works even if the tab isn't focused)
    newAlerts.forEach(a => {
      if (Notification.permission === 'granted') {
        new Notification('FamilyBot', {
          body: `${a.title}: ${a.description}`,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2325D366"/><text x="50" y="68" font-size="55" text-anchor="middle">💬</text></svg>'
        });
      }
    });
  }
}

// ---- WHATSAPP-STYLE IN-APP NOTIFICATION ----
function showWhatsAppNotification(title, description) {
  const stacked = document.querySelectorAll('.wa-notification:not(.closing)').length;
  const el = document.createElement('div');
  el.className = 'wa-notification';
  el.style.top = (20 + stacked * 92) + 'px';
  el.innerHTML = `
    <div class="wa-notification-header">
      <div class="wa-notification-avatar">💬</div>
      <div class="wa-notification-name">FamilyBot</div>
      <div class="wa-notification-time">ahora</div>
      <button class="wa-notification-close" title="Cerrar">✕</button>
    </div>
    <div class="wa-notification-body">
      <div class="wa-notification-title">${title}</div>
      <div class="wa-notification-desc">${description}</div>
    </div>
  `;

  const dismiss = () => {
    el.classList.add('closing');
    setTimeout(() => el.remove(), 300);
  };

  el.querySelector('.wa-notification-close').addEventListener('click', (e) => {
    e.stopPropagation();
    dismiss();
  });
  el.addEventListener('click', () => { window.location.href = 'alerts.html'; });

  document.body.appendChild(el);
  setTimeout(dismiss, 6000);
}

function updateAlertBadge() {
  const alerts = getAlerts();
  const unread = alerts.filter(a => !a.read).length;
  const badge = document.getElementById('alertBadge');
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'block' : 'none';
  }
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ---- SIDEBAR USER ----
function loadSidebarUser() {
  const user = getCurrentUser();
  const el = document.getElementById('sidebarUser');
  if (el && user) {
    el.textContent = `👤 ${user.name} ${user.lastName}`;
  }
}

// ---- INIT (called on every app page) ----
function initApp() {
  const user = requireAuth();
  if (!user) return;

  const key = localStorage.getItem('fb_gemini_key');
  if (!key) {
    window.location.href = '../index.html';
    return;
  }

  loadSidebarUser();
  updateAlertBadge();
  requestNotificationPermission();

  // Check alerts every 60 seconds
  checkUpcomingAlerts();
  setInterval(checkUpcomingAlerts, 60000);

  // Close sidebar on outside click (mobile)
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.querySelector('.menu-toggle');
    if (sidebar && toggle && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}
