// ==========================================
// MEMBERS.JS
// ==========================================

initApp();

let selectedColor = '#4F8EF7';
let selectedDays = ['lun','mar','mie','jue','vie'];
let selectedRole = 'nino';

function openMemberModal(editId = null) {
  document.getElementById('memberModal').style.display = 'flex';
  document.getElementById('memberFormError').style.display = 'none';
  document.getElementById('memberModalTitle').textContent = editId ? 'Editar miembro' : 'Agregar miembro';
  document.getElementById('memberEditId').value = editId || '';

  if (editId) {
    const member = getMembers().find(m => m.id === editId);
    if (!member) return;
    document.getElementById('memberName').value = member.name;
    document.getElementById('memberAge').value = member.age || '';
    document.getElementById('memberGrade').value = member.grade || '';
    document.getElementById('memberSchool').value = member.school || '';
    document.getElementById('memberSchoolAddress').value = member.schoolAddress || '';
    document.getElementById('memberEntryTime').value = member.entryTime || '07:00';
    document.getElementById('memberExitTime').value = member.exitTime || '14:00';
    document.getElementById('memberRelation').value = member.relation || '';

    selectedRole = member.role || 'nino';
    selectedDays = member.days || ['lun','mar','mie','jue','vie'];
    selectedColor = member.color || '#4F8EF7';
  } else {
    document.getElementById('memberName').value = '';
    document.getElementById('memberAge').value = '';
    document.getElementById('memberGrade').value = '';
    document.getElementById('memberSchool').value = '';
    document.getElementById('memberSchoolAddress').value = '';
    document.getElementById('memberEntryTime').value = '07:00';
    document.getElementById('memberExitTime').value = '14:00';
    document.getElementById('memberRelation').value = '';
    selectedRole = 'nino';
    selectedDays = ['lun','mar','mie','jue','vie'];
    selectedColor = '#4F8EF7';
  }

  renderRoleButtons();
  renderDayButtons();
  renderColorPicker();
  updateRoleFields();
}

function closeMemberModal() {
  document.getElementById('memberModal').style.display = 'none';
}

function renderRoleButtons() {
  document.querySelectorAll('.role-btn').forEach(btn => {
    const role = btn.dataset.role;
    btn.classList.toggle('active', role === selectedRole);
    btn.onclick = () => {
      selectedRole = role;
      renderRoleButtons();
      updateRoleFields();
    };
  });
}

function updateRoleFields() {
  const isChild = selectedRole === 'nino';
  document.getElementById('schoolFields').style.display = isChild ? 'block' : 'none';
  document.getElementById('relationField').style.display = isChild ? 'none' : 'block';
}

function renderDayButtons() {
  document.querySelectorAll('.day-btn').forEach(btn => {
    const day = btn.dataset.day;
    btn.classList.toggle('active', selectedDays.includes(day));
    btn.onclick = () => toggleDay(day, btn);
  });
}

function toggleDay(day, btn) {
  if (selectedDays.includes(day)) {
    selectedDays = selectedDays.filter(d => d !== day);
    btn.classList.remove('active');
  } else {
    selectedDays.push(day);
    btn.classList.add('active');
  }
}

function renderColorPicker() {
  document.querySelectorAll('.color-btn').forEach(btn => {
    const color = btn.dataset.color;
    btn.classList.toggle('active', color === selectedColor);
    btn.onclick = () => {
      selectedColor = color;
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });
}

function saveMember() {
  const name = document.getElementById('memberName').value.trim();
  const age = document.getElementById('memberAge').value;
  const grade = document.getElementById('memberGrade').value.trim();
  const school = document.getElementById('memberSchool').value.trim();
  const schoolAddress = document.getElementById('memberSchoolAddress').value.trim();
  const entryTime = document.getElementById('memberEntryTime').value;
  const exitTime = document.getElementById('memberExitTime').value;
  const relation = document.getElementById('memberRelation').value.trim();
  const editId = document.getElementById('memberEditId').value;
  const errEl = document.getElementById('memberFormError');

  if (!name) {
    errEl.textContent = 'El nombre es requerido.';
    errEl.style.display = 'block';
    return;
  }

  if (selectedRole === 'nino' && (!age || !grade || !school)) {
    errEl.textContent = 'Para un niño(a), edad, grado y escuela son requeridos.';
    errEl.style.display = 'block';
    return;
  }

  const members = getMembers();
  const memberData = {
    name, role: selectedRole, age: age ? parseInt(age) : null,
    grade, school, schoolAddress, entryTime, exitTime,
    days: selectedDays, relation, color: selectedColor
  };

  if (editId) {
    const idx = members.findIndex(m => m.id === editId);
    if (idx !== -1) members[idx] = { ...members[idx], ...memberData };
  } else {
    members.push({
      id: 'm_' + Date.now(),
      ...memberData,
      createdAt: new Date().toISOString()
    });
  }

  saveMembers(members);
  closeMemberModal();
  renderMembers();
  showToast(editId ? 'Miembro actualizado ✓' : 'Miembro agregado ✓', 'success');
}

function deleteMember(id) {
  if (!confirm('¿Eliminar este miembro? También se borrarán sus eventos.')) return;

  let members = getMembers();
  members = members.filter(m => m.id !== id);
  saveMembers(members);

  let events = getRawEvents();
  events = events.filter(e => e.memberId !== id);
  saveEvents(events);

  renderMembers();
  showToast('Miembro eliminado', 'info');
}

function renderMembers() {
  const members = getMembers();
  const grid = document.getElementById('membersGrid');
  const empty = document.getElementById('membersEmpty');

  if (members.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = members.map(m => `
    <div class="member-card">
      <div class="member-card-header">
        <div class="member-avatar" style="background:${m.color}">${m.name[0]}</div>
        <div class="member-meta">
          <h3>${m.name}</h3>
          <p>${roleLabel(m.role)}${m.role === 'nino' && m.age ? ' · ' + m.age + ' años' : ''}${m.role !== 'nino' && m.relation ? ' · ' + m.relation : ''}</p>
        </div>
      </div>
      <div class="member-card-body">
        ${m.role === 'nino' ? `
          ${m.school ? `<div class="member-info-row">🏫 ${m.school}${m.grade ? ' · ' + m.grade : ''}</div>` : ''}
          ${m.schoolAddress ? `<div class="member-info-row">📍 ${m.schoolAddress}</div>` : ''}
          ${m.entryTime && m.exitTime ? `<div class="member-info-row">⏰ Entrada: ${formatTime(m.entryTime)} · Salida: ${formatTime(m.exitTime)}</div>` : ''}
          ${m.days && m.days.length ? `<div class="member-info-row">📆 ${m.days.join(', ')}</div>` : ''}
        ` : `
          ${m.age ? `<div class="member-info-row">🎂 ${m.age} años</div>` : ''}
        `}
      </div>
      <div class="member-card-actions">
        <button class="btn-edit-member" onclick="openMemberModal('${m.id}')">✏️ Editar</button>
        <button class="btn-delete-member" onclick="deleteMember('${m.id}')">🗑️ Eliminar</button>
      </div>
    </div>
  `).join('');
}

renderMembers();
renderRoleButtons();
renderDayButtons();
renderColorPicker();
