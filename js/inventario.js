/* ================= FIREBASE ================= */
import { db, storage } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  setDoc,
  writeBatch,
  deleteField
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/* ================= DOM ================= */
const modalCategorias = document.getElementById("modalCategorias");
const modalDetalleCategoria = document.getElementById("modalDetalleCategoria");
const modalOpcionesAtributo = document.getElementById("modalOpcionesAtributo");
const modalProducto = document.getElementById("modalProducto");

const listaCategorias = document.getElementById("listaCategorias");
const inputCategoria = document.getElementById("inputCategoria");

const tituloCategoria = document.getElementById("tituloCategoria");
const inputAtributo = document.getElementById("inputAtributo");
const listaAtributos = document.getElementById("listaAtributos");

const tituloAtributo = document.getElementById("tituloAtributo");
const inputOpcion = document.getElementById("inputOpcion");
const listaOpciones = document.getElementById("listaOpciones");

const productoId = document.getElementById("productoId");
const productoPrecio = document.getElementById("productoPrecio");
const productoCategoria = document.getElementById("productoCategoria");
const productoAtributos = document.getElementById("productoAtributos");
const productoImagen = document.getElementById("productoImagen");

const previewContainer = document.getElementById("previewContainer");
const previewImagen = document.getElementById("previewImagen");

const gridProductos = document.getElementById("gridProductos");
const totalProductos = document.getElementById("totalProductos");
const buscarId = document.getElementById("buscarId");
const filtroCategoria = document.getElementById("filtroCategoria");
const contenidoCategoria = document.getElementById("contenidoCategoria");
const modalConfirmarEliminar = document.getElementById("modalConfirmarEliminar");
const textoConfirmarEliminar = document.getElementById("textoConfirmarEliminar");

/* ================= ESTADO ================= */
let categoriaActualId = null;
let categoriaActualNombre = "";
let atributoActualId = null;
let atributoActualNombre = "";
let productoEditandoId = null;
let atributosSeleccionados = {};
let categoriasCache = [];
let productosCache = [];
/* ================= CACHE ================= */
async function cargarCategoriasCache() {
  const snap = await getDocs(collection(db, "categorias"));
  categoriasCache = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
}

/* ================= UTIL ================= */
const mostrar = el => abrirModal(el);
const ocultar = el => cerrarModal(el);

/* ================= CONECTIVIDAD ================= */
function hayInternet() {
  return navigator.onLine;
}

// feedback visual opcional
window.addEventListener("offline", () => {
  mostrarToast("Sin conexión a internet 📡", "error");
});

window.addEventListener("online", () => {
  mostrarToast("Conexión restablecida ✅");
});

/* ================= MODALES ================= */
window.abrirModalCategoria = async () => {
  mostrar(modalCategorias);
  cargarCategorias();
};

window.cerrarModalCategoria = () => ocultar(modalCategorias);
window.cerrarDetalleCategoria = () => ocultar(modalDetalleCategoria);
window.cerrarModalOpciones = () => ocultar(modalOpcionesAtributo);

window.abrirModalProducto = async () => {
  mostrar(modalProducto);
  await cargarCategoriasProducto();
};

/* ================= CATEGORÍAS ================= */
window.guardarCategoria = async () => {
  if (!hayInternet()) {
    mostrarToast("No hay conexión a internet 📡", "error");
    return;
  }

  const nombre = inputCategoria.value.trim().toUpperCase();

  if (!nombre) {
    mostrarToast("Escribe un nombre ✏️", "error");
    return;
  }

  const snap = await getDocs(collection(db, "categorias"));

  if (snap.docs.some(d => d.data().nombre === nombre)) {
    mostrarToast("Esta categoría ya existe ⚠️", "error");
    return;
  }

  await addDoc(collection(db, "categorias"), {
    nombre,
    creado: new Date()
  });

  await cargarCategoriasCache();

  mostrarToast("Categoría registrada correctamente ✨");

  inputCategoria.value = "";
  cargarCategorias();
  cargarFiltroCategorias();
};

