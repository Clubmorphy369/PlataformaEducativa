// ============================================================
//  TAREAS Y ENTREGAS v2 (con ordenar tareas, bloques y vista previa)
// ============================================================

let taskBlocks = [];

// ----- Ordenar tareas (mover arriba/abajo) -----
function moveTaskUp(taskId) {
    const index = tasks.findIndex(t => t.id === taskId);
    if (index > 0) {
        [tasks[index], tasks[index - 1]] = [tasks[index - 1], tasks[index]];
        saveAllData();
        renderTaskList();
        addLog(currentRole, 'Movió tarea arriba', tasks[index].title);
    }
}

function moveTaskDown(taskId) {
    const index = tasks.findIndex(t => t.id === taskId);
    if (index < tasks.length - 1) {
        [tasks[index], tasks[index + 1]] = [tasks[index + 1], tasks[index]];
        saveAllData();
        renderTaskList();
        addLog(currentRole, 'Movió tarea abajo', tasks[index].title);
    }
}

// ----- Funciones del modal (vista previa) -----
function openTaskModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    document.getElementById('taskModalTitle').textContent = task.title;
    let bodyHtml = '';
    if (task.blocks && task.blocks.length > 0) {
        task.blocks.forEach(block => {
            if (block.type === 'text') {
                bodyHtml += `<div style="margin-bottom:1rem;">${block.content}</div>`;
            } else if (block.type === 'video') {
                let videoUrl = block.content;
                if (videoUrl.includes('youtube.com/watch?v=')) {
                    try {
                        const videoId = new URL(videoUrl).searchParams.get('v');
                        if (videoId) videoUrl = `https://www.youtube.com/embed/${videoId}`;
                    } catch(e) {}
                } else if (videoUrl.includes('youtu.be/')) {
                    const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
                    if (videoId) videoUrl = `https://www.youtube.com/embed/${videoId}`;
                }
                bodyHtml += `<div style="margin-bottom:1rem;"><iframe width="100%" height="315" src="${videoUrl}" frameborder="0" allowfullscreen></iframe></div>`;
            } else if (block.type === 'iframe') {
                bodyHtml += `<div style="margin-bottom:1rem;"><iframe width="100%" height="400" src="${block.content}" frameborder="0"></iframe></div>`;
            } else if (block.type === 'link') {
                bodyHtml += `<div style="margin-bottom:1rem;"><a href="${block.content}" target="_blank">${block.content}</a></div>`;
            } else if (block.type === 'separator') {
                bodyHtml += `<h3 style="text-align:center; margin:1.5rem 0; color:var(--primary-color); border-bottom:2px solid var(--border-color); padding-bottom:0.5rem;">${block.content}</h3>`;
            }
        });
    } else {
        bodyHtml = '<p>Sin contenido.</p>';
    }
    document.getElementById('taskModalBody').innerHTML = bodyHtml;
    document.getElementById('taskModal').style.display = 'flex';
}

function closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
}

