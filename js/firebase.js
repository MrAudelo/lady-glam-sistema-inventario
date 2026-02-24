// js/firebase.js
import { initializeApp, getApps } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getFirestore } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getAuth } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { getStorage } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCupyPrMOHKg6LiJVGELcltd5Ax5FQ00WY",
  authDomain: "miraiboutique.firebaseapp.com",
  projectId: "miraiboutique",

  // 🔥 BUCKET CORRECTO
  storageBucket: "miraiboutique.firebasestorage.app"
};

// 🔁 Inicializar UNA sola vez
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("🔥 Firebase Mirai inicializado");
} else {
  app = getApps()[0];
  console.log("♻️ Firebase Mirai reutilizado");
}

// ✅ EXPORTS
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// 🧪 DEBUG
console.log("🪣 Bucket activo:", app.options.storageBucket);
