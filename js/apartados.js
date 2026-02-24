/* =====================================================
   FIREBASE
===================================================== */
import { db } from "./firebase.js";
import {
  imprimirTicketApartado,
  imprimirTicketApartadoInterno
} from "./ticketApartado.js";

import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  updateDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =====================================================
   DOM
===================================================== */
const scanInput = document.getElementById("scanInput");
const listaVenta = document.getElementById("listaVenta");

const totalVenta = document.getElementById("totalVenta");
const totalPagadoEl = document.getElementById("totalPagado");
const restanteEl = document.getElementById("restante");
const cambioEl = document.getElementById("cambio");
const estadoTexto = document.getElementById("estadoTexto");

const nombreCliente = document.getElementById("nombreCliente");
const telefonoCliente = document.getElementById("telefonoCliente");
const selectEmpleado = document.getElementById("selectEmpleado");

const anticipoInput = document.getElementById("anticipoAcordado");
const fechaLimiteInput = document.getElementById("fechaLimiteApartado");
const fechaApartadoEl = document.getElementById("fechaApartado");

const btnGuardar = document.getElementById("btnGuardarVenta");
const chkMetodos = document.querySelectorAll(".chk-metodo");
const montoMetodos = document.querySelectorAll(".monto-metodo");
const selectCantidadMetodos = document.getElementById("cantidadMetodos");
const modalManual = document.getElementById("modalManual");
const btnCancelarManual = document.getElementById("cancelarManual");
const btnAgregarManual = document.getElementById("agregarManual");
const manualCategoria = document.getElementById("manualCategoria");
const contAtributos = document.getElementById("manualAtributos");

// cache de categorias → atributos
let categoriasCache = {};

if (btnAgregarManual) {
  btnAgregarManual.addEventListener("click", () => {
    const nombre =
      document.getElementById("manualNombre").value.trim() ||
      "Producto sin código";

    const categoria = manualCategoria.value;
  const precio = toMoney(document.getElementById("manualPrecio").value);

    if (!categoria || precio <= 0) {
      mostrarToast("Completa categoría y precio");
      return;
    }
// 🔒 validar selects obligatorios
let atributosInvalidos = false;

contAtributos.querySelectorAll("select").forEach(select => {
  if (!select.value) {
    atributosInvalidos = true;
  }
});

if (atributosInvalidos) {
  mostrarToast("Selecciona todas las opciones del producto");
  return;
}

    // ✅ AQUÍ VA LO QUE PREGUNTABAS
    const atributos = {};

    // inputs normales
    contAtributos.querySelectorAll("input").forEach(input => {
      if (input.value.trim()) {
        atributos[input.dataset.attr] = input.value.trim();
      }
    });

    // selects con opciones
    contAtributos.querySelectorAll("select").forEach(select => {
      if (select.value) {
        atributos[select.dataset.attr] = select.value;
      }
    });

    // ✅ ahora sí guardar producto manual
carrito.push({
  docId: null,
  id: `MAN-${Date.now()}`,
  nombre,
  categoria,
  atributos,
  precio,

  imagen: null, // ✅ AQUÍ VA

  cuponActivo: false,
  cuponMonto: 0,
  descuentoActivo: false,
  descuentoPorcentaje: 0,
  manual: true,
manualCreadoPor: selectEmpleado.value || null,
manualCreadoEn: new Date()
});
    cerrarProductoManual();
    renderizarCarrito();
    mostrarToast("Producto manual agregado ✨");
  });
}

/* =====================================================
   ESTADO GLOBAL
===================================================== */
let carrito = [];
function toMoney(valor) {
  return Math.round(Number(valor || 0) * 100) / 100;
}

