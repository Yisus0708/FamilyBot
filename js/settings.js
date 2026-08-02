// ==========================================
// SETTINGS.JS
// ==========================================

initApp();

function loadSettingsUI() {
  const settings = getSettings();
  document.getElementById('toggleShowExpenses').checked = settings.showExpenses;
  refreshApiKeyDisplay();
}

function onToggleShowExpenses(checked) {
  const settings = getSettings();
  settings.showExpenses = checked;
  saveSettings(settings);
  showToast('Ajustes guardados ✓', 'success');
}

function refreshApiKeyDisplay() {
  const key = localStorage.getItem('fb_gemini_key');
  const display = document.getElementById('currentApiKeyDisplay');
  display.textContent = key ? `${key.slice(0, 4)}••••••••${key.slice(-4)}` : 'No has guardado ninguna clave.';
}

function updateApiKey() {
  const key = document.getElementById('newApiKeyInput').value.trim();
  const errEl = document.getElementById('apiKeyFormError');
  errEl.style.display = 'none';

  if (!key || key.length < 20) {
    errEl.textContent = 'Por favor ingresa una API Key válida.';
    errEl.style.display = 'block';
    return;
  }

  if (!key.startsWith('AQ') && !key.startsWith('AI')) {
    errEl.textContent = 'Las API Keys de Google AI Studio generalmente comienzan con "AQ" o "AI". Verifica tu clave.';
    errEl.style.display = 'block';
    return;
  }

  localStorage.setItem('fb_gemini_key', key);
  document.getElementById('newApiKeyInput').value = '';
  refreshApiKeyDisplay();
  showToast('API Key actualizada ✓', 'success');
}

function clearApiKey() {
  if (!confirm('¿Eliminar la API Key guardada?')) return;
  localStorage.removeItem('fb_gemini_key');
  refreshApiKeyDisplay();
  showToast('API Key eliminada', 'info');
}

loadSettingsUI();
