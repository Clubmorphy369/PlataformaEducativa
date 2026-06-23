// Configuración de Firebase (con datos reales)
const firebaseConfig = {
    apiKey: "AIzaSyCfBqdYlZY3ELO2ti0tiPrzau6JccAfRtM",
    authDomain: "plataformaeducativa-8d5ac.firebaseapp.com",
    projectId: "plataformaeducativa-8d5ac",
    storageBucket: "plataformaeducativa-8d5ac.firebasestorage.app",
    messagingSenderId: "358052040473",
    appId: "1:358052040473:web:b5a476c7d3bb10c9b7bf88"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Servicios globales
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
