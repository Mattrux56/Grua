// Lógica digital: red de compuertas y cálculo de salidas/ángulos

// Red AND/OR/NOT con interlock: si la pluma no está en G0 (E3+E2 = 1)
// el gancho no puede estar en Z0, así que sube a Z1.
function evaluateLogicGates(e3, e2, e1, e0) {
  const outOfHome = (e3 | e2);          // OR
  const notE1 = e1 === 0 ? 1 : 0;       // NOT
  const and0 = (outOfHome & notE1);     // AND

  const s3 = e3;
  const s2 = e2;
  const s1 = e1;
  const s0 = (e0 | and0);               // OR

  return { s3, s2, s1, s0, notE1, outOfHome, and0 };
}

function recalculateSystem() {
  const e3 = state.inputs[3];
  const e2 = state.inputs[2];
  const e1 = state.inputs[1];
  const e0 = state.inputs[0];

  const gateInfo = evaluateLogicGates(e3, e2, e1, e0);

  if (state.mode === 'BINARY') {
    state.outputs = [e0, e1, e2, e3];
  } else {
    state.outputs = [gateInfo.s0, gateInfo.s1, gateInfo.s2, gateInfo.s3];
  }

  const idxS1 = (state.outputs[3] << 1) | state.outputs[2];
  const idxS2 = (state.outputs[1] << 1) | state.outputs[0];
  state.servo1Angle = GIRO_MAP[idxS1];
  state.servo2Angle = IZAJE_MAP[idxS2];

  renderUI(gateInfo);
  sendToEsp32IfConnected();
  publishToWokwiLive();
}
