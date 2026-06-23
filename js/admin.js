// ============================================================
//  ADMINISTRACIÓN (con gestión de materias y editUser corregido)
// ============================================================

// ---- USUARIOS ----
function renderUserList() {
    const container = document.getElementById('userListContainer');
    if (users.length === 0) {
        container.innerHTML = `<div class="empty-state">No hay usuarios.</div>`;
        return;
    }
    let html = '';
    users.forEach(u => {
        const roleName = { student: 'Alumno', teacher: 'Maestro', admin: 'Admin' } [u.role] || u.role;
        html += `
            <div class="user-item">
                <div class="user-info">
                    <strong>${u.name}</strong> (${u.email}) - <span class="badge">${roleName}</span>
                </div>
                <div class="user-actions">
                    <button class="btn btn-sm btn-outline" onclick="editUser('${u.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

document.getElementById('addUserForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const role = document.getElementById('newUserRole').value;
    if (!name || !email) {
        alert('Nombre y email son obligatorios.');
        return;
    }
    if (users.some(u => u.email === email)) {
        alert('El email ya está registrado.');
        return;
    }
    const newUser = { id: Date.now().toString(), name, email, role };
    users.push(newUser);
    saveAllData();
    renderUserList();
    document.getElementById('newUserName').value = '';
    document.getElementById('newUserEmail').value = '';
    addLog(currentRole, 'Agregó usuario', `${name} (${role})`);
    showNotification('Usuario agregado.');
});

async function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newName = prompt('Nuevo nombre:', user.name);
    if (newName !== null && newName.trim()) user.name = newName.trim();
    const newEmail = prompt('Nuevo email:', user.email);
    if (newEmail !== null && newEmail.trim()) user.email = newEmail.trim();
    const newRole = prompt('Nuevo rol (student, teacher, admin):', user.role);
    if (newRole !== null && ['student', 'teacher', 'admin'].includes(newRole)) {
        user.role = newRole;
        try {
            await db.collection('usuarios').doc(user.id).update({ role: newRole, name: user.name, email: user.email });
            showNotification('Usuario actualizado correctamente.');
        } catch (error) {
            alert('Error al actualizar: ' + error.message);
            return;
        }
    }
    saveAllData();
    renderUserList();
    addLog(currentRole, 'Editó usuario', `ID ${userId}`);
}

function deleteUser(userId) {
    if (!confirm('¿Eliminar este usuario?')) return;
    users = users.filter(u => u.id !== userId);
    saveAllData();
    renderUserList();
    addLog(currentRole, 'Eliminó usuario', `ID ${userId}`);
    showNotification('Usuario eliminado.');
}

// ---- LÍMITES ----
function saveLimits() {
    const maxClasses = parseInt(document.getElementById('maxClassesPerTeacher').value);
    const maxStudents = parseInt(document.getElementById('maxStudentsPerTeacher').value);
    if (isNaN(maxClasses) || isNaN(maxStudents) || maxClasses < 1 || maxStudents < 1) {
        alert('Valores inválidos.');
        return;
    }
    config.maxClassesPerTeacher = maxClasses;
    config.maxStudentsPerTeacher = maxStudents;
    saveConfig();
    addLog(currentRole, 'Guardó límites', `Clases: ${maxClasses}, Alumnos: ${maxStudents}`);
    showNotification('Límites guardados.');
}

// ---- ASIGNACIONES ----
function renderAssignments() {
    const teacherSelect = document.getElementById('teacherSelectForAssignment');
    const studentSelect = document.getElementById('studentSelectForAssignment');
    const teachers = users.filter(u => u.role === 'teacher');
    const students = users.filter(u => u.role === 'student');
    teacherSelect.innerHTML = teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    studentSelect.innerHTML = students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    const listDiv = document.getElementById('assignmentList');
    let html = '<h4>Asignaciones actuales</h4>';
    if (Object.keys(teacherAssignments).length === 0) {
        html += '<p style="color:#94a3b8;">No hay asignaciones.</p>';
    } else {
        html += '<ul>';
        for (const [teacherId, studentIds] of Object.entries(teacherAssignments)) {
            const teacher = users.find(u => u.id == teacherId);
            const teacherName = teacher ? teacher.name : 'Desconocido';
            const studentNames = studentIds.map(id => {
                const s = users.find(u => u.id == id);
                return s ? s.name : 'Desconocido';
            }).join(', ') || 'Ninguno';
            html += `<li><strong>${teacherName}</strong>: ${studentNames}</li>`;
        }
        html += '</ul>';
    }
    listDiv.innerHTML = html;
}

function assignStudentToTeacher() {
    const teacherId = document.getElementById('teacherSelectForAssignment').value;
    const studentId = document.getElementById('studentSelectForAssignment').value;
    if (!teacherId || !studentId) {
        alert('Selecciona ambos.');
        return;
    }
    if (!teacherAssignments[teacherId]) teacherAssignments[teacherId] = [];
    if (!teacherAssignments[teacherId].includes(studentId)) {
        teacherAssignments[teacherId].push(studentId);
        saveAllData();
        renderAssignments();
        addLog(currentRole, 'Asignó alumno a maestro', `Maestro ${teacherId}, Alumno ${studentId}`);
        showNotification('Asignación realizada.');
    } else {
        showNotification('Ya estaba asignado.');
    }
}

// ---- VISIBILIDAD ----
function renderVisibilitySettings() {
    const container = document.getElementById('visibilitySettings');
    const modules = ['tasks', 'forum', 'progress', 'calendar', 'adminPanel'];
    const roleLabels = { student: 'Alumno', teacher: 'Maestro', admin: 'Admin' };
    let html = '';
    modules.forEach(mod => {
        const current = config.visibility[mod] || ['student', 'teacher', 'admin'];
        html += `<div style="margin-bottom:12px;"><strong>${mod.charAt(0).toUpperCase() + mod.slice(1)}</strong><br>`;
        ['student', 'teacher', 'admin'].forEach(role => {
            const checked = current.includes(role) ? 'checked' : '';
            html += `
                <label style="margin-right:12px;">
                    <input type="checkbox" value="${role}" ${checked} data-module="${mod}" class="visibility-checkbox" />
                    ${roleLabels[role]}
                </label>
            `;
        });
        html += '</div>';
    });
    container.innerHTML = html;
}

function saveVisibility() {
    const checkboxes = document.querySelectorAll('.visibility-checkbox');
    const visibility = {};
    checkboxes.forEach(cb => {
        const mod = cb.dataset.module;
        if (!visibility[mod]) visibility[mod] = [];
        if (cb.checked) visibility[mod].push(cb.value);
    });
    config.visibility = visibility;
    saveConfig();
    renderAll();
    addLog(currentRole, 'Actualizó visibilidad', JSON.stringify(visibility));
    showNotification('Visibilidad guardada.');
}

// ---- ANUNCIOS ----
function saveAnnouncement() {
    const text = document.getElementById('announcementInput').value.trim();
    config.globalAnnouncement = text;
    saveConfig();
    renderGlobalAnnouncement();
    addLog(currentRole, 'Publicó anuncio', text);
    showNotification('Anuncio publicado.');
}

function renderGlobalAnnouncement() {
    const text = config.globalAnnouncement || '';
    const element = document.getElementById('globalAnnouncement');
    const textElement = document.getElementById('announcementText');
    if (text) {
        element.classList.remove('hidden');
        textElement.textContent = text;
    } else {
        element.classList.add('hidden');
    }
}

// ---- GESTIÓN DE MATERIAS ----
function renderClassListAdmin() {
    const container = document.getElementById('classListAdminContainer');
    if (allClasses.length === 0) {
        container.innerHTML = `<div class="empty-state">No hay materias creadas.</div>`;
        return;
    }
    let html = '';
    allClasses.forEach(cls => {
        html += `
            <div class="user-item">
                <div class="user-info"><strong>${cls}</strong></div>
                <div class="user-actions">
                    <button class="btn btn-sm btn-outline" onclick="editClassAdmin('${cls}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteClassAdmin('${cls}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

document.getElementById('addClassForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const newClass = document.getElementById('newClassName').value.trim();
    if (!newClass) {
        alert('Ingresa un nombre para la materia.');
        return;
    }
    if (allClasses.includes(newClass)) {
        alert('Esa materia ya existe.');
        return;
    }
    allClasses.push(newClass);
    config.classes = [...allClasses];
    saveConfig();
    renderClassListAdmin();
    updateClassSelectors();
    document.getElementById('newClassName').value = '';
    addLog(currentRole, 'Agregó materia', newClass);
    showNotification('Materia agregada correctamente.');
});

function editClassAdmin(oldName) {
    const newName = prompt('Nuevo nombre para la materia:', oldName);
    if (newName && newName.trim() !== '' && newName !== oldName) {
        if (allClasses.includes(newName)) {
            alert('Esa materia ya existe.');
            return;
        }
        const index = allClasses.indexOf(oldName);
        if (index > -1) {
            allClasses[index] = newName;
            if (studentProgress.completadas.includes(oldName)) {
                const idx = studentProgress.completadas.indexOf(oldName);
                studentProgress.completadas[idx] = newName;
                saveProgress();
            }
            if (studentProgress.favoritas.includes(oldName)) {
                const idx = studentProgress.favoritas.indexOf(oldName);
                studentProgress.favoritas[idx] = newName;
                saveProgress();
            }
            config.classes = [...allClasses];
            saveConfig();
            renderClassListAdmin();
            updateClassSelectors();
            addLog(currentRole, 'Editó materia', `${oldName} → ${newName}`);
            showNotification('Materia actualizada.');
        }
    }
}

function deleteClassAdmin(className) {
    if (!confirm(`¿Eliminar la materia "${className}"? Esto no eliminará las tareas o eventos existentes.`)) return;
    allClasses = allClasses.filter(c => c !== className);
    studentProgress.completadas = studentProgress.completadas.filter(c => c !== className);
    studentProgress.favoritas = studentProgress.favoritas.filter(c => c !== className);
    saveProgress();
    config.classes = [...allClasses];
    saveConfig();
    renderClassListAdmin();
    updateClassSelectors();
    addLog(currentRole, 'Eliminó materia', className);
    showNotification('Materia eliminada.');
}

// ---- LOGS ----
function renderLogs() {
    const container = document.getElementById('logListContainer');
    if (logs.length === 0) {
        container.innerHTML = `<div class="empty-state">No hay logs.</div>`;
        return;
    }
    let html = '';
    logs.slice().reverse().forEach(log => {
        html += `
            <div class="log-item">
                <div><strong>${log.user}</strong> - ${log.action}</div>
                <div class="log-meta">${new Date(log.timestamp?.toDate?.() || log.timestamp).toLocaleString()} ${log.details ? '| ' + log.details : ''}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ---- ANALÍTICAS ----
function renderAnalytics() {
    const grid = document.getElementById('analyticsGrid');
    const totalUsers = users.length;
    const totalTeachers = users.filter(u => u.role === 'teacher').length;
    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalTasks = tasks.length;
    const totalSubmissions = submissions.length;
    const totalComments = comments.length;
    const totalEvents = events.length;
    const totalLogs = logs.length;

    grid.innerHTML = `
        <div class="analytics-card"><div class="number">${totalUsers}</div><div class="label">Usuarios</div></div>
        <div class="analytics-card"><div class="number">${totalTeachers}</div><div class="label">Maestros</div></div>
        <div class="analytics-card"><div class="number">${totalStudents}</div><div class="label">Alumnos</div></div>
        <div class="analytics-card"><div class="number">${totalTasks}</div><div class="label">Tareas</div></div>
        <div class="analytics-card"><div class="number">${totalSubmissions}</div><div class="label">Entregas</div></div>
        <div class="analytics-card"><div class="number">${totalComments}</div><div class="label">Comentarios</div></div>
        <div class="analytics-card"><div class="number">${totalEvents}</div><div class="label">Eventos</div></div>
        <div class="analytics-card"><div class="number">${totalLogs}</div><div class="label">Acciones</div></div>
    `;
}

// ---- BACKUP ----
function exportData() {
    const data = {
        tasks,
        submissions,
        comments,
        events,
        users,
        logs,
        teacherAssignments,
        studentProgress,
        config
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog(currentRole, 'Exportó datos', 'JSON');
    showNotification('Exportación completada.');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            tasks = data.tasks || [];
            submissions = data.submissions || [];
            comments = data.comments || [];
            events = data.events || [];
            users = data.users || [];
            logs = data.logs || [];
            teacherAssignments = data.teacherAssignments || {};
            studentProgress = data.studentProgress || { completadas: [], favoritas: [] };
            config = data.config || config;
            if (config.classes) allClasses = config.classes;
            saveAllData();
            saveProgress();
            saveConfig();
            renderAll();
            addLog(currentRole, 'Importó datos', 'JSON');
            showNotification('Datos importados correctamente.');
        } catch (err) {
            alert('Error al importar: archivo inválido.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ---- APARIENCIA ----
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    config.theme = isDark ? 'dark' : 'light';
    saveConfig();
    const icon = document.getElementById('themeIcon');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    addLog(currentRole, 'Cambió tema', isDark ? 'oscuro' : 'claro');
}

function applyAppearance() {
    document.documentElement.style.setProperty('--primary-color', config.primaryColor || '#4f46e5');
    document.documentElement.style.setProperty('--font-family', config.fontFamily || 'Inter');
    document.documentElement.style.setProperty('--font-size-base', (config.fontSize || 16) + 'px');
    if (config.theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('themeIcon').className = 'fas fa-moon';
    }
    document.getElementById('fontFamilyInput').value = config.fontFamily || 'Inter';
    document.getElementById('fontSizeInput').value = config.fontSize || 16;
    document.getElementById('primaryColorInput').value = config.primaryColor || '#4f46e5';
    document.getElementById('primaryColorValue').textContent = config.primaryColor || '#4f46e5';
}

function saveAppearance() {
    const fontFamily = document.getElementById('fontFamilyInput').value.trim() || 'Inter';
    const fontSize = parseInt(document.getElementById('fontSizeInput').value) || 16;
    const primaryColor = document.getElementById('primaryColorInput').value;
    config.fontFamily = fontFamily;
    config.fontSize = fontSize;
    config.primaryColor = primaryColor;
    saveConfig();
    applyAppearance();
    addLog(currentRole, 'Cambió apariencia', `Fuente: ${fontFamily}, Tamaño: ${fontSize}, Color: ${primaryColor}`);
    showNotification('Apariencia actualizada.');
}

document.getElementById('primaryColorInput').addEventListener('input', function() {
    document.getElementById('primaryColorValue').textContent = this.value;
});

// ---- PESTAÑAS ADMIN ----
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const panelId = this.dataset.tab;
        document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('panel-' + panelId).classList.add('active');
        if (panelId === 'classes') renderClassListAdmin();
    });
});
