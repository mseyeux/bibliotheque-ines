// ============================================
// CONFIGURATION FIREBASE
// ============================================
//
// INSTRUCTIONS POUR CONFIGURER FIREBASE :
//
// 1. Aller sur https://console.firebase.google.com
// 2. Créer un nouveau projet (nom: "bibliotheque-ines")
// 3. Dans le projet, cliquer sur "Web" (icône </>) pour ajouter une app
// 4. Copier les valeurs de firebaseConfig et les coller ci-dessous
// 5. Aller dans "Firestore Database" et créer une base de données
// 6. Choisir "Mode test" pour commencer (permet l'accès sans authentification)
//
// ============================================

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBP9ouWE6jeINLSDTfTCLT7O0dRoytXzDw",
  authDomain: "ines-books.firebaseapp.com",
  projectId: "ines-books",
  storageBucket: "ines-books.firebasestorage.app",
  messagingSenderId: "1009762869334",
  appId: "1:1009762869334:web:4f9a628c047aa9f1ae5bf7",
  measurementId: "G-ZSNPZCJ1BV"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);

// Référence à la base de données Firestore
const db = firebase.firestore();

// Collection pour stocker les livres
const booksCollection = db.collection('livres');

console.log('🔥 Firebase initialisé !');
