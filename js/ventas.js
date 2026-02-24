/* =====================================================
   FIREBASE
===================================================== */
import { db } from "./firebase.js";
import {
  imprimirTicketVenta,
  imprimirTicketVentaInterno
} from "./ticketVentas.js";

import {
  collection,
  getDocs,
  doc,
  query,
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =====================================================
   DOM ELEMENTS
===================================================== */
const scanInput = document.getElementById("scanInput");
const listaVenta = document.getElementById("listaVenta");
const totalVenta = document.getElementById("totalVenta");
const estadoTexto = document.getElementById("estadoTexto");
const btnGuardarVenta = document.getElementById("btnGuardarVenta");
const selectEmpleado = document.getElementById("selectEmpleado");
const btnSalir = document.getElementById("btnSalir");
const totalPagadoEl = document.getElementById("totalPagado");
const restanteEl = document.getElementById("restante");
const cambioEl = document.getElementById("cambio");
const selectCantidadMetodos = document.getElementById("cantidadMetodos");

/* ---------- Producto manual ---------- */
const modalManual = document.getElementById("modalManual");
const manualNombre = document.getElementById("manualNombre");
const manualCategoria = document.getElementById("manualCategoria");
const contenedorAtributos = document.getElementById("manualAtributos");
const manualPrecio = document.getElementById("manualPrecio");
const btnAgregarManual = document.getElementById("agregarManual");
const btnCancelarManual = document.getElementById("cancelarManual");

/* =====================================================
   ESTADO GLOBAL
===================================================== */
let carrito = [];
let pagos = [];
let guardandoVenta = false;
let mapaCategorias = {};

/* =====================================================
   INIT
===================================================== */
resetearFormulario();
cargarEmpleados(); // 🔥 NUEVO
setTimeout(() => scanInput.focus(), 300);
/* =====================================================
   CARGAR EMPLEADOS DESDE FIRESTORE
===================================================== */
async function cargarEmpleados() {
  try {
    const select = selectEmpleado;

    // limpiar opciones (dejando el placeholder)
    select.innerHTML = `<option value="">Selecciona un empleado</option>`;

const q = query(collection(db, "empleados"));

    const snap = await getDocs(q);

    snap.forEach(docu => {
      const d = docu.data();
      if (!d.nombre) return;

      const option = document.createElement("option");
      option.value = d.nombre;      // lo que se guarda en la venta
      option.textContent = d.nombre; // lo que se muestra
      select.appendChild(option);
    });

  } catch (err) {
    console.error("Error cargando empleados:", err);
    mostrarToast("Error al cargar empleados");
  }
}

/* =====================================================
   RESET
===================================================== */
function resetearFormulario() {
  carrito = [];
  listaVenta.innerHTML = "";
  scanInput.value = "";
  totalVenta.textContent = "$0.00";
  estadoTexto.textContent = "Agrega productos y pagos";
  btnGuardarVenta.disabled = true;
  selectEmpleado.value = "";
  resetearPagos();

  // 🔒 BLOQUEAR MÉTODOS HASTA QUE HAYA PRODUCTOS
  selectCantidadMetodos.disabled = true;
  selectCantidadMetodos.value = "";
}

/* =====================================================
   ESCÁNER
===================================================== */
scanInput.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;

  const valor = scanInput.value.trim().toLowerCase();
  if (!valor) return;

  // 👉 Producto manual
  if (valor === "manual" || valor === "*" || valor === "nuevo") {
    abrirProductoManual();
    scanInput.value = "";
    return;
  }

  // 👉 Producto normal
  await agregarProductoPorID(valor);
  scanInput.value = "";
});

