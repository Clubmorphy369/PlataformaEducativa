// ============================================================
//  PROGRESO Y PERSONALIZACIÓN
// ============================================================

function renderClassList() {
    const container = document.getElementById('classListContainer');
    const isTeacherOrAdmin = (currentRole === 'teacher' || currentRole === 'admin');
    let html = '';
    allClasses.forEach(cls => {
        const isCompleted = studentProgress.completadas.includes(cls);
        const isFavorite = studentProgress.favoritas.includes(cls);
        html += `
            <div class="class-item">
                <span class="class-name"><i class="fas fa-book"></i> ${cls}</span>
                <div class="class-actions">
                    <label>
                        <input type="checkbox" ${isCompleted ? 'checked' : ''} 
                            ${isTeacherOrAdmin ? 'disabled' : ''} 
                            onchange="toggleComplete('${cls}')" />
                        Completada
                    </label>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                            onclick="toggleFavorite('${cls}')" 
                            ${isTeacherOrAdmin ? 'disabled' : ''}
                            title="Marcar como favorita">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    if (isTeacherOrAdmin) {
        container.innerHTML += `<div style="margin-top:8px; font-size:13px; color:#64748b;"><i class="fas fa-info-circle"></i> Como ${currentRole}, visualizas el progreso del alumno, pero no puedes modificarlo.</div>`;
    }
}

function toggleComplete(className) {
    if (currentRole === 'teacher' || currentRole === 'admin') {
        showNotification('No puedes modificar el progreso desde este rol.');
        return;
    }
    const index = studentProgress.completadas.indexOf(className);
    if (index > -1) {
        studentProgress.completadas.splice(index, 1);
    } else {
        studentProgress.completadas.push(className);
    }
    saveProgress();
    renderClassList();
    updateProgressBar();
    renderRecommendations();
    addLog(currentRole, 'Cambió progreso', `Clase ${className} ${index > -1 ? 'desmarcada' : 'marcada'}`);
    showNotification(`Clase "${className}" ${index > -1 ? 'marcada como no completada' : 'marcada como completada'}.`);
}

function toggleFavorite(className) {
    if (currentRole === 'teacher' || currentRole === 'admin') {
        showNotification('No puedes modificar favoritos desde este rol.');
        return;
    }
    const index = studentProgress.favoritas.indexOf(className);
    if (index > -1) {
        studentProgress.favoritas.splice(index, 1);
    } else {
        studentProgress.favoritas.push(className);
    }
    saveProgress();
    renderClassList();
    renderRecommendations();
    addLog(currentRole, 'Cambió favorito', `Clase ${className}`);
    showNotification(`Clase "${className}" ${index > -1 ? 'eliminada de favoritos' : 'agregada a favoritos'}.`);
}

function updateProgressBar() {
    const total = allClasses.length;
    const completed = studentProgress.completadas.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('progressBar').style.width = percent + '%';
    document.getElementById('progressPercentage').textContent = percent + '%';
}

function renderRecommendations() {
    const container = document.getElementById('recommendationsContainer');
    const notCompleted = allClasses.filter(cls => !studentProgress.completadas.includes(cls));
    const recommendations = notCompleted.filter(cls => !studentProgress.favoritas.includes(cls));
    if (recommendations.length === 0) {
        container.innerHTML = `<div class="empty-state">¡Excelente! Has completado todas las clases. ✨</div>`;
        return;
    }
    let html = '';
    recommendations.forEach(cls => {
        html += `
            <div class="recommendation-item">
                <i class="fas fa-arrow-right"></i>
                <span>Te recomendamos la clase <strong>${cls}</strong> — aún no la has completado.</span>
            </div>
        `;
    });
    container.innerHTML = html;
}