async function cargarCategoriasManual() {
  manualCategoria.innerHTML = `<option value="">Selecciona categoría</option>`;
  contAtributos.innerHTML = "";
  categoriasCache = {};

  const categoriasSnap = await getDocs(collection(db, "categorias"));

  for (const catDoc of categoriasSnap.docs) {
    const data = catDoc.data();
    if (!data.nombre) continue;

    const key = data.nombre.toLowerCase();

    // 🔥 leer SUBCOLECCIÓN atributos
    const atributosSnap = await getDocs(
      collection(db, "categorias", catDoc.id, "atributos")
    );

    const atributos = [];
    atributosSnap.forEach(attrDoc => {
      const attrData = attrDoc.data();
      if (attrData.nombre) {
        atributos.push({
          nombre: attrData.nombre,
          opciones: attrData.opciones || {}
        });
      }
    });

    categoriasCache[key] = atributos;

    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = data.nombre;
    manualCategoria.appendChild(opt);
  }

  console.log("categoriasCache:", categoriasCache);
}
manualCategoria.addEventListener("change", () => {
  contAtributos.innerHTML = "";

  const key = manualCategoria.value;
  if (!key || !categoriasCache[key]) return;

  categoriasCache[key].forEach(attr => {
    const label = document.createElement("label");
    label.textContent =
      attr.nombre.charAt(0).toUpperCase() + attr.nombre.slice(1);

    contAtributos.appendChild(label);

 if (attr.opciones && Object.keys(attr.opciones).length > 0) {
  const select = document.createElement("select");
  select.dataset.attr = attr.nombre;

  const def = document.createElement("option");
  def.value = "";
  def.textContent = `Selecciona ${attr.nombre}`;
  select.appendChild(def);

  Object.keys(attr.opciones).forEach(opcion => {
    const o = document.createElement("option");
    o.value = opcion;
    o.textContent = opcion;
    select.appendChild(o);
  });

  contAtributos.appendChild(select);
} else {
  const input = document.createElement("input");
  input.type = "text";
  input.dataset.attr = attr.nombre;
  input.placeholder = `Ej. ${attr.nombre}`;
  contAtributos.appendChild(input);
}
  });
});
async function cargarEmpleados() {
  try {
    selectEmpleado.innerHTML = `
      <option value="">Selecciona un empleado</option>
    `;

    const snap = await getDocs(collection(db, "empleados"));

    snap.forEach(docu => {
      const d = docu.data();
      if (!d.nombre) return;

      const option = document.createElement("option");
      option.value = d.nombre;
      option.textContent = d.nombre;
      selectEmpleado.appendChild(option);
    });

  } catch (err) {
    console.error("Error cargando empleados:", err);
    mostrarToast("Error al cargar empleados");
  }
}
/* =====================================================
   INIT
===================================================== */
ponerFechaHoy();
establecerFechaMinima();
cargarEmpleados(); // 🔥 AQUI
scanInput.focus();
actualizarResumen();

// 🔒 bloquear selección de métodos hasta que haya anticipo
selectCantidadMetodos.disabled = true;

/* =====================================================
   FECHA HOY
===================================================== */
function ponerFechaHoy() {
  if (!fechaApartadoEl) return;
  const hoy = new Date();
  const d = String(hoy.getDate()).padStart(2, "0");
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const y = hoy.getFullYear();
  fechaApartadoEl.textContent = `${d}/${m}/${y}`;
}

/* =====================================================
   FECHA LÍMITE MÍNIMA
===================================================== */
function establecerFechaMinima() {
  const hoy = new Date();
  hoy.setDate(hoy.getDate() + 1);
  fechaLimiteInput.min = hoy.toISOString().split("T")[0];
}

/* =====================================================
   ESCÁNER
===================================================== */
if (scanInput) {
  scanInput.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const valor = scanInput.value.trim().toLowerCase();
    if (!valor) return;

    if (
      valor === "manual" ||
      valor === "man" ||
      valor === "*" ||
      valor.includes("sin")
    ) {
      abrirProductoManual();
      scanInput.value = "";
      return;
    }

    await agregarProductoPorID(valor);
    scanInput.value = "";
  });
}


