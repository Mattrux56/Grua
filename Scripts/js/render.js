// Interfaz: textos, botones, estado, interlock y diagrama SVG de compuertas

function renderUI(gateInfo) {
  const e3 = state.inputs[3], e2 = state.inputs[2], e1 = state.inputs[1], e0 = state.inputs[0];
  const s3 = state.outputs[3], s2 = state.outputs[2], s1 = state.outputs[1], s0 = state.outputs[0];

  const inBin  = `${e3}${e2}${e1}${e0}`;
  const inDec  = (e3 << 3) | (e2 << 2) | (e1 << 1) | e0;
  const outBin = `${s3}${s2}${s1}${s0}`;
  const outDec = (s3 << 3) | (s2 << 2) | (s1 << 1) | s0;

  const pwm1 = angleToPwmUs(state.servo1Angle);
  const pwm2 = angleToPwmUs(state.servo2Angle);

  document.getElementById('strip-mode').textContent =
    state.mode === 'BINARY' ? 'MODO 1 // BINARIO 4B' : 'MODO 2 // COMPUERTAS';
  document.getElementById('strip-input').textContent = `${inBin} (DEC ${inDec})`;
  document.getElementById('strip-output').textContent = `${outBin} (DEC ${outDec})`;
  const gIdx = (s3 << 1) | s2;
  const zIdx = (s1 << 1) | s0;
  const ZDESC = ['gancho abajo', 'gancho a 1/3', 'gancho a 2/3', 'gancho arriba'];
  document.getElementById('strip-s1').textContent = `G${gIdx} = ${state.servo1Angle}° // ${pwm1} µs`;
  document.getElementById('strip-s2').textContent = `Z${zIdx} = ${state.servo2Angle}° // ${pwm2} µs`;

  // El interlock actúa cuando la pluma está fuera de G0 y se pidió Z0 (E1 = E0 = 0)
  const interlock = state.mode === 'GATES' && gateInfo.and0 === 1 && e0 === 0;
  document.getElementById('status-text').innerHTML =
    `<span class="g">Pluma en G${gIdx} (${state.servo1Angle}°)</span> · ` +
    `<span class="z">${ZDESC[zIdx]} (Z${zIdx})</span>`;
  const alertBox = document.getElementById('interlock-alert');
  alertBox.style.display = interlock ? 'block' : 'none';
  alertBox.textContent = interlock
    ? `⚠ INTERLOCK: la pluma está fuera de G0 y pediste Z0. El gancho sube a Z1 para que la carga no choque con el pedestal.`
    : '';

  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`btn-bit-${i}`);
    const val = state.inputs[i];
    btn.textContent = val;
    btn.className = val === 1 ? 'bit-btn on' : 'bit-btn';

    const outBox = document.getElementById(`out-box-${i}`);
    const outVal = state.outputs[i];
    outBox.textContent = `S${i} = ${outVal}`;
    outBox.className = 'out-cell ' + (i >= 2 ? 'grp-giro' : 'grp-izaje') + (outVal === 1 ? ' on' : '');
  }

  document.getElementById('out-decimal-label').textContent = `${outBin} (DEC ${outDec})`;

  // Cruceta: límites según la ENTRADA pedida
  const gIn = (e3 << 1) | e2;
  const zIn = (e1 << 1) | e0;
  document.getElementById('btn-dpad-left').disabled  = gIn === 0;
  document.getElementById('btn-dpad-right').disabled = gIn === 3;
  document.getElementById('btn-dpad-down').disabled  = zIn === 0;
  document.getElementById('btn-dpad-up').disabled    = zIn === 3;
  document.getElementById('dpad-state').textContent =
    `Pedido: giro G${gIn} · izaje Z${zIn} (teclado: flechas, Inicio = home)`;

  const gateOuts = [
    { id: 's3', val: gateInfo.s3 },
    { id: 's2', val: gateInfo.s2 },
    { id: 's1', val: gateInfo.s1 },
    { id: 's0', val: gateInfo.s0 }
  ];
  gateOuts.forEach(item => {
    const badge = document.getElementById(`eq-val-${item.id}`);
    badge.textContent = `${item.id.toUpperCase()} = ${item.val}`;
    badge.className = item.val === 1 ? 'eq-badge on' : 'eq-badge';
  });

  const banner = document.getElementById('gates-inactive-banner');
  const statusBadge = document.getElementById('gates-status-badge');

  if (state.mode === 'GATES') {
    banner.style.display = 'none';
    statusBadge.textContent = 'ACTIVO';
    document.getElementById('badge-input-mode').textContent = 'Entradas (Modo 2)';
    document.getElementById('mode-helper-text').textContent =
      'Modo 2 (compuertas): [E3 E2] = giro que pides, [E1 E0] = altura que pides. Las compuertas AND/OR/NOT aplican el interlock: si la pluma no está en G0, el gancho sube como mínimo a Z1.';
    document.getElementById('lbl-bit3').textContent = 'E3';
    document.getElementById('lbl-bit2').textContent = 'E2';
    document.getElementById('lbl-bit1').textContent = 'E1';
    document.getElementById('lbl-bit0').textContent = 'E0';
    document.getElementById('role-bit3').textContent = 'GIRO MSB';
    document.getElementById('role-bit2').textContent = 'GIRO LSB';
    document.getElementById('role-bit1').textContent = 'ALTURA MSB';
    document.getElementById('role-bit0').textContent = 'ALTURA LSB';
  } else {
    banner.style.display = 'block';
    statusBadge.textContent = 'En espera (Modo 1)';
    document.getElementById('badge-input-mode').textContent = 'Palabra binaria';
    document.getElementById('mode-helper-text').textContent =
      'Modo 1 (binario): [B3 B2] = giro de la pluma (servo 1) y [B1 B0] = izaje del gancho (servo 2). La salida es igual a la entrada.';
    document.getElementById('lbl-bit3').textContent = 'B3 (2³)';
    document.getElementById('lbl-bit2').textContent = 'B2 (2²)';
    document.getElementById('lbl-bit1').textContent = 'B1 (2¹)';
    document.getElementById('lbl-bit0').textContent = 'B0 (2⁰)';
    document.getElementById('role-bit3').textContent = 'GIRO MSB';
    document.getElementById('role-bit2').textContent = 'GIRO LSB';
    document.getElementById('role-bit1').textContent = 'IZAJE MSB';
    document.getElementById('role-bit0').textContent = 'IZAJE LSB';
  }

  document.getElementById('sim-action-badge').textContent = `Salida: ${outBin}`;

  renderGatesSVG(e3, e2, e1, e0, gateInfo);
  renderCraneCanvas(state.servo1Angle, state.servo2Angle, pwm1, pwm2, interlock);
}

