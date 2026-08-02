// ==========================================
// DASHBOARD.JS
// ==========================================

initApp();

const headerDate = document.getElementById('headerDate');
if (headerDate) {
  headerDate.textContent = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
}

function loadDashboard() {
  const members = getMembers();
  const events = getEvents();
  const alerts = getAlerts();
  const shopping = getShopping();
  const pets = getPets();
  const settings = getSettings();
  const today = new Date().toISOString().split('T')[0];

  // Stats
  const todayEvents = events.filter(e => e.date === today);
  const unreadAlerts = alerts.filter(a => !a.read);
  const pendingTasks = events.filter(e => e.type === 'task' && !isTaskDone(e))
    .sort((a, b) => a.date.localeCompare(b.date));

  document.getElementById('statsMembers').textContent = members.length;
  document.getElementById('statsEvents').textContent = todayEvents.length;
  document.getElementById('statsAlerts').textContent = unreadAlerts.length;
  document.getElementById('statsTasks').textContent = pendingTasks.length;

  // Members overview
  const membersEl = document.getElementById('membersOverview');
  if (members.length === 0) {
    membersEl.innerHTML = `<div class="empty-state">
      <div class="empty-icon">👪</div>
      <p>Agrega miembros de tu familia para comenzar</p>
      <a href="members.html" class="btn-secondary small">Agregar miembro</a>
    </div>`;
  } else {
    membersEl.innerHTML = members.map(m => `
      <div class="child-mini">
        <div class="child-mini-avatar" style="background:${m.color}">${m.name[0]}</div>
        <div>
          <div class="child-mini-name">${m.name}</div>
          <div class="child-mini-school">${m.role === 'nino' && m.school ? m.school + ' · Salida ' + formatTime(m.exitTime) : roleLabel(m.role) + (m.relation ? ' · ' + m.relation : '')}</div>
        </div>
      </div>`).join('');
  }

  // Today's schedule
  const scheduleEl = document.getElementById('todaySchedule');
  if (todayEvents.length === 0) {
    scheduleEl.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📅</div>
      <p>No hay eventos para hoy</p>
      <a href="schedule.html" class="btn-secondary small">Agregar evento</a>
    </div>`;
  } else {
    const sorted = todayEvents.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    scheduleEl.innerHTML = sorted.map(ev => {
      const member = members.find(m => m.id === ev.memberId);
      return `<div class="schedule-item">
        <div class="schedule-time">${ev.time ? formatTime(ev.time) : 'Todo el día'}</div>
        <div class="schedule-dot" style="background:${member ? member.color : '#94A3B8'}"></div>
        <div class="schedule-info">
          <div class="schedule-title">${typeIcon(ev.type)} ${ev.title}</div>
          ${member ? `<div class="schedule-child">${member.name}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  // Pending tasks
  const tasksEl = document.getElementById('dashTasks');
  if (pendingTasks.length === 0) {
    tasksEl.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><p>No hay tareas pendientes</p></div>`;
  } else {
    tasksEl.innerHTML = pendingTasks.slice(0, 5).map(ev => `
      <div class="shopping-item">
        <input type="checkbox" onchange="toggleTaskDone('${ev.baseId || ev.id}', '${ev.date}'); loadDashboard();"/>
        <div class="shopping-item-info">
          <span class="shopping-item-name">${ev.title}</span>
          <span class="shopping-item-qty">${formatDate(ev.date)}</span>
        </div>
      </div>`).join('');
  }

  // Reminders (alerts)
  const dashAlertsEl = document.getElementById('dashAlerts');
  const recentAlerts = [...alerts].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 4);
  if (recentAlerts.length === 0) {
    dashAlertsEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🔔</div><p>Sin recordatorios pendientes</p></div>`;
  } else {
    dashAlertsEl.innerHTML = recentAlerts.map(a => `
      <div class="alert-item ${a.type} ${a.read ? '' : 'unread'}" style="margin-bottom:8px; padding:10px 12px; background:var(--off-white); border-radius:8px; display:flex; gap:10px; border-left:3px solid ${a.read ? 'var(--gray-200)' : 'var(--coral)'}">
        <span>${typeIcon(a.type)}</span>
        <div>
          <div style="font-size:13px; font-weight:600">${a.title}</div>
          <div style="font-size:12px; color:var(--gray-600)">${a.description}</div>
        </div>
      </div>`).join('');
  }

  // Shopping list
  const shoppingEl = document.getElementById('dashShopping');
  const pendingShopping = shopping.filter(i => !i.checked);
  if (pendingShopping.length === 0) {
    shoppingEl.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🛒</div>
      <p>Tu lista de compras está vacía</p>
      <a href="shopping.html" class="btn-secondary small">Agregar producto</a>
    </div>`;
  } else {
    shoppingEl.innerHTML = pendingShopping.slice(0, 5).map(i => `
      <div class="shopping-item">
        <input type="checkbox" onchange="toggleShoppingItemFromDash('${i.id}')"/>
        <div class="shopping-item-info">
          <span class="shopping-item-name">${i.name}</span>
          ${i.quantity ? `<span class="shopping-item-qty">${i.quantity}</span>` : ''}
        </div>
      </div>`).join('');
  }

  // Expenses (optional)
  const expensesCard = document.getElementById('expensesCard');
  if (settings.showExpenses) {
    expensesCard.style.display = 'block';
    const expenses = getExpenses();
    const dashExpensesEl = document.getElementById('dashExpenses');
    if (expenses.length === 0) {
      dashExpensesEl.innerHTML = `<div class="empty-state">
        <div class="empty-icon">💰</div>
        <p>Aún no hay gastos registrados</p>
        <a href="expenses.html" class="btn-secondary small">Registrar gasto</a>
      </div>`;
    } else {
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      const recent = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
      dashExpensesEl.innerHTML = `
        <div style="font-size:13px;color:var(--gray-600);margin-bottom:10px">Total: <strong style="color:var(--navy)">${total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</strong></div>
        ${recent.map(e => `
          <div class="schedule-item">
            <div class="schedule-info">
              <div class="schedule-title">${e.description}</div>
              <div class="schedule-child">${formatDate(e.date)}</div>
            </div>
          </div>`).join('')}`;
    }
  } else {
    expensesCard.style.display = 'none';
  }

  // Pets overview
  const petsEl = document.getElementById('petsOverview');
  if (pets.length === 0) {
    petsEl.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🐾</div>
      <p>Aún no has registrado mascotas</p>
      <a href="pets.html" class="btn-secondary small">Agregar mascota</a>
    </div>`;
  } else {
    petsEl.innerHTML = pets.map(p => `
      <div class="child-mini">
        <div class="child-mini-avatar" style="background:${p.color}">${p.name[0]}</div>
        <div>
          <div class="child-mini-name">${p.name}</div>
          <div class="child-mini-school">${p.species}${p.breed ? ' · ' + p.breed : ''}</div>
        </div>
      </div>`).join('');
  }
}

function toggleShoppingItemFromDash(id) {
  const items = getShopping().map(i => i.id === id ? { ...i, checked: !i.checked } : i);
  saveShopping(items);
  loadDashboard();
}

async function quickAsk() {
  const input = document.getElementById('quickQuestion');
  const ansEl = document.getElementById('quickAnswer');
  const q = input.value.trim();
  if (!q) return;

  ansEl.style.display = 'block';
  ansEl.textContent = '⏳ Consultando...';

  try {
    const ctx = buildFamilyContext();
    const answer = await askGemini(q, ctx);
    ansEl.textContent = answer;
  } catch (e) {
    ansEl.textContent = `❌ Error al conectar con la IA. (${e.message})`;
  }
}

// Enter key for quick ask
document.getElementById('quickQuestion').addEventListener('keydown', e => {
  if (e.key === 'Enter') quickAsk();
});

loadDashboard();
