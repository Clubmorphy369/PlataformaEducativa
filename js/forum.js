// ============================================================
//  FORO POR CLASE
// ============================================================

// Pinta la lista de comentarios de la clase seleccionada
function renderForumComments() {
    const classSelect = document.getElementById('forumClassSelect');
    const container = document.getElementById('commentListContainer');
    if (!classSelect || !container) return;

    const selectedClass = classSelect.value;
    const filtered = comments
        .filter(c => c.class === selectedClass)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state">No hay comentarios en esta clase. ¡Sé el primero!</div>`;
        return;
    }

    let html = '';
    filtered.forEach(c => {
        const date = new Date(c.createdAt).toLocaleString('es-ES');
        const canDelete = currentRole === 'admin';
        html += `
            <div class="comment-item" style="padding:10px; border-bottom:1px solid var(--border-color);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>${c.authorName}</strong>
                    <span style="font-size:12px; color:#94a3b8;">${date}</span>
                </div>
                <div style="margin-top:4px;">${escapeHtml(c.text)}</div>
                ${canDelete ? `<button class="btn btn-sm btn-danger" style="margin-top:6px;" onclick="deleteComment('${c.id}')"><i class="fas fa-trash"></i> Eliminar</button>` : ''}
            </div>
        `;
    });
    container.innerHTML = html;
}

// Evita que texto con < o > rompa el HTML (seguridad básica)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Cuando el usuario cambia de clase en el selector del foro
document.getElementById('forumClassSelect').addEventListener('change', renderForumComments);

// Publicar comentario nuevo
document.getElementById('commentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const textInput = document.getElementById('commentText');
    const text = textInput.value.trim();
    const selectedClass = document.getElementById('forumClassSelect').value;

    if (!text) {
        alert('Escribe un comentario antes de publicar.');
        return;
    }
    if (!selectedClass) {
        alert('Selecciona una clase primero.');
        return;
    }

    const newComment = {
        id: Date.now().toString(),
        class: selectedClass,
        authorId: currentUser.uid,
        authorName: currentUserData?.name || 'Usuario',
        text: text,
        createdAt: new Date().toISOString()
    };

    try {
        comments.push(newComment);
        await db.collection('comments').doc(newComment.id).set(newComment);
        renderForumComments();
        textInput.value = '';
        addLog(currentRole, 'Publicó comentario', `Clase: ${selectedClass}`);
        showNotification('Comentario publicado.');
    } catch (error) {
        alert('Error al publicar: ' + error.message);
    }
});

// Eliminar comentario (solo admin)
async function deleteComment(commentId) {
    if (currentRole !== 'admin') {
        alert('Solo un administrador puede eliminar comentarios.');
        return;
    }
    if (!confirm('¿Eliminar este comentario?')) return;
    try {
        await db.collection('comments').doc(commentId).delete();
        comments = comments.filter(c => c.id !== commentId);
        renderForumComments();
        addLog(currentRole, 'Eliminó comentario', `ID ${commentId}`);
        showNotification('Comentario eliminado.');
    } catch (error) {
        alert('Error al eliminar: ' + error.message);
    }
}