/* =====================================================
   BUSCAR PRODUCTO
===================================================== */
async function agregarProductoPorID(id) {
  const q = query(
    collection(db, "productos"),
    where("id", "==", id),
    where("estado", "==", "disponible")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    alert("Producto no encontrado o no disponible");
    return;
  }

  if (carrito.find(p => p.id === id)) {
    alert("Este producto ya está agregado");
    return;
  }

  const d = snap.docs[0];
  const data = d.data();

 carrito.push({
  docId: d.id,
  id: data.id,
  nombre: data.nombre || `Producto ${data.id}`,
  categoria: data.categoriaNombre || "-",
  atributos: data.atributos || {},
  precio: data.precio,

  // 🔥 IMAGEN DEL PRODUCTO
  imagen: data.imagenURL || data.imagenUrl || data.imagen || null,

  cuponActivo: false,
  cuponMonto: 0,
  descuentoActivo: false,
  descuentoPorcentaje: 0
});

  renderizarCarrito();
}

/* =====================================================
   RENDER CARRITO
===================================================== */
function renderizarCarrito() {
  listaVenta.innerHTML = "";

  carrito.forEach((p, i) => {
    const final = precioFinal(p);

    const row = document.createElement("div");
    row.className = "venta-row";

    const attrs = Object.entries(p.atributos)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    row.innerHTML = `
      <span>
  ${p.nombre}
  ${p.manual ? '<small style="color:#c49b63;font-weight:600"> (MANUAL)</small>' : ''}
</span>
      <span>${p.categoria}</span>
      <span>${attrs || "-"}</span>

      <div class="precio-box">
        ${
          final < p.precio
            ? `<span class="precio-original">$${p.precio.toFixed(2)}</span>
               <span class="precio-final">$${final.toFixed(2)}</span>`
            : `<span class="precio-final">$${p.precio.toFixed(2)}</span>`
        }
      </div>
<div class="descuento-box">
  <input
    type="checkbox"
    class="chk-cupon"
    data-i="${i}"
    ${p.cuponActivo ? "checked" : ""}
  >
  <input
    type="number"
    class="input-cupon"
    data-i="${i}"
    placeholder="$"
    ${p.cuponActivo ? "" : "disabled"}
    value="${p.cuponActivo ? p.cuponMonto : ""}"
  >
</div>

<div class="descuento-box">
  <input
    type="checkbox"
    class="chk-descuento"
    data-i="${i}"
    ${p.descuentoActivo ? "checked" : ""}
  >
  <input
    type="number"
    class="input-descuento"
    data-i="${i}"
    placeholder="%"
    ${p.descuentoActivo ? "" : "disabled"}
    value="${p.descuentoActivo ? p.descuentoPorcentaje : ""}"
  >
</div>

      <button class="btn-delete-producto" data-i="${i}">✕</button>
    `;

    listaVenta.appendChild(row);
  });
actualizarResumen();
}

/* =====================================================
   EVENTOS CARRITO
===================================================== */
listaVenta.addEventListener("click", (e) => {
  if (!e.target.classList.contains("btn-delete-producto")) return;

  if (!confirm("¿Quitar este producto del apartado?")) return;

  carrito.splice(e.target.dataset.i, 1);
  renderizarCarrito();
});

listaVenta.addEventListener("change", (e) => {
  const i = e.target.dataset.i;
  const p = carrito[i];
  const row = e.target.closest(".venta-row");
  if (!p || !row) return;

  const inputCupon = row.querySelector(".input-cupon");
  const inputDesc = row.querySelector(".input-descuento");
  const chkCupon = row.querySelector(".chk-cupon");
  const chkDesc = row.querySelector(".chk-descuento");

 // ===== CUPÓN =====
if (e.target.classList.contains("chk-cupon")) {
  p.cuponActivo = chkCupon.checked;

  if (p.cuponActivo) {
    inputCupon.disabled = false;
    inputCupon.focus();

    chkDesc.checked = false;
    inputDesc.disabled = true;
    inputDesc.value = "";
    p.descuentoActivo = false;
    p.descuentoPorcentaje = 0;
  } else {
    inputCupon.disabled = true;
    inputCupon.value = "";
    p.cuponMonto = 0;

    renderizarCarrito(); // 🔥 ESTO FALTABA
    return;
  }
}

// ===== DESCUENTO =====
if (e.target.classList.contains("chk-descuento")) {
  p.descuentoActivo = chkDesc.checked;

  if (p.descuentoActivo) {
    inputDesc.disabled = false;
    inputDesc.focus();

    chkCupon.checked = false;
    inputCupon.disabled = true;
    inputCupon.value = "";
    p.cuponActivo = false;
    p.cuponMonto = 0;
  } else {
    inputDesc.disabled = true;
    inputDesc.value = "";
    p.descuentoPorcentaje = 0;

    renderizarCarrito(); // 🔥 ESTO FALTABA
    return;
  }
}

  actualizarResumen();
});

