// ==========================================
// AUTH.JS — Login, Register, Session
// ==========================================

function getUsers() {
  return JSON.parse(localStorage.getItem('fb_users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('fb_users', JSON.stringify(users));
}

function getCurrentUser() {
  const id = localStorage.getItem('fb_current_user');
  if (!id) return null;
  return getUsers().find(u => u.id === id) || null;
}

function setCurrentUser(user) {
  localStorage.setItem('fb_current_user', user.id);
}

function logout() {
  localStorage.removeItem('fb_current_user');
  window.location.href = isInPages() ? '../index.html' : 'index.html';
}

function isInPages() {
  return window.location.pathname.includes('/pages/');
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = isInPages() ? '../index.html' : 'index.html';
    return null;
  }
  return user;
}

function switchTab(tab) {
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('loginTab').classList.toggle('active', tab === 'login');
  document.getElementById('registerTab').classList.toggle('active', tab === 'register');
}

function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';

  if (!email || !password) {
    errEl.textContent = 'Por favor completa todos los campos.';
    errEl.style.display = 'block';
    return;
  }

  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === btoa(password));

  if (!user) {
    errEl.textContent = 'Correo o contraseña incorrectos.';
    errEl.style.display = 'block';
    return;
  }

  setCurrentUser(user);
  checkApiKey();
}

function handleRegister() {
  const name = document.getElementById('regName').value.trim();
  const lastName = document.getElementById('regLastName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const familyType = document.getElementById('regFamilyType').value;
  const errEl = document.getElementById('regError');
  errEl.style.display = 'none';

  if (!name || !lastName || !email || !password) {
    errEl.textContent = 'Por favor completa todos los campos.';
    errEl.style.display = 'block';
    return;
  }

  if (password.length < 6) {
    errEl.textContent = 'La contraseña debe tener al menos 6 caracteres.';
    errEl.style.display = 'block';
    return;
  }

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(email)) {
    errEl.textContent = 'Ingresa un correo electrónico válido.';
    errEl.style.display = 'block';
    return;
  }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    errEl.textContent = 'Ya existe una cuenta con ese correo.';
    errEl.style.display = 'block';
    return;
  }

  const newUser = {
    id: 'u_' + Date.now(),
    name,
    lastName,
    email,
    password: btoa(password),
    familyType,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);
  setCurrentUser(newUser);
  checkApiKey();
}

function checkApiKey() {
  const key = localStorage.getItem('fb_gemini_key');
  if (key) {
    window.location.href = 'pages/dashboard.html';
  } else {
    showApiModal();
  }
}

function showApiModal() {
  document.getElementById('apiModal').style.display = 'flex';
}

function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  const errEl = document.getElementById('apiError');
  errEl.style.display = 'none';

  if (!key || key.length < 20) {
    errEl.textContent = 'Por favor ingresa una API Key válida.';
    errEl.style.display = 'block';
    return;
  }

  // Quick validate format
  if (!key.startsWith('AQ') && !key.startsWith('AI')) {
    errEl.textContent = 'Las API Keys de Google AI Studio generalmente comienzan con "AQ" o "AI". Verifica tu clave.';
    errEl.style.display = 'block';
    return;
  }

  localStorage.setItem('fb_gemini_key', key);
  window.location.href = 'pages/dashboard.html';
}

// ---- INIT ----
if (document.getElementById('saveApiBtn')) {
  document.getElementById('saveApiBtn').addEventListener('click', saveApiKey);
}

// If already logged in, skip to dashboard
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
  const user = getCurrentUser();
  if (user) {
    const key = localStorage.getItem('fb_gemini_key');
    if (key) {
      window.location.href = 'pages/dashboard.html';
    } else {
      showApiModal();
    }
  }
}