function renderGatesSVG(e3, e2, e1, e0, g) {
  const svg = document.getElementById('gates-svg');
  const w = (bit) => bit ? 'stroke-width="2.5"' : 'stroke-width="1" stroke-dasharray="3,2"';
  // Color por grupo: azul = giro, naranja = izaje, rojo = rama del interlock
  const G = COLOR.giro, Z = COLOR.izaje, A = COLOR.alerta;
  const fillOf = (active, c) => active ? c : '#f1f5f9';
  const box = (x, y, wBox, label, active, c) => `
    <rect x="${x}" y="${y}" width="${wBox}" height="26" rx="5" fill="${fillOf(active, c)}" stroke="${active ? c : COLOR.off}" stroke-width="1.5"/>
    <text x="${x + wBox / 2}" y="${y + 16}" text-anchor="middle" font-size="9" font-weight="bold" fill="${active ? '#ffffff' : '#475569'}">${label}</text>
  `;
  const pin = (x, y, text, active, c, bitIndex = null) => `
    <g ${bitIndex !== null ? `onclick="toggleBit(${bitIndex}, true)" style="cursor:pointer"` : ''}>
      <rect x="${x}" y="${y}" width="42" height="26" rx="5" fill="${fillOf(active, c)}" stroke="${active ? c : COLOR.off}" stroke-width="1.5"/>
      <text x="${x + 21}" y="${y + 16}" text-anchor="middle" font-size="9.5" font-weight="bold" fill="${active ? '#ffffff' : '#475569'}">${text}</text>
    </g>
  `;

  const line = (pts, bit, c) =>
    `<polyline points="${pts}" fill="none" stroke="${bit ? c : COLOR.off}" ${w(bit)} />`;
  const dot = (x, y, c) => `<circle cx="${x}" cy="${y}" r="2.5" fill="${c}" />`;

  let content = '';

  // S3 = E3, S2 = E2, S1 = E1 (cables directos)
  content += pin(8, 8, 'E3=' + e3, e3, G, 3)  + line('50,21 330,21', e3, G) + pin(330, 8, 'S3=' + g.s3, g.s3, G, null);
  content += pin(8, 44, 'E2=' + e2, e2, G, 2) + line('50,57 330,57', e2, G) + pin(330, 44, 'S2=' + g.s2, g.s2, G, null);
  content += pin(8, 80, 'E1=' + e1, e1, Z, 1) + line('50,93 330,93', e1, Z) + pin(330, 80, 'S1=' + g.s1, g.s1, Z, null);

  // Derivaciones hacia la red de S0 (rama del interlock en rojo cuando está activa)
  content += line('62,21 62,147 88,147', e3, G) + dot(62, 21, e3 ? G : COLOR.off);
  content += line('72,57 72,159 88,159', e2, G) + dot(72, 57, e2 ? G : COLOR.off);
  content += line('80,93 80,189 88,189', e1, Z) + dot(80, 93, e1 ? Z : COLOR.off);

  // S0 = E0 + (E3 + E2) · E1'
  const K = '#475569'; // compuertas intermedias en gris; solo el AND se pone rojo (interlock)
  content += box(88, 140, 76, 'OR(E3+E2)=' + g.outOfHome, g.outOfHome, K);
  content += box(88, 176, 76, "NOT(E1)=" + g.notE1, g.notE1, K);
  content += line('164,153 171,153 171,165 178,165', g.outOfHome, K);
  content += line('164,189 171,189 171,177 178,177', g.notE1, K);
  content += box(178, 158, 80, "AND(F·E1')=" + g.and0, g.and0, A);
  content += line('258,171 268,171', g.and0, A);
  content += box(268, 158, 52, 'OR=' + g.s0, g.s0, Z);
  content += pin(8, 210, 'E0=' + e0, e0, Z, 0) + line('50,223 294,223 294,184', e0, Z);
  content += line('320,171 330,171', g.s0, Z) + pin(330, 158, 'S0=' + g.s0, g.s0, Z, null);

  svg.innerHTML = content;
}