/* =====================================================
   BUSCAR PRODUCTO NORMAL
===================================================== */
async function agregarProductoPorID(id) {
  const q = query(
    collection(db, "productos"),
    where("id", "==", id),
    where("estado", "==", "disponible")
  );

  const snap = await getDocs(q);

if (snap.empty) {
  mostrarAlerta("Producto no encontrado o no disponible");
  scanInput.focus();
  return;
}

if (carrito.find(p => p.id === id)) {
  mostrarAlerta("Este producto ya está registrado en la venta");
  scanInput.focus();
  return;
}

if (carrito.find(p => p.id === id)) {
  mostrarToast("⚠️ Este producto ya está agregado a la venta");
  scanInput.focus();
  return;
}

  const docSnap = snap.docs[0];
  const d = docSnap.data();

carrito.push({
  tipo: "normal",
  docId: docSnap.id,
  id: d.id,
  nombre: d.nombre || `Producto ${d.id}`,
  categoria: d.categoriaNombre || "-",
  atributos: d.atributos || {},
  precio: d.precio,

  // 🔥 ESTO ES LO QUE FALTABA
 imagen: d.imagenURL || d.imagenUrl || d.imagen || "",

  cuponActivo: false,
  cuponMonto: null,
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

  carrito.forEach((p, index) => {
    const final = precioFinal(p);

    const row = document.createElement("div");
    row.className = "venta-row";

    const atributosTexto = Object.entries(p.atributos || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    row.innerHTML = `
      <span>${p.nombre}</span>
      <span>${p.categoria}</span>
      <span>${atributosTexto || "-"}</span>

      <span class="precio-box">
        ${
          final < p.precio
            ? `<span class="precio-original">$${p.precio.toFixed(2)}</span>
               <span class="precio-final">$${final.toFixed(2)}</span>`
            : `<span class="precio-final">$${p.precio.toFixed(2)}</span>`
        }
      </span>

      <span>
        <input type="checkbox" class="chk-cupon" data-index="${index}" ${p.cuponActivo ? "checked" : ""}>
        <input type="number" class="input-cupon" data-index="${index}" placeholder="$"
          ${p.cuponActivo ? "" : "disabled"} value="${p.cuponMonto ?? ""}">
      </span>

      <span>
        <input type="checkbox" class="chk-descuento" data-index="${index}" ${p.descuentoActivo ? "checked" : ""}>
        <input type="number" class="input-descuento" data-index="${index}" placeholder="%"
          ${p.descuentoActivo ? "" : "disabled"} value="${p.descuentoPorcentaje || ""}">
      </span>

      <span>
        <button class="btn-delete-producto" data-index="${index}">✕</button>
      </span>
    `;

    listaVenta.appendChild(row);
  });
  // 🔓 habilitar selector SOLO si hay productos
  selectCantidadMetodos.disabled = carrito.length === 0;
  actualizarTotal();
}

/* =====================================================
   EVENTOS PRODUCTOS
===================================================== */

// 👉 mientras escribe (NO renderiza)
listaVenta.addEventListener("input", (e) => {
  const index = Number(e.target.dataset.index);
  const p = carrito[index];
  if (!p) return;

  if (e.target.classList.contains("input-cupon") && p.cuponActivo) {
    p.cuponMonto = Number(e.target.value || 0);
    actualizarTotal();
  }

  if (e.target.classList.contains("input-descuento") && p.descuentoActivo) {
    let val = Number(e.target.value || 0);
    if (val < 0) val = 0;
    if (val > 100) val = 100;
    e.target.value = val;
    p.descuentoPorcentaje = val;
    actualizarTotal();
  }
});
// 👉 CONFIRMAR CUPÓN / DESCUENTO CON ENTER
listaVenta.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  if (
    e.target.classList.contains("input-cupon") ||
    e.target.classList.contains("input-descuento")
  ) {
    e.preventDefault();      // 🔒 evita comportamientos raros
    e.target.blur();         // 🔥 dispara el blur
    renderizarCarrito();     // 🔥 precio tachado inmediato
  }
});

// 👉 cuando TERMINA de escribir (blur)
listaVenta.addEventListener(
  "blur",
  (e) => {
    if (
      e.target.classList.contains("input-cupon") ||
      e.target.classList.contains("input-descuento")
    ) {
      renderizarCarrito(); // ✅ aquí SÍ
    }
  },
  true
);

/* =====================================================
   ELIMINAR PRODUCTO
===================================================== */
listaVenta.addEventListener("click", (e) => {
  if (!e.target.classList.contains("btn-delete-producto")) return;
  const index = Number(e.target.dataset.index);
  carrito.splice(index, 1);
  renderizarCarrito();
});

/* =====================================================
   CÁLCULOS
===================================================== */
function precioFinal(p) {
  let precio = p.precio;
  if (p.cuponActivo && p.cuponMonto) precio -= p.cuponMonto;
  if (p.descuentoActivo && p.descuentoPorcentaje)
    precio *= 1 - p.descuentoPorcentaje / 100;
  return Math.max(precio, 0);
}
function ventaCubiertaPorCupon() {
  const total = carrito.reduce((s, p) => s + precioFinal(p), 0);
  return total === 0 && carrito.length > 0;
}

function actualizarTotal() {
  const total = carrito.reduce((s, p) => s + precioFinal(p), 0);
  totalVenta.textContent = `$${total.toFixed(2)}`;

  actualizarEstadoPago();
}

/* =====================================================
   PAGOS (BÁSICO)
===================================================== */
function resetearPagos() {
  pagos = [];

  document.querySelectorAll(".chk-metodo").forEach(chk => {
    chk.checked = false;
  });

  document.querySelectorAll(".monto-metodo").forEach(input => {
    input.value = "";
    input.disabled = true;
  });

  totalPagadoEl.textContent = "$0.00";
  restanteEl.textContent = "$0.00";
  cambioEl.textContent = "$0.00";
}
// ===============================
// CONTROLAR CUÁNTOS MÉTODOS SE PUEDEN USAR
// ===============================
selectCantidadMetodos.addEventListener("change", () => {
  const max = Number(selectCantidadMetodos.value || 0);

  // reset pagos al cambiar
  document.querySelectorAll(".chk-metodo").forEach(chk => {
    chk.checked = false;
    chk.disabled = max === 0;
  });

  document.querySelectorAll(".monto-metodo").forEach(input => {
    input.value = "";
    input.disabled = true;
  });

  actualizarEstadoPago();
});
function productoParaVenta(p) {
  return {
    ...p,

    // 💰 PRECIOS IMPORTANTES
    precioOriginal: p.precio,
    precioFinal: precioFinal(p),

    // 🧾 DETALLE DEL DESCUENTO
    descuento: p.cuponActivo
      ? {
          tipo: "cupon",
          monto: p.cuponMonto
        }
      : p.descuentoActivo
      ? {
          tipo: "porcentaje",
          porcentaje: p.descuentoPorcentaje
        }
      : null
  };
}
function validarCantidadMetodos() {
  const requeridos = Number(selectCantidadMetodos.value || 0);

  const usados = pagos.filter(p => p.monto > 0).length;

  return usados === requeridos;
}
function normalizarPagos(pagos, totalFinal) {
  let restante = totalFinal;

  return pagos.map((p, i) => {
    if (i === pagos.length - 1) {
      // el último método absorbe cualquier ajuste
      return { ...p, monto: restante };
    } else {
      const monto = Math.min(p.monto, restante);
      restante -= monto;
      return { ...p, monto };
    }
  });
}

/* =====================================================
   GUARDAR VENTA
===================================================== */
window.guardarVenta = async () => {
  if (guardandoVenta) return;

  if (!selectEmpleado.value || carrito.length === 0) {
    mostrarToast("Completa la venta");
    return;
  }

 const total = carrito.reduce((s, p) => s + precioFinal(p), 0);
const esVentaConCupon = ventaCubiertaPorCupon();

if (!esVentaConCupon && !validarCantidadMetodos()) {
  mostrarToast(
    `Debes usar exactamente ${selectCantidadMetodos.value} método(s) de pago`
  );
  return;
}

  // 🔥 AJUSTE CLAVE: pagos deben sumar EXACTAMENTE totalFinal
let pagosFinales = [];

if (esVentaConCupon) {
  pagosFinales = [
    { metodo: "Cupón", monto: 0 }
  ];
} else {
  pagosFinales = normalizarPagos(pagos, total);
}

  guardandoVenta = true;
  btnGuardarVenta.disabled = true;
  btnGuardarVenta.textContent = "Guardando…";

  try {
    const batch = writeBatch(db);
    const ventaRef = doc(collection(db, "ventas"));

    batch.set(ventaRef, {
      empleado: selectEmpleado.value,
      productos: carrito.map(productoParaVenta),
      pagos: pagosFinales,     // ✅ CORRECTO
      totalFinal: total,       // ✅ CORRECTO
      fecha: new Date(),
      tipo: "venta"
    });

    for (const p of carrito) {
      if (p.tipo === "normal") {
        batch.delete(doc(db, "productos", p.docId));
      }
    }

    await batch.commit();

/* =========================
   IMPRIMIR TICKET
========================= */
const ventaParaTicket = {
  empleado: selectEmpleado.value,
  productos: carrito.map(productoParaVenta),
  pagos: pagosFinales,
  totalFinal: total,
  fecha: new Date()
};

imprimirTicketVenta(ventaParaTicket);
imprimirTicketVentaInterno(ventaParaTicket); 

mostrarToast("Venta registrada ✨", 1500);

setTimeout(() => {
  window.location.href = "index.html";
}, 1500);

} catch (error) {
  console.error(error);
  mostrarToast("Error al guardar la venta ❌");

  guardandoVenta = false;
  btnGuardarVenta.disabled = false;
  btnGuardarVenta.textContent = "Guardar venta";
}
};

/* =====================================================
   BOTÓN SALIR
===================================================== */
if (btnSalir) {
  btnSalir.addEventListener("click", () => {
    if (carrito.length && !confirm("¿Salir y perder la venta?")) return;
    window.location.href = "index.html";
  });
}

/* =====================================================
   TOAST
===================================================== */
function mostrarToast(mensaje, duracion = 2500) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.remove("hidden");
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, duracion);
}

