// ============================================================
//  DATOS Y PERSISTENCIA (Firestore)
// ============================================================

let tasks = [];
let submissions = [];
let comments = [];
let events = [];
let users = [];
let logs = [];
let teacherAssignments = {};
let studentProgress = { completadas: [], favoritas: [] };
let config = {};

let allClasses = ['Matemáticas', 'Historia', 'Ciencias', 'Lengua']; // se actualizará desde config

// Cargar todo desde Firestore
async function loadAllDataFromFirestore() {
    // Configuración
    const configSnap = await db.collection('config').doc('app').get();
    config = configSnap.exists ? configSnap.data() : getDefaultConfig();

    if (config.classes && config.classes.length > 0) {
        allClasses = config.classes;
    } else {
        config.classes = ['Matemáticas', 'Historia', 'Ciencias', 'Lengua'];
        allClasses = [...config.classes];
        await db.collection('config').doc('app').set({ classes: allClasses }, { merge: true });
    }

    // Colecciones
    tasks = (await db.collection('tasks').get()).docs.map(d => ({ id: d.id, ...d.data() }));
    submissions = (await db.collection('submissions').get()).docs.map(d => ({ id: d.id, ...d.data() }));
    comments = (await db.collection('comments').get()).docs.map(d => ({ id: d.id, ...d.data() }));
    events = (await db.collection('events').get()).docs.map(d => ({ id: d.id, ...d.data() }));
    users = (await db.collection('usuarios').get()).docs.map(d => ({ id: d.id, ...d.data() }));
    logs = (await db.collection('logs').orderBy('timestamp', 'desc').limit(100).get()).docs.map(d => ({ id: d.id, ...d.data() }));

    // Asignaciones
    const assignSnap = await db.collection('assignments').doc('teacherAssignments').get();
    teacherAssignments = assignSnap.exists ? assignSnap.data().assignments || {} : {};

    // Progreso del alumno
    if (currentUser) {
        const userSnap = await db.collection('usuarios').doc(currentUser.uid).get();
        if (userSnap.exists && userSnap.data().progress) {
            studentProgress = userSnap.data().progress;
        } else {
            studentProgress = { completadas: [], favoritas: [] };
        }
    }

    applyAppearance();
}

function getDefaultConfig() {
    return {
        maxClassesPerTeacher: 10,
        maxStudentsPerTeacher: 30,
        visibility: {
            tasks: ['student', 'teacher', 'admin'],
            forum: ['student', 'teacher', 'admin'],
            progress: ['student', 'teacher', 'admin'],
            calendar: ['student', 'teacher', 'admin'],
            adminPanel: ['admin']
        },
        globalAnnouncement: '',
        theme: 'light',
        fontFamily: 'Inter',
        fontSize: 16,
        primaryColor: '#4f46e5',
        classes: ['Matemáticas', 'Historia', 'Ciencias', 'Lengua']
    };
}

// Guardar todos los datos (se llama después de cada cambio importante)
async function saveAllData() {
    const batch = db.batch();
    // Tareas
    const tasksRef = db.collection('tasks');
    const oldTasks = await tasksRef.get();
    oldTasks.docs.forEach(doc => batch.delete(doc.ref));
    tasks.forEach(t => batch.set(tasksRef.doc(t.id), t));
    // Entregas
    const subsRef = db.collection('submissions');
    const oldSubs = await subsRef.get();
    oldSubs.docs.forEach(doc => batch.delete(doc.ref));
    submissions.forEach(s => batch.set(subsRef.doc(s.id), s));
    // Comentarios
    const commRef = db.collection('comments');
    const oldComm = await commRef.get();
    oldComm.docs.forEach(doc => batch.delete(doc.ref));
    comments.forEach(c => batch.set(commRef.doc(c.id), c));
    // Eventos
    const eventsRef = db.collection('events');
    const oldEvents = await eventsRef.get();
    oldEvents.docs.forEach(doc => batch.delete(doc.ref));
    events.forEach(e => batch.set(eventsRef.doc(e.id), e));
    // Usuarios
    const usersRef = db.collection('usuarios');
    const oldUsers = await usersRef.get();
    oldUsers.docs.forEach(doc => batch.delete(doc.ref));
    users.forEach(u => batch.set(usersRef.doc(u.id), u));
    // Logs (solo añadir, no borrar)
    logs.forEach(log => {
        if (!log.id) log.id = Date.now().toString();
        batch.set(db.collection('logs').doc(log.id), log);
    });
    // Asignaciones
    batch.set(db.collection('assignments').doc('teacherAssignments'), { assignments: teacherAssignments });
    // Configuración (incluye classes)
    config.classes = allClasses;
    batch.set(db.collection('config').doc('app'), config);
    // Progreso del estudiante en su documento
    if (currentUser) {
        batch.set(db.collection('usuarios').doc(currentUser.uid), { progress: studentProgress }, { merge: true });
    }
    await batch.commit();
}

// Funciones auxiliares que usan otros módulos
function saveProgress() {
    if (currentUser) {
        db.collection('usuarios').doc(currentUser.uid).set({ progress: studentProgress }, { merge: true });
    }
}

function saveConfig() {
    config.classes = allClasses;
    db.collection('config').doc('app').set(config, { merge: true });
}

function addLog(userName, action, details = '') {
    const log = {
        id: Date.now().toString(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        user: userName,
        action: action,
        details: details
    };
    logs.push(log);
    db.collection('logs').doc(log.id).set(log);
}
