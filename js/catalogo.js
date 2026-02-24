/* ================= ESPERAR DOM ================= */
document.addEventListener("DOMContentLoaded", () => {
  iniciar();
});

/* ================= FIREBASE ================= */
import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= VARIABLES ================= */
let productos = [];
let filtros = {};

/* ================= INIT ================= */
async function iniciar() {
  // 🔹 ahora el DOM ya existe
  const selectCategoria = document.getElementById("selectCategoria");
  const contAtributos = document.getElementById("contenedorAtributos");
  const resultados = document.getElementById("resultados");
  const mensaje = document.getElementById("mensaje");
  const btnBuscar = document.getElementById("btnBuscar");
  const btnLimpiar = document.getElementById("btnLimpiar");

  /* ================= CARGAR PRODUCTOS ================= */
  async function cargarProductos() {
    const q = query(
      collection(db, "productos"),
      where("estado", "==", "disponible")
    );
    const snap = await getDocs(q);
    productos = snap.docs.map(d => ({
  id: d.id,
  ...d.data()
}));

  }

  /* ================= CARGAR CATEGORIAS ================= */
async function cargarCategorias() {
  const snap = await getDocs(collection(db, "categorias"));

  selectCategoria.innerHTML = `<option value="">Selecciona categoría</option>`;

  snap.forEach(doc => {
    const categoriaId = doc.id;
    const data = doc.data();

    // 🔹 ¿Existe AL MENOS un producto disponible en esta categoría?
    const tieneProductos = productos.some(
      p => p.categoriaId === categoriaId
    );

    // ❌ Si no tiene productos, NO se muestra
    if (!tieneProductos) return;

    const opt = document.createElement("option");
    opt.value = categoriaId;
    opt.textContent = data.nombre;
    selectCategoria.appendChild(opt);
  });
}

/* ================= ATRIBUTOS POR CATEGORIA (INTELIGENTE) ================= */
selectCategoria.addEventListener("change", async () => {
  contAtributos.innerHTML = "";
  filtros = {};
  mensaje.style.display = "none";

  const categoriaId = selectCategoria.value;
  if (!categoriaId) return;

  // 👉 productos disponibles SOLO de esta categoría
  const productosCategoria = productos.filter(
    p => p.categoriaId === categoriaId
  );

  const attrsSnap = await getDocs(
    collection(db, "categorias", categoriaId, "atributos")
  );

  for (const attr of attrsSnap.docs) {
    const data = attr.data();
    const nombreAttr = data.nombre;

    // 👉 opciones reales disponibles según productos
    const opcionesDisponibles = new Set();

    productosCategoria.forEach(p => {
      if (p.atributos && p.atributos[nombreAttr]) {
        opcionesDisponibles.add(p.atributos[nombreAttr]);
      }
    });

    // ❌ si no hay ninguna opción real, no mostramos el select
    if (opcionesDisponibles.size === 0) continue;

    const select = document.createElement("select");
    select.innerHTML = `<option value="">${nombreAttr}</option>`;

    opcionesDisponibles.forEach(opcion => {
      select.innerHTML += `
        <option value="${opcion}">
          ${opcion}
        </option>
      `;
    });

    select.addEventListener("change", () => {
      filtros[nombreAttr] = select.value;
    });

    contAtributos.appendChild(select);
  }
});

  /* ================= BUSCAR ================= */
  btnBuscar.addEventListener("click", () => {
    resultados.innerHTML = "";

    let lista = productos.filter(
      p => p.categoriaId === selectCategoria.value
    );

    for (let key in filtros) {
      if (filtros[key]) {
        lista = lista.filter(p => p.atributos[key] === filtros[key]);
      }
    }

    if (!lista.length) {
      mensaje.textContent = "No se encontraron productos.";
      mensaje.style.display = "block";
      return;
    }

   lista.forEach(p => {
  resultados.innerHTML += `
    <div class="card">
      <div class="img-wrapper">
        <span class="producto-id">${p.id}</span>
        <img src="${p.imagenURL}">
      </div>
      <div class="card-body">
        <div>${Object.values(p.atributos).join(" · ")}</div>
        <div class="precio">$${p.precio}</div>
      </div>
    </div>
  `;
});

  });

  /* ================= LIMPIAR ================= */
  btnLimpiar.addEventListener("click", () => location.reload());

  /* ================= EJECUCIÓN ================= */
  await cargarProductos();
  await cargarCategorias();
}