/* =====================================================
   PRODUCTO MANUAL - ATRIBUTOS SEGÚN CATEGORÍA (REAL)
===================================================== */

async function cargarCategoriasManual() {
  manualCategoria.innerHTML = `<option value="">Selecciona una categoría</option>`;
  contenedorAtributos.innerHTML = "";
  mapaCategorias = {};

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
      if (attrData.nombre) atributos.push(attrData.nombre);
    });

    mapaCategorias[key] = atributos;

    const option = document.createElement("option");
    option.value = key;
    option.textContent = data.nombre;
    manualCategoria.appendChild(option);
  }

  console.log("mapaCategorias:", mapaCategorias);
}

/* =====================================================
   CUANDO CAMBIA LA CATEGORÍA → GENERAR ATRIBUTOS
===================================================== */
manualCategoria.addEventListener("change", async () => {
  contenedorAtributos.innerHTML = "";

  const categoriaKey = manualCategoria.value;
  if (!categoriaKey) return;

  const categoriasSnap = await getDocs(collection(db, "categorias"));
  let categoriaDocId = null;

  categoriasSnap.forEach(d => {
    if (d.data().nombre.toLowerCase() === categoriaKey) {
      categoriaDocId = d.id;
    }
  });

  if (!categoriaDocId) return;

  const atributosSnap = await getDocs(
    collection(db, "categorias", categoriaDocId, "atributos")
  );

  atributosSnap.forEach(attrDoc => {
    const attr = attrDoc.data();
    if (!attr.nombre) return;

    const label = document.createElement("label");
    label.textContent =
      attr.nombre.charAt(0).toUpperCase() + attr.nombre.slice(1);
    contenedorAtributos.appendChild(label);

    // ✅ OPCIONES COMO MAP
    if (attr.opciones && typeof attr.opciones === "object") {
      const select = document.createElement("select");
      select.dataset.attr = attr.nombre;

      const optDefault = document.createElement("option");
      optDefault.value = "";
      optDefault.textContent = `Selecciona ${attr.nombre}`;
      select.appendChild(optDefault);

      Object.keys(attr.opciones).forEach(opcion => {
        const option = document.createElement("option");
        option.value = opcion;
        option.textContent = opcion;
        select.appendChild(option);
      });

      contenedorAtributos.appendChild(select);
    }
    // ✅ SIN OPCIONES → INPUT
    else {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = `Ej. ${label.textContent}`;
      input.dataset.attr = attr.nombre;
      contenedorAtributos.appendChild(input);
    }
  });
});