async function cargarCategorias() {
  listaCategorias.innerHTML = "";

  categoriasCache
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .forEach(cat => {
      const div = document.createElement("div");
      div.className = "categoria-card";
      div.textContent = cat.nombre;
      div.onclick = () => abrirDetalleCategoria(cat.id, cat.nombre);
      listaCategorias.appendChild(div);
    });
}

function abrirDetalleCategoria(id, nombre) {
  categoriaActualId = id;
  categoriaActualNombre = nombre;
  tituloCategoria.textContent = nombre;

  // 🔥 RESET TOTAL DE UI
  resetDetalleCategoriaUI();

  ocultar(modalCategorias);
  mostrar(modalDetalleCategoria);
  cargarAtributos();
}

window.eliminarCategoriaActual = async () => {
  // 🔎 buscar productos que usen esta categoría
  const snap = await getDocs(
    query(
      collection(db, "productos"),
      where("categoriaId", "==", categoriaActualId)
    )
  );

  if (!snap.empty) {
    mostrarToast(
      "No puedes eliminar esta categoría porque tiene productos registrados ❌",
      "error"
    );
    return;
  }

  abrirConfirmarEliminarCategoria();
};
function resetDetalleCategoriaUI() {
  // mostrar contenido normal de la categoría
  contenidoCategoria.style.display = "block";
}

/* ================= ATRIBUTOS ================= */
window.guardarAtributo = async () => {
  const nombre = inputAtributo.value.trim().toUpperCase();

  if (!nombre) {
    mostrarToast("Escribe un atributo ✏️", "error");
    return;
  }

  const refA = collection(db, "categorias", categoriaActualId, "atributos");
  const snap = await getDocs(refA);

  // 🔒 evitar duplicados sin importar mayúsculas
  if (snap.docs.some(d => d.data().nombre === nombre)) {
    mostrarToast("Este atributo ya existe ⚠️", "error");
    return;
  }

  await addDoc(refA, {
    nombre,
    opciones: {} 
  });

  mostrarToast(`Atributo "${nombre}" agregado correctamente ✨`);

  inputAtributo.value = "";
  cargarAtributos();
};

async function cargarAtributos() {
  listaAtributos.innerHTML = "";
  const snap = await getDocs(
    collection(db, "categorias", categoriaActualId, "atributos")
  );

  snap.forEach(d => {
    const div = document.createElement("div");
    div.className = "atributo-card";
    div.textContent = d.data().nombre;
    div.onclick = () =>
      abrirModalOpciones(d.id, d.data().nombre, d.data().opciones || []);
    listaAtributos.appendChild(div);
  });
}

/* ================= OPCIONES ATRIBUTO ================= */
function abrirModalOpciones(id, nombre, opciones) {
  atributoActualId = id;
  atributoActualNombre = nombre;

  // título principal (atributo)
  tituloAtributo.textContent = nombre;

  // subtítulo tipo: "Faja · Color"
  document.getElementById("subtituloAtributo").textContent =
    `${categoriaActualNombre} · ${nombre}`;

  listaOpciones.innerHTML = "";
Object.keys(opciones || {}).forEach(op => pintarOpcion(op));

  mostrar(modalOpcionesAtributo);
}
window.guardarOpcion = async () => {
  const valorRaw = inputOpcion.value.trim();
  if (!valorRaw) {
    mostrarToast("Escribe una opción ✏️", "error");
    return;
  }

const opcion = valorRaw.trim().toUpperCase();

  const refA = doc(
    db,
    "categorias",
    categoriaActualId,
    "atributos",
    atributoActualId
  );

  const snap = await getDoc(refA);
  const atributo = snap.data();

  // 🔒 evitar duplicados
  if (atributo.opciones?.[opcion]) {
    mostrarToast(`La opción "${opcion}" ya existe ⚠️`, "error");
    return;
  }

  // ✅ guardar como OBJETO
  await updateDoc(refA, {
    [`opciones.${opcion}`]: true
  });

  mostrarToast(`Opción "${opcion}" agregada correctamente ✨`);

  inputOpcion.value = "";

  // 🔄 refrescar lista de opciones
  const snapNuevo = await getDoc(refA);
  abrirModalOpciones(
    atributoActualId,
    atributoActualNombre,
    snapNuevo.data().opciones || {}
  );
};

