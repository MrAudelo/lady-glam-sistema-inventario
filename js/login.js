/* ================= FIREBASE ================= */
import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= LOGIN ================= */
window.login = async function () {
  const user = document.getElementById("user").value.trim();
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  // usuario fijo
  if (user !== "mirai.boutique") {
    message.style.color = "red";
    message.textContent = "Usuario incorrecto";
    return;
  }

  const email = "mirai.boutique@gmail.com";

  try {
    await signInWithEmailAndPassword(auth, email, password);

    message.style.color = "green";
    message.textContent = "Inicio de sesión exitoso ✔";

    setTimeout(() => {
      window.location.href = "../index.html";
    }, 1200);

  } catch (error) {
    message.style.color = "red";
    message.textContent = "Contraseña incorrecta";
  }
};
