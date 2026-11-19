// Acciones del usuario: modo, bits, presets y cruceta

function setMode(newMode) {
  state.mode = newMode;
  const btnBin = document.getElementById('btn-mode-binary');
  const btnGates = document.getElementById('btn-mode-gates');

  if (newMode === 'BINARY') {
    btnBin.className = 'btn-tab active-black';
    btnGates.className = 'btn-tab inactive-white';
  } else {
    btnBin.className = 'btn-tab inactive-white';
    btnGates.className = 'btn-tab active-black';
  }

  recalculateSystem();
}

function toggleBit(bitIndex, forceGatesMode = false) {
  if (forceGatesMode && state.mode !== 'GATES') {
    state.mode = 'GATES';
    setMode('GATES');
  }
  state.inputs[bitIndex] = state.inputs[bitIndex] === 1 ? 0 : 1;
  recalculateSystem();
}

function setRawInputs(b3, b2, b1, b0) {
  state.inputs = [b0, b1, b2, b3];
  recalculateSystem();
}

// Cruceta: mueve la ENTRADA por pasos. Giro = bits [b3 b2] (0..3), izaje = bits [b1 b0] (0..3).
function moveDpad(dir) {
  let g = (state.inputs[3] << 1) | state.inputs[2];
  let z = (state.inputs[1] << 1) | state.inputs[0];
  if (dir === 'home') { g = 0; z = 0; }
  else if (dir === 'left')  g = Math.max(0, g - 1);
  else if (dir === 'right') g = Math.min(3, g + 1);
  else if (dir === 'up')    z = Math.min(3, z + 1);
  else if (dir === 'down')  z = Math.max(0, z - 1);
  state.inputs = [z & 1, z >> 1, g & 1, g >> 1];
  recalculateSystem();
}

document.addEventListener('keydown', (ev) => {
  if (ev.target && ['INPUT', 'TEXTAREA'].includes(ev.target.tagName)) return;
  const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', Home: 'home' };
  const dir = map[ev.key];
  if (!dir) return;
  ev.preventDefault();
  moveDpad(dir);
});
