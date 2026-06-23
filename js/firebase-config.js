// Configuración de Firebase (reemplaza con tus datos)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROJECT.firebaseapp.com",
    projectId: "TU_PROJECT",
    storageBucket: "TU_PROJECT.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Servicios globales
const auth = firebase.auth();
const db = firebase.firestore();