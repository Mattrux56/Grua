# Diseño Lógico y Mecánico — Entrega 1
## Sistema de Control de Garra Biaxial (2 Servos SG90) con Lógica Binaria de 4 Bits y Red de Compuertas

---

## 1. ¿Cómo funciona la Garra con las piezas que tenemos?

En las fotos del inventario tenemos **2 micro servomotores azules TowerPro SG90**. Cada servomotor tiene un eje blanco que gira entre $0^\circ$ y $180^\circ$ según el pulso analógico PWM que le envíe el ESP32.

Como tenemos **2 servomotores**, la garra realiza **2 movimientos reales**:

1. **Servo 1 — Pinza (Agarrar y Soltar):**
   - Mueve las mordazas de la pinza (que se pueden recortar en cartón piedra, MDF o palitos de helado pegados al bracito blanco del Servo 1).
   - **$0^\circ$:** Pinza totalmente abierta (**Soltar**).
   - **$30^\circ$:** Pinza semi-abierta (Agarre amplio).
   - **$60^\circ$:** Pinza en agarre medio.
   - **$90^\circ$:** Pinza totalmente cerrada (**Agarrar firme**).

2. **Servo 2 — Brazo / Base (Subir y Bajar, o Girar):**
   - Como el Servo 1 pesa apenas $9\text{ g}$, el cuerpo del Servo 1 se pega directamente sobre el bracito blanco del Servo 2.
   - Si pegas el Servo 2 acostado (horizontal), el brazo **Sube y Baja** ($0^\circ, 45^\circ, 90^\circ, 135^\circ$).
   - Si pegas el Servo 2 de pie (vertical), el brazo **Gira a la Izquierda y Derecha** ($0^\circ, 45^\circ, 90^\circ, 135^\circ$).
   - **Nota:** El circuito electrónico y el código son **exactamente los mismos**; tú decides al pegarlo si prefieres que el Servo 2 suba/baje o gire izquierda/derecha.

---

## 2. Modo 1: Lógica Binaria Directa (4 Bits)

En el **Modo 1**, los 4 pulsadores de tu placa soldada representan directamente un número binario de 4 bits:

$$B = B_3 B_2 B_1 B_0 \quad \text{donde } N = 8 B_3 + 4 B_2 + 2 B_1 + B_0 \in [0, 15]$$

### División de los 4 Bits:
- **Bits Superiores ($B_3 B_2$) $\rightarrow$ Controlan el Servo 1 (Pinza: Agarrar / Soltar):**
  - `00` ($0_{10}$) $\rightarrow 0^\circ$ (Abierta / Soltar — $0\%$ cierre)
  - `01` ($1_{10}$) $\rightarrow 30^\circ$ (Pre-agarre — $33\%$ cierre)
  - `10` ($2_{10}$) $\rightarrow 60^\circ$ (Agarre medio — $66\%$ cierre)
  - `11` ($3_{10}$) $\rightarrow 90^\circ$ (Cerrada / Agarre firme — $100\%$ cierre)

- **Bits Inferiores ($B_1 B_0$) $\rightarrow$ Controlan el Servo 2 (Brazo: Subir / Bajar):**
  - `00` ($0_{10}$) $\rightarrow 0^\circ$ (Abajo / Nivel base)
  - `01` ($1_{10}$) $\rightarrow 45^\circ$ (Elevación baja)
  - `10` ($2_{10}$) $\rightarrow 90^\circ$ (Elevación media)
  - `11` ($3_{10}$) $\rightarrow 135^\circ$ (Elevación máxima)

### Tabla de las 16 Combinaciones Binarias (Modo 1)

