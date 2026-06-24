// ============================================================
//  INICIALIZACIÓN Y NOTIFICACIONES
// ============================================================

function showNotification(msg) {
    const banner = document.getElementById('notificationBanner');
    const message = document.getElementById('notificationMessage');
    if (!banner || !message) return;
    message.textContent = msg;
    banner.classList.remove('hidden');
    clearTimeout(window.notifTimeout);
    window.notifTimeout = setTimeout(() => {
        banner.classList.add('hidden');
    }, 4000);
}

function renderAll() {
    const vis = config.visibility || {};
    document.getElementById('createTaskCard').style.display = vis.tasks?.includes(currentRole) ? '' : 'none';
    document.getElementById('submissionPanel').style.display = vis.tasks?.includes(currentRole) ? '' : 'none';
    document.getElementById('gradePanel').style.display = vis.tasks?.includes(currentRole) ? '' : 'none';
    document.getElementById('forumCard').style.display = vis.forum?.includes(currentRole) ? '' : 'none';
    document.getElementById('progressCard').style.display = vis.progress?.includes(currentRole) ? '' : 'none';
    document.getElementById('calendarCard').style.display = vis.calendar?.includes(currentRole) ? '' : 'none';
    document.getElementById('adminPanelContainer').style.display = vis.adminPanel?.includes(currentRole) ? '' : 'none';

    if (typeof insertTeacherSelector === 'function') {
        insertTeacherSelector();
    }

    renderTaskList();
    renderTaskSelects();
    renderSubmissionsForGrading();
    renderClassList();
    updateProgressBar();
    renderRecommendations();
    renderGlobalAnnouncement();
    renderUserList();
    renderAssignments();
    renderVisibilitySettings();
    renderLogs();
    renderAnalytics();
    renderClassListAdmin();
    updateClassSelectors();
    applyAppearance();
}

function updateClassSelectors() {
    const classSelects = ['taskClass', 'eventClass', 'forumClassSelect'];
    classSelects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            const currentVal = select.value;
            select.innerHTML = allClasses.map(c => `<option value="${c}">${c}</option>`).join('');
            if (currentVal && allClasses.includes(currentVal)) select.value = currentVal;
        }
    });
}

console.log('App inicializada. Esperando autenticación...');