function pintarOpcion(valor) {
  const div = document.createElement("div");
  div.className = "opcion-item";

  div.innerHTML = `
    <span>${valor}</span>
    <button class="btn-eliminar">Eliminar</button>
  `;

  div.querySelector(".btn-eliminar").onclick = async () => {
    const prodSnap = await getDocs(
      query(
        collection(db, "productos"),
        where("categoriaId", "==", categoriaActualId)
      )
    );

    const usada = prodSnap.docs.some(p => {
      const data = p.data();
      return data.atributos?.[atributoActualNombre] === valor;
    });

    if (usada) {
      mostrarToast(
        `No puedes eliminar la opción "${valor}" porque ya está en uso ❌`,
        "error"
      );
      return;
    }

    const confirmar = confirm(
      `¿Seguro que deseas eliminar "${valor}"?`
    );
    if (!confirmar) return;

    const refA = doc(
      db,
      "categorias",
      categoriaActualId,
      "atributos",
      atributoActualId
    );

    await updateDoc(refA, {
      [`opciones.${valor}`]: deleteField()
    });

    mostrarToast(`"${valor}" eliminada 🗑️`);

    const snapNuevo = await getDoc(refA);
    abrirModalOpciones(
      atributoActualId,
      atributoActualNombre,
      snapNuevo.data().opciones || {}
    );
  };

  listaOpciones.appendChild(div);
}

/* ================= PRODUCTOS ================= */
productoImagen.addEventListener("change", () => {
  const file = productoImagen.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    previewImagen.src = e.target.result;
    previewContainer.style.display = "flex";
  };
  reader.readAsDataURL(file);
});

async function cargarCategoriasProducto() {
  productoCategoria.innerHTML =
    `<option value="">Selecciona una categoría</option>`;

  categoriasCache.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.nombre;
    productoCategoria.appendChild(option);
  });
}

/* ================= INVENTARIO ================= */
async function cargarInventario() {
  const q = query(collection(db, "productos"), where("estado", "==", "disponible"));
  const snap = await getDocs(q);

  productosCache = snap.docs.map(d => ({
    docId: d.id,
    ...d.data()
  })).sort((a, b) => a.docId.localeCompare(b.docId))

  pintarProductos(productosCache);
}
function pintarProductos(lista) {
  gridProductos.innerHTML = "";
  totalProductos.textContent = lista.length;

  lista.forEach(p => {
    // 🧩 convertir atributos en texto
    const atributosHTML = p.atributos
      ? Object.entries(p.atributos)
          .map(([k, v]) => `<span><b>${k}:</b> ${v}</span>`)
          .join("<br>")
      : "";

    const card = document.createElement("div");
    card.className = "producto-card";
    card.innerHTML = `
      <img src="${p.imagenURL}">
      <h4>ID: ${p.docId}</h4>

      <p style="font-size:14px;opacity:.8;">
        <b>Categoría:</b> ${p.categoriaNombre}
      </p>

      <div style="font-size:13px;margin:6px 0;">
        ${atributosHTML}
      </div>

      <p class="precio">$${p.precio}</p>

      <button class="btn-primary" onclick="editarProducto('${p.docId}')">
        Editar
      </button>
      <button class="btn-delete" onclick="eliminarProducto('${p.docId}')">
        Eliminar
      </button>
    `;
    gridProductos.appendChild(card);
  });
}