| Decimal | $B_3$ | $B_2$ | $B_1$ | $B_0$ | Servo 1 (Pinza) | Pulso PWM S1 | Servo 2 (Brazo) | Pulso PWM S2 | Acción Física |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **0** | 0 | 0 | 0 | 0 | $0^\circ$ (0%) | $500\ \mu\text{s}$ | $0^\circ$ | $500\ \mu\text{s}$ | Soltar + Brazo abajo (Home) |
| **1** | 0 | 0 | 0 | 1 | $0^\circ$ (0%) | $500\ \mu\text{s}$ | $45^\circ$ | $975\ \mu\text{s}$ | Soltar + Brazo a $45^\circ$ |
| **2** | 0 | 0 | 1 | 0 | $0^\circ$ (0%) | $500\ \mu\text{s}$ | $90^\circ$ | $1450\ \mu\text{s}$ | Soltar + Brazo a $90^\circ$ |
| **3** | 0 | 0 | 1 | 1 | $0^\circ$ (0%) | $500\ \mu\text{s}$ | $135^\circ$ | $1925\ \mu\text{s}$ | Soltar + Brazo arriba ($135^\circ$) |
| **4** | 0 | 1 | 0 | 0 | $30^\circ$ (33%) | $817\ \mu\text{s}$ | $0^\circ$ | $500\ \mu\text{s}$ | Pre-agarre + Brazo abajo |
| **5** | 0 | 1 | 0 | 1 | $30^\circ$ (33%) | $817\ \mu\text{s}$ | $45^\circ$ | $975\ \mu\text{s}$ | Pre-agarre + Brazo a $45^\circ$ |
| **6** | 0 | 1 | 1 | 0 | $30^\circ$ (33%) | $817\ \mu\text{s}$ | $90^\circ$ | $1450\ \mu\text{s}$ | Pre-agarre + Brazo a $90^\circ$ |
| **7** | 0 | 1 | 1 | 1 | $30^\circ$ (33%) | $817\ \mu\text{s}$ | $135^\circ$ | $1925\ \mu\text{s}$ | Pre-agarre + Brazo arriba |
| **8** | 1 | 0 | 0 | 0 | $60^\circ$ (66%) | $1133\ \mu\text{s}$ | $0^\circ$ | $500\ \mu\text{s}$ | Agarre medio + Brazo abajo |
| **9** | 1 | 0 | 0 | 1 | $60^\circ$ (66%) | $1133\ \mu\text{s}$ | $45^\circ$ | $975\ \mu\text{s}$ | Agarre medio + Brazo a $45^\circ$ |
| **10** | 1 | 0 | 1 | 0 | $60^\circ$ (66%) | $1133\ \mu\text{s}$ | $90^\circ$ | $1450\ \mu\text{s}$ | Agarre medio + Brazo a $90^\circ$ |
| **11** | 1 | 0 | 1 | 1 | $60^\circ$ (66%) | $1133\ \mu\text{s}$ | $135^\circ$ | $1925\ \mu\text{s}$ | Agarre medio + Brazo arriba |
| **12** | 1 | 1 | 0 | 0 | $90^\circ$ (100%) | $1450\ \mu\text{s}$ | $0^\circ$ | $500\ \mu\text{s}$ | Agarre firme + Brazo abajo |
| **13** | 1 | 1 | 0 | 1 | $90^\circ$ (100%) | $1450\ \mu\text{s}$ | $45^\circ$ | $975\ \mu\text{s}$ | Agarre firme + Brazo a $45^\circ$ |
| **14** | 1 | 1 | 1 | 0 | $90^\circ$ (100%) | $1450\ \mu\text{s}$ | $90^\circ$ | $1450\ \mu\text{s}$ | Agarre firme + Brazo a $90^\circ$ |
| **15** | 1 | 1 | 1 | 1 | $90^\circ$ (100%) | $1450\ \mu\text{s}$ | $135^\circ$ | $1925\ \mu\text{s}$ | Agarre firme + Brazo arriba |

---

## 3. Modo 2: Lógica por Compuertas (Generación de Patrones de 4 Bits)

En el **Modo 2**, las 4 entradas ($E_3, E_2, E_1, E_0$) pasan por una **red combinacional de compuertas lógicas (`AND`, `OR`, `NOT`)** que sintetiza el patrón de 4 bits de salida ($S_3 S_2 S_1 S_0$).

### Significado de las Entradas en Modo Compuertas:
- **$E_3$:** Orden de **Agarre Firme** (si el brazo está abajo en $E_1=0$, cierra la pinza al máximo $90^\circ$, patrón `1100`).
- **$E_2$:** Orden de **Pre-agarre + Posicionamiento** (cierra la pinza a $30^\circ$ y sube el brazo a $45^\circ$ automáticamente, patrón `0101`).
- **$E_1$:** Orden de **Subir Brazo** (sube a $90^\circ$, y si se combina con $E_2=1$, las compuertas cierran la pinza a $90^\circ$ y suben a $135^\circ$).
- **$E_0$:** Orden de **Elevación Auxiliar ($45^\circ$)** (y si se combina con $E_3=1$, ejecuta agarre firme $90^\circ$ + elevación máxima $135^\circ$, patrón `1111`).

### Tabla de Verdad del Circuito de Compuertas

