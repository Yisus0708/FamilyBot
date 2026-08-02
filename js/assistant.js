// ==========================================
// ASSISTANT.JS — Gemini AI Chat
// ==========================================

initApp();

let chatHistory = [];
let isLoading = false;

function usePrompt(btn) {
  document.getElementById('chatInput').value = btn.textContent;
  document.getElementById('chatInput').focus();
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 140) + 'px';
}

function addMessage(role, content) {
  const container = document.getElementById('chatMessages');

  // Remove welcome screen on first message
  const welcome = container.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  const div = document.createElement('div');
  div.className = `msg ${role}`;

  const avatar = role === 'bot' ? '🤖' : '👤';
  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-bubble">${formatMarkdown(content)}</div>
  `;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function showTyping() {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.id = 'typingMsg';
  div.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-bubble">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById('typingMsg');
  if (typing) typing.remove();
}

async function sendMessage() {
  if (isLoading) return;
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';
  isLoading = true;

  const sendBtn = document.getElementById('sendBtn');
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<div class="typing-dot" style="width:8px;height:8px;background:white;border-radius:50%"></div>';

  addMessage('user', text);
  chatHistory.push({ role: 'user', text });

  showTyping();

  try {
    const ctx = buildFamilyContext();

    // Build conversation context
    const historyText = chatHistory.slice(-6).map(m =>
      `${m.role === 'user' ? 'Usuario' : 'FamilyBot'}: ${m.text}`
    ).join('\n');

    const fullPrompt = `${ctx}

HISTORIAL DE CONVERSACIÓN:
${historyText}

Responde SOLO al último mensaje del usuario de manera natural y conversacional.`;

    const answer = await askGemini(text, fullPrompt.replace(`\nUsuario: ${text}`, '').replace(`Usuario: ${text}`, ''));

    removeTyping();
    addMessage('bot', answer);
    chatHistory.push({ role: 'bot', text: answer });

  } catch (err) {
    removeTyping();
    addMessage('bot', `❌ Lo siento, no pude conectarme con la IA. (${err.message})`);
  }

  isLoading = false;
  sendBtn.disabled = false;
  sendBtn.innerHTML = '<span id="sendIcon">➤</span>';
}

function clearChat() {
  chatHistory = [];
  const container = document.getElementById('chatMessages');
  container.innerHTML = `
    <div class="chat-welcome">
      <div class="welcome-icon">🤖</div>
      <h2>Hola, soy FamilyBot</h2>
      <p>Tu asistente familiar inteligente. Puedo ayudarte a organizar horarios, tareas, compras, gastos y a toda tu familia. ¿En qué te puedo ayudar hoy?</p>
      <div class="quick-prompts">
        <button class="quick-prompt" onclick="usePrompt(this)">¿A qué hora recojo a los niños hoy?</button>
        <button class="quick-prompt" onclick="usePrompt(this)">¿Qué tareas tienen esta semana?</button>
        <button class="quick-prompt" onclick="usePrompt(this)">¿Qué me falta comprar?</button>
        <button class="quick-prompt" onclick="usePrompt(this)">Resume el horario de mañana</button>
        <button class="quick-prompt" onclick="usePrompt(this)">¿Qué recordatorios tengo pendientes?</button>
      </div>
    </div>`;
}
