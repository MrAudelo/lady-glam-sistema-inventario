import { db } from "./firebase.js";
import {
  imprimirTicketAbono,
  imprimirTicketAbonoInterno
} from "./ticketAbono.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =====================================================
   DOM
===================================================== */
const inputBuscar = document.getElementById("buscarCliente");
const listaResultados = document.getElementById("listaApartados");

const modalAbono = document.getElementById("modalAbono");
const abonoCliente = document.getElementById("abonoCliente");
const abonoTotal = document.getElementById("abonoTotal");
const abonoSaldo = document.getElementById("abonoSaldo");
const listaProductosApartado = document.getElementById("listaProductosApartado");

const inputMonto = document.getElementById("montoAbono");
const btnGuardar = document.getElementById("btnGuardarAbono");
const abonoTelefono = document.getElementById("abonoTelefono");
const abonoAnticipo = document.getElementById("abonoAnticipo");
const listaAbonos = document.getElementById("listaAbonos");
const chkMetodos = document.querySelectorAll(".chk-metodo");
const montoMetodos = document.querySelectorAll(".monto-metodo");
const feriaInput = document.getElementById("feriaAbono");
const estadoAbono = document.getElementById("estadoAbono");
const selectCantidadMetodos = document.getElementById("cantidadMetodos");
const selectEmpleado = document.getElementById("selectEmpleado");
const filtroEstado = document.getElementById("filtroEstado");

/* =====================================================
   ESTADO
===================================================== */
let apartadoActivo = null;
let estadoFiltro = "activo";
/* =====================================================
   CARGAR EMPLEADOS
===================================================== */
async function cargarEmpleados() {
  selectEmpleado.innerHTML =
    `<option value="">Cargando empleados...</option>`;

  try {
   const q = query(collection(db, "empleados"));
    const snap = await getDocs(q);

    selectEmpleado.innerHTML =
      `<option value="">Selecciona un empleado</option>`;

    if (snap.empty) {
      selectEmpleado.innerHTML =
        `<option value="">No hay empleados</option>`;
      return;
    }

    snap.forEach(docu => {
      const e = docu.data();

      const option = document.createElement("option");
  option.value = docu.id;
option.textContent = e.nombre;
option.dataset.nombre = e.nombre; // 👈🔥

      selectEmpleado.appendChild(option);
    });

  } catch (error) {
    console.error("Error al cargar empleados:", error);
    selectEmpleado.innerHTML =
      `<option value="">Error al cargar empleados</option>`;
  }
}