listaVenta.addEventListener("input", (e) => {
  const i = e.target.dataset.i;
  const p = carrito[i];
  if (!p) return;

  // CUPÓN $
  if (e.target.classList.contains("input-cupon")) {
    let monto = Number(e.target.value || 0);

    // no negativos
    if (monto < 0) monto = 0;

    // no mayor al precio
    if (monto > p.precio) {
      monto = p.precio;
    }

    e.target.value = monto;
    p.cuponMonto = monto;
  }

  // DESCUENTO %
  if (e.target.classList.contains("input-descuento")) {
    let porc = Number(e.target.value || 0);

    if (porc < 0) porc = 0;
    if (porc > 100) porc = 100;

    e.target.value = porc;
    p.descuentoPorcentaje = porc;
  }

  actualizarResumen();
});

function contarMetodosSeleccionados() {
  return Array.from(document.querySelectorAll(".chk-metodo"))
    .filter(chk => chk.checked)
    .length;
}

/* =====================================================
   CÁLCULOS
===================================================== */
function precioFinal(p) {
  let precio = p.precio;
  if (p.cuponActivo) precio -= p.cuponMonto;
  if (p.descuentoActivo) precio *= (1 - p.descuentoPorcentaje / 100);
  return Math.max(precio, 0);
}
function obtenerTotal() {
  return carrito.reduce((s, p) => s + precioFinal(p), 0);
}
function actualizarResumen() {
  const total = carrito.reduce((s, p) => s + precioFinal(p), 0);
  const anticipo = Number(anticipoInput.value || 0);
  const totalPagado = calcularPagoMetodos();

  totalVenta.textContent = `$${total.toFixed(2)}`;

  // ==========================
  // 🔥 CALCULAR ANTICIPO + CAMBIO PRIMERO
  // ==========================
  const {
    anticipoAplicado,
    cambio
  } = calcularAnticipoAplicado();

  // ==========================
  // SALDO PENDIENTE REAL
  // ==========================
  let restante = total - anticipoAplicado;
  if (restante < 0) restante = 0;
  restanteEl.textContent = `$${restante.toFixed(2)}`;

  totalPagadoEl.textContent = `$${anticipoAplicado.toFixed(2)}`;
  cambioEl.textContent = `$${cambio.toFixed(2)}`;

  // ==========================
  // VALIDACIONES BÁSICAS
  // ==========================
  if (carrito.length === 0) {
    estadoTexto.textContent = "Agrega productos";
    btnGuardar.disabled = true;
    return;
  }

  if (anticipo <= 0) {
    estadoTexto.textContent = "Ingresa anticipo";
    btnGuardar.disabled = true;
    return;
  }

  if (totalPagado < anticipo) {
    estadoTexto.textContent = "El pago no cubre el anticipo";
    btnGuardar.disabled = true;
    return;
  }

  // ==========================
  // VALIDACIÓN MÉTODOS
  // ==========================
  const requeridos = Number(selectCantidadMetodos.value || 0);
  const usados = contarMetodosSeleccionados();

  if (requeridos > 0 && usados !== requeridos) {
    estadoTexto.textContent = `Usa exactamente ${requeridos} método(s) de pago`;
    btnGuardar.disabled = true;
    return;
  }

  // ==========================
  // TODO OK
  // ==========================
 if (!validarFormularioCompleto()) {
  estadoTexto.textContent = "Completa todos los campos para continuar";
  btnGuardar.disabled = true;
  return;
}

estadoTexto.textContent = "Listo para guardar apartado";
btnGuardar.disabled = false;
}

