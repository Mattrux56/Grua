// Dibujo de la grúa en el canvas (vista lateral + vista superior) y ondas PWM

function renderCraneCanvas(s1Angle, s2Angle, pwm1, pwm2, interlock) {
  const canvas = document.getElementById('craneCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#e2e8f0';
  for (let x = 20; x < W; x += 20) {
    for (let y = 20; y < 235; y += 20) {
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Suelo
  ctx.fillStyle = COLOR.ground;
  ctx.fillRect(0, 225, 290, 15);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 225);
  ctx.lineTo(290, 225);
  ctx.stroke();

  const gIdx = GIRO_MAP.indexOf(s1Angle);
  const zIdx = IZAJE_MAP.indexOf(s2Angle);

  // Barra con contorno de color y relleno claro
  const bar = (x1, y1, x2, y2, outer, inner, color, soft) => {
    ctx.lineCap = 'butt';
    ctx.strokeStyle = color;
    ctx.lineWidth = outer;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = soft;
    ctx.lineWidth = inner;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  };

  // ---------- VISTA LATERAL (el cable sube/baja según Z) ----------
  const mastX = 75;
  const jibY = 48;
  const tipX = 240;
  const groundY = 225;

  // Pedestal (caja) + mástil
  ctx.fillStyle = '#475569';
  ctx.fillRect(mastX - 32, 203, 64, groundY - 203);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('PEDESTAL', mastX - 28, 218);
  bar(mastX, 203, mastX, 58, 10, 4, '#475569', '#e2e8f0');

  // Pluma horizontal (azul: la mueve el servo de giro)
  bar(22, jibY, 250, jibY, 10, 4, COLOR.giro, COLOR.giroSoft);

  // Engranaje en lo alto del mástil (gira la pluma)
  ctx.fillStyle = COLOR.giroSoft;
  ctx.strokeStyle = COLOR.giro;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mastX, jibY, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + (s1Angle * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(mastX + Math.cos(a) * 11, jibY + Math.sin(a) * 11);
    ctx.lineTo(mastX + Math.cos(a) * 15, jibY + Math.sin(a) * 15);
    ctx.stroke();
  }
  ctx.fillStyle = COLOR.giro;
  ctx.font = 'bold 8px monospace';
  ctx.fillText('S1', mastX - 5, jibY + 3);

  // Caja en el extremo contrario: servo del carrete (S2) y contrapeso
  ctx.fillStyle = COLOR.izaje;
  ctx.fillRect(12, jibY + 6, 44, 26);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('S2', 28, jibY + 17);
  ctx.font = 'bold 7px monospace';
  ctx.fillText('CARRETE', 15, jibY + 27);

  // Polea en el otro extremo de la pluma
  ctx.fillStyle = COLOR.izajeSoft;
  ctx.strokeStyle = COLOR.izaje;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(tipX, jibY + 11, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Escala de niveles Z0..Z3 (el nivel actual se resalta) y posición del gancho
  const hookY = 190 - zIdx * 33;
  ctx.font = 'bold 8px monospace';
  for (let i = 0; i < 4; i++) {
    const ty = 190 - i * 33;
    const on = i === zIdx;
    ctx.fillStyle = on ? COLOR.izaje : COLOR.off;
    ctx.fillRect(264, ty, 8, on ? 3 : 1);
    ctx.fillText(`Z${i}${on ? ' ◄' : ''}`, 274, ty + 3);
  }

  // Cable, gancho y carga (naranja: los mueve el servo de izaje)
  ctx.strokeStyle = COLOR.izaje;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tipX, jibY + 17);
  ctx.lineTo(tipX, hookY);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(tipX, hookY + 6, 6, Math.PI * 1.1, Math.PI * 2.6);
  ctx.stroke();

  ctx.fillStyle = interlock ? COLOR.alerta : COLOR.izaje;
  ctx.fillRect(tipX - 11, hookY + 13, 22, 22);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px monospace';
  ctx.fillText('CARGA', tipX - 11, hookY + 27);
  if (interlock) {
    ctx.fillStyle = COLOR.alerta;
    ctx.font = 'bold 9px monospace';
    ctx.fillText('INTERLOCK', 150, 150);
    ctx.fillText('sube a Z1', 150, 162);
  }

  // ---------- VISTA SUPERIOR (la pluma gira según G, 0°..135°) ----------
  const cx = 362;
  const cy = 150;
  const R = 58;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(292, 40);
  ctx.lineTo(292, 236);
  ctx.stroke();

  // Arco de recorrido y marcas G0..G3
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(cx, cy, R, -(135 * Math.PI) / 180, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Tramo ya recorrido (azul sólido) hasta la posición actual
  ctx.strokeStyle = COLOR.giro;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, R, -(s1Angle * Math.PI) / 180, 0);
  ctx.stroke();
  ctx.lineWidth = 1;

  ctx.font = 'bold 8px monospace';
  GIRO_MAP.forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const mx = cx + Math.cos(a) * (R + 4);
    const my = cy - Math.sin(a) * (R + 4);
    const on = i === gIdx;
    ctx.strokeStyle = on ? COLOR.giro : COLOR.off;
    ctx.fillStyle = on ? COLOR.giro : '#64748b';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (R - 4), cy - Math.sin(a) * (R - 4));
    ctx.lineTo(mx, my);
    ctx.stroke();
    ctx.fillText(`G${i}`, cx + Math.cos(a) * (R + 8) - 6, cy - Math.sin(a) * (R + 8) + 3);
  });

  const ang = (s1Angle * Math.PI) / 180;
  const jibTipX = cx + Math.cos(ang) * R;
  const jibTipY = cy - Math.sin(ang) * R;
  const jibBackX = cx - Math.cos(ang) * 24;
  const jibBackY = cy + Math.sin(ang) * 24;
  bar(jibBackX, jibBackY, jibTipX, jibTipY, 8, 3, COLOR.giro, COLOR.giroSoft);

  ctx.fillStyle = COLOR.izaje;
  ctx.fillRect(jibBackX - 5, jibBackY - 5, 10, 10);
  ctx.fillStyle = interlock ? COLOR.alerta : COLOR.izajeSoft;
  ctx.strokeStyle = interlock ? COLOR.alerta : COLOR.izaje;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(jibTipX, jibTipY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#475569';
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // ---------- Textos ----------
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = COLOR.giro;
  ctx.fillText(`GIRO:  G${gIdx} = ${s1Angle}°`, 14, 18);
  ctx.fillStyle = COLOR.izaje;
  ctx.fillText(`IZAJE: Z${zIdx} = ${s2Angle}° ${zIdx === 0 ? '(abajo)' : zIdx === 3 ? '(arriba)' : ''}`, 14, 34);
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText('VISTA LATERAL', 150, 236);
  ctx.fillText('VISTA SUPERIOR', 300, 236);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 240);
  ctx.lineTo(W, 240);
  ctx.stroke();

  drawPwmWave(ctx, 14, 255, W - 28, 30, 'PWM servo 1 (giro)', pwm1, COLOR.giro);
  drawPwmWave(ctx, 14, 298, W - 28, 30, 'PWM servo 2 (izaje)', pwm2, COLOR.izaje);
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
