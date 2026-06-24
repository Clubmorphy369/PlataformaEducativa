// ============================================================
//  RENDERIZADO PRINCIPAL (sin reasignar currentRole)
// ============================================================

function renderAll() {
    const visibility = config.visibility || {};
    const canSeeTasks = (visibility.tasks || ['student', 'teacher', 'admin']).includes(currentRole);
    const canSeeForum = (visibility.forum || ['student', 'teacher', 'admin']).includes(currentRole);
    const canSeeProgress = (visibility.progress || ['student', 'teacher', 'admin']).includes(currentRole);
    const canSeeCalendar = (visibility.calendar || ['student', 'teacher', 'admin']).includes(currentRole);
    const canSeeAdmin = (visibility.adminPanel || ['admin']).includes(currentRole);

    document.getElementById('createTaskCard').style.display = (currentRole === 'teacher' || currentRole === 'admin') && canSeeTasks ? 'block' : 'none';
    document.getElementById('submissionPanel').style.display = (currentRole === 'student') && canSeeTasks ? 'block' : 'none';
    document.getElementById('gradePanel').style.display = (currentRole === 'teacher' || currentRole === 'admin') && canSeeTasks ? 'block' : 'none';
    document.getElementById('forumCard').style.display = canSeeForum ? 'block' : 'none';
    document.getElementById('progressCard').style.display = (currentRole === 'student' || currentRole === 'teacher') && canSeeProgress ? 'block' : 'none';
    document.getElementById('calendarCard').style.display = canSeeCalendar ? 'block' : 'none';
    document.getElementById('adminPanelContainer').style.display = canSeeAdmin ? 'block' : 'none';

    document.getElementById('createEventFormContainer').style.display = (currentRole === 'teacher' || currentRole === 'admin') && canSeeCalendar ? 'block' : 'none';

    updateClassSelectors();

    if (typeof insertTeacherSelector === 'function') {
        insertTeacherSelector();
    }

    renderTaskList();
    renderTaskSelects();
    renderSubmissionsForGrading();
    renderComments();
    renderClassList();
    renderRecommendations();
    updateProgressBar();
    updateBadge();
    renderUserList();
    renderLogs();
    renderAnalytics();
    renderAssignments();
    renderVisibilitySettings();
    renderGlobalAnnouncement();
    renderEventList();
    checkEventReminders();

    if (canSeeAdmin) renderClassListAdmin();
}

function updateBadge() {
    const roleNames = { student: 'Alumno', teacher: 'Maestro', admin: 'Admin' };
    const badge = document.getElementById('roleBadge');
    badge.innerHTML = `<i class="fas ${currentRole === 'student' ? 'fa-user-graduate' : currentRole === 'teacher' ? 'fa-chalkboard-teacher' : 'fa-user-shield'}"></i> ${roleNames[currentRole]}`;
}

function updateClassSelectors() {
    const selects = ['taskClass', 'forumClassSelect', 'eventClass'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            const currentVal = select.value;
            select.innerHTML = '';
            allClasses.forEach(cls => {
                const opt = document.createElement('option');
                opt.value = cls;
                opt.textContent = cls;
                select.appendChild(opt);
            });
            if (allClasses.includes(currentVal)) {
                select.value = currentVal;
            }
        }
    });
}
