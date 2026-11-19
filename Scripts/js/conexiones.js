// Conexiones externas: ESP32 por USB (Web Serial) y puente en vivo con Wokwi (MQTT sobre WebSocket)

async function connectSerial() {
  const btn = document.getElementById('btn-serial');
  if (!('serial' in navigator)) {
    alert('USA CHROME O EDGE PARA CONECTAR POR USB AL ESP32.');
    return;
  }
  try {
    state.serialPort = await navigator.serial.requestPort();
    await state.serialPort.open({ baudRate: 115200 });
    const encoder = new TextEncoderStream();
    encoder.readable.pipeTo(state.serialPort.writable);
    state.serialWriter = encoder.writable.getWriter();
    btn.textContent = 'ESP32 CONECTADO (USB)';
    btn.className = 'btn-ctrl active-black';
    sendToEsp32IfConnected();
  } catch (err) {
    console.warn('Conexión Serial cancelada:', err);
  }
}

async function sendToEsp32IfConnected() {
  if (!state.serialWriter) return;
  try {
    const inBin = `${state.inputs[3]}${state.inputs[2]}${state.inputs[1]}${state.inputs[0]}`;
    const cmd = `MODE:${state.mode};IN:${inBin};S1:${state.servo1Angle};S2:${state.servo2Angle};PAT:${state.outputs[3]}${state.outputs[2]}${state.outputs[1]}${state.outputs[0]}\n`;
    await state.serialWriter.write(cmd);
  } catch (e) {
    console.warn('Error enviando al ESP32:', e);
  }
}

// =========================================================================
// PUENTE EN VIVO CON WOKWI (MQTT SOBRE WEBSOCKET SIN LIBRERÍAS EXTERNAS)
// =========================================================================
let wokwiWs = null;
let wokwiConnected = false;
let suppressEcho = false;
const TOPIC_CMD   = 'ed-garra-luist-2026/cmd';
const TOPIC_STATE = 'ed-garra-luist-2026/state';

function initWokwiLiveBridge() {
  const btn = document.getElementById('btn-wokwi-live');
  if (wokwiWs && (wokwiWs.readyState === WebSocket.OPEN || wokwiWs.readyState === WebSocket.CONNECTING)) {
    publishToWokwiLive();
    return;
  }

  try {
    btn.textContent = 'WOKWI EN VIVO: CONECTANDO...';
    btn.className = 'btn-ctrl inactive-white';
    wokwiWs = new WebSocket('wss://broker.hivemq.com:8884/mqtt', 'mqtt');
    wokwiWs.binaryType = 'arraybuffer';

    wokwiWs.onopen = () => {
      const enc = new TextEncoder();
      const cid = enc.encode('html_' + Math.random().toString(16).slice(2, 8));
      const conn = new Uint8Array(14 + cid.length);
      conn.set([0x10, 12 + cid.length, 0x00, 0x04, 77, 81, 84, 84, 0x04, 0x02, 0x00, 0x3C, 0x00, cid.length]);
      conn.set(cid, 14);
      wokwiWs.send(conn);

      setTimeout(() => {
        if (!wokwiWs || wokwiWs.readyState !== WebSocket.OPEN) return;
        const tBytes = enc.encode(TOPIC_STATE);
        const sub = new Uint8Array(7 + tBytes.length);
        sub.set([0x82, 5 + tBytes.length, 0x00, 0x01, 0x00, tBytes.length]);
        sub.set(tBytes, 6);
        sub[6 + tBytes.length] = 0x00;
        wokwiWs.send(sub);

        wokwiConnected = true;
        btn.textContent = 'WOKWI EN VIVO: SINCRONIZADO';
        btn.className = 'btn-ctrl active-black';
        publishToWokwiLive();
      }, 250);
    };

    wokwiWs.onmessage = (evt) => {
      const data = new Uint8Array(evt.data);
      if (data.length >= 4 && (data[0] & 0xF0) === 0x30) {
        const topicLen = (data[2] << 8) | data[3];
        const payloadBytes = data.slice(4 + topicLen);
        const msg = new TextDecoder().decode(payloadBytes).trim();
        if ((msg.startsWith('M1:') || msg.startsWith('M2:')) && msg.length >= 7) {
          suppressEcho = true;
          state.mode = msg.charAt(1) === '2' ? 'GATES' : 'BINARY';
          state.inputs[3] = msg.charAt(3) === '1' ? 1 : 0;
          state.inputs[2] = msg.charAt(4) === '1' ? 1 : 0;
          state.inputs[1] = msg.charAt(5) === '1' ? 1 : 0;
          state.inputs[0] = msg.charAt(6) === '1' ? 1 : 0;
          const btnBin = document.getElementById('btn-mode-binary');
          const btnGates = document.getElementById('btn-mode-gates');
          if (state.mode === 'BINARY') {
            btnBin.className = 'btn-tab active-black';
            btnGates.className = 'btn-tab inactive-white';
          } else {
            btnBin.className = 'btn-tab inactive-white';
            btnGates.className = 'btn-tab active-black';
          }
          recalculateSystem();
          suppressEcho = false;
        }
      }
    };

    wokwiWs.onclose = () => {
      wokwiConnected = false;
      btn.textContent = 'WOKWI EN VIVO: RECONECTAR';
      btn.className = 'btn-ctrl inactive-white';
    };

    wokwiWs.onerror = () => {
      wokwiConnected = false;
      btn.textContent = 'WOKWI: SIN RED (USA DATOS)';
      btn.className = 'btn-ctrl inactive-white';
    };
  } catch (e) {
    console.warn('Error WebSocket Wokwi:', e);
  }
}

function publishToWokwiLive() {
  if (suppressEcho || !wokwiConnected || !wokwiWs || wokwiWs.readyState !== WebSocket.OPEN) return;
  try {
    const enc = new TextEncoder();
    const inBin = `${state.inputs[3]}${state.inputs[2]}${state.inputs[1]}${state.inputs[0]}`;
    const cmd = `${state.mode === 'BINARY' ? 'M1' : 'M2'}:${inBin}`;
    const tBytes = enc.encode(TOPIC_CMD);
    const mBytes = enc.encode(cmd);
    const pub = new Uint8Array(4 + tBytes.length + mBytes.length);
    pub[0] = 0x30;
    pub[1] = 2 + tBytes.length + mBytes.length;
    pub[2] = 0x00;
    pub[3] = tBytes.length;
    pub.set(tBytes, 4);
    pub.set(mBytes, 4 + tBytes.length);
    wokwiWs.send(pub);
  } catch (e) {
    console.warn('Error publicando a Wokwi:', e);
  }
}

setInterval(() => {
  if (wokwiConnected && wokwiWs && wokwiWs.readyState === WebSocket.OPEN) {
    wokwiWs.send(new Uint8Array([0xC0, 0x00]));
  }
}, 20000);