/* =====================================================
   ABRIR / CERRAR MODAL MANUAL
===================================================== */
function abrirProductoManual() {
  modalManual.classList.remove("hidden");

  // 🔒 Nombre automático y bloqueado
  manualNombre.value = "Producto sin código";
  manualNombre.setAttribute("readonly", true);

  manualCategoria.value = "";
  manualPrecio.value = "";
  contenedorAtributos.innerHTML = "";

  cargarCategoriasManual();
}

function cerrarProductoManual() {
  modalManual.classList.add("hidden");
}

btnCancelarManual.addEventListener("click", cerrarProductoManual);

/* =====================================================
   AGREGAR PRODUCTO MANUAL AL CARRITO
===================================================== */
btnAgregarManual.addEventListener("click", () => {
  const nombre = manualNombre.value.trim();
  const categoria = manualCategoria.value;
  const precio = Number(manualPrecio.value);

  if (!nombre || !categoria || precio <= 0) {
    mostrarToast("Completa nombre, categoría y precio");
    return;
  }

 const atributos = {};

// inputs normales
contenedorAtributos.querySelectorAll("input").forEach(input => {
  if (input.value.trim()) {
    atributos[input.dataset.attr] = input.value.trim();
  }
});

// selects con opciones
contenedorAtributos.querySelectorAll("select").forEach(select => {
  if (select.value) {
    atributos[select.dataset.attr] = select.value;
  }
});

carrito.push({
  tipo: "manual",
  id: `manual-${Date.now()}`,
  nombre,
  categoria,
  atributos,
  precio,

  // 🔥 imagen fallback
  imagen: "",

  cuponActivo: false,
  cuponMonto: null,
  descuentoActivo: false,
  descuentoPorcentaje: 0
});

  cerrarProductoManual();
  renderizarCarrito();
  mostrarToast("Producto manual agregado ✨");
});