| # | $E_3$ | $E_2$ | $E_1$ | $E_0$ | $S_3$ | $S_2$ | $S_1$ | $S_0$ | Patrón Generado | Comportamiento de la Garra |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :---: | :--- |
| 0 | 0 | 0 | 0 | 0 | **0** | **0** | **0** | **0** | `0000` (0) | Reposo / Home (Pinza $0^\circ$, Brazo $0^\circ$) |
| 1 | 0 | 0 | 0 | 1 | **0** | **0** | **0** | **1** | `0001` (1) | Elevación baja sin carga (Pinza $0^\circ$, Brazo $45^\circ$) |
| 2 | 0 | 0 | 1 | 0 | **0** | **0** | **1** | **0** | `0010` (2) | Subir brazo abierto (Pinza $0^\circ$, Brazo $90^\circ$) |
| 3 | 0 | 0 | 1 | 1 | **0** | **0** | **1** | **1** | `0011` (3) | Subir brazo al máximo abierto (Pinza $0^\circ$, Brazo $135^\circ$) |
| 4 | 0 | 1 | 0 | 0 | **0** | **1** | **0** | **1** | `0101` (5) | Rutina Pre-agarre: Pinza $30^\circ$ + Brazo se ubica a $45^\circ$ |
| 5 | 0 | 1 | 0 | 1 | **0** | **1** | **0** | **1** | `0101` (5) | Pre-agarre sostenido a $45^\circ$ (Pinza $30^\circ$, Brazo $45^\circ$) |
| 6 | 0 | 1 | 1 | 0 | **1** | **1** | **1** | **1** | `1111` (15) | Subir con pre-agarre: Cierra firme a $90^\circ$ y sube a $135^\circ$ |
| 7 | 0 | 1 | 1 | 1 | **1** | **1** | **1** | **1** | `1111` (15) | Carga asegurada arriba (Pinza $90^\circ$, Brazo $135^\circ$) |
| 8 | 1 | 0 | 0 | 0 | **1** | **1** | **0** | **0** | `1100` (12) | Agarre firme en la base (Pinza $90^\circ$, Brazo $0^\circ$) |
| 9 | 1 | 0 | 0 | 1 | **1** | **1** | **1** | **1** | `1111` (15) | Rutina Agarre Firme + Elevación máxima ($90^\circ$, $135^\circ$) |
| 10 | 1 | 0 | 1 | 0 | **1** | **0** | **1** | **0** | `1010` (10) | Agarre medio a media altura (Pinza $60^\circ$, Brazo $90^\circ$) |
| 11 | 1 | 0 | 1 | 1 | **1** | **0** | **1** | **1** | `1011` (11) | Agarre medio en altura máxima (Pinza $60^\circ$, Brazo $135^\circ$) |
| 12 | 1 | 1 | 0 | 0 | **1** | **1** | **0** | **0** | `1100` (12) | Agarre firme en base (Pinza $90^\circ$, Brazo $0^\circ$) |
| 13 | 1 | 1 | 0 | 1 | **1** | **1** | **1** | **1** | `1111` (15) | Agarre firme en altura máxima (Pinza $90^\circ$, Brazo $135^\circ$) |
| 14 | 1 | 1 | 1 | 0 | **1** | **1** | **1** | **0** | `1110` (14) | Agarre firme a $90^\circ$ de elevación (Pinza $90^\circ$, Brazo $90^\circ$) |
| 15 | 1 | 1 | 1 | 1 | **1** | **1** | **1** | **1** | `1111` (15) | Posición máxima total (Pinza $90^\circ$, Brazo $135^\circ$) |

---

## 4. Simplificación por Mapas de Karnaugh

### 4.1 Salida $S_3$ (Minitérminos: $m_6, m_7, m_8, m_9, m_{10}, m_{11}, m_{12}, m_{13}, m_{14}, m_{15}$)
- **Ecuación simplificada:**
  $$S_3 = E_3 + (E_2 \cdot E_1)$$

### 4.2 Salida $S_2$ (Minitérminos: $m_4, m_5, m_6, m_7, m_8, m_9, m_{12}, m_{13}, m_{14}, m_{15}$)
- **Ecuación simplificada:**
  $$S_2 = E_2 + (E_3 \cdot \overline{E_1})$$

### 4.3 Salida $S_1$ (Minitérminos: $m_2, m_3, m_6, m_7, m_9, m_{10}, m_{11}, m_{13}, m_{14}, m_{15}$)
- **Ecuación simplificada:**
  $$S_1 = E_1 + (E_3 \cdot E_0)$$

### 4.4 Salida $S_0$ (Minitérminos: $m_1, m_3, m_4, m_5, m_6, m_7, m_9, m_{11}, m_{13}, m_{15}$)
- **Ecuación simplificada:**
  $$S_0 = E_0 + (E_2 \cdot \overline{E_3})$$
