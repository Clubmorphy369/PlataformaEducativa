// ============================================================
//  TAREAS Y ENTREGAS
// ============================================================

function renderTaskList() {
    const container = document.getElementById('taskListContainer');
    const count = document.getElementById('taskCount');
    if (tasks.length === 0) {
        container.innerHTML = `<div class="empty-state">No hay tareas creadas aún.</div>`;
        count.textContent = '0';
        return;
    }
    let html = '';
    tasks.forEach(task => {
        const dueDate = new Date(task.due).toLocaleDateString('es-ES');
        html += `
            <div class="task-item">
                <div class="title">${task.title}</div>
                <div class="meta">
                    <span><i class="far fa-calendar-alt"></i> ${dueDate}</span>
                    <span><i class="fas fa-users"></i> ${task.class}</span>
                    <span><i class="fas fa-file-alt"></i> ${task.desc || 'Sin descripción'}</span>
                </div>
                <div class="actions">
                    ${(currentRole === 'teacher' || currentRole === 'admin') ? 
                        `<button class="btn btn-sm btn-outline" onclick="deleteTask('${task.id}')"><i class="fas fa-trash"></i> Eliminar</button>` 
                        : ''}
                    ${currentRole === 'student' ? 
                        `<button class="btn btn-sm btn-outline" onclick="selectTaskForSubmit('${task.id}')"><i class="fas fa-arrow-right"></i> Entregar</button>` 
                        : ''}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    count.textContent = tasks.length;
}

function renderTaskSelects() {
    const submitSelect = document.getElementById('submitTaskSelect');
    const gradeSelect = document.getElementById('gradeTaskSelect');

    const currentSubmitVal = submitSelect.value;
    submitSelect.innerHTML = `<option value="">-- Elige una tarea --</option>`;
    tasks.forEach(task => {
        const opt = document.createElement('option');
        opt.value = task.id;
        opt.textContent = `${task.title} (${task.class})`;
        submitSelect.appendChild(opt);
    });
    if (currentSubmitVal && tasks.some(t => t.id == currentSubmitVal)) {
        submitSelect.value = currentSubmitVal;
    }

    const currentGradeVal = gradeSelect.value;
    gradeSelect.innerHTML = `<option value="">-- Seleccionar --</option>`;
    tasks.forEach(task => {
        const opt = document.createElement('option');
        opt.value = task.id;
        opt.textContent = `${task.title} (${task.class})`;
        gradeSelect.appendChild(opt);
    });
    if (currentGradeVal && tasks.some(t => t.id == currentGradeVal)) {
        gradeSelect.value = currentGradeVal;
    }
}

function renderSubmissionsForGrading() {
    const container = document.getElementById('submissionsForGrading');
    const taskId = document.getElementById('gradeTaskSelect').value;
    if (!taskId) {
        container.innerHTML = `<div class="empty-state">Selecciona una tarea para ver las entregas.</div>`;
        return;
    }
    const taskSubs = submissions.filter(s => s.taskId === taskId);
    if (taskSubs.length === 0) {
        container.innerHTML = `<div class="empty-state">No hay entregas para esta tarea.</div>`;
        return;
    }
    let html = '';
    taskSubs.forEach(sub => {
        const gradeDisplay = sub.grade !== undefined && sub.grade !== null ?
            `<span class="grade">${sub.grade}/10</span>` :
            `<span class="grade" style="background:#f1f5f9;color:#64748b;">Sin calificar</span>`;
        html += `
            <div class="submission-item">
                <div class="student"><i class="fas fa-user"></i> ${sub.studentName || 'Alumno'}</div>
                <div style="font-size:13px; color:#64748b; margin:4px 0;">
                    ${sub.text ? `📝 ${sub.text}` : ''}
                    ${sub.fileName ? ` 📎 ${sub.fileName}` : ''}
                </div>
                <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:6px;">
                    ${gradeDisplay}
                    ${sub.feedback ? `<span style="font-size:13px; color:#475569;"><i class="fas fa-comment"></i> ${sub.feedback}</span>` : ''}
                </div>
                ${(currentRole === 'teacher' || currentRole === 'admin') ? `
                    <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                        <input type="number" id="gradeInput_${sub.id}" placeholder="Calificación (0-10)" min="0" max="10" step="0.5" style="width:100px; padding:6px 10px; border:1px solid var(--border-color); border-radius:8px; font-size:13px;" />
                        <input type="text" id="feedbackInput_${sub.id}" placeholder="Retroalimentación" style="flex:1; min-width:120px; padding:6px 10px; border:1px solid var(--border-color); border-radius:8px; font-size:13px;" />
                        <button class="btn btn-sm btn-primary" onclick="gradeSubmission('${sub.id}')"><i class="fas fa-check"></i> Calificar</button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    container.innerHTML = html;
}

// Crear tarea
document.getElementById('createTaskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value.trim();
    const desc = document.getElementById('taskDesc').value.trim();
    const due = document.getElementById('taskDue').value;
    const cls = document.getElementById('taskClass').value;
    if (!title || !due) {
        alert('Título y fecha de entrega son obligatorios.');
        return;
    }
    const newTask = {
        id: Date.now().toString(),
        title,
        desc,
        due,
        class: cls,
        createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    saveAllData();
    renderAll();
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskDue').value = '';
    addLog(currentRole, 'Creó tarea', `"${title}" (${cls})`);
    showNotification('Tarea creada exitosamente.');
});

function deleteTask(taskId) {
    if (!confirm('¿Eliminar esta tarea y todas sus entregas?')) return;
    const task = tasks.find(t => t.id === taskId);
    tasks = tasks.filter(t => t.id !== taskId);
    submissions = submissions.filter(s => s.taskId !== taskId);
    saveAllData();
    renderAll();
    addLog(currentRole, 'Eliminó tarea', `"${task?.title}"`);
    showNotification('Tarea eliminada.');
}

function selectTaskForSubmit(taskId) {
    if (currentRole !== 'student') {
        alert('Solo los alumnos pueden entregar tareas.');
        return;
    }
    document.getElementById('submitTaskSelect').value = taskId;
    document.getElementById('submitText').focus();
}

document.getElementById('submitForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (currentRole !== 'student') {
        alert('Solo los alumnos pueden entregar tareas.');
        return;
    }
    const taskId = document.getElementById('submitTaskSelect').value;
    if (!taskId) {
        alert('Selecciona una tarea.');
        return;
    }
    const text = document.getElementById('submitText').value.trim();
    const fileInput = document.getElementById('submitFile');
    let fileName = '';
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.size > 5 * 1024 * 1024) {
            alert('El archivo es demasiado grande (máx. 5MB).');
            return;
        }
        fileName = file.name;
    }
    if (!text && !fileName) {
        alert('Debes proporcionar al menos texto o un archivo.');
        return;
    }
    const newSub = {
        id: Date.now().toString(),
        taskId: taskId,
        studentName: currentUserData?.name || 'Alumno',
        text: text,
        fileName: fileName,
        fileUrl: fileName ? '#simulacion' : null,
        grade: null,
        feedback: '',
        submittedAt: new Date().toISOString()
    };
    submissions.push(newSub);
    saveAllData();
    renderAll();
    document.getElementById('submitText').value = '';
    document.getElementById('submitFile').value = '';
    addLog(currentRole, 'Entregó tarea', `Tarea ID ${taskId}`);
    showNotification('¡Tarea entregada correctamente!');
});

function gradeSubmission(subId) {
    if (currentRole !== 'teacher' && currentRole !== 'admin') {
        alert('Solo maestros o admin pueden calificar.');
        return;
    }
    const sub = submissions.find(s => s.id === subId);
    if (!sub) return;
    const gradeInput = document.getElementById(`gradeInput_${subId}`);
    const feedbackInput = document.getElementById(`feedbackInput_${subId}`);
    const grade = parseFloat(gradeInput.value);
    if (isNaN(grade) || grade < 0 || grade > 10) {
        alert('Ingresa una calificación válida entre 0 y 10.');
        return;
    }
    sub.grade = grade;
    sub.feedback = feedbackInput.value.trim() || '';
    saveAllData();
    renderAll();
    addLog(currentRole, 'Calificó entrega', `Tarea ID ${sub.taskId}, nota ${grade}`);
    showNotification(`Tarea calificada con ${grade}/10.`);
}