/* ================= FILTROS ================= */
buscarId.addEventListener("input", () => {
  const v = buscarId.value.trim();
  pintarProductos(v ? productosCache.filter(p => p.docId === v) : productosCache);
});

filtroCategoria.addEventListener("change", async () => {
  const categoria = filtroCategoria.value;

  // limpiar todo
  gridProductos.innerHTML = "";
  productosCache = [];
  totalProductos.textContent = "0";

  // si no hay categoría, no cargar nada
  if (!categoria) {
    return;
  }

  // consulta SOLO por categoría
  const q = query(
    collection(db, "productos"),
    where("estado", "==", "disponible"),
    where("categoriaNombre", "==", categoria)
  );

  const snap = await getDocs(q);

  productosCache = snap.docs.map(d => ({
    docId: d.id,
    ...d.data()
  }));

  pintarProductos(productosCache);
});

function cargarFiltroCategorias() {
  filtroCategoria.innerHTML =
    `<option value=""> Selecciona una categoría para ver los productos</option>`;

  categoriasCache
    .map(c => c.nombre)
    .sort((a, b) => a.localeCompare(b, "es"))
    .forEach(nombre => {
      const option = document.createElement("option");
      option.value = nombre;
      option.textContent = nombre;
      filtroCategoria.appendChild(option);
    });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  await cargarCategoriasCache();
  cargarFiltroCategorias();

  // no cargar productos al inicio
  gridProductos.innerHTML = "";
});
/* ================= TOAST ================= */
function mostrarToast(mensaje, tipo = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;

  toast.className = "toast"; // reset
  toast.classList.add("show", tipo);

  setTimeout(() => {
    toast.classList.remove("show", tipo);
  }, 2500);
}

window.abrirConfirmarEliminarCategoria = () => {
  textoConfirmarEliminar.textContent =
    `¿Eliminar "${categoriaActualNombre}"? Esta acción no se puede deshacer.`;

  mostrar(modalConfirmarEliminar);
};

window.confirmarEliminarCategoria = async () => {
  await eliminarCategoriaCompleta(categoriaActualId);

  mostrarToast("Categoría eliminada 🗑️");

  cerrarConfirmarEliminar();
  ocultar(modalDetalleCategoria);

  cargarCategorias();
  cargarFiltroCategorias();
};

function cerrarConfirmarEliminar() {
  ocultar(modalConfirmarEliminar);
}

async function eliminarCategoriaCompleta(categoriaId) {
  if (!hayInternet()) {
    mostrarToast("No hay conexión a internet 📡", "error");
    return;
  }

  const batch = writeBatch(db);

  const atributosSnap = await getDocs(
    collection(db, "categorias", categoriaId, "atributos")
  );

  atributosSnap.forEach(attr => batch.delete(attr.ref));
  batch.delete(doc(db, "categorias", categoriaId));

  await batch.commit();
  await cargarCategoriasCache();
}

const modalEliminarAtributo = document.getElementById("modalEliminarAtributo");
const textoEliminarAtributo = document.getElementById("textoEliminarAtributo");

window.eliminarAtributoActual = async () => {
  // 🔎 buscar productos de la categoría
  const prodSnap = await getDocs(
    query(
      collection(db, "productos"),
      where("categoriaId", "==", categoriaActualId)
    )
  );

  // 🔎 verificar si algún producto usa el atributo
  const usado = prodSnap.docs.some(p => {
    const data = p.data();
    return data.atributos && atributoActualNombre in data.atributos;
  });

  if (usado) {
    mostrarToast(
      `No puedes eliminar el atributo "${atributoActualNombre}" porque ya está en uso ❌`,
      "error"
    );
    return;
  }

  // si no está en uso → confirmar
  textoEliminarAtributo.textContent =
    `¿Eliminar el atributo "${atributoActualNombre}"?
     Se eliminarán todas sus opciones.`;

  mostrar(modalEliminarAtributo);
};

window.cerrarEliminarAtributo = () => {
  ocultar(modalEliminarAtributo);
};