function calcularAnticipoAplicado() {
  const anticipo = Number(anticipoInput.value || 0);

  let efectivo = 0;
  let noEfectivo = 0;

  document.querySelectorAll(".metodo-box").forEach(box => {
    const chk = box.querySelector(".chk-metodo");
    const input = box.querySelector(".monto-metodo");
    const metodo = box.querySelector("span").textContent.trim();
    const monto = Number(input.value || 0);

    if (!chk.checked || monto <= 0) return;

    if (metodo === "Efectivo") {
      efectivo += monto;
    } else {
      noEfectivo += monto;
    }
  });

  const noEfectivoAplicado = Math.min(noEfectivo, anticipo);
  const faltante = anticipo - noEfectivoAplicado;
  const efectivoAplicado = Math.min(efectivo, faltante);
  const cambio = Math.max(efectivo - efectivoAplicado, 0);

  const metodosAplicados = [];

  if (noEfectivoAplicado > 0) {
    document.querySelectorAll(".metodo-box").forEach(box => {
      const chk = box.querySelector(".chk-metodo");
      const input = box.querySelector(".monto-metodo");
      const metodo = box.querySelector("span").textContent.trim();
      const monto = Number(input.value || 0);

      if (!chk.checked || metodo === "Efectivo") return;

      metodosAplicados.push({
        metodo,
        monto: Math.min(monto, noEfectivoAplicado)
      });
    });
  }

  if (efectivoAplicado > 0) {
    metodosAplicados.push({
      metodo: "Efectivo",
      monto: efectivoAplicado
    });
  }

  return {
    anticipoAplicado: noEfectivoAplicado + efectivoAplicado,
    cambio,
    metodosAplicados
  };
}
function validarCantidadMetodosAnticipo(metodosAplicados) {
  const requeridos = Number(selectCantidadMetodos.value || 0);

  if (requeridos <= 0) return false;

  return metodosAplicados.length === requeridos;
}

