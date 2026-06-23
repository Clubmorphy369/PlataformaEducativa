// ============================================================
//  FORO
// ============================================================

function renderComments() {
    const container = document.getElementById('commentListContainer');
    const selectedClass = document.getElementById('forumClassSelect').value;
    const classComments = comments.filter(c => c.class === selectedClass)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    if (classComments.length === 0) {
        container.innerHTML = `<div class="empty-state">No hay comentarios en esta clase. ¡Sé el primero!</div>`;
        return;
    }
    let html = '';
    classComments.forEach(c => {
        let text = c.text;
        if (c.mentions && c.mentions.length > 0) {
            c.mentions.forEach(m => {
                const regex = new RegExp(`@${m}`, 'g');
                text = text.replace(regex, `<span class="mention">@${m}</span>`);
            });
        }
        const isAdmin = currentRole === 'admin';
        html += `
            <div class="comment-item">
                <div>
                    <span class="comment-author"><i class="fas fa-user-circle"></i> ${c.author}</span>
                    <span class="comment-meta">${new Date(c.date).toLocaleString('es-ES')}</span>
                </div>
                <div class="comment-text">${text}</div>
                <div class="comment-actions">
                    ${isAdmin ? `<button class="btn btn-sm btn-danger" onclick="deleteComment('${c.id}')"><i class="fas fa-trash"></i> Eliminar</button>` : ''}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

document.getElementById('commentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const text = document.getElementById('commentText').value.trim();
    if (!text) {
        alert('Escribe un comentario.');
        return;
    }
    const selectedClass = document.getElementById('forumClassSelect').value;
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(match[1]);
    }
    const newComment = {
        id: Date.now().toString(),
        class: selectedClass,
        author: currentUserData?.name || (currentRole === 'student' ? 'Alumno' : (currentRole === 'teacher' ? 'Maestro' : 'Admin')),
        text: text,
        date: new Date().toISOString(),
        mentions: mentions
    };
    comments.push(newComment);
    saveAllData();
    renderComments();
    document.getElementById('commentText').value = '';
    addLog(currentRole, 'Comentó en foro', `Clase ${selectedClass}`);
    showNotification('Comentario publicado.');
});

function deleteComment(commentId) {
    if (currentRole !== 'admin') {
        alert('Solo los administradores pueden eliminar comentarios.');
        return;
    }
    if (!confirm('¿Eliminar este comentario?')) return;
    comments = comments.filter(c => c.id !== commentId);
    saveAllData();
    renderComments();
    addLog(currentRole, 'Eliminó comentario', `ID ${commentId}`);
    showNotification('Comentario eliminado.');
}

document.getElementById('forumClassSelect').addEventListener('change', renderComments);