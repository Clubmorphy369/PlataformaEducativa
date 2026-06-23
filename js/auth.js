// ============================================================
//  AUTENTICACIÓN
// ============================================================

// Variables globales de sesión
let currentUser = null;
let currentUserData = null;
let userRole = 'student'; // por defecto

// Funciones de UI para cambiar formularios
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('recoveryForm').style.display = 'none';
    clearAuthAlert();
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('recoveryForm').style.display = 'none';
    clearAuthAlert();
}

function showRecovery() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('recoveryForm').style.display = 'block';
    clearAuthAlert();
}

function clearAuthAlert() {
    const alert = document.getElementById('authAlert');
    if (alert) {
        alert.style.display = 'none';
        alert.textContent = '';
    }
}

function showAuthAlert(message, type = 'danger') {
    const alert = document.getElementById('authAlert');
    if (alert) {
        alert.style.display = 'block';
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
    }
}

// Iniciar sesión
async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) {
        showAuthAlert('Completa todos los campos.', 'danger');
        return;
    }
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        showAuthAlert(error.message, 'danger');
    }
}

// Registro (siempre como alumno)
async function register() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !password) {
        showAuthAlert('Completa los campos obligatorios.', 'danger');
        return;
    }
    if (password.length < 6) {
        showAuthAlert('La contraseña debe tener al menos 6 caracteres.', 'danger');
        return;
    }

    try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        // Crear perfil en Firestore
        await db.collection('usuarios').doc(cred.user.uid).set({
            name,
            email,
            role: 'student', // forzado
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showAuthAlert('Cuenta creada. Ya puedes iniciar sesión.', 'success');
        showLogin();
    } catch (error) {
        showAuthAlert(error.message, 'danger');
    }
}

// Recuperar contraseña
async function recoverPassword() {
    const email = document.getElementById('recoveryEmail').value.trim();
    if (!email) {
        showAuthAlert('Ingresa tu correo.', 'danger');
        return;
    }
    try {
        await auth.sendPasswordResetEmail(email);
        showAuthAlert('Correo de recuperación enviado.', 'success');
        showLogin();
    } catch (error) {
        showAuthAlert(error.message, 'danger');
    }
}

// Cerrar sesión
function logout() {
    auth.signOut();
}

// Observador de autenticación
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        // Cargar perfil desde Firestore
        const doc = await db.collection('usuarios').doc(user.uid).get();
        if (doc.exists) {
            currentUserData = doc.data();
            userRole = currentUserData.role || 'student';
        } else {
            // Si no existe, crear perfil por defecto como alumno
            currentUserData = { name: user.email, email: user.email, role: 'student' };
            userRole = 'student';
            await db.collection('usuarios').doc(user.uid).set(currentUserData);
        }
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        document.getElementById('userNameDisplay').textContent = currentUserData.name || user.email;
        document.getElementById('roleBadge').innerHTML = `<i class="fas fa-user-graduate"></i> ${userRole.toUpperCase()}`;
        // Cargar datos desde Firestore y renderizar
        await loadAllDataFromFirestore();
        renderAll();
    } else {
        currentUser = null;
        currentUserData = null;
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
        showLogin();
    }
});