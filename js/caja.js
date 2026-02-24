/* =====================================================
   FIREBASE
===================================================== */
import { db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =====================================================
   DOM
===================================================== */
const fechaInput = document.getElementById("fechaCaja");
const fechaActualEl = document.getElementById("fechaActual");

const totalGeneralEl = document.getElementById("totalGeneral");
const totalEfectivoEl = document.getElementById("totalEfectivo");
const totalTarjetaEl = document.getElementById("totalTarjeta");
const totalTransferenciaEl = document.getElementById("totalTransferencia");

const tablaMovimientos = document.getElementById("tablaMovimientos");
const contenedorEmpleados = document.getElementById("contenedorEmpleados");
const selectEmpleado = document.getElementById("empleadoCaja");
let movimientos = [];

/* =====================================================
   INIT
===================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  const hoy = new Date();

  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");

  fechaInput.value = `${yyyy}-${mm}-${dd}`;
  fechaActualEl.textContent = hoy.toLocaleDateString();

  await cargarEmpleados();
  await cargarTodo();
});

/* =====================================================
   EMPLEADOS
===================================================== */
async function cargarEmpleados() {
  selectEmpleado.innerHTML = `<option value="todos">Todos</option>`;
  contenedorEmpleados.innerHTML = "";

  const snap = await getDocs(collection(db, "empleados"));

  snap.forEach(docu => {
    const { nombre } = docu.data();
    if (!nombre) return;

    const opt = document.createElement("option");
    opt.value = nombre;
    opt.textContent = nombre;
    selectEmpleado.appendChild(opt);

    const card = document.createElement("div");
    card.className = "empleado-card";
    card.dataset.empleado = nombre;

    card.innerHTML = `
      <h3>${nombre}</h3>
      <p>Efectivo: <strong class="efectivo">$0.00</strong></p>
      <p>Tarjeta: <strong class="tarjeta">$0.00</strong></p>
      <p>Transferencia: <strong class="transferencia">$0.00</strong></p>
      <p class="total">Total: $0.00</p>
    `;

    contenedorEmpleados.appendChild(card);
  });
}

/* =====================================================
   CARGAR TODO
===================================================== */
async function cargarTodo() {
  limpiarResumen();
  movimientos = [];

  await cargarVentas();
  await cargarAbonos();

  // 🔥 ORDENAR SOLO POR HORA (más reciente primero)
  movimientos.sort((a, b) => b.fecha - a.fecha);

  // 🔥 AHORA SÍ PINTAR
  movimientos.forEach(mov => pintarMovimiento(mov));
}

/* =====================================================
   VENTAS
===================================================== */
async function cargarVentas() {
  const fechaSel = fechaNormalizada(fechaInput.value);
  const snap = await getDocs(collection(db, "ventas"));

  snap.forEach(docu => {
    const v = docu.data();
    if (!Array.isArray(v.pagos) || !v.fecha) return;

    const fechaVenta = v.fecha.toDate ? v.fecha.toDate() : new Date(v.fecha);
    if (!mismaFecha(fechaVenta, fechaSel)) return;

    const empleado = v.empleadoNombre || v.empleado || "—";
    if (selectEmpleado.value !== "todos" && empleado !== selectEmpleado.value) return;

    registrarMovimiento({
      tipo: "Venta",
      fecha: fechaVenta,
      empleado,
      pagos: v.pagos,
      productos: v.productos || []
    });
  });
}
function pintarMovimiento({ tipo, fecha, empleado, pagos, productos }) {
  let totalMovimiento = 0;
  const metodosTexto = [];

  pagos.forEach(p => {
    if (p.metodo && typeof p.monto === "number") {
      totalMovimiento += p.monto;
      sumarMetodo(p.metodo, p.monto);
      sumarEmpleado(empleado, p.metodo, p.monto);
      metodosTexto.push(`${p.metodo}: $${p.monto}`);
      return;
    }

    if (Array.isArray(p.metodos)) {
      p.metodos.forEach(m => {
        totalMovimiento += m.monto;
        sumarMetodo(m.metodo, m.monto);
        sumarEmpleado(empleado, m.metodo, m.monto);
        metodosTexto.push(`${m.metodo}: $${m.monto}`);
      });
      return;
    }

    if (p.monto) {
      totalMovimiento += p.monto;
      sumarMetodo("Efectivo", p.monto);
      sumarEmpleado(empleado, "Efectivo", p.monto);
      metodosTexto.push(`Efectivo: $${p.monto}`);
    }
  });

  totalGeneralEl.textContent =
    dinero(texto(totalGeneralEl) + totalMovimiento);

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
    <td>${tipo}${formatearProductos(productos)}</td>
    <td>${empleado}</td>
    <td>${metodosTexto.join(" · ")}</td>
    <td>${dinero(totalMovimiento)}</td>
  `;

  tablaMovimientos.appendChild(tr);
}

/* =====================================================
   ABONOS / ANTICIPOS
===================================================== */
async function cargarAbonos() {
  const fechaSel = fechaNormalizada(fechaInput.value);
  const snap = await getDocs(collection(db, "apartados"));

  snap.forEach(docu => {
    const a = docu.data();
    if (!Array.isArray(a.pagos)) return;

    a.pagos.forEach(p => {
      const fechaPago = p.fecha?.toDate ? p.fecha.toDate() : new Date(p.fecha);
      if (!mismaFecha(fechaPago, fechaSel)) return;

      const empleado =
        p.empleadoNombre ||
        p.empleado ||
        a.empleadoNombre ||
        "—";

      if (selectEmpleado.value !== "todos" && empleado !== selectEmpleado.value) return;

      registrarMovimiento({
        tipo: p.tipo === "anticipo" ? "Anticipo" : "Abono",
        fecha: fechaPago,
        empleado,
        pagos: [p],
        productos: a.productos || []
      });
    });
  });
}

/* =====================================================
   REGISTRAR MOVIMIENTO (CORE)
===================================================== */
function registrarMovimiento({ tipo, fecha, empleado, pagos, productos }) {
  movimientos.push({
    tipo,
    fecha,
    empleado,
    pagos,
    productos
  });
}

/* =====================================================
   SUMADORES
===================================================== */
function sumarMetodo(metodo, monto) {
  if (metodo === "Efectivo")
    totalEfectivoEl.textContent = dinero(texto(totalEfectivoEl) + monto);
  if (metodo === "Tarjeta")
    totalTarjetaEl.textContent = dinero(texto(totalTarjetaEl) + monto);
  if (metodo === "Transferencia")
    totalTransferenciaEl.textContent = dinero(texto(totalTransferenciaEl) + monto);
}

function sumarEmpleado(empleado, metodo, monto) {
  const card = document.querySelector(`.empleado-card[data-empleado="${empleado}"]`);
  if (!card) return;

  const campo = card.querySelector(`.${metodo.toLowerCase()}`);
  if (!campo) return;

  campo.textContent = dinero(texto(campo) + monto);
  card.querySelector(".total").textContent =
    dinero(texto(card.querySelector(".total")) + monto);
}

/* =====================================================
   PRODUCTOS (DETALLE)
===================================================== */
function formatearProductos(productos = []) {
  if (!productos.length) return "";

  return productos.map(p => {
    const attrs = p.atributos
      ? Object.entries(p.atributos).map(([k, v]) => `${k}: ${v}`).join(" · ")
      : "";

    return `
      <div class="producto-mov">
        <strong>${p.nombre || "Producto"}</strong>
        ${attrs ? `<div class="attrs">${attrs}</div>` : ""}
      </div>
    `;
  }).join("");
}

/* =====================================================
   FECHAS
===================================================== */
function fechaNormalizada(str) {
  const [y, m, d] = str.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function mismaFecha(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* =====================================================
   UTILS
===================================================== */
function dinero(n = 0) {
  return `$${n.toFixed(2)}`;
}

function texto(el) {
  return Number(el.textContent.replace("$", "")) || 0;
}

function limpiarResumen() {
  totalGeneralEl.textContent = "$0.00";
  totalEfectivoEl.textContent = "$0.00";
  totalTarjetaEl.textContent = "$0.00";
  totalTransferenciaEl.textContent = "$0.00";
  tablaMovimientos.innerHTML = "";

  document.querySelectorAll(".empleado-card").forEach(card => {
    card.querySelector(".efectivo").textContent = "$0.00";
    card.querySelector(".tarjeta").textContent = "$0.00";
    card.querySelector(".transferencia").textContent = "$0.00";
    card.querySelector(".total").textContent = "$0.00";
  });
}

/* =====================================================
   EVENTOS
===================================================== */
fechaInput.addEventListener("change", cargarTodo);
selectEmpleado.addEventListener("change", cargarTodo);
