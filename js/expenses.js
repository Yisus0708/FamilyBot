// ==========================================
// EXPENSES.JS
// ==========================================

initApp();

function categoryIcon(cat) {
  const icons = {
    mercado: '🛒', servicios: '💡', salud: '🏥',
    educacion: '📚', transporte: '🚗', otro: '📌'
  };
  return icons[cat] || '📌';
}

function categoryLabel(cat) {
  const labels = {
    mercado: 'Mercado', servicios: 'Servicios', salud: 'Salud',
    educacion: 'Educación', transporte: 'Transporte', otro: 'Otro'
  };
  return labels[cat] || 'Otro';
}

function addExpense() {
  const descEl = document.getElementById('expenseDesc');
  const amountEl = document.getElementById('expenseAmount');
  const categoryEl = document.getElementById('expenseCategory');
  const dateEl = document.getElementById('expenseDate');
  const errEl = document.getElementById('expenseFormError');

  const description = descEl.value.trim();
  const amount = parseFloat(amountEl.value);
  const category = categoryEl.value;
  const date = dateEl.value || new Date().toISOString().split('T')[0];

  if (!description || !amount || amount <= 0) {
    errEl.textContent = 'Descripción y monto (mayor a 0) son requeridos.';
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';

  const expenses = getExpenses();
  expenses.push({
    id: 'g_' + Date.now(),
    description, amount, category, date,
    createdAt: new Date().toISOString()
  });
  saveExpenses(expenses);

  descEl.value = '';
  amountEl.value = '';
  dateEl.value = '';
  renderExpenses();
  showToast('Gasto registrado ✓', 'success');
}

function deleteExpense(id) {
  const expenses = getExpenses().filter(e => e.id !== id);
  saveExpenses(expenses);
  renderExpenses();
}

function renderExpenses() {
  const expenses = getExpenses();
  const listEl = document.getElementById('expensesList');
  const emptyEl = document.getElementById('expensesEmpty');
  const totalEl = document.getElementById('expensesTotal');

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  totalEl.textContent = total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  if (expenses.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'flex';
    return;
  }

  emptyEl.style.display = 'none';
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

  listEl.innerHTML = sorted.map(e => `
    <div class="expense-item">
      <div class="event-type-icon">${categoryIcon(e.category)}</div>
      <div class="event-info">
        <div class="event-title">${e.description}</div>
        <div class="event-meta">${formatDate(e.date)} · ${categoryLabel(e.category)}</div>
      </div>
      <div class="expense-amount">${e.amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</div>
      <button class="event-action-btn" onclick="deleteExpense('${e.id}')" title="Eliminar">🗑️</button>
    </div>
  `).join('');
}

renderExpenses();