/* =====================================================
   GUARDAR APARTADO
===================================================== */
window.guardarApartado = async () => {
  if (btnGuardar.disabled) return;
  const requeridos = Number(selectCantidadMetodos.value || 0);
  const usados = contarMetodosSeleccionados();

  if (requeridos > 0 && usados !== requeridos) {
    alert(`Debes usar exactamente ${requeridos} método(s) de pago`);
    btnGuardar.disabled = false;
    btnGuardar.textContent = "Guardar apartado";
    listaVenta.style.pointerEvents = "auto";
    scanInput.disabled = false;
    return;
  }

btnGuardar.disabled = true;
btnGuardar.textContent = "Guardando…";
listaVenta.style.pointerEvents = "none";
scanInput.disabled = true;

  if (!nombreCliente.value || !selectEmpleado.value || carrito.length === 0) {
    mostrarToast("Completa cliente, empleado y productos");
    return;
  }

  if (!fechaLimiteInput.value) {
    mostrarToast("Selecciona fecha límite");
    return;
  }

  const total = obtenerTotal();
  const anticipo = Number(anticipoInput.value || 0);

  if (anticipo <= 0 || anticipo >= total) {
    mostrarToast("Anticipo inválido");
    return;
  }

  try {
    const batch = writeBatch(db);
// ===============================
// ARMAR ANTICIPO PROFESIONAL
// ===============================
const {
  anticipoAplicado,
  cambio,
  metodosAplicados
} = calcularAnticipoAplicado();

const pagos = [
  {
    tipo: "anticipo",
    monto: anticipoAplicado,        // 🔥 EXACTO
    totalPagado: anticipoAplicado,  // 🔥 EXACTO
    metodos: metodosAplicados,      // 🔥 SOLO LO APLICADO
    cambio,                         // 🔥 AUDITORÍA
    empleadoId: selectEmpleado.value,
    empleadoNombre: selectEmpleado.value,
    fecha: new Date(),
    saldoDespues: total - anticipoAplicado
  }
];

    const apartadoRef = doc(collection(db, "apartados"));
batch.set(apartadoRef, {
  cliente: nombreCliente.value,
  telefono: telefonoCliente.value,
  empleado: selectEmpleado.value,

  productos: carrito.map(p => ({
    id: p.id,
    docId: p.docId || null,
    nombre: p.nombre,
    precioOriginal: p.precio,
    precioFinal: precioFinal(p),
    descuento: {
      tipo: p.cuponActivo
        ? "cupon"
        : p.descuentoActivo
          ? "porcentaje"
          : null,
      monto: p.cuponActivo
        ? p.cuponMonto
        : p.descuentoActivo
          ? p.descuentoPorcentaje
          : 0
    },
    atributos: p.atributos || {},
    imagen: p.imagen ?? null,
    manual: p.manual || false
  })),

  total,
  anticipo,
  pagos,            // 👈 ahora YA es profesional
  estado: "activo",
  fecha: new Date(),
  fechaLimite: new Date(fechaLimiteInput.value)
});
    for (const p of carrito) {
      if (!p.docId) continue;
      batch.update(doc(db, "productos", p.docId), {
        estado: "apartado"
      });
    }

    await batch.commit();
listaVenta.style.pointerEvents = "none";
scanInput.disabled = true;

/* ===============================
   IMPRIMIR TICKET DE APARTADO
=============================== */
const ticketApartado = {
  cliente: nombreCliente.value,
  telefono: telefonoCliente.value,
  empleado: selectEmpleado.value,
  productos: carrito.map(p => ({
    nombre: p.nombre,
    atributos: p.atributos,
    precioFinal: precioFinal(p)
  })),
  total,
  anticipo,
  pagos,
  fecha: new Date(),
  fechaLimite: fechaLimiteInput.value
};

imprimirTicketApartado(ticketApartado);
imprimirTicketApartadoInterno(ticketApartado);

mostrarToast("✨ Apartado registrado correctamente");

setTimeout(() => {
  location.href = "index.html";
}, 2000);

  } catch (err) {
  console.error(err);
  mostrarToast("Error al guardar apartado");

  btnGuardar.disabled = false;
  btnGuardar.textContent = "Guardar apartado";
  listaVenta.style.pointerEvents = "auto";
  scanInput.disabled = false;
}
};
async function cancelarApartado(apartadoId, productos = []) {
  try {
    const batch = writeBatch(db);

    // 1️⃣ cambiar estado del apartado
    const apartadoRef = doc(db, "apartados", apartadoId);
    batch.update(apartadoRef, {
      estado: "cancelado",
      canceladoEn: new Date(),
      motivoCancelacion: "Vencido"
    });

    // 2️⃣ regresar productos a disponible
    for (const p of productos) {
      if (!p.docId) continue;

      const productoRef = doc(db, "productos", p.docId);
      batch.update(productoRef, {
        estado: "disponible"
      });
    }

    await batch.commit();

    mostrarToast("Apartado cancelado y productos liberados");

  } catch (err) {
    console.error(err);
    mostrarToast("Error al cancelar apartado");
  }
}

/* =====================================================
   EVENTOS
===================================================== */
if (anticipoInput) {
  anticipoInput.addEventListener("input", actualizarResumen);
}

if (selectEmpleado) {
  selectEmpleado.addEventListener("change", actualizarResumen);
}

