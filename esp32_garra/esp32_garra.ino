#include <Arduino.h>
#include <WiFi.h>

// Pines del ESP32 para los 4 pulsadores
const int PIN_B3 = 19; // Bit 3 (MSB) - Morado
const int PIN_B2 = 18; // Bit 2       - Azul
const int PIN_B1 = 17; // Bit 1       - Verde
const int PIN_B0 = 16; // Bit 0 (LSB) - Amarillo

// Interruptor deslizante de Modo en Wokwi (GPIO 4)
const int PIN_SWITCH_MODO = 4;

// Pines PWM del ESP32 para los 2 servomotores SG90 (50 Hz)
const int PIN_SERVO_PINZA = 25; // Servo 1: Pinza (0° = Soltar, 90° = Agarrar)
const int PIN_SERVO_BRAZO = 26; // Servo 2: Brazo (0° = Abajo, 135° = Arriba)

const int MAPA_PINZA[4] = {0, 30, 60, 90};
const int MAPA_BRAZO[4] = {0, 45, 90, 135};

int modoOperacion = 1; // 1 = BINARIO, 2 = COMPUERTAS
int bitsEntrada[4] = {0, 0, 0, 0}; // [b0, b1, b2, b3]
int prevLecturaBtn[4] = {0, 0, 0, 0};
int ultimoSwitch = -1;

int anguloPinzaActual = 0;
int anguloBrazoActual = 0;

// Cliente Wi-Fi + MQTT ligero (sin librerías externas) para sincronizar con index.html
WiFiClient netClient;
const char* MQTT_HOST = "broker.hivemq.com";
const int   MQTT_PORT = 1883;
const char* TOPIC_CMD   = "ed-garra-luist-2026/cmd";
const char* TOPIC_STATE = "ed-garra-luist-2026/state";
unsigned long lastPingMs = 0;
unsigned long lastReconnectMs = 0;

uint32_t anguloADuty16Bits(int angulo) {
  angulo = constrain(angulo, 0, 180);
  uint32_t pulsoUs = 500 + ((uint32_t)angulo * 1900) / 180;
  return (pulsoUs * 65535) / 20000;
}

void moverServos(int anguloPinza, int anguloBrazo) {
  anguloPinzaActual = constrain(anguloPinza, 0, 90);
  anguloBrazoActual = constrain(anguloBrazo, 0, 135);
  ledcWrite(PIN_SERVO_PINZA, anguloADuty16Bits(anguloPinzaActual));
  ledcWrite(PIN_SERVO_BRAZO, anguloADuty16Bits(anguloBrazoActual));
}

void evaluarCompuertas(int e3, int e2, int e1, int e0, int &s3, int &s2, int &s1, int &s0) {
  int notE1 = !e1;
  int notE3 = !e3;

  s3 = e3 | (e2 & e1);    // S3 = E3 + (E2 · E1)
  s2 = e2 | (e3 & notE1); // S2 = E2 + (E3 · E1')
  s1 = e1 | (e3 & e0);    // S1 = E1 + (E3 · E0)
  s0 = e0 | (e2 & notE3); // S0 = E0 + (E2 · E3')
}

// Publica el estado actual hacia index.html
void mqttPublishState() {
  if (!netClient.connected()) return;
  char payload[16];
  snprintf(payload, sizeof(payload), "M%d:%d%d%d%d",
           modoOperacion, bitsEntrada[3], bitsEntrada[2], bitsEntrada[1], bitsEntrada[0]);

  uint8_t tLen = strlen(TOPIC_STATE);
  uint8_t mLen = strlen(payload);
  uint8_t header[4] = { 0x30, (uint8_t)(2 + tLen + mLen), 0x00, tLen };
  netClient.write(header, 4);
  netClient.write((const uint8_t*)TOPIC_STATE, tLen);
  netClient.write((const uint8_t*)payload, mLen);
}

void actualizarSistema(bool notificarWeb = true) {
  int e3 = bitsEntrada[3];
  int e2 = bitsEntrada[2];
  int e1 = bitsEntrada[1];
  int e0 = bitsEntrada[0];

  int s3, s2, s1, s0;
  if (modoOperacion == 1) {
    s3 = e3; s2 = e2; s1 = e1; s0 = e0;
  } else {
    evaluarCompuertas(e3, e2, e1, e0, s3, s2, s1, s0);
  }

  int idxPinza = (s3 << 1) | s2;
  int idxBrazo = (s1 << 1) | s0;

  moverServos(MAPA_PINZA[idxPinza], MAPA_BRAZO[idxBrazo]);

  Serial.printf("MODO %d (%s) | ENTRADA: %d%d%d%d | SALIDA 4-BIT: %d%d%d%d | SERVO1(PINZA): %d deg | SERVO2(BRAZO): %d deg\n",
                modoOperacion,
                modoOperacion == 1 ? "BINARIO" : "COMPUERTAS",
                e3, e2, e1, e0,
                s3, s2, s1, s0,
                anguloPinzaActual, anguloBrazoActual);

  if (notificarWeb) {
    mqttPublishState();
  }
}

