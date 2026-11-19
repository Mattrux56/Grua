// Dibujo de la grúa en el canvas (vista lateral acotada + vista superior + specs) y ondas PWM

function renderCraneCanvas(s1Angle, s2Angle, pwm1, pwm2, interlock) {
  const canvas = document.getElementById('craneCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;

  // Paleta original: azul = giro, naranja = izaje, rojo = interlock, grises = estructura
  const C = {
    bg: '#ffffff', panel: '#f8fafc', line: '#cbd5e1', text: '#0f172a', mute: '#64748b',
    dim: '#475569', fill: '#e2e8f0', stroke: '#475569',
    blue: COLOR.giro, blueDark: '#1d4ed8', blueSoft: COLOR.giroSoft,
    orange: COLOR.izaje, orangeDark: '#c2410c', orangeSoft: COLOR.izajeSoft,
    red: COLOR.alerta, redDark: '#991b1b',
    ground: '#64748b', guide: '#cbd5e1', off: COLOR.off, slate: '#475569'
  };
  const gIdx = GIRO_MAP.indexOf(s1Angle);
  const zIdx = IZAJE_MAP.indexOf(s2Angle);

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, canvas.height);

  const mono = (px, bold) => { ctx.font = `${bold ? 'bold ' : ''}${px}px monospace`; };
  const line = (x1, y1, x2, y2, color, w, dash) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w || 1;
    ctx.setLineDash(dash || []);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
  };
  const arrow = (x1, y1, x2, y2) => {
    line(x1, y1, x2, y2, C.dim, 1);
    const a = Math.atan2(y2 - y1, x2 - x1);
    [[x1, y1, 1], [x2, y2, -1]].forEach(([x, y, s]) => {
      ctx.fillStyle = C.dim;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + s * 6 * Math.cos(a - 0.4), y + s * 6 * Math.sin(a - 0.4));
      ctx.lineTo(x + s * 6 * Math.cos(a + 0.4), y + s * 6 * Math.sin(a + 0.4));
      ctx.fill();
    });
  };
  const box = (x, y, w, h, fill, stroke) => {
    ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 1.5;
    ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  };
  const circle = (x, y, r, fill, stroke, w) => {
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w || 1.5; ctx.stroke(); }
  };
  const panel = (y, h, title) => {
    ctx.fillStyle = C.panel; ctx.strokeStyle = C.line; ctx.lineWidth = 1;
    ctx.fillRect(4, y, W - 8, h); ctx.strokeRect(4.5, y + 0.5, W - 9, h - 1);
    mono(10, true); ctx.fillStyle = C.text; ctx.fillText(title, 12, y + 15);
  };

  // =================== VISTA LATERAL ACOTADA ===================
  panel(4, 262, 'VISTA LATERAL ACOTADA (ESCALA REAL mm)');
  const k = 0.8;                       // px por mm
  const gy = 246;                      // suelo
  const mastX = 175;
  const baseW = 160 * k, baseH = 45 * k;
  const mastW = 18;
  const jibY = gy - 210 * k;           // pluma a 210 mm
  const jibL = mastX - 60 * k;         // brazo trasero 60 mm
  const jibR = mastX + 140 * k;        // brazo delantero 140 mm

  line(10, gy, W - 10, gy, C.ground, 2);

  // base con lastre y S1 interno
  box(mastX - baseW / 2, gy - baseH, baseW, baseH, C.fill, C.stroke);
  box(mastX - baseW / 2 + 8, gy - baseH + 20, 34, 12, '#cbd5e1', C.mute);
  mono(8, false); ctx.fillStyle = C.text;
  ctx.fillText('350g', mastX - baseW / 2 + 12, gy - baseH + 29);
  box(mastX - 8, gy - baseH + 6, 16, 22, C.blue, C.blueDark);
  mono(9, true); ctx.fillStyle = C.blue;
  ctx.fillText('S1 Base (giro)', mastX + 76, gy - baseH + 20);
  line(mastX + 10, gy - baseH + 17, mastX + 74, gy - baseH + 17, C.blue, 1, [2, 3]);

  // placa de giro y mástil
  box(mastX - 30, gy - baseH - 5, 60, 5, C.blueSoft, C.blue);
  box(mastX - mastW / 2, jibY + 7, mastW, gy - baseH - 5 - jibY - 7, C.fill, C.stroke);

  // S2 + biela
  // S2 (izaje, vertical) a media altura del mástil
  const midY = (jibY + 7 + gy - baseH - 5) / 2;
  box(mastX - 15, midY - 10, 30, 20, C.orange, C.orangeDark);
  mono(9, true); ctx.fillStyle = '#ffffff';
  ctx.fillText('S2', mastX - 7, midY + 3);
  ctx.fillStyle = C.orange;
  ctx.fillText('S2 + Biela (izaje)', mastX + 22, midY + 3);
  line(mastX + 10, midY - 10, mastX + 24, jibY + 7, C.orangeDark, 2);
  circle(mastX + 24, jibY + 7, 3, C.orangeSoft, C.orangeDark, 1.2);

  // pluma y tirantes
  box(jibL, jibY - 7, jibR - jibL, 14, C.fill, C.stroke);
  line(jibL + 8, jibY - 15, jibR, jibY - 6, C.text, 1);
  line(jibL + 8, jibY - 15, mastX, jibY - 7, C.text, 1);

  // contrapeso 50 g y poleas
  box(jibL - 4, jibY - 6, 14, 12, C.slate, C.text);
  mono(9, true); ctx.fillStyle = C.text; ctx.fillText('50g', jibL - 14, jibY - 12);
  circle(mastX - 14, jibY - 2, 6, C.bg, C.text, 1.5);
  circle(mastX + 6, jibY + 3, 3, C.bg, C.text, 1.2);
  circle(jibR, jibY, 11, C.orangeSoft, C.orange, 2.5);
  circle(jibR, jibY, 4, C.orange);

  // cable, gancho y carga (según Z)
  const hx = jibR + 10;
  const hookY = (gy - 58) - zIdx * 32;
  line(hx, jibY, hx, hookY, C.orange, 1.5);
  box(hx - 5, hookY, 10, 7, C.orangeSoft, C.orange);
  ctx.strokeStyle = C.orange; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(hx, hookY + 14, 6, Math.PI * 1.2, Math.PI * 2.7); ctx.stroke();
  box(hx - 9, hookY + 22, 18, 14, interlock ? C.red : C.orange, interlock ? C.redDark : C.orangeDark);
  mono(7, true); ctx.fillStyle = '#ffffff'; ctx.fillText('CARGA', hx - 9, hookY + 32);

  // niveles Z
  mono(8, true);
  for (let i = 0; i < 4; i++) {
    const ty = (gy - 58) - i * 32;
    const on = i === zIdx;
    ctx.fillStyle = on ? C.orange : C.off;
    ctx.fillRect(W - 40, ty, 6, on ? 3 : 1);
    ctx.fillText(`Z${i}${on ? '◄' : ''}`, W - 32, ty + 3);
  }

  // cotas
  mono(9, true); ctx.fillStyle = C.dim;
  arrow(jibL, 36, mastX, 36);  ctx.fillText('60mm', jibL + 6, 32);
  arrow(mastX, 36, jibR, 36);  ctx.fillText('140 mm', mastX + 45, 32);
  [jibL, mastX, jibR].forEach(x => line(x, 28, x, jibY - 16, C.guide, 1, [2, 3]));
  arrow(24, gy, 24, jibY);     ctx.fillText('210mm', 4, (gy + jibY) / 2 + 3);
  line(24, jibY, jibL - 6, jibY, C.guide, 1, [2, 3]);
  arrow(58, gy - baseH, 58, jibY + 7);  ctx.fillText('165mm', 38, (gy - baseH + jibY) / 2 + 12);
  arrow(58, gy, 58, gy - baseH);        ctx.fillText('45mm', 34, gy - 12);
  line(58, gy - baseH, mastX - baseW / 2, gy - baseH, C.guide, 1, [2, 3]);
  arrow(mastX - baseW / 2, gy + 10, mastX + baseW / 2, gy + 10);
  ctx.fillStyle = C.panel; ctx.fillRect(mastX - 24, gy + 4, 48, 12);
  ctx.fillStyle = C.dim; ctx.fillText('160 mm', mastX - 22, gy + 13);

  if (interlock) {
    mono(9, true); ctx.fillStyle = C.red;
    ctx.fillText('INTERLOCK: sube a Z1', 235, 130);
  }

  // =================== VISTA SUPERIOR (giro) ===================
  const t0 = 270;
  panel(t0, 190, 'VISTA SUPERIOR (GIRO 180°)');
  const cx = 110, cy = t0 + 108, ks = 0.5, R = 140 * ks;
  box(cx - 40 - 6, cy - 40 - 6, 92, 92, C.fill, C.stroke);
  circle(cx, cy, 36, C.blueSoft, C.blue, 1);

  ctx.strokeStyle = C.off; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.arc(cx, cy, R + 10, -Math.PI, 0); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, R + 10, -(s1Angle * Math.PI) / 180, 0); ctx.stroke();

  mono(8, true);
  GIRO_MAP.forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const on = i === gIdx;
    line(cx + Math.cos(a) * (R + 6), cy - Math.sin(a) * (R + 6),
         cx + Math.cos(a) * (R + 16), cy - Math.sin(a) * (R + 16), on ? C.blue : C.off, 1.5);
    ctx.fillStyle = on ? C.blue : C.mute;
    ctx.fillText(`G${i}`, cx + Math.cos(a) * (R + 24) - 6, cy - Math.sin(a) * (R + 24) + 3);
  });

  const ang = (s1Angle * Math.PI) / 180;
  const tipX = cx + Math.cos(ang) * R, tipY = cy - Math.sin(ang) * R;
  const backX = cx - Math.cos(ang) * 60 * ks, backY = cy + Math.sin(ang) * 60 * ks;
  line(backX, backY, tipX, tipY, C.blue, 5);
  circle(backX, backY, 4, C.orange);
  circle(tipX, tipY, 6, interlock ? C.red : C.orange, interlock ? C.redDark : C.orangeDark, 1.5);
  circle(cx, cy, 6, C.slate, C.off, 1.5);

  // estado actual
  mono(10, true);
  ctx.fillStyle = C.blue;   ctx.fillText(`GIRO  G${gIdx} = ${s1Angle}°`, 14, t0 + 34);
  ctx.fillStyle = C.orange; ctx.fillText(`IZAJE Z${zIdx} = ${s2Angle}°`, 14, t0 + 48);

  // especificaciones reales
  const sx = 250, sy = t0 + 34, sw = W - sx - 12, sh = 142;
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = C.line; ctx.lineWidth = 1;
  ctx.fillRect(sx, sy, sw, sh); ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
  mono(10, true); ctx.fillStyle = C.text; ctx.fillText('ESPECIFICACIONES', sx + 8, sy + 18);
  mono(9, false); ctx.fillStyle = C.mute;
  ['• Carga segura: 20–50 g', '  (brazo 140 mm)', '• Base 160×160 mm c/', '  350 g lastre interno', '• Servo 3 atrás =', '  contrapeso + hilo cte.', '• 3× SG90']
    .forEach((t, i) => ctx.fillText(t, sx + 8, sy + 38 + i * 14));

  // =================== PWM ===================
  drawPwmWave(ctx, 14, 486, W - 28, 30, 'PWM servo 1 (giro)', pwm1, C.blue);
  drawPwmWave(ctx, 14, 534, W - 28, 30, 'PWM servo 2 (izaje)', pwm2, C.orange);
}

function drawPwmWave(ctx, x, y, width, height, label, pulseUs, color) {
  const dutyRatio = Math.min(0.85, Math.max(0.1, pulseUs / 3000));
  const periodPx = Math.floor(width / 3);

  ctx.fillStyle = color;
  ctx.font = 'bold 10px monospace';
  ctx.fillText(`${label}: ${pulseUs} µs (${(pulseUs / 200).toFixed(1)}% @ 50 Hz)`, x, y - 3);

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();

  for (let i = 0; i < 3; i++) {
    const startX = x + i * periodPx;
    const highW = Math.floor(periodPx * dutyRatio);
    const endX = startX + periodPx;

    ctx.moveTo(startX, y + height - 4);
    ctx.lineTo(startX, y + 6);
    ctx.lineTo(startX + highW, y + 6);
    ctx.lineTo(startX + highW, y + height - 4);
    ctx.lineTo(endX, y + height - 4);
  }
  ctx.stroke();
}
