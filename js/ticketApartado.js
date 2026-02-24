/* =====================================================
   TICKET DE APARTADO – MIRAI BOUTIQUE (58mm) – HD MODE
===================================================== */

export function imprimirTicketApartado(apartado) {
  const win = window.open("", "PRINT", "width=300,height=650");

  win.document.write(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ticket de Apartado</title>
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
  <div class="center small">TICKET DE APARTADO</div>

  <div class="line"></div>

  <!-- INFO -->
  <div>Fecha: ${fmt(apartado.fecha)}</div>
  <div>Empleado: ${apartado.empleado}</div>
  <div>Cliente: ${apartado.cliente}</div>
  <div>Tel: ${apartado.telefono}</div>
  <div>Fecha límite: ${fmt(apartado.fechaLimite)}</div>

  <div class="line"></div>

  <!-- PRODUCTOS -->
  ${apartado.productos.map(p => `
    <div class="bold">${p.nombre}</div>
    ${renderAtributos(p.atributos)}
    <div class="precio">$${p.precioFinal.toFixed(2)}</div>
    <br>
  `).join("")}

  <div class="line"></div>

  <!-- RESUMEN -->
  <div class="bold">TOTAL</div>
  <div class="precio">$${apartado.total.toFixed(2)}</div>

  <div class="bold">ANTICIPO</div>
  <div class="precio">$${apartado.anticipo.toFixed(2)}</div>

  <div class="bold">SALDO PENDIENTE</div>
  <div class="precio">$${(apartado.total - apartado.anticipo).toFixed(2)}</div>

  <div class="line"></div>

  <!-- PAGOS -->
  <div class="bold">ANTICIPO PAGADO</div>
  ${renderPagos(apartado.pagos)}

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
    POLÍTICAS DE APARTADO:<br>
    • El apartado tiene vigencia hasta la fecha límite indicada.<br>
    • No existen cambios en apartados.<br>
    • Se debe pagar el 50% para separar.<br>
    • El anticipo NO es reembolsable.<br>
    • Si no se liquida en la fecha acordada, el apartado se cancela.<br>
    • La mercancía regresa a venta y el anticipo se pierde.
  </div>

  <div class="line"></div>

  <div class="center small">
    ¡Gracias por tu preferencia!<br>
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

/* ================= HELPERS ================= */

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
        <div class="precio">$${m.monto.toFixed(2)}</div>
      `;
    });
  });

  return html;
}

/* =====================================================
   TICKET DE APARTADO – COPIA INTERNA (SIN POLÍTICAS)
===================================================== */

export function imprimirTicketApartadoInterno(apartado) {
  const win = window.open("", "PRINT", "width=300,height=650");

  win.document.write(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ticket Interno Apartado</title>
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

  <!-- ENCABEZADO -->
  <div class="center bold">MIRAI BOUTIQUE</div>
  <div class="center small">COPIA INTERNA – APARTADO</div>

  <div class="line"></div>

  <!-- INFO -->
  <div>Fecha: ${fmt(apartado.fecha)}</div>
  <div>Empleado: ${apartado.empleado}</div>
  <div>Cliente: ${apartado.cliente}</div>
  <div>Tel: ${apartado.telefono}</div>
  <div>Fecha límite: ${fmt(apartado.fechaLimite)}</div>

  <div class="line"></div>

  <!-- PRODUCTOS -->
  ${apartado.productos.map(p => `
    <div class="bold">${p.nombre}</div>
    ${renderAtributos(p.atributos)}
    <div class="precio">$${p.precioFinal.toFixed(2)}</div>
    <br>
  `).join("")}

  <div class="line"></div>

  <!-- RESUMEN -->
  <div class="bold">TOTAL</div>
  <div class="precio">$${apartado.total.toFixed(2)}</div>

  <div class="bold">ANTICIPO</div>
  <div class="precio">$${apartado.anticipo.toFixed(2)}</div>

  <div class="bold">SALDO</div>
  <div class="precio">$${(apartado.total - apartado.anticipo).toFixed(2)}</div>

  <div class="line"></div>

  <!-- PAGOS -->
  <div class="bold">ANTICIPO PAGADO</div>
  ${renderPagos(apartado.pagos)}

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