void procesarComando(String linea, bool desdeWeb) {
  linea.trim();
  linea.toUpperCase();
  if (linea.length() == 0) return;

  if (linea == "1") {
    modoOperacion = 1;
    actualizarSistema(!desdeWeb);
    return;
  }
  if (linea == "2") {
    modoOperacion = 2;
    actualizarSistema(!desdeWeb);
    return;
  }

  if ((linea.startsWith("M1:") || linea.startsWith("M2:")) && linea.length() >= 7) {
    modoOperacion = (linea.charAt(1) == '2') ? 2 : 1;
    bitsEntrada[3] = (linea.charAt(3) == '1') ? 1 : 0;
    bitsEntrada[2] = (linea.charAt(4) == '1') ? 1 : 0;
    bitsEntrada[1] = (linea.charAt(5) == '1') ? 1 : 0;
    bitsEntrada[0] = (linea.charAt(6) == '1') ? 1 : 0;
    actualizarSistema(!desdeWeb);
    return;
  }

  if (linea.length() == 4 &&
      (linea.charAt(0) == '0' || linea.charAt(0) == '1') &&
      (linea.charAt(1) == '0' || linea.charAt(1) == '1') &&
      (linea.charAt(2) == '0' || linea.charAt(2) == '1') &&
      (linea.charAt(3) == '0' || linea.charAt(3) == '1')) {
    bitsEntrada[3] = (linea.charAt(0) == '1') ? 1 : 0;
    bitsEntrada[2] = (linea.charAt(1) == '1') ? 1 : 0;
    bitsEntrada[1] = (linea.charAt(2) == '1') ? 1 : 0;
    bitsEntrada[0] = (linea.charAt(3) == '1') ? 1 : 0;
    actualizarSistema(!desdeWeb);
    return;
  }
}

void conectarPuenteWeb() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (netClient.connected()) return;
  if (millis() - lastReconnectMs < 3000) return;
  lastReconnectMs = millis();

  if (!netClient.connect(MQTT_HOST, MQTT_PORT)) return;

  // Enviar paquete MQTT CONNECT
  char cid[20];
  snprintf(cid, sizeof(cid), "wokwi_%04X", (uint16_t)random(0xFFFF));
  uint8_t cidLen = strlen(cid);
  uint8_t connPkt[32] = {
    0x10, (uint8_t)(12 + cidLen),
    0x00, 0x04, 'M', 'Q', 'T', 'T', 0x04, 0x02, 0x00, 0x3C,
    0x00, cidLen
  };
  netClient.write(connPkt, 14);
  netClient.write((const uint8_t*)cid, cidLen);

  delay(100);
  while (netClient.available()) netClient.read(); // Limpiar CONNACK

  // Enviar paquete MQTT SUBSCRIBE a TOPIC_CMD
  uint8_t tLen = strlen(TOPIC_CMD);
  uint8_t subHead[6] = { 0x82, (uint8_t)(5 + tLen), 0x00, 0x01, 0x00, tLen };
  netClient.write(subHead, 6);
  netClient.write((const uint8_t*)TOPIC_CMD, tLen);
  uint8_t qos = 0x00;
  netClient.write(&qos, 1);

  Serial.println(">> [CONECTADO EN VIVO CON INDEX.HTML] Ya puedes dar clic en tu HTML y ver moverse Wokwi.");
  mqttPublishState();
}

void leerPuenteWeb() {
  if (!netClient.connected()) return;

  if (millis() - lastPingMs > 20000) {
    lastPingMs = millis();
    uint8_t ping[2] = { 0xC0, 0x00 };
    netClient.write(ping, 2);
  }

  while (netClient.available() >= 2) {
    uint8_t b0 = netClient.read();
    uint8_t remLen = netClient.read();

    uint8_t buf[128];
    int n = 0;
    unsigned long t0 = millis();
    while (n < remLen && n < 127 && (millis() - t0 < 200)) {
      if (netClient.available()) buf[n++] = netClient.read();
    }

    // Si es un paquete PUBLISH (0x30..0x3F)
    if ((b0 & 0xF0) == 0x30 && n >= 4) {
      int topicLen = (buf[0] << 8) | buf[1];
      int payloadStart = 2 + topicLen;
      if (payloadStart < n) {
        String msg = "";
        for (int i = payloadStart; i < n; i++) {
          msg += (char)buf[i];
        }
        procesarComando(msg, true);
      }
    }
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(PIN_B3, INPUT_PULLDOWN);
  pinMode(PIN_B2, INPUT_PULLDOWN);
  pinMode(PIN_B1, INPUT_PULLDOWN);
  pinMode(PIN_B0, INPUT_PULLDOWN);
  pinMode(PIN_SWITCH_MODO, INPUT_PULLDOWN);

  ledcAttach(PIN_SERVO_PINZA, 50, 16);
  ledcAttach(PIN_SERVO_BRAZO, 50, 16);

  Serial.println("Conectando Wi-Fi virtual de Wokwi (Wokwi-GUEST)...");
  WiFi.begin("Wokwi-GUEST", "", 6);
  unsigned long tStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - tStart < 4000) {
    delay(100);
  }

  actualizarSistema(false);
  conectarPuenteWeb();
}

void loop() {
  conectarPuenteWeb();
  leerPuenteWeb();

  if (Serial.available()) {
    String linea = Serial.readStringUntil('\n');
    procesarComando(linea, false);
  }

  int lecturaSwitch = digitalRead(PIN_SWITCH_MODO);
  if (ultimoSwitch == -1) {
    ultimoSwitch = lecturaSwitch;
  } else if (lecturaSwitch != ultimoSwitch) {
    ultimoSwitch = lecturaSwitch;
    modoOperacion = (lecturaSwitch == HIGH) ? 2 : 1;
    actualizarSistema(true);
  }

  const int pines[4] = {PIN_B0, PIN_B1, PIN_B2, PIN_B3};
  bool huboCambio = false;
  for (int i = 0; i < 4; i++) {
    int lectura = digitalRead(pines[i]);
    if (lectura == HIGH && prevLecturaBtn[i] == LOW) {
      bitsEntrada[i] = !bitsEntrada[i];
      huboCambio = true;
    }
    prevLecturaBtn[i] = lectura;
  }
  if (huboCambio) {
    actualizarSistema(true);
  }
  delay(25);
}