// ==========================================
// API.JS — Google Gemini AI Integration
// ==========================================

async function askGemini(prompt, systemContext = '') {
  const key = localStorage.getItem('fb_gemini_key');
  if (!key) throw new Error('No API key');

  const fullPrompt = systemContext
    ? `${systemContext}\n\nUsuario: ${prompt}`
    : prompt;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    }
  );

  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      const err = await resp.json();
      msg = err.error?.message ? `${resp.status}: ${err.error.message}` : msg;
    } catch (_) {}
    throw new Error(msg);
  }

  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta';
}

function buildFamilyContext() {
  const user = getCurrentUser();
  if (!user) return '';

  const members = getMembers();
  const events = getEvents();
  const shopping = getShopping();
  const pets = getPets();
  const settings = getSettings();
  const now = new Date();
  const today = now.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  let ctx = `Eres FamilyBot, un asistente familiar inteligente y amigable que habla en español.
Tu misión es ayudar a organizar la familia de ${user.name} ${user.lastName}.
Fecha y hora actual: ${today} - ${now.toLocaleTimeString('es-CO')}.

INFORMACIÓN DE LA FAMILIA:
`;

  if (members.length === 0) {
    ctx += '- Aún no tiene miembros registrados en el sistema.\n';
  } else {
    ctx += `Miembros registrados (${members.length}):\n`;
    members.forEach(m => {
      if (m.role === 'nino') {
        ctx += `  • ${m.name} (niño/a), ${m.age || '?'} años, ${m.grade || ''} en ${m.school || 'sin escuela registrada'}
    Horario: entrada ${m.entryTime || '?'} - salida ${m.exitTime || '?'}
    Días de escuela: ${(m.days || []).join(', ')}\n`;
      } else {
        ctx += `  • ${m.name} (${roleLabel(m.role)}${m.relation ? ', ' + m.relation : ''})${m.age ? ', ' + m.age + ' años' : ''}\n`;
      }
    });
  }

  const todayStr = now.toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.date === todayStr);
  const upcomingEvents = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);
  const pendingTasks = events.filter(e => e.type === 'task' && !isTaskDone(e))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (todayEvents.length > 0) {
    ctx += `\nEVENTOS DE HOY:\n`;
    todayEvents.forEach(e => {
      const member = members.find(m => m.id === e.memberId);
      ctx += `  • ${e.time || 'Sin hora'} - ${e.title} (${e.type}) para ${member ? member.name : 'familia'}${e.location ? ' en ' + e.location : ''}\n`;
    });
  } else {
    ctx += '\nNo hay eventos programados para hoy.\n';
  }

  if (upcomingEvents.length > 0) {
    ctx += `\nPRÓXIMOS EVENTOS:\n`;
    upcomingEvents.forEach(e => {
      const member = members.find(m => m.id === e.memberId);
      ctx += `  • ${e.date} ${e.time || ''} - ${e.title} para ${member ? member.name : 'familia'}\n`;
    });
  }

  if (pendingTasks.length > 0) {
    ctx += `\nTAREAS PENDIENTES:\n`;
    pendingTasks.slice(0, 10).forEach(e => {
      ctx += `  • ${e.date} - ${e.title}\n`;
    });
  } else {
    ctx += '\nNo hay tareas pendientes.\n';
  }

  const pendingShopping = shopping.filter(i => !i.checked);
  if (pendingShopping.length > 0) {
    ctx += `\nLISTA DE COMPRAS PENDIENTE:\n`;
    pendingShopping.forEach(i => {
      ctx += `  • ${i.name}${i.quantity ? ' (' + i.quantity + ')' : ''}\n`;
    });
  } else {
    ctx += '\nLa lista de compras está vacía.\n';
  }

  if (pets.length > 0) {
    ctx += `\nMASCOTAS REGISTRADAS:\n`;
    pets.forEach(p => {
      ctx += `  • ${p.name}, ${p.species}${p.breed ? ' (' + p.breed + ')' : ''}\n`;
    });
  }

  if (settings.showExpenses) {
    const expenses = getExpenses();
    if (expenses.length > 0) {
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      ctx += `\nGASTOS DEL HOGAR: Total acumulado ${total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })} en ${expenses.length} gasto(s) registrado(s).\n`;
    }
  }

  ctx += `
INSTRUCCIONES:
- Responde de manera amigable, concisa y útil en español.
- Si te preguntan sobre horarios o recogidas, usa los datos exactos de la familia.
- Si no hay datos suficientes, sugiere que el usuario los registre.
- Puedes dar consejos de organización familiar.
- Usa emojis ocasionalmente para ser más amigable.
- Respuestas máximo de 3-4 párrafos cortos.`;

  return ctx;
}