// 👉 cuando TERMINA de escribir ($ o %) → redibujar fila
listaVenta.addEventListener(
  "blur",
  (e) => {
    if (
      e.target.classList.contains("input-cupon") ||
      e.target.classList.contains("input-descuento")
    ) {
      renderizarCarrito();
    }
  },
  true
);
// =====================================================
// CONFIRMAR CUPÓN / DESCUENTO CON ENTER
// =====================================================
listaVenta.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  const i = e.target.dataset.i;
  const p = carrito[i];
  if (!p) return;

  const row = e.target.closest(".venta-row");
  if (!row) return;

  const chkCupon = row.querySelector(".chk-cupon");
  const chkDesc = row.querySelector(".chk-descuento");
  const inputCupon = row.querySelector(".input-cupon");
  const inputDesc = row.querySelector(".input-descuento");

  // ⛔ evitar submits raros
  e.preventDefault();

  // ===== ENTER EN CUPÓN =====
  if (e.target.classList.contains("input-cupon")) {
    if (p.cuponMonto > 0) {
      p.cuponActivo = true;
      chkCupon.checked = true;

      // apagar descuento
      p.descuentoActivo = false;
      p.descuentoPorcentaje = 0;
      chkDesc.checked = false;
      inputDesc.value = "";
      inputDesc.disabled = true;
    }

    e.target.blur();
    renderizarCarrito();
  }

  // ===== ENTER EN DESCUENTO =====
  if (e.target.classList.contains("input-descuento")) {
    if (p.descuentoPorcentaje > 0) {
      p.descuentoActivo = true;
      chkDesc.checked = true;

      // apagar cupón
      p.cuponActivo = false;
      p.cuponMonto = 0;
      chkCupon.checked = false;
      inputCupon.value = "";
      inputCupon.disabled = true;
    }

    e.target.blur();
    renderizarCarrito();
  }
});

/* =====================================================
   MÉTODOS DE PAGO DEL ANTICIPO (REGLAS)
===================================================== */
function obtenerMetodosActivos() {
  return Array.from(document.querySelectorAll(".metodo-box"))
    .filter(box => box.querySelector(".chk-metodo").checked);
}

function bloquearMetodosSiYaCubre() {
  const anticipo = Number(anticipoInput.value || 0);
  const activos = obtenerMetodosActivos();

  if (activos.length === 0) return;

  const totalPagado = calcularPagoMetodos();

  // 👉 si ya cubre el anticipo, bloquear otros
  if (totalPagado >= anticipo) {
    document.querySelectorAll(".chk-metodo").forEach((chk) => {
      if (!chk.checked) {
        chk.disabled = true;
      }
    });
  } else {
    document.querySelectorAll(".chk-metodo").forEach((chk) => {
      chk.disabled = false;
    });
  }
}

function calcularPagoMetodos() {
  let totalPagos = 0;

  document.querySelectorAll(".metodo-box").forEach((box) => {
    const chk = box.querySelector(".chk-metodo");
    const input = box.querySelector(".monto-metodo");

    if (chk.checked) {
      totalPagos += Number(input.value || 0);
    }
  });

  return totalPagos;
}

function mostrarToast(mensaje) {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.classList.remove("hidden");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 300);
  }, 2500);
}
/* =====================================================
   MÉTODOS DE PAGO — SEGÚN CANTIDAD SELECCIONADA
===================================================== */
// ===== CONTROL ÚNICO DE MONTOS POR MÉTODO =====
montoMetodos.forEach(input => {
  input.addEventListener("input", (e) => {
    const box = e.target.closest(".metodo-box");
    const metodo = box.querySelector("span").textContent.trim();
    let monto = Number(e.target.value || 0);
    const anticipo = Number(anticipoInput.value || 0);

    if (monto < 0) monto = 0;

// ===============================
// 🔒 REGLA REAL DE MÉTODOS
// ===============================
let totalNoEfectivo = 0;

// calcular cuánto ya hay en métodos NO efectivo
document.querySelectorAll(".metodo-box").forEach(box => {
  const chk = box.querySelector(".chk-metodo");
  const input = box.querySelector(".monto-metodo");
  const m = box.querySelector("span").textContent.trim();

  if (!chk.checked || m === "Efectivo") return;

  totalNoEfectivo += Number(input.value || 0);
});

// si este input NO es efectivo, limitar contra el RESTANTE
if (metodo !== "Efectivo") {
  const restanteNoEfectivo = anticipo - (totalNoEfectivo - monto);

  if (monto > restanteNoEfectivo) {
    monto = Math.max(restanteNoEfectivo, 0);
    mostrarToast(
      `Tarjeta + Transferencia no pueden exceder $${anticipo}`
    );
  }
}

    e.target.value = monto;
    actualizarResumen();
  });
});