window.confirmarEliminarAtributo = async () => {
  const refA = doc(
    db,
    "categorias",
    categoriaActualId,
    "atributos",
    atributoActualId
  );

  await deleteDoc(refA);

  mostrarToast("Atributo eliminado 🗑️");

  cerrarEliminarAtributo();
  cerrarModalOpciones();
  cargarAtributos();
};

function abrirModal(modal) {
  modal.style.display = "flex";
  document.body.classList.add("modal-open");
}

function cerrarModal(modal) {
  modal.style.display = "none";
  liberarScrollGlobal();
}

productoCategoria.addEventListener("change", async () => {
  const categoriaId = productoCategoria.value;
  if (!categoriaId) return;

  await cargarAtributosProducto(categoriaId);
});

window.guardarProducto = async () => {
  if (!hayInternet()) {
    mostrarToast("No hay conexión a internet 📡", "error");
    return;
  }

  const btnGuardar = modalProducto.querySelector(".btn-primary");
  btnGuardar.disabled = true;

  const id = productoId.value.trim();
  const precioNum = Number(productoPrecio.value);
  const categoriaId = productoCategoria.value;
  const imagenFile = productoImagen.files[0];
  const modoEdicion = modalProducto.dataset.mode === "editar";

  if (!Number.isFinite(precioNum) || precioNum < 1) {
    mostrarToast("Precio inválido 💲", "error");
    btnGuardar.disabled = false;
    return;
  }

  if (!id || !categoriaId) {
    mostrarToast("Completa todos los campos ⚠️", "error");
    btnGuardar.disabled = false;
    return;
  }

  if (!modoEdicion) {
    const qId = query(
      collection(db, "productos"),
      where("__name__", "==", id)
    );
    const snapId = await getDocs(qId);

    if (!snapId.empty) {
      mostrarToast("Ese ID ya existe ⚠️", "error");
      btnGuardar.disabled = false;
      return;
    }

    if (!imagenFile) {
      mostrarToast("Selecciona una imagen 📷", "error");
      btnGuardar.disabled = false;
      return;
    }
  }

  const selects = productoAtributos.querySelectorAll("select");
  for (const select of selects) {
    if (!select.value) {
      mostrarToast("Selecciona todos los atributos ⚠️", "error");
      btnGuardar.disabled = false;
      return;
    }
  }

  try {
    const categoria = categoriasCache.find(c => c.id === categoriaId);
    const categoriaNombre = categoria.nombre;

    let imagenURL = null;

    if (modoEdicion) {
      const productoActual = productosCache.find(
        p => p.docId === productoEditandoId
      );

      imagenURL = productoActual.imagenURL;

      if (imagenFile) {
        const imgRef = ref(storage, `productos/${id}`);
        await uploadBytes(imgRef, imagenFile);
        imagenURL = await getDownloadURL(imgRef);
      }

      await updateDoc(doc(db, "productos", productoEditandoId), {
        precio: precioNum,
        categoriaId,
        categoriaNombre,
        atributos: atributosSeleccionados,
        imagenURL,
        editado: new Date()
      });

      mostrarToast("Producto actualizado ✏️✨");

    } else {
      const imgRef = ref(storage, `productos/${id}`);
      await uploadBytes(imgRef, imagenFile);
      imagenURL = await getDownloadURL(imgRef);

      await setDoc(doc(db, "productos", id), {
        id,
        precio: precioNum,
        categoriaId,
        categoriaNombre,
        atributos: atributosSeleccionados,
        imagenURL,
        estado: "disponible",
        creado: new Date()
      });

      mostrarToast("Producto registrado ✨");
    }

    cerrarModalProducto();

if (filtroCategoria.value) {
  filtroCategoria.dispatchEvent(new Event("change"));
} else {
  // si no hay filtro, mantener vacío
  gridProductos.innerHTML = "";
  totalProductos.textContent = "0";
}


  } catch (e) {
    console.error(e);
    mostrarToast("Error al guardar producto ❌", "error");
  } finally {
    btnGuardar.disabled = false;
  }
};