function toggleFullscreenModal() {
    const modalContent = document.getElementById('taskModalContent');
    if (!document.fullscreenElement) {
        if (modalContent.requestFullscreen) modalContent.requestFullscreen();
        else if (modalContent.webkitRequestFullscreen) modalContent.webkitRequestFullscreen();
        else if (modalContent.msRequestFullscreen) modalContent.msRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDue').value = task.due;
    document.getElementById('taskClass').value = task.class;
    document.getElementById('taskStatus').value = task.status || 'publicado';
    document.getElementById('taskVisibility').value = task.visibility || 'publico';
    taskBlocks = JSON.parse(JSON.stringify(task.blocks || []));
    renderBlocks();
    tasks = tasks.filter(t => t.id !== taskId);
    document.getElementById('createTaskCard').scrollIntoView({ behavior: 'smooth' });
    showNotification('Editando tarea. No olvides guardar los cambios.');
}

// ===== Funciones de bloques =====
function addBlock(type) {
    const block = {
        id: Date.now().toString(),
        type: type,
        content: (type === 'separator') ? 'Nueva sección' : ''
    };
    taskBlocks.push(block);
    renderBlocks();
}

function removeBlock(blockId) {
    taskBlocks = taskBlocks.filter(b => b.id !== blockId);
    renderBlocks();
}

function moveBlock(blockId, direction) {
    const index = taskBlocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    if (direction === 'up' && index > 0) {
        [taskBlocks[index], taskBlocks[index - 1]] = [taskBlocks[index - 1], taskBlocks[index]];
    } else if (direction === 'down' && index < taskBlocks.length - 1) {
        [taskBlocks[index], taskBlocks[index + 1]] = [taskBlocks[index + 1], taskBlocks[index]];
    }
    renderBlocks();
}

function updateBlockContent(blockId, newContent) {
    const block = taskBlocks.find(b => b.id === blockId);
    if (block) block.content = newContent;
}

function renderBlocks() {
    const container = document.getElementById('blocksContainer');
    let html = '';
    taskBlocks.forEach((block) => {
        let editorHtml = '';
        if (block.type === 'text') {
            editorHtml = `<textarea oninput="updateBlockContent('${block.id}', this.value)" style="width:100%; min-height:100px; padding:8px; border:1px solid var(--border-color); border-radius:8px;">${block.content}</textarea>`;
        } else if (block.type === 'video' || block.type === 'iframe' || block.type === 'link') {
            editorHtml = `<input type="text" value="${block.content}" oninput="updateBlockContent('${block.id}', this.value)" placeholder="URL del ${block.type}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:8px;" />`;
        } else if (block.type === 'separator') {
            editorHtml = `<input type="text" value="${block.content}" oninput="updateBlockContent('${block.id}', this.value)" placeholder="Nombre de la sección" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:8px; font-weight:bold; text-align:center;" />`;
        }
        html += `
            <div class="block-item" style="background:var(--bg-body); padding:12px; border-radius:8px; margin-bottom:8px; border-left:4px solid var(--primary-color);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span><i class="fas ${block.type === 'text' ? 'fa-font' : block.type === 'video' ? 'fa-video' : block.type === 'iframe' ? 'fa-code' : block.type === 'link' ? 'fa-link' : 'fa-heading'}"></i> ${block.type.toUpperCase()}</span>
                    <div style="display:flex; gap:4px;">
                        <button type="button" class="btn btn-sm btn-outline" onclick="moveBlock('${block.id}', 'up')"><i class="fas fa-arrow-up"></i></button>
                        <button type="button" class="btn btn-sm btn-outline" onclick="moveBlock('${block.id}', 'down')"><i class="fas fa-arrow-down"></i></button>
                        <button type="button" class="btn btn-sm btn-danger" onclick="removeBlock('${block.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                ${editorHtml}
            </div>
        `;
    });
    if (taskBlocks.length === 0) {
        html = '<p class="text-muted">Agrega bloques de contenido usando los botones de abajo.</p>';
    }
    container.innerHTML = html;
}

// ===== Guardar tarea =====
document.getElementById('createTaskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value.trim();
    const due = document.getElementById('taskDue').value;
    const cls = document.getElementById('taskClass').value;
    const status = document.getElementById('taskStatus').value;
    const visibility = document.getElementById('taskVisibility').value;

    if (!title || !due) {
        alert('Título y fecha de entrega son obligatorios.');
        return;
    }

    const newTask = {
        id: Date.now().toString(),
        title,
        due,
        class: cls,
        status: status,
        visibility: visibility,
        blocks: JSON.parse(JSON.stringify(taskBlocks)),
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    saveAllData();
    renderAll();
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDue').value = '';
    taskBlocks = [];
    renderBlocks();
    addLog(currentRole, 'Creó tarea', `"${title}" (${cls})`);
    showNotification('Tarea creada exitosamente.');
});

// ===== Renderizar lista de tareas (con botones de ordenar para admin/maestro) =====
function renderTaskList() {
    const container = document.getElementById('taskListContainer');
    const count = document.getElementById('taskCount');

    let filteredTasks = tasks.filter(task => {
        if (currentRole === 'admin' || currentRole === 'teacher') {
            return true;
        } else {
            return task.status === 'publicado' && task.visibility === 'publico';
        }
    });

    if (filteredTasks.length === 0) {
        container.innerHTML = `<div class="empty-state">No hay tareas disponibles.</div>`;
        count.textContent = '0';
        return;
    }

    let html = '';
    filteredTasks.forEach((task, index) => {
        const dueDate = new Date(task.due).toLocaleDateString('es-ES');
        const statusBadge = task.status === 'publicado' ? '✅' : '📝';
        const visibilityBadge = task.visibility === 'publico' ? '🌐' : '🔒';

        html += `
            <div class="task-item">
                <div class="title">${statusBadge} ${visibilityBadge} ${task.title}</div>
                <div class="meta">
                    <span><i class="far fa-calendar-alt"></i> ${dueDate}</span>
                    <span><i class="fas fa-users"></i> ${task.class}</span>
                    <span><i class="fas fa-cubes"></i> ${task.blocks?.length || 0} bloques</span>
                </div>
                <div class="actions">
                    ${(currentRole === 'teacher' || currentRole === 'admin') ? `
                        <button class="btn btn-sm btn-outline" onclick="moveTaskUp('${task.id}')" ${index === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
                        <button class="btn btn-sm btn-outline" onclick="moveTaskDown('${task.id}')" ${index === filteredTasks.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
                        <button class="btn btn-sm btn-outline" onclick="editTask('${task.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTask('${task.id}')"><i class="fas fa-trash"></i></button>
                    ` : ''}
                    <button class="btn btn-sm btn-outline" onclick="openTaskModal('${task.id}')"><i class="fas fa-eye"></i> Ver</button>
                    ${currentRole === 'student' ? 
                        `<button class="btn btn-sm btn-outline" onclick="selectTaskForSubmit('${task.id}')"><i class="fas fa-arrow-right"></i> Entregar</button>` 
                        : ''}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    count.textContent = filteredTasks.length;
}

// ===== Funciones existentes (sin cambios) =====
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
