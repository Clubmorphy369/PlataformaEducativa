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

console.log('App inicializada. Esperando autenticación...');