/* =====================================================
   BUSCAR APARTADOS (🔥 FIX REAL)
   
===================================================== */
async function cargarApartados(filtro = "") {
  listaResultados.innerHTML = "";

let q;

if (estadoFiltro === "todos") {
  q = query(collection(db, "apartados"));
} else {
  q = query(
    collection(db, "apartados"),
    where("estado", "==", estadoFiltro)
  );
}
  const snap = await getDocs(q);

  if (snap.empty) {
    listaResultados.innerHTML = "<p>No hay apartados activos</p>";
    return;
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  snap.forEach(docu => {
    const d = docu.data();

const cliente = d.cliente.toLowerCase().trim();
const busqueda = filtro.toLowerCase().trim();

// si no hay búsqueda, mostrar todo
if (!busqueda) {
  // no filtrar
} else {
  const palabrasCliente = cliente.split(" ");
  const palabrasBusqueda = busqueda.split(" ").filter(Boolean);

  // ❌ si escriben más palabras de las que tiene el nombre
  if (palabrasBusqueda.length > palabrasCliente.length) return;

  // 🔥 comparar palabra por palabra DESDE EL INICIO
  const coincide = palabrasBusqueda.every(
    (pb, i) => palabrasCliente[i].startsWith(pb)
  );

  if (!coincide) return;
}
    const total = d.total || 0;
    const pagado = (d.pagos || []).reduce((s, p) => s + p.monto, 0);
    const saldo = total - pagado;

  const fechaApartado = d.fecha?.toDate
  ? d.fecha.toDate()
  : new Date(d.fecha);

const fechaLimite = d.fechaLimite?.toDate
  ? d.fechaLimite.toDate()
  : new Date(d.fechaLimite);

// 🔥 GUARDAR ESTADO VENCIDO EN FIRESTORE (SOLO UNA VEZ)
if (fechaLimite < hoy && d.estado === "activo") {
  updateDoc(doc(db, "apartados", docu.id), {
    estado: "vencido"
  });

  // actualizar también en memoria para este render
  d.estado = "vencido";
}

let estadoTexto = "Activo";
let estadoClase = "estado-activo";

if (d.estado === "liquidado") {
  estadoTexto = "Liquidado";
  estadoClase = "estado-liquidado";
} else if (d.estado === "cancelado") {
  estadoTexto = "Cancelado";
  estadoClase = "estado-cancelado";
} else if (d.estado === "vencido") {
  estadoTexto = "Vencido";
  estadoClase = "estado-vencido";
}

    const row = document.createElement("div");
    row.className = "venta-row";

    row.innerHTML = `
      <span>${d.cliente}</span>
      <span>${d.telefono || "—"}</span>
      <span>${fechaApartado.toLocaleDateString()}</span>
      <span>${fechaLimite.toLocaleDateString()}</span>
      <span class="${estadoClase}">
  ${estadoTexto}
</span>
     <span class="acciones">
<span class="acciones">
  ${
    d.estado === "activo"
      ? `<button class="btn-primary btn-abonar">Abonar</button>`
      : d.estado === "liquidado"
        ? `<button class="btn-secondary btn-ver">Ver</button>`
        : d.estado === "vencido"
          ? `<button class="btn-danger btn-cancelar">Cancelar</button>`
          : d.estado === "cancelado"
            ? `<button class="btn-secondary btn-ver">Ver</button>`
            : ``
  }
</span>
    `;
// 👉 ABONAR (solo si NO está liquidado)
const btnAbonar = row.querySelector(".btn-abonar");
if (btnAbonar) {
  btnAbonar.onclick = () =>
    abrirModalAbono(docu.id, {
      ...d,
      total,
      pagado,
      saldo
    });
}
// 👉 VER (solo si está liquidado)
const btnVer = row.querySelector(".btn-ver");
if (btnVer) {
  btnVer.onclick = () =>
    abrirModalAbono(docu.id, {
      ...d,
      total,
      pagado,
      saldo,
      soloLectura: true
    });
}
// 👉 CANCELAR (solo si está vencido)
const btnCancelar = row.querySelector(".btn-cancelar");
if (btnCancelar) {
  btnCancelar.onclick = () =>
  cancelarApartado(docu.id, d.productos);
}

    // 👉 CANCELAR
    listaResultados.appendChild(row);
  });

  if (!listaResultados.children.length) {
    listaResultados.innerHTML = "<p>No se encontraron apartados</p>";
  }
}

/* =====================================================
   MODAL ABONO
===================================================== */
function abrirModalAbono(id, data) {
  apartadoActivo = { id, ...data };

  /* ================= CLIENTE ================= */
  abonoCliente.textContent = data.cliente || "—";
  abonoTelefono.textContent = data.telefono || "—";

  /* ================= TOTALES ================= */
const total = data.total || 0;
const pagos = data.pagos || [];

// 🔥 anticipo puede venir de:
const anticipo =
  pagos.find(p => p.tipo === "anticipo")?.monto ??
  data.anticipo ??
  0;

// total realmente pagado (anticipo + abonos)
const pagado = pagos.reduce((s, p) => s + p.monto, 0);
const saldoReal = Math.max(total - pagado, 0);

abonoTotal.textContent = total.toFixed(2);
abonoAnticipo.textContent = anticipo.toFixed(2);
abonoSaldo.textContent = saldoReal.toFixed(2);
// 🔒 BLOQUEAR ABONO SI EL APARTADO ESTÁ VENCIDO
const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

const fechaLimiteReal = data.fechaLimite?.toDate
  ? data.fechaLimite.toDate()
  : new Date(data.fechaLimite);

if (fechaLimiteReal < hoy && data.estado !== "liquidado") {
  inputMonto.disabled = true;
  selectCantidadMetodos.disabled = true;
  selectEmpleado.disabled = true;
  btnGuardar.style.display = "none";
  estadoAbono.textContent = "Apartado vencido — debe cancelarse";
}

  /* ================= MONTO DEL ABONO (SOLO SALDO) ================= */
  inputMonto.value = "";
  inputMonto.max = saldoReal;
  inputMonto.placeholder = `Máximo $${saldoReal.toFixed(2)}`;

  // 🔒 Forzar que el abono nunca exceda el saldo
  inputMonto.oninput = () => {
    let val = Number(inputMonto.value || 0);

    if (val > saldoReal) {
      val = saldoReal;
      inputMonto.value = saldoReal;
    }

    if (val < 0) {
      inputMonto.value = 0;
    }

    validarAbono();
  };
const soloLectura = data.soloLectura === true;

if (soloLectura) {
  inputMonto.disabled = true;
  selectCantidadMetodos.disabled = true;
  selectEmpleado.disabled = true;
  btnGuardar.style.display = "none";
  estadoAbono.textContent = "Apartado liquidado (solo lectura)";
} else {
  inputMonto.disabled = false;
  selectEmpleado.disabled = false;
  btnGuardar.style.display = "inline-flex";
}

  /* ================= PRODUCTOS ================= */
  listaProductosApartado.innerHTML = "";

  (data.productos || []).forEach(p => {
    const row = document.createElement("div");
    row.className = "producto-row";

    const detalles = p.atributos
      ? Object.entries(p.atributos)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      : "-";

    row.innerHTML = `
      <span>${p.nombre || "Producto"}</span>
      <span>${detalles}</span>
      <span>$${(p.precioFinal ?? p.precio ?? 0).toFixed(2)}</span>
    `;

    listaProductosApartado.appendChild(row);
  });

  /* ================= HISTORIAL DE ABONOS ================= */
  listaAbonos.innerHTML = "";

  if (!data.pagos || data.pagos.length === 0) {
    listaAbonos.innerHTML =
      "<p style='opacity:.6'>No hay abonos registrados</p>";
  } else {
    const anticipo = data.pagos.find(p => p.tipo === "anticipo");

const otrosPagos = data.pagos
  .filter(p => p.tipo !== "anticipo")
      .sort((a, b) => {
        const fa = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
        const fb = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
        return fa - fb;
      });

    [...(anticipo ? [anticipo] : []), ...otrosPagos].forEach(p => {
      const fecha = p.fecha?.toDate
        ? p.fecha.toDate()
        : new Date(p.fecha);

      const item = document.createElement("div");
      item.className = "abono-item";

item.innerHTML = `
  <div>
    <div class="monto">$${p.monto.toFixed(2)}</div>
    <div class="meta">
      ${p.tipo === "anticipo" ? "Anticipo inicial" : "Abono"}
      · ${(p.metodos ?? []).map(m => m.metodo).join(" + ")}
      ${p.empleadoNombre ? ` · <strong>${p.empleadoNombre}</strong>` : ""}
    </div>
  </div>

  <div class="meta">
    ${fecha.toLocaleDateString()}<br>
    ${fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
  </div>

  <div class="acciones-abono">
    <button class="btn-secondary btn-reimp-cliente">🧾 Cliente</button>
    <button class="btn-secondary btn-reimp-interno">🗂️ Interno</button>
  </div>
`;

/* 🔥 AQUÍ VA LO QUE PREGUNTAS 🔥 */
const btnCliente = item.querySelector(".btn-reimp-cliente");
const btnInterno = item.querySelector(".btn-reimp-interno");

const ticketReimpresion = {
  cliente: apartadoActivo.cliente,
  telefono: apartadoActivo.telefono,
  empleado: p.empleadoNombre || "",
  productos: (apartadoActivo.productos || []).map(prod => ({
    nombre: prod.nombre,
    atributos: prod.atributos || {},
    precioFinal: prod.precioFinal ?? prod.precio ?? 0
  })),
  saldoAnterior: p.saldoDespues + p.monto,
  abono: p.monto,
  saldoActual: p.saldoDespues,
  pagos: [p],
  fecha: p.fecha,
  reimpresion: true
};

btnCliente.onclick = () => {
  imprimirTicketAbono(ticketReimpresion);
};

btnInterno.onclick = () => {
  imprimirTicketAbonoInterno(ticketReimpresion);
};

/* 👇 y ya se agrega al DOM */
listaAbonos.appendChild(item);
    });
  }

  /* ================= RESET MÉTODOS DE PAGO ================= */
  chkMetodos.forEach(chk => {
    chk.checked = false;
    chk.disabled = true;
  });

  montoMetodos.forEach(input => {
    input.value = "";
    input.disabled = true;
  });

  feriaInput.value = "$0.00";
  estadoAbono.textContent = "Ingresa el monto del abono";
  btnGuardar.disabled = true;
selectCantidadMetodos.value = 0;
selectCantidadMetodos.disabled = true;
selectEmpleado.value = "";

  /* ================= MOSTRAR MODAL ================= */
  modalAbono.style.display = "flex";
}

window.cerrarModalAbono = () => {
  modalAbono.style.display = "none";
  apartadoActivo = null;

  btnGuardar.style.display = "inline-flex";
  inputMonto.disabled = false;
  selectEmpleado.disabled = false;
};
async function cancelarApartado(apartadoId, productos = []) {
  if (!Array.isArray(productos) || productos.length === 0) {
    alert("Este apartado no tiene productos vinculados");
    return;
  }

  try {
    const batch = writeBatch(db);

    // 1️⃣ cancelar apartado
    batch.update(doc(db, "apartados", apartadoId), {
      estado: "cancelado",
      fechaCancelacion: new Date()
    });

    // 2️⃣ liberar SOLO productos reales
    for (const p of productos) {
      if (!p.docId) {
        console.warn("Producto sin docId (manual):", p);
        continue;
      }

      console.log("Liberando producto:", p.docId);

      batch.update(
        doc(db, "productos", p.docId),
        { estado: "disponible" }
      );
    }

    await batch.commit();

    alert("Apartado cancelado y productos liberados ✅");
    cargarApartados(inputBuscar.value);

  } catch (error) {
    console.error("Error al cancelar:", error);
    alert("Error al cancelar el apartado");
  }
}

/* =====================================================
   GUARDAR ABONO
===================================================== */
btnGuardar.onclick = async () => {
  if (!apartadoActivo) return;
if (apartadoActivo.estado === "vencido") {
  alert("Este apartado está vencido y debe cancelarse");
  return;
}

if (apartadoActivo.estado === "cancelado") {
  alert("Este apartado está cancelado");
  return;
}

  const montoAbono = Number(inputMonto.value || 0);
  if (montoAbono <= 0) {
    alert("Ingresa un monto válido");
    return;
  }
// ===============================
// 🔒 VALIDAR CANTIDAD EXACTA DE MÉTODOS (SEGURIDAD FINAL)
// ===============================
const requeridos = Number(selectCantidadMetodos.value || 0);
const usados = contarMetodosUsados();

if (requeridos > 0 && usados !== requeridos) {
  alert(`Debes usar exactamente ${requeridos} método(s) de pago`);
  return;
}

const empleadoId = selectEmpleado.value;

const empleadoNombre =
  selectEmpleado.options[selectEmpleado.selectedIndex].dataset.nombre;


if (selectEmpleado.selectedIndex === 0) {
  alert("Selecciona el empleado que registra el abono");
  return;
}
  const total = apartadoActivo.total || 0;
  const pagosAnteriores = apartadoActivo.pagos || [];
  const pagadoAnterior = pagosAnteriores.reduce((s, p) => s + p.monto, 0);
  const saldoActual = Math.max(total - pagadoAnterior, 0);

  if (saldoActual === 0) {
    alert("Este apartado ya está liquidado");
    return;
  }

  if (montoAbono > saldoActual) {
    alert("El abono no puede ser mayor al saldo pendiente");
    return;
  }

/* ================= VALIDAR MÉTODOS ================= */
let totalPagado = 0;
let efectivo = 0;

montoMetodos.forEach(input => {
  const metodo = input.dataset.metodo;
  const chk = document.querySelector(
    `.chk-metodo[data-metodo="${metodo}"]`
  );

  if (!chk || !chk.checked) return;

  const val = Number(input.value || 0);
  if (val <= 0) return;

  totalPagado += val;

  if (metodo === "Efectivo") {
    efectivo += val;
  }
});

// ===============================
// 🔥 CALCULAR MÉTODOS APLICADOS + FERIA REAL
// ===============================
let restantePorCubrir = montoAbono;
let feria = 0;

const metodosAplicados = [];

montoMetodos.forEach(input => {
  const metodo = input.dataset.metodo;
  const chk = document.querySelector(
    `.chk-metodo[data-metodo="${metodo}"]`
  );

  let montoIngresado = Number(input.value || 0);
  if (!chk || !chk.checked || montoIngresado <= 0) return;

  if (metodo === "Efectivo") {
    const aplicado = Math.min(montoIngresado, restantePorCubrir);
    const cambio = Math.max(montoIngresado - aplicado, 0);

    if (aplicado > 0) {
      metodosAplicados.push({
        metodo: "Efectivo",
        monto: aplicado
      });
    }

    feria += cambio;
    restantePorCubrir -= aplicado;
  } else {
    const aplicado = Math.min(montoIngresado, restantePorCubrir);

    if (aplicado > 0) {
      metodosAplicados.push({
        metodo,
        monto: aplicado
      });
    }

    restantePorCubrir -= aplicado;
  }
});

// 🔒 seguridad final
if (restantePorCubrir > 0) {
  alert("El pago no cubre el monto del abono");
  return;
}
  /* ================= CALCULAR NUEVO SALDO ================= */
  const totalPagadoNuevo = pagadoAnterior + montoAbono;
const nuevoSaldo = Math.max(total - totalPagadoNuevo, 0);
// validaciones reales
if (totalPagado < montoAbono) {
  alert("El pago no cubre el monto del abono");
  return;
}

// ✅ SOLO se guarda el abono
const pagosNuevos = [
  {
    tipo: "abono",
    monto: montoAbono,            // ✅ abono real
    totalPagado: montoAbono,      // ✅ solo lo aplicado
    metodos: metodosAplicados,    // ✅ SIN feria
    feria,                        // 🔥 feria explícita
    empleadoId,
    empleadoNombre,
    fecha: new Date(),
    saldoDespues: nuevoSaldo
  }
];

/* ===== validar que haya al menos un método ===== */
if (pagosNuevos.length === 0) {
  alert("Selecciona al menos un método de pago");
  return;
}

  if (totalPagado < montoAbono) {
    alert("El pago no cubre el monto del abono");
    return;
  }

  if (efectivo === 0 && totalPagado > montoAbono) {
    alert("Tarjeta o transferencia no permiten feria");
    return;
  }

  /* ================= GUARDAR ================= */
  const ref = doc(db, "apartados", apartadoActivo.id);

  const nuevosPagos = [
    ...pagosAnteriores,
    ...pagosNuevos
  ];

 await updateDoc(ref, {
  pagos: nuevosPagos,
  estado: nuevoSaldo === 0 ? "liquidado" : "activo",
  fechaLiquidacion: nuevoSaldo === 0 ? new Date() : null
});

const ticketAbono = {
  cliente: apartadoActivo.cliente,
  telefono: apartadoActivo.telefono,
  empleado: empleadoNombre,
  productos: (apartadoActivo.productos || []).map(p => ({
    nombre: p.nombre,
    atributos: p.atributos || {},
    precioFinal: p.precioFinal ?? p.precio ?? 0
  })),
  saldoAnterior: saldoActual,
  abono: montoAbono,
  saldoActual: nuevoSaldo,
  pagos: pagosNuevos,
  fecha: new Date()
};

imprimirTicketAbono(ticketAbono);
imprimirTicketAbonoInterno(ticketAbono);

alert("Abono registrado correctamente ✨");
cerrarModalAbono();
cargarApartados();


  /* ================= PASAR A VENTAS SI SE LIQUIDA ================= */
await updateDoc(ref, {
  pagos: nuevosPagos,
  estado: nuevoSaldo === 0 ? "liquidado" : "activo",
  fechaLiquidacion: nuevoSaldo === 0 ? new Date() : null
});

  alert("Abono registrado correctamente ✨");
  cerrarModalAbono();
  cargarApartados();
};

document.addEventListener("DOMContentLoaded", () => {
  cargarApartados();
  cargarEmpleados(); // 👈🔥 AQUI
});

const MAX_METODOS = 2;

function obtenerMetodosActivos() {
  return Array.from(chkMetodos).filter(chk => chk.checked);
}
function contarMetodosUsados() {
  let usados = 0;

  montoMetodos.forEach(input => {
    const metodo = input.dataset.metodo;
    const chk = document.querySelector(
      `.chk-metodo[data-metodo="${metodo}"]`
    );

    if (chk && chk.checked && Number(input.value || 0) > 0) {
      usados++;
    }
  });

  return usados;
}

chkMetodos.forEach(chk => {
  chk.addEventListener("change", () => {
    const activos = obtenerMetodosActivos();
    const max = Number(selectCantidadMetodos.value || 0);

    if (activos.length > max) {
      chk.checked = false;
      alert(`Solo puedes usar ${max} método(s) de pago`);
      return;
    }

    const metodo = chk.dataset.metodo;
    const input = document.querySelector(
      `.monto-metodo[data-metodo="${metodo}"]`
    );

    if (chk.checked) {
      input.disabled = false;
      input.focus();
    } else {
      input.disabled = true;
      input.value = "";
    }

    validarAbono();
  });
});

function validarAbono() {
  const montoAbono = Number(inputMonto.value || 0);
  let totalPagado = 0;
  let efectivo = 0;

if (montoAbono <= 0) {
  selectCantidadMetodos.value = 0;
  selectCantidadMetodos.disabled = true;

  estadoAbono.textContent = "Ingresa el monto del abono";
  btnGuardar.disabled = true;
  feriaInput.value = "$0.00";

    chkMetodos.forEach(chk => {
      chk.checked = false;
      chk.disabled = true;

      const input = document.querySelector(
        `.monto-metodo[data-metodo="${chk.dataset.metodo}"]`
      );
      input.value = "";
      input.disabled = true;
    });
    return;
  }

  // habilitar métodos
  selectCantidadMetodos.disabled = false;

  chkMetodos.forEach(chk => (chk.disabled = false));

  montoMetodos.forEach(input => {
    const metodo = input.dataset.metodo;
    const chk = document.querySelector(
      `.chk-metodo[data-metodo="${metodo}"]`
    );

    if (!chk.checked) return;

    let val = Number(input.value || 0);

    // 🚫 tarjeta / transferencia NO pueden exceder el monto
    if (metodo !== "Efectivo" && val > montoAbono) {
      val = montoAbono;
      input.value = montoAbono;
    }

    totalPagado += val;

    if (metodo === "Efectivo") {
      efectivo += val;
    }
  });

  if (totalPagado < montoAbono) {
    estadoAbono.textContent = "El pago no cubre el abono";
    btnGuardar.disabled = true;
    feriaInput.value = "$0.00";
    return;
  }

  // 🚫 feria solo con efectivo
  if (efectivo === 0 && totalPagado > montoAbono) {
    estadoAbono.textContent =
      "Tarjeta o transferencia no permiten feria";
    btnGuardar.disabled = true;
    feriaInput.value = "$0.00";
    return;
  }

  // 🔒 si ya se cubrió el abono, bloquear otros métodos
  if (totalPagado >= montoAbono) {
    chkMetodos.forEach(chk => {
      const input = document.querySelector(
        `.monto-metodo[data-metodo="${chk.dataset.metodo}"]`
      );

      if (!chk.checked) {
        chk.disabled = true;
        input.disabled = true;
        input.value = "";
      }
    });
  }

  const feria = Math.max(totalPagado - montoAbono, 0);
  feriaInput.value = `$${feria.toFixed(2)}`;

if (selectEmpleado.selectedIndex === 0) {
  estadoAbono.textContent = "Selecciona el empleado que registra el abono";
  btnGuardar.disabled = true;
  return;
}
// ===============================
// 🔒 VALIDAR CANTIDAD EXACTA DE MÉTODOS
// ===============================
const requeridos = Number(selectCantidadMetodos.value || 0);
const usados = contarMetodosUsados();

if (requeridos > 0 && usados !== requeridos) {
  estadoAbono.textContent =
    `Debes usar exactamente ${requeridos} método(s) de pago`;
  btnGuardar.disabled = true;
  return;
}

estadoAbono.textContent = "Abono válido";
btnGuardar.disabled = false;

}

inputMonto.addEventListener("input", validarAbono);

montoMetodos.forEach(input => {
  input.addEventListener("input", validarAbono);
});
/* =====================================================
   CANTIDAD DE MÉTODOS DE PAGO
===================================================== */
selectCantidadMetodos.addEventListener("change", () => {
  const max = Number(selectCantidadMetodos.value || 0);

  // resetear métodos
  chkMetodos.forEach(chk => {
    chk.checked = false;
    chk.disabled = max === 0;

    const input = document.querySelector(
      `.monto-metodo[data-metodo="${chk.dataset.metodo}"]`
    );
    input.value = "";
    input.disabled = true;
  });

  estadoAbono.textContent =
    max === 0
      ? "Selecciona cuántos métodos usarás"
      : `Puedes usar hasta ${max} método(s)`;

  validarAbono();
});
selectEmpleado.addEventListener("change", validarAbono);
filtroEstado.addEventListener("change", () => {
  estadoFiltro = filtroEstado.value;
  cargarApartados(inputBuscar.value.toLowerCase());
});
inputBuscar.addEventListener("input", () => {
  const texto = inputBuscar.value.toLowerCase().trim();
  cargarApartados(texto);
});
