/* =====================================================
   TICKET DE VENTA – MIRAI BOUTIQUE (58mm) – HD MODE
===================================================== */

export function imprimirTicketVenta(venta) {
  const win = window.open("", "PRINT", "width=300,height=600");

  // ===== calcular efectivo y cambio =====
  let efectivo = 0;
  let totalPagado = 0;

  venta.pagos.forEach(p => {
    totalPagado += Number(p.monto || 0);
    if (p.metodo === "Efectivo") {
      efectivo += Number(p.monto || 0);
    }
  });

  const cambio = Math.max(efectivo - venta.totalFinal, 0);

  win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Ticket de Venta</title>
  <style>
    * {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      font-weight: 900;
      color: #000;
      letter-spacing: 0.4px;
      line-height: 1.25;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      width: 58mm;
      margin: 0;
      padding: 4px;
    }

    .center { text-align: center; }
    .bold { font-weight: 900; }

    .small {
      font-size: 12px;
      font-weight: 800;
    }

    .xsmall {
      font-size: 11px;
      font-weight: 700;
    }

    .line {
      border-top: 2px dashed #000;
      margin: 6px 0;
    }

    .precio {
      display: block;
      width: 100%;
      text-align: right;
      padding-right: 5mm;
      box-sizing: border-box;
      font-size: 15px;
      font-weight: 900;
    }

    .tachado {
      text-decoration: line-through;
      font-size: 12px;
      font-weight: 700;
    }
  </style>
</head>

<body>

  <!-- ENCABEZADO -->
  <div class="center bold">MIRAI BOUTIQUE</div>
  <div class="center small">Ropa & Accesorios</div>

  <div class="line"></div>

  <!-- INFO -->
  <div>Fecha: ${formatearFecha(venta.fecha)}</div>
  <div>Empleado: ${venta.empleado}</div>

  <div class="line"></div>

  <!-- PRODUCTOS -->
  ${venta.productos.map(p => {
    const tieneDescuento = p.precioOriginal > p.precioFinal;
    const descuento = p.precioOriginal - p.precioFinal;

    return `
      <div class="bold">${p.nombre}</div>
      ${renderAtributos(p.atributos)}

      ${tieneDescuento ? `
        <div class="tachado">$${p.precioOriginal.toFixed(2)}</div>
        <div class="small">Descuento: -$${descuento.toFixed(2)}</div>
      ` : ""}

      <div class="precio">$${p.precioFinal.toFixed(2)}</div>
      <br>
    `;
  }).join("")}

  <div class="line"></div>

  <!-- TOTALES -->
  <div class="bold">TOTAL</div>
  <div class="precio">$${venta.totalFinal.toFixed(2)}</div>

  <div class="line"></div>

  <!-- PAGOS -->
  <div class="bold">PAGOS</div>
  ${venta.pagos.map(p => `
    <div>${p.metodo}</div>
    <div class="precio">$${Number(p.monto).toFixed(2)}</div>
  `).join("")}

  ${cambio > 0 ? `
    <div class="bold">CAMBIO</div>
    <div class="precio">$${cambio.toFixed(2)}</div>
  ` : ""}

  <div class="line"></div>

  <!-- CONTACTO -->
  <div class="center small">
    WhatsApp: 899 872 0716<br>
    Instagram: @mirai.btq<br>
    Facebook: Mirai Boutique
  </div>

  <div class="line"></div>

  <!-- POLÍTICAS -->
  <div class="xsmall">
    POLÍTICAS:<br>
    • Aceptamos pagos en efectivo, tarjeta y transferencia.<br>
    • No se aceptan devoluciones.<br>
    • Cambios únicamente cuando la prenda NO haya sido usada.<br>
    • El cambio puede realizarse dentro de 1 día después de la compra.<br>
    • La prenda debe conservar etiquetas y estar en perfecto estado.<br>
    • Es responsabilidad del cliente revisar la prenda al comprar.<br>
    • Para facturación, solicitar el mismo día de la compra.<br>
    • Para aplicar promociones, avisar antes de pagar.
  </div>

  <div class="line"></div>

  <div class="center small">
    ¡Gracias por tu compra!<br>
    Vuelve pronto
  </div>

  <div style="height:20mm"></div>

</body>
</html>
  `);

  win.document.close();
  win.focus();
  win.print();
  win.close();
}

/* ================= HELPERS ================= */

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString();
}

function renderAtributos(attrs = {}) {
  const keys = Object.keys(attrs);
  if (!keys.length) return "";
  return `<div class="small">${keys.map(k => `${k}: ${attrs[k]}`).join(", ")}</div>`;
}
/* =====================================================
   TICKET DE VENTA – COPIA INTERNA (58mm) – HD MODE
===================================================== */

export function imprimirTicketVentaInterno(venta) {
  const win = window.open("", "PRINT", "width=300,height=600");

  // ===== calcular efectivo y cambio =====
  let efectivo = 0;
  let totalPagado = 0;

  venta.pagos.forEach(p => {
    totalPagado += Number(p.monto || 0);
    if (p.metodo === "Efectivo") {
      efectivo += Number(p.monto || 0);
    }
  });

  const cambio = Math.max(efectivo - venta.totalFinal, 0);

  win.document.write(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ticket Interno Venta</title>
  <style>
    * {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      font-weight: 900;
      color: #000;
      letter-spacing: 0.4px;
      line-height: 1.25;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      width: 58mm;
      margin: 0;
      padding: 4px;
    }

    .center { text-align: center; }
    .bold { font-weight: 900; }

    .small {
      font-size: 12px;
      font-weight: 800;
    }

    .line {
      border-top: 2px dashed #000;
      margin: 6px 0;
    }

    .precio {
      display: block;
      width: 100%;
      text-align: right;
      padding-right: 5mm;
      box-sizing: border-box;
      font-size: 15px;
      font-weight: 900;
    }

    .tachado {
      text-decoration: line-through;
      font-size: 12px;
      font-weight: 700;
    }
  </style>
</head>

<body>

  <!-- ENCABEZADO -->
  <div class="center bold">MIRAI BOUTIQUE</div>
  <div class="center small">COPIA INTERNA – VENTA</div>

  <div class="line"></div>

  <!-- INFO -->
  <div>Fecha: ${formatearFecha(venta.fecha)}</div>
  <div>Empleado: ${venta.empleado}</div>

  <div class="line"></div>

  <!-- PRODUCTOS -->
  ${venta.productos.map(p => {
    const tieneDescuento = p.precioOriginal > p.precioFinal;
    const descuento = p.precioOriginal - p.precioFinal;

    return `
      <div class="bold">${p.nombre}</div>
      ${renderAtributos(p.atributos)}

      ${tieneDescuento ? `
        <div class="tachado">$${p.precioOriginal.toFixed(2)}</div>
        <div class="small">Desc: -$${descuento.toFixed(2)}</div>
      ` : ""}

      <div class="precio">$${p.precioFinal.toFixed(2)}</div>
      <br>
    `;
  }).join("")}

  <div class="line"></div>

  <!-- TOTALES -->
  <div class="bold">TOTAL</div>
  <div class="precio">$${venta.totalFinal.toFixed(2)}</div>

  <div class="line"></div>

  <!-- PAGOS -->
  <div class="bold">PAGOS</div>
  ${venta.pagos.map(p => `
    <div>${p.metodo}</div>
    <div class="precio">$${Number(p.monto).toFixed(2)}</div>
  `).join("")}

  ${cambio > 0 ? `
    <div class="bold">CAMBIO</div>
    <div class="precio">$${cambio.toFixed(2)}</div>
  ` : ""}

  <div class="line"></div>

  <div class="center small">
    CONTROL INTERNO – MIRAI BOUTIQUE
  </div>

  <div style="height:20mm"></div>

</body>
</html>
  `);

  win.document.close();
  win.focus();
  win.print();
  win.close();
}
