// ==========================================
// PETS.JS
// ==========================================

initApp();

let selectedPetColor = '#4F8EF7';

function openPetModal(editId = null) {
  document.getElementById('petModal').style.display = 'flex';
  document.getElementById('petFormError').style.display = 'none';
  document.getElementById('petModalTitle').textContent = editId ? 'Editar mascota' : 'Agregar mascota';
  document.getElementById('petEditId').value = editId || '';

  if (editId) {
    const pet = getPets().find(p => p.id === editId);
    if (!pet) return;
    document.getElementById('petName').value = pet.name;
    document.getElementById('petSpecies').value = pet.species || '';
    document.getElementById('petBreed').value = pet.breed || '';
    document.getElementById('petHasVaccine').value = pet.hasVaccine ? 'si' : 'no';
    document.getElementById('petVaccineCount').value = pet.vaccineCount || '';
    document.getElementById('petNotes').value = pet.notes || '';
    selectedPetColor = pet.color || '#4F8EF7';
  } else {
    document.getElementById('petName').value = '';
    document.getElementById('petSpecies').value = '';
    document.getElementById('petBreed').value = '';
    document.getElementById('petHasVaccine').value = 'no';
    document.getElementById('petVaccineCount').value = '';
    document.getElementById('petNotes').value = '';
    selectedPetColor = '#4F8EF7';
  }

  onPetHasVaccineChange();
  renderPetColorPicker();
}

function onPetHasVaccineChange() {
  const hasVaccine = document.getElementById('petHasVaccine').value === 'si';
  const countInput = document.getElementById('petVaccineCount');
  countInput.disabled = !hasVaccine;
  if (!hasVaccine) countInput.value = '';
}

function closePetModal() {
  document.getElementById('petModal').style.display = 'none';
}

function renderPetColorPicker() {
  document.querySelectorAll('#petColorPicker .color-btn').forEach(btn => {
    const color = btn.dataset.color;
    btn.classList.toggle('active', color === selectedPetColor);
    btn.onclick = () => {
      selectedPetColor = color;
      document.querySelectorAll('#petColorPicker .color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });
}

function savePet() {
  const name = document.getElementById('petName').value.trim();
  const species = document.getElementById('petSpecies').value.trim();
  const breed = document.getElementById('petBreed').value.trim();
  const hasVaccine = document.getElementById('petHasVaccine').value === 'si';
  const vaccineCount = document.getElementById('petVaccineCount').value;
  const notes = document.getElementById('petNotes').value.trim();
  const editId = document.getElementById('petEditId').value;
  const errEl = document.getElementById('petFormError');

  if (!name || !species) {
    errEl.textContent = 'Nombre y tipo de mascota son requeridos.';
    errEl.style.display = 'block';
    return;
  }

  const pets = getPets();
  const petData = { name, species, breed, hasVaccine, vaccineCount: hasVaccine && vaccineCount ? parseInt(vaccineCount) : 0, notes, color: selectedPetColor };

  if (editId) {
    const idx = pets.findIndex(p => p.id === editId);
    if (idx !== -1) pets[idx] = { ...pets[idx], ...petData };
  } else {
    pets.push({ id: 'p_' + Date.now(), ...petData, createdAt: new Date().toISOString() });
  }

  savePets(pets);
  closePetModal();
  renderPets();
  showToast(editId ? 'Mascota actualizada ✓' : 'Mascota agregada ✓', 'success');
}

function deletePet(id) {
  if (!confirm('¿Eliminar esta mascota?')) return;
  const pets = getPets().filter(p => p.id !== id);
  savePets(pets);
  renderPets();
  showToast('Mascota eliminada', 'info');
}

function renderPets() {
  const pets = getPets();
  const grid = document.getElementById('petsGrid');
  const empty = document.getElementById('petsEmpty');

  if (pets.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = pets.map(p => `
    <div class="member-card">
      <div class="member-card-header">
        <div class="member-avatar" style="background:${p.color}">${p.name[0]}</div>
        <div class="member-meta">
          <h3>${p.name}</h3>
          <p>${p.species}${p.breed ? ' · ' + p.breed : ''}</p>
        </div>
      </div>
      <div class="member-card-body">
        <div class="member-info-row">💉 ${p.hasVaccine ? `Vacunada · ${p.vaccineCount || 0} vacuna${p.vaccineCount === 1 ? '' : 's'}` : 'Sin vacunas'}</div>
        ${p.notes ? `<div class="member-info-row">📝 ${p.notes}</div>` : ''}
      </div>
      <div class="member-card-actions">
        <button class="btn-edit-member" onclick="openPetModal('${p.id}')">✏️ Editar</button>
        <button class="btn-delete-member" onclick="deletePet('${p.id}')">🗑️ Eliminar</button>
      </div>
    </div>
  `).join('');
}

renderPets();
renderPetColorPicker();