/* =====================================================
   ACTIVAR / DESACTIVAR CUPÓN Y DESCUENTO
===================================================== */
listaVenta.addEventListener("change", (e) => {
  const index = Number(e.target.dataset.index);
  const p = carrito[index];
  if (!p) return;

  // ✔ Checkbox cupón
  if (e.target.classList.contains("chk-cupon")) {
    p.cuponActivo = e.target.checked;

    if (!p.cuponActivo) {
      p.cuponMonto = null;
    }

    // desactiva descuento
    p.descuentoActivo = false;
    p.descuentoPorcentaje = 0;

    renderizarCarrito();
  }

  // ✔ Checkbox descuento
  if (e.target.classList.contains("chk-descuento")) {
    p.descuentoActivo = e.target.checked;

    if (!p.descuentoActivo) {
      p.descuentoPorcentaje = 0;
    }

    // desactiva cupón
    p.cuponActivo = false;
    p.cuponMonto = null;

    renderizarCarrito();
  }
});
function calcularRestanteSinMetodo(metodoActual) {
  const total = carrito.reduce((s, p) => s + precioFinal(p), 0);

  let usado = 0;

  pagos.forEach(p => {
    if (p.metodo !== metodoActual) {
      usado += p.monto;
    }
  });

  return Math.max(total - usado, 0);
}

