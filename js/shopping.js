// ==========================================
// SHOPPING.JS
// ==========================================

initApp();

function addShoppingItem() {
  const nameEl = document.getElementById('shoppingName');
  const qtyEl = document.getElementById('shoppingQty');
  const name = nameEl.value.trim();
  if (!name) return;

  const items = getShopping();
  items.push({
    id: 's_' + Date.now(),
    name,
    quantity: qtyEl.value.trim(),
    checked: false,
    createdAt: new Date().toISOString()
  });
  saveShopping(items);

  nameEl.value = '';
  qtyEl.value = '';
  nameEl.focus();
  renderShopping();
}

function handleShoppingKey(e) {
  if (e.key === 'Enter') addShoppingItem();
}

function toggleShoppingItem(id) {
  const items = getShopping().map(i => i.id === id ? { ...i, checked: !i.checked } : i);
  saveShopping(items);
  renderShopping();
}

function deleteShoppingItem(id) {
  const items = getShopping().filter(i => i.id !== id);
  saveShopping(items);
  renderShopping();
}

function clearCheckedShopping() {
  const items = getShopping().filter(i => !i.checked);
  saveShopping(items);
  renderShopping();
  showToast('Comprados eliminados', 'info');
}

function renderShopping() {
  const items = getShopping();
  const listEl = document.getElementById('shoppingList');
  const emptyEl = document.getElementById('shoppingEmpty');

  if (items.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'flex';
    return;
  }

  emptyEl.style.display = 'none';

  const sorted = [...items].sort((a, b) => (a.checked === b.checked) ? 0 : (a.checked ? 1 : -1));

  listEl.innerHTML = sorted.map(i => `
    <div class="shopping-item ${i.checked ? 'checked' : ''}">
      <input type="checkbox" ${i.checked ? 'checked' : ''} onchange="toggleShoppingItem('${i.id}')"/>
      <div class="shopping-item-info">
        <span class="shopping-item-name">${i.name}</span>
        ${i.quantity ? `<span class="shopping-item-qty">${i.quantity}</span>` : ''}
      </div>
      <button class="event-action-btn" onclick="deleteShoppingItem('${i.id}')" title="Eliminar">🗑️</button>
    </div>
  `).join('');
}

renderShopping();
