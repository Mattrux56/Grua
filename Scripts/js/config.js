// Configuración global y estado compartido (se carga primero)
// Servo 1 = GIRO de la pluma (G0..G3), Servo 2 = IZAJE del gancho (Z0..Z3)

const state = {
  mode: 'BINARY',
  inputs: [0, 0, 0, 0],
  outputs: [0, 0, 0, 0],
  servo1Angle: 0,
  servo2Angle: 0,
  serialPort: null,
  serialWriter: null
};

const COLOR = { giro: '#2563eb', giroSoft: '#dbeafe', izaje: '#ea580c', izajeSoft: '#ffedd5', alerta: '#dc2626', off: '#94a3b8', ink: '#0f172a', ground: '#e2e8f0' };
const GIRO_MAP  = [0, 45, 90, 135];
const IZAJE_MAP = [0, 45, 90, 135];

function angleToPwmUs(angle) {
  return Math.round(500 + (angle / 180) * 1900);
}