function actualizarEstadoPago() {
  const total = carrito.reduce((s, p) => s + precioFinal(p), 0);

  // ===============================
  // 🔥 CASO ESPECIAL: VENTA 100% CUPÓN
  // ===============================
  if (ventaCubiertaPorCupon()) {
    pagos = []; // 🔒 no se usan pagos reales

    totalPagadoEl.textContent = "$0.00";
    restanteEl.textContent = "$0.00";
    cambioEl.textContent = "$0.00";

    estadoTexto.textContent = "Venta cubierta totalmente por cupón 🎟️";

    btnGuardarVenta.disabled = !selectEmpleado.value;
    return;
  }

  // ===============================
  // PAGOS NORMALES
  // ===============================
  pagos = [];
  let totalPagado = 0;
  let efectivo = 0;
  let noEfectivo = 0;

  document.querySelectorAll(".metodo-box").forEach(box => {
    const chk = box.querySelector(".chk-metodo");
    const input = box.querySelector(".monto-metodo");
    if (!chk || !input || !chk.checked) return;

    const monto = Number(input.value || 0);
    if (monto <= 0) return;

    const metodo = chk.dataset.metodo;

    pagos.push({ metodo, monto });
    totalPagado += monto;

    if (metodo === "Efectivo") {
      efectivo += monto;
    } else {
      noEfectivo += monto;
    }
  });

  let restante = total - totalPagado;
  let cambio = 0;

  // 🔥 el cambio SOLO sale del efectivo
  if (totalPagado >= total) {
    const faltanteDespuesNoEfectivo = Math.max(total - noEfectivo, 0);
    cambio = Math.max(efectivo - faltanteDespuesNoEfectivo, 0);
    restante = 0;
  }

  totalPagadoEl.textContent = `$${totalPagado.toFixed(2)}`;
  restanteEl.textContent = `$${restante.toFixed(2)}`;
  cambioEl.textContent = `$${cambio.toFixed(2)}`;

  if (restante > 0) {
    estadoTexto.textContent = "Falta completar el pago";
  } else if (!validarCantidadMetodos()) {
    estadoTexto.textContent = `Usa ${selectCantidadMetodos.value} método(s)`;
  } else {
    estadoTexto.textContent = "Pago completo ✅";
  }

  btnGuardarVenta.disabled =
    total <= 0 ||
    restante > 0 ||
    !selectEmpleado.value;
}

// ===============================
// PAGOS – MÁXIMO 2 MÉTODOS (HTML real)
// ===============================
document.addEventListener("change", (e) => {
  if (!e.target.classList.contains("chk-metodo")) return;

const max = Number(selectCantidadMetodos.value || 0);
  const activos = Array.from(document.querySelectorAll(".chk-metodo"))
    .filter(c => c.checked);

  if (activos.length > max) {
    e.target.checked = false;
    mostrarToast(`Solo puedes usar ${max} método(s) de pago`);
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

  actualizarEstadoPago();
});

document.addEventListener("input", (e) => {
  if (!e.target.classList.contains("monto-metodo")) return;

  const box = e.target.closest(".metodo-box");
  if (!box) return;

  const chk = box.querySelector(".chk-metodo");
  if (!chk) return;

  const metodo = chk.dataset.metodo;
  let monto = Number(e.target.value || 0);

  if (monto < 0) monto = 0;

  // 🔥 CALCULAR RESTANTE REAL
  const restanteDisponible = calcularRestanteSinMetodo(metodo);

  // ❌ métodos NO efectivo no pueden pasar del restante
  if (metodo !== "Efectivo" && monto > restanteDisponible) {
    monto = restanteDisponible;
    mostrarToast(`${metodo} solo puede cubrir $${restanteDisponible.toFixed(2)}`);
  }

  e.target.value = monto;
  actualizarEstadoPago();
});

selectEmpleado.addEventListener("change", actualizarEstadoPago);

function mostrarAlerta(mensaje) {
  alert(mensaje);
}
