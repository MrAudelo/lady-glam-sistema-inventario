/* =====================================================
   TICKET DE ABONO – MIRAI BOUTIQUE (58mm) – HD MODE
   CLIENTE + COPIA INTERNA
===================================================== */

/* =====================================================
   TICKET ABONO – CLIENTE
===================================================== */
export function imprimirTicketAbono(abono) {
  const win = window.open("", "PRINT", "width=300,height=650");

  win.document.write(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ticket de Abono</title>
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
  </style>
</head>

<body>

  <!-- ENCABEZADO -->
  <div class="center bold">MIRAI BOUTIQUE</div>
  <div class="center small">COMPROBANTE DE ABONO</div>

  <div class="line"></div>

  <!-- INFO -->
  <div>Fecha: ${fmt(abono.fecha)}</div>
  <div>Empleado: ${abono.empleado}</div>
  <div>Cliente: ${abono.cliente}</div>
  <div>Tel: ${abono.telefono || "—"}</div>

  <div class="line"></div>

  <!-- PRODUCTOS -->
  ${abono.productos.map(p => `
    <div class="bold">${p.nombre}</div>
    ${renderAtributos(p.atributos)}
    <div class="precio">$${Number(p.precioFinal || 0).toFixed(2)}</div>
    <br>
  `).join("")}

  <div class="line"></div>

  <!-- RESUMEN -->
  <div class="bold">SALDO ANTERIOR</div>
  <div class="precio">$${Number(abono.saldoAnterior).toFixed(2)}</div>

  <div class="bold">ABONO REALIZADO</div>
  <div class="precio">$${Number(abono.abono).toFixed(2)}</div>

  <div class="bold">SALDO ACTUAL</div>
  <div class="precio">$${Number(abono.saldoActual).toFixed(2)}</div>

  <div class="line"></div>

  <!-- PAGOS -->
  <div class="bold">FORMA DE PAGO</div>
  ${renderPagos(abono.pagos)}

  <div class="line"></div>

  <!-- POLÍTICAS -->
  <div class="xsmall">
    POLÍTICAS:<br>
    • Los abonos NO son reembolsables.<br>
    • El saldo debe liquidarse antes de la fecha límite.<br>
    • Conserve este comprobante.
  </div>

  <div class="line"></div>

  <div class="center small">
    ¡Gracias por su preferencia!<br>
    Mirai Boutique
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

/* =====================================================
   TICKET ABONO – COPIA INTERNA (SIN POLÍTICAS)
===================================================== */
export function imprimirTicketAbonoInterno(abono) {
  const win = window.open("", "PRINT", "width=300,height=650");

  win.document.write(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Abono Interno</title>
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
  </style>
</head>

<body>

  <div class="center bold">MIRAI BOUTIQUE</div>
  <div class="center small">COPIA INTERNA – ABONO</div>

  <div class="line"></div>

  <div>Fecha: ${fmt(abono.fecha)}</div>
  <div>Empleado: ${abono.empleado}</div>
  <div>Cliente: ${abono.cliente}</div>

  <div class="line"></div>

  <div class="bold">ABONO</div>
  <div class="precio">$${Number(abono.abono).toFixed(2)}</div>

  <div class="bold">SALDO RESULTANTE</div>
  <div class="precio">$${Number(abono.saldoActual).toFixed(2)}</div>

  <div class="line"></div>

  <div class="bold">MÉTODOS</div>
  ${renderPagos(abono.pagos)}

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

/* =====================================================
   HELPERS
===================================================== */
function fmt(fecha) {
  return new Date(fecha).toLocaleString();
}

function renderAtributos(attrs = {}) {
  const keys = Object.keys(attrs);
  if (!keys.length) return "";
  return `<div class="small">${keys.map(k => `${k}: ${attrs[k]}`).join(", ")}</div>`;
}

function renderPagos(pagos = []) {
  if (!pagos.length) return "";

  let html = "";

  pagos.forEach(p => {
    if (!p.metodos || !p.metodos.length) return;

    p.metodos.forEach(m => {
      html += `
        <div>${m.metodo}</div>
        <div class="precio">$${Number(m.monto).toFixed(2)}</div>
      `;
    });
  });

  return html;
}