window.cerrarModalProducto = () => {
  ocultar(modalProducto);

  modalProducto.dataset.mode = "crear";
  productoEditandoId = null;

  productoId.value = "";
  productoId.disabled = false; // 🔓 volver a habilitar

  productoPrecio.value = "";
  productoCategoria.value = "";
  productoAtributos.innerHTML = "";
  productoImagen.value = "";

  previewContainer.style.display = "none";
  previewImagen.src = "";

  liberarScrollGlobal();
};

function liberarScrollGlobal() {
  document.body.classList.remove("modal-open");
}
window.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    const modalesVisibles = document.querySelectorAll(".modal[style*='flex']");
    if (modalesVisibles.length === 0) {
      liberarScrollGlobal();
    }
  }
});
window.editarProducto = async (docId) => {
  const producto = productosCache.find(p => p.docId === docId);
  if (!producto) return;

  modalProducto.dataset.mode = "editar";
  productoEditandoId = docId;

  productoId.value = producto.docId; // 🔥 NO undefined
  productoId.disabled = true;        // 🔒 no editable

  productoPrecio.value = producto.precio;

  await cargarCategoriasProducto();
  productoCategoria.value = producto.categoriaId;

  await cargarAtributosProducto(
    producto.categoriaId,
    producto.atributos || {}
  );

  previewImagen.src = producto.imagenURL;
  previewContainer.style.display = "flex";

  mostrar(modalProducto);
};

async function cargarAtributosProducto(categoriaId, valores = {}) {
  productoAtributos.innerHTML = "";
  atributosSeleccionados = { ...valores };

  const snap = await getDocs(
    collection(db, "categorias", categoriaId, "atributos")
  );

  snap.forEach(d => {
    const atributo = d.data();

    const div = document.createElement("div");
    div.className = "menu-card";

    div.innerHTML = `
      <label style="font-weight:600;margin-bottom:6px;display:block;">
        ${atributo.nombre}
      </label>
      <select>
        <option value="">Selecciona ${atributo.nombre}</option>
       ${Object.keys(atributo.opciones || {})
  .map(op => `<option>${op}</option>`)
  .join("")}
      </select>
    `;

    const select = div.querySelector("select");

    // 👇 asignar valor si existe
    if (valores[atributo.nombre]) {
      select.value = valores[atributo.nombre];
    }

    select.onchange = e => {
      atributosSeleccionados[atributo.nombre] = e.target.value;
    };

    productoAtributos.appendChild(div);
  });
}
// ================= ELIMINAR PRODUCTO =================
window.eliminarProducto = async (docId) => {
  const producto = productosCache.find(p => p.docId === docId);
  if (!producto) return;

  const confirmar = confirm(
    "¿Seguro que deseas eliminar este producto?\nEsta acción no se puede deshacer."
  );
  if (!confirmar) return;

  try {
    const imgRef = ref(storage, `productos/${docId}`);
    await deleteObject(imgRef).catch(() => {});

    await deleteDoc(doc(db, "productos", docId));

   mostrarToast("Producto eliminado 🗑️");

if (filtroCategoria.value) {
  filtroCategoria.dispatchEvent(new Event("change"));
} else {
  // si no hay filtro, mantener vacío
  gridProductos.innerHTML = "";
  totalProductos.textContent = "0";
}

  } catch (error) {
    console.error(error);
    mostrarToast("Error al eliminar producto ❌", "error");
  }
};
/* ================= ERRORES GLOBALES ================= */
window.addEventListener("unhandledrejection", e => {
  console.error("Promesa rechazada:", e.reason);
  mostrarToast("Ocurrió un error inesperado ❌", "error");
});

window.addEventListener("error", e => {
  console.error("Error JS:", e.message);
  mostrarToast("Error del sistema ❌", "error");
});