// cuando eligen cuántos métodos
if (selectCantidadMetodos) {
  selectCantidadMetodos.addEventListener("change", () => {
    const max = Number(selectCantidadMetodos.value || 0);
    chkMetodos.forEach(chk => {
      chk.checked = false;
      chk.disabled = max === 0;
    });
    montoMetodos.forEach(input => {
      input.value = "";
      input.disabled = true;
    });
    actualizarResumen();
  });
}

// activar / desactivar inputs
chkMetodos.forEach(chk => {
  chk.addEventListener("change", (e) => {
    const max = Number(selectCantidadMetodos.value || 0);
    const activos = Array.from(chkMetodos).filter(c => c.checked);

    if (activos.length > max) {
      e.target.checked = false;
      mostrarToast(`Solo puedes usar ${max} método(s)`);
      return;
    }

    const box = e.target.closest(".metodo-box");
    const input = box.querySelector(".monto-metodo");

    if (e.target.checked) {
      input.disabled = false;
      input.focus();
    } else {
      input.value = "";
      input.disabled = true;
    }

    actualizarResumen();
  });
});

anticipoInput.addEventListener("input", () => {
  const anticipo = Number(anticipoInput.value || 0);

  if (anticipo > 0) {
    // ✅ habilitar selección de métodos
    selectCantidadMetodos.disabled = false;
  } else {
    // 🔒 desactivar todo
    selectCantidadMetodos.value = "";
    selectCantidadMetodos.disabled = true;

    chkMetodos.forEach(chk => {
      chk.checked = false;
      chk.disabled = true;
    });

    montoMetodos.forEach(input => {
      input.value = "";
      input.disabled = true;
    });
  }

  actualizarResumen();
});
function abrirProductoManual() {
  modalManual.classList.remove("hidden");

  const inputNombre = document.getElementById("manualNombre");
  inputNombre.value = "Producto sin código";
  inputNombre.setAttribute("readonly", true); // 🔒 BLOQUEADO

  document.getElementById("manualPrecio").value = "";

  contAtributos.innerHTML = "";
  cargarCategoriasManual();
}
if (btnCancelarManual) {
  btnCancelarManual.addEventListener("click", (e) => {
    e.preventDefault();
    cerrarProductoManual();
  });
}

function cerrarProductoManual() {
  modalManual.classList.add("hidden");

  // limpiar campos
  document.getElementById("manualPrecio").value = "";
  manualCategoria.value = "";
  contAtributos.innerHTML = "";
}
// 🔒 EL ANTICIPO NO PUEDE SER MAYOR O IGUAL AL TOTAL
anticipoInput.addEventListener("input", () => {
  const total = carrito.reduce((s, p) => s + precioFinal(p), 0);
  let anticipo = Number(anticipoInput.value || 0);

  if (anticipo < 0) anticipo = 0;

  // ⛔ no permitir anticipo >= total
  if (total > 0 && anticipo >= total) {
    anticipo = total - 1; // deja $1 mínimo pendiente
    mostrarToast("El anticipo debe ser menor al total del apartado");
  }

  anticipoInput.value = anticipo;
  actualizarResumen();
});
function validarFormularioCompleto() {
  // campos básicos
  if (!nombreCliente.value.trim()) return false;
  if (!telefonoCliente.value.trim()) return false;
  if (!selectEmpleado.value) return false;
  if (!fechaLimiteInput.value) return false;

  // carrito
  if (carrito.length === 0) return false;

  // anticipo
  const total = obtenerTotal();
  const anticipo = Number(anticipoInput.value || 0);
  if (anticipo <= 0 || anticipo >= total) return false;

  // pagos
  const totalPagado = calcularPagoMetodos();
  if (totalPagado < anticipo) return false;

  // cantidad exacta de métodos
  const requeridos = Number(selectCantidadMetodos.value || 0);
  const usados = contarMetodosSeleccionados();
  if (requeridos > 0 && usados !== requeridos) return false;

  return true;
}

