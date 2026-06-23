// ============================================================
//  CALENDARIO
// ============================================================

function renderEventList() {
    const container = document.getElementById('eventListContainer');
    if (events.length === 0) {
        container.innerHTML = `<div class="empty-state">No hay eventos programados.</div>`;
        return;
    }
    const sorted = [...events].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    let html = '';
    sorted.forEach(ev => {
        const start = new Date(ev.startDate);
        const end = new Date(ev.endDate);
        const startStr = start.toLocaleString('es-ES');
        const endStr = end.toLocaleString('es-ES');
        const now = new Date();
        const diff = start.getTime() - now.getTime();
        const isSoon = diff > 0 && diff < 24 * 60 * 60 * 1000;
        html += `
            <div class="event-item">
                <div>
                    <span class="event-title">${ev.title}</span>
                    <span class="badge" style="margin-left:8px;">${ev.class}</span>
                    ${isSoon ? '<span class="event-reminder"><i class="fas fa-clock"></i> ¡Próximo!</span>' : ''}
                </div>
                <div class="event-meta">
                    <span><i class="far fa-calendar-alt"></i> Inicio: ${startStr}</span>
                    <span><i class="far fa-calendar-check"></i> Fin: ${endStr}</span>
                </div>
                ${(currentRole === 'teacher' || currentRole === 'admin') ? `
                    <div class="event-actions">
                        <button class="btn btn-sm btn-danger" onclick="deleteEvent('${ev.id}')"><i class="fas fa-trash"></i> Eliminar</button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    container.innerHTML = html;
}

document.getElementById('createEventForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (currentRole !== 'teacher' && currentRole !== 'admin') {
        alert('Solo maestros o administradores pueden programar eventos.');
        return;
    }
    const title = document.getElementById('eventTitle').value.trim();
    const cls = document.getElementById('eventClass').value;
    const start = document.getElementById('eventStart').value;
    const end = document.getElementById('eventEnd').value;
    if (!title || !start || !end) {
        alert('Todos los campos son obligatorios.');
        return;
    }
    if (new Date(start) >= new Date(end)) {
        alert('La fecha de fin debe ser posterior a la de inicio.');
        return;
    }
    const newEvent = {
        id: Date.now().toString(),
        title,
        class: cls,
        startDate: new Date(start).toISOString(),
        endDate: new Date(end).toISOString(),
        createdAt: new Date().toISOString()
    };
    events.push(newEvent);
    saveAllData();
    renderAll();
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventStart').value = '';
    document.getElementById('eventEnd').value = '';
    addLog(currentRole, 'Programó evento', `"${title}" (${cls})`);
    showNotification('Evento programado correctamente.');
});

function deleteEvent(eventId) {
    if (!confirm('¿Eliminar este evento?')) return;
    const ev = events.find(e => e.id === eventId);
    events = events.filter(e => e.id !== eventId);
    saveAllData();
    renderAll();
    addLog(currentRole, 'Eliminó evento', `"${ev?.title}"`);
    showNotification('Evento eliminado.');
}

function checkEventReminders() {
    const now = new Date();
    const soonEvents = events.filter(ev => {
        const start = new Date(ev.startDate);
        const diff = start.getTime() - now.getTime();
        return diff > 0 && diff < 24 * 60 * 60 * 1000;
    });
    if (soonEvents.length > 0 && currentRole !== 'admin') {
        const titles = soonEvents.map(e => e.title).join(', ');
        showNotification(`📅 Recordatorio: Eventos próximos: ${titles}`);
    }
}