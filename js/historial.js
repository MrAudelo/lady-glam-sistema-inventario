/* =====================================================
   FIREBASE
===================================================== */
import { db } from "./firebase.js";
// Ventas
import {
  imprimirTicketVenta,
  imprimirTicketVentaInterno
} from "./ticketVentas.js";

// Apartados
import {
  imprimirTicketApartado,
  imprimirTicketApartadoInterno
} from "./ticketApartado.js";

// Abonos ✅
import {
  imprimirTicketAbono,
  imprimirTicketAbonoInterno
} from "./ticketAbono.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =====================================================
   DOM
===================================================== */
const tipoHistorial = document.getElementById("tipoHistorial");
const listaHistorial = document.getElementById("listaHistorial");
const filtroFecha = document.getElementById("filtroFecha");

/* =====================================================
   CARGAR HISTORIAL
===================================================== */
async function cargarHistorial(tipo = "ventas") {
  listaHistorial.innerHTML = "<p style='opacity:.6'>Cargando...</p>";

  const fechaSeleccionada = filtroFecha.value;
if (!fechaSeleccionada) return;

// ⏰ rango del día
const inicio = new Date(`${fechaSeleccionada}T00:00:00`);
const fin = new Date(`${fechaSeleccionada}T23:59:59`);

const q = query(
  collection(db, tipo),
  where("fecha", ">=", Timestamp.fromDate(inicio)),
  where("fecha", "<=", Timestamp.fromDate(fin)),
  orderBy("fecha", "desc")
);

  const snap = await getDocs(q);

  if (snap.empty) {
    listaHistorial.innerHTML = "<p>No hay registros</p>";
    return;
  }

  listaHistorial.innerHTML = "";

  snap.forEach(docu => {
    const d = docu.data();

    /* ================= FECHA ================= */
    const fecha = d.fecha?.toDate ? d.fecha.toDate() : new Date(d.fecha);

    /* ================= PAGOS ================= */
    const pagos = Array.isArray(d.pagos) ? d.pagos : [];

    const totalPagado = pagos.reduce(
      (s, p) => s + Number(p.monto || 0),
      0
    );

/* ================= MÉTODOS ================= */
/* ================= MÉTODOS ================= */
const metodosTexto = (() => {
  if (!pagos.length) return "—";

  // 🔹 CASO 1: VENTAS (pagos = [{ metodo, monto }])
  if (pagos[0].metodo) {
    return pagos
      .map(p => `${p.metodo}: $${Number(p.monto || 0).toFixed(2)}`)
      .join(" · ");
  }

  // 🔹 CASO 2: APARTADOS (pagos = [{ metodos: [...] }])
  if (Array.isArray(pagos[0].metodos)) {
    return pagos[0].metodos
      .map(m => `${m.metodo}: $${Number(m.monto || 0).toFixed(2)}`)
      .join(" · ");
  }

  return "—";
})();

    /* ================= PRODUCTOS ================= */
    const productos = Array.isArray(d.productos)
      ? d.productos
      : d.nombre
        ? [d]
        : [];

    /* ================= EMPLEADO ================= */
    const empleadoTexto =
      d.empleadoNombre ||
      d.empleado ||
      "—";

    /* ================= CARD ================= */
    const card = document.createElement("div");
    card.className = "historial-card";

    card.innerHTML = `
      <div class="card-header">
        <div>
          <h3>
            ${
              productos.length
                ? `${productos.length} ${productos.length === 1 ? "producto" : "productos"}`
                : tipo === "ventas"
                  ? "Venta sin producto"
                  : "Apartado sin producto"
            }
          </h3>
          <p class="cliente">
            ${tipo === "ventas" ? "Venta" : "Apartado"} ·
            ${fecha.toLocaleDateString()} ·
            ${fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span class="fecha">$${totalPagado.toFixed(2)}</span>
      </div>

      <div class="card-body">
        <div class="info">
          <p><strong>Empleado:</strong> ${empleadoTexto}</p>
          <p><strong>Métodos de pago:</strong> ${metodosTexto}</p>
        </div>

        <p><strong>Productos:</strong></p>

        <div class="productos-lista">
          ${productos.map(p => {
            const attrs = p.atributos
              ? Object.entries(p.atributos).map(([k, v]) => `${k}: ${v}`).join(" · ")
              : "";

            const precioOriginal = p.precioOriginal ?? p.precio ?? 0;
            const precioFinal = p.precioFinal ?? precioOriginal;

            return `
              <div class="producto-historial">
                <img
                  src="${p.imagen || 'https://placehold.co/80x110?text=Producto'}"
                  class="img-producto-historial"
                >

                <div class="producto-info">
                  <strong>${p.nombre || "Producto"}</strong>
                  <div class="attrs">${attrs}</div>

                  <div class="precio">
                    ${
                      precioFinal < precioOriginal
                        ? `
                          <span class="precio-original">$${precioOriginal.toFixed(2)}</span>
                          <span class="precio-final">$${precioFinal.toFixed(2)}</span>
                        `
                        : `<span class="precio-final">$${precioOriginal.toFixed(2)}</span>`
                    }
                  </div>

                  <div class="detalle-desc">
                    Descuento aplicado: ${precioFinal < precioOriginal ? "Sí" : "No"}
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>

        <div class="card-footer ${tipo === "ventas" ? "venta" : "apartado"}">
          ${tipo === "ventas" ? "Venta realizada" : `Estado: ${d.estado || "—"}`}
        </div>
        <div class="acciones-historial">
  <button class="btn-secondary btn-reimprimir-cliente">
    🧾 Reimprimir cliente
  </button>
  <button class="btn-secondary btn-reimprimir-interno">
    🗂️ Reimprimir interno
  </button>
</div>
    `;

    listaHistorial.appendChild(card);
    const btnCliente = card.querySelector(".btn-reimprimir-cliente");
const btnInterno = card.querySelector(".btn-reimprimir-interno");

btnCliente.onclick = () => {
  if (tipo === "ventas") {
    imprimirTicketVenta(d);
  } else if (tipo === "apartados") {
    imprimirTicketApartado(d);
  } else if (tipo === "abonos") {
    imprimirTicketAbono(d);
  }
};

btnInterno.onclick = () => {
  if (tipo === "ventas") {
    imprimirTicketVentaInterno(d);
  } else if (tipo === "apartados") {
    imprimirTicketApartadoInterno(d);
  } else if (tipo === "abonos") {
    imprimirTicketAbonoInterno(d);
  }
};

  });
}

/* =====================================================
   EVENTOS
===================================================== */
tipoHistorial.addEventListener("change", () => {
  cargarHistorial(tipoHistorial.value);
});

document.addEventListener("DOMContentLoaded", () => {
  setFechaHoy();
  cargarHistorial("ventas");
});

function setFechaHoy() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  filtroFecha.value = `${yyyy}-${mm}-${dd}`;
}
filtroFecha.addEventListener("change", () => {
  cargarHistorial(tipoHistorial.value);
});
