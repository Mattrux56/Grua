# Diseño Lógico y Mecánico — Entrega 1
## Sistema de Control de Grúa Torre Biaxial (2 Servos SG90) con Lógica Binaria de 4 Bits y Red de Compuertas

---

## 1. ¿Cómo funciona la Grúa con las piezas que tenemos?

En las fotos del inventario tenemos **2 micro servomotores azules TowerPro SG90**. Cada servomotor tiene un eje blanco que gira entre $0^\circ$ y $180^\circ$ según el pulso analógico PWM que le envíe el ESP32.

La grúa es una **grúa torre** (según el boceto): un **mástil vertical** sobre un **pedestal** (una caja). En la parte alta del mástil hay un **engranaje** que hace girar una **pluma horizontal**. En un extremo de la pluma hay una **polea**, y por ahí cuelga el **cable** con el **gancho** y la **carga**. En el otro extremo de la pluma hay una **caja** con el servo del carrete (cabrestante) y/o el contrapeso.

Como tenemos **2 servomotores**, la grúa realiza **2 movimientos reales**:

1. **Servo 1 — GIRO de la pluma (movimiento horizontal), GPIO 25:**
   - Hace girar la pluma sobre el mástil (directo, o a través del engranaje del boceto).
   - 4 posiciones: **G0 = $0^\circ$** (home, pluma sobre el pedestal), **G1 = $45^\circ$**, **G2 = $90^\circ$**, **G3 = $135^\circ$**.

2. **Servo 2 — IZAJE (movimiento vertical), GPIO 26:**
   - El servo lleva un **carrete** que enrolla o desenrolla el cable que pasa por la polea.
   - 4 niveles: **Z0 = $0^\circ$** (gancho abajo), **Z1 = $45^\circ$**, **Z2 = $90^\circ$**, **Z3 = $135^\circ$** (gancho arriba).

### Nota mecánica: recorrido del cable y el engranaje

El SG90 **solo gira $180^\circ$**, así que el cable que se enrolla en el carrete mide:

$$\text{recorrido} = r \cdot \theta \quad (\theta \text{ en radianes})$$

Con $\theta = 135^\circ = \dfrac{3\pi}{4} \approx 2{,}356\text{ rad}$ y un recorrido útil de unos $10\text{ cm}$:

$$r = \frac{10\text{ cm}}{2{,}356} \approx 4{,}2\text{ cm} \quad (\text{diámetro del carrete} \approx 8{,}5\text{ cm})$$

Cada nivel sube el gancho $\approx 3{,}3\text{ cm}$ (Z0 = $0$, Z1 = $3{,}3$, Z2 = $6{,}7$, Z3 = $10\text{ cm}$). Un carrete de $8{,}5\text{ cm}$ de diámetro es grande para el brazo del SG90; si se quiere un carrete menor, el **engranaje del boceto puede servir como reducción o transmisión**: con una relación $2{:}1$ el carrete gira el doble del ángulo del servo y basta $r \approx 2{,}1\text{ cm}$. El mismo tipo de engranaje sirve para transmitir el giro del Servo 1 a la pluma en el extremo del mástil.

---

## 2. Modo 1: Lógica Binaria Directa (4 Bits)

En el **Modo 1**, los 4 pulsadores de tu placa soldada representan directamente un número binario de 4 bits (la salida es igual a la entrada):

$$B = B_3 B_2 B_1 B_0 \quad \text{donde } N = 8 B_3 + 4 B_2 + 2 B_1 + B_0 \in [0, 15]$$

### División de los 4 Bits:
- **Bits Superiores ($B_3 B_2$) $\rightarrow$ Servo 1 (GIRO de la pluma, G):**
  - `00` $\rightarrow$ G0 = $0^\circ$ (home)
  - `01` $\rightarrow$ G1 = $45^\circ$
  - `10` $\rightarrow$ G2 = $90^\circ$
  - `11` $\rightarrow$ G3 = $135^\circ$

- **Bits Inferiores ($B_1 B_0$) $\rightarrow$ Servo 2 (IZAJE del gancho, Z):**
  - `00` $\rightarrow$ Z0 = $0^\circ$ (gancho abajo)
  - `01` $\rightarrow$ Z1 = $45^\circ$
  - `10` $\rightarrow$ Z2 = $90^\circ$
  - `11` $\rightarrow$ Z3 = $135^\circ$ (gancho arriba)

Pulso PWM: $t = 500 + \text{ángulo} \cdot 1900/180\ \mu\text{s}$.

### Tabla de las 16 Combinaciones Binarias (Modo 1)

| Decimal | $B_3$ | $B_2$ | $B_1$ | $B_0$ | Servo 1 (Giro) | Pulso PWM S1 | Servo 2 (Izaje) | Pulso PWM S2 | Acción Física |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **0** | 0 | 0 | 0 | 0 | G0 = $0^\circ$ | $500\ \mu\text{s}$ | Z0 = $0^\circ$ | $500\ \mu\text{s}$ | Pluma a $0^\circ$ + gancho abajo |
| **1** | 0 | 0 | 0 | 1 | G0 = $0^\circ$ | $500\ \mu\text{s}$ | Z1 = $45^\circ$ | $975\ \mu\text{s}$ | Pluma a $0^\circ$ + gancho a 1/3 |
| **2** | 0 | 0 | 1 | 0 | G0 = $0^\circ$ | $500\ \mu\text{s}$ | Z2 = $90^\circ$ | $1450\ \mu\text{s}$ | Pluma a $0^\circ$ + gancho a 2/3 |
| **3** | 0 | 0 | 1 | 1 | G0 = $0^\circ$ | $500\ \mu\text{s}$ | Z3 = $135^\circ$ | $1925\ \mu\text{s}$ | Pluma a $0^\circ$ + gancho arriba |
| **4** | 0 | 1 | 0 | 0 | G1 = $45^\circ$ | $975\ \mu\text{s}$ | Z0 = $0^\circ$ | $500\ \mu\text{s}$ | Pluma a $45^\circ$ + gancho abajo |
| **5** | 0 | 1 | 0 | 1 | G1 = $45^\circ$ | $975\ \mu\text{s}$ | Z1 = $45^\circ$ | $975\ \mu\text{s}$ | Pluma a $45^\circ$ + gancho a 1/3 |
| **6** | 0 | 1 | 1 | 0 | G1 = $45^\circ$ | $975\ \mu\text{s}$ | Z2 = $90^\circ$ | $1450\ \mu\text{s}$ | Pluma a $45^\circ$ + gancho a 2/3 |
| **7** | 0 | 1 | 1 | 1 | G1 = $45^\circ$ | $975\ \mu\text{s}$ | Z3 = $135^\circ$ | $1925\ \mu\text{s}$ | Pluma a $45^\circ$ + gancho arriba |
| **8** | 1 | 0 | 0 | 0 | G2 = $90^\circ$ | $1450\ \mu\text{s}$ | Z0 = $0^\circ$ | $500\ \mu\text{s}$ | Pluma a $90^\circ$ + gancho abajo |
| **9** | 1 | 0 | 0 | 1 | G2 = $90^\circ$ | $1450\ \mu\text{s}$ | Z1 = $45^\circ$ | $975\ \mu\text{s}$ | Pluma a $90^\circ$ + gancho a 1/3 |
| **10** | 1 | 0 | 1 | 0 | G2 = $90^\circ$ | $1450\ \mu\text{s}$ | Z2 = $90^\circ$ | $1450\ \mu\text{s}$ | Pluma a $90^\circ$ + gancho a 2/3 |
| **11** | 1 | 0 | 1 | 1 | G2 = $90^\circ$ | $1450\ \mu\text{s}$ | Z3 = $135^\circ$ | $1925\ \mu\text{s}$ | Pluma a $90^\circ$ + gancho arriba |
| **12** | 1 | 1 | 0 | 0 | G3 = $135^\circ$ | $1925\ \mu\text{s}$ | Z0 = $0^\circ$ | $500\ \mu\text{s}$ | Pluma a $135^\circ$ + gancho abajo |
| **13** | 1 | 1 | 0 | 1 | G3 = $135^\circ$ | $1925\ \mu\text{s}$ | Z1 = $45^\circ$ | $975\ \mu\text{s}$ | Pluma a $135^\circ$ + gancho a 1/3 |
| **14** | 1 | 1 | 1 | 0 | G3 = $135^\circ$ | $1925\ \mu\text{s}$ | Z2 = $90^\circ$ | $1450\ \mu\text{s}$ | Pluma a $135^\circ$ + gancho a 2/3 |
| **15** | 1 | 1 | 1 | 1 | G3 = $135^\circ$ | $1925\ \mu\text{s}$ | Z3 = $135^\circ$ | $1925\ \mu\text{s}$ | Pluma a $135^\circ$ + gancho arriba |

---

## 3. Modo 2: Lógica por Compuertas (Interlock de Seguridad)

En el **Modo 2**, las 4 entradas ($E_3, E_2, E_1, E_0$) pasan por una **red combinacional de compuertas lógicas (`AND`, `OR`, `NOT`)** que genera el patrón de salida ($S_3 S_2 S_1 S_0$).

### Significado de las Entradas y Salidas:
- **$E_3 E_2$:** giro solicitado (G0..G3). **$E_1 E_0$:** altura solicitada (Z0..Z3).
- **$S_3 S_2$:** giro que se ejecuta. **$S_1 S_0$:** izaje que se ejecuta.

### Interlock de seguridad
Si la pluma **no** está en G0 (home), el gancho **no puede estar en Z0**, porque la carga chocaría con el pedestal o el piso al girar. En ese caso el izaje sube como mínimo a **Z1**. Si G = G0, la altura pasa tal cual. El giro siempre pasa igual.

Sea $F = E_3 + E_2$ ("pluma fuera de home"). Entonces $S_3 = E_3$, $S_2 = E_2$, $S_1 = E_1$ y $S_0 = E_0 + F \cdot \overline{E_1}$ (si se pidió Z0 estando fuera de home, $E_1 = 0$ y se fuerza $S_0 = 1$).

### Tabla de Verdad del Circuito de Compuertas

| # | $E_3$ | $E_2$ | $E_1$ | $E_0$ | $S_3$ | $S_2$ | $S_1$ | $S_0$ | Patrón Generado | Comportamiento de la Grúa |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :---: | :--- |
| 0 | 0 | 0 | 0 | 0 | **0** | **0** | **0** | **0** | `0000` (0) | Pluma a $0^\circ$ + gancho abajo |
| 1 | 0 | 0 | 0 | 1 | **0** | **0** | **0** | **1** | `0001` (1) | Pluma a $0^\circ$ + gancho a 1/3 |
| 2 | 0 | 0 | 1 | 0 | **0** | **0** | **1** | **0** | `0010` (2) | Pluma a $0^\circ$ + gancho a 2/3 |
| 3 | 0 | 0 | 1 | 1 | **0** | **0** | **1** | **1** | `0011` (3) | Pluma a $0^\circ$ + gancho arriba |
| 4 | 0 | 1 | 0 | 0 | **0** | **1** | **0** | **1** | `0101` (5) | Pluma a $45^\circ$ + gancho a 1/3 — **INTERLOCK**: se pidió Z0, sube a Z1 |
| 5 | 0 | 1 | 0 | 1 | **0** | **1** | **0** | **1** | `0101` (5) | Pluma a $45^\circ$ + gancho a 1/3 |
| 6 | 0 | 1 | 1 | 0 | **0** | **1** | **1** | **0** | `0110` (6) | Pluma a $45^\circ$ + gancho a 2/3 |
| 7 | 0 | 1 | 1 | 1 | **0** | **1** | **1** | **1** | `0111` (7) | Pluma a $45^\circ$ + gancho arriba |
| 8 | 1 | 0 | 0 | 0 | **1** | **0** | **0** | **1** | `1001` (9) | Pluma a $90^\circ$ + gancho a 1/3 — **INTERLOCK**: se pidió Z0, sube a Z1 |
| 9 | 1 | 0 | 0 | 1 | **1** | **0** | **0** | **1** | `1001` (9) | Pluma a $90^\circ$ + gancho a 1/3 |
| 10 | 1 | 0 | 1 | 0 | **1** | **0** | **1** | **0** | `1010` (10) | Pluma a $90^\circ$ + gancho a 2/3 |
| 11 | 1 | 0 | 1 | 1 | **1** | **0** | **1** | **1** | `1011` (11) | Pluma a $90^\circ$ + gancho arriba |
| 12 | 1 | 1 | 0 | 0 | **1** | **1** | **0** | **1** | `1101` (13) | Pluma a $135^\circ$ + gancho a 1/3 — **INTERLOCK**: se pidió Z0, sube a Z1 |
| 13 | 1 | 1 | 0 | 1 | **1** | **1** | **0** | **1** | `1101` (13) | Pluma a $135^\circ$ + gancho a 1/3 |
| 14 | 1 | 1 | 1 | 0 | **1** | **1** | **1** | **0** | `1110` (14) | Pluma a $135^\circ$ + gancho a 2/3 |
| 15 | 1 | 1 | 1 | 1 | **1** | **1** | **1** | **1** | `1111` (15) | Pluma a $135^\circ$ + gancho arriba |

Solo las filas 4, 8 y 12 difieren de la entrada: son los casos en que el interlock levanta el gancho de Z0 a Z1.

---

## 4. Simplificación por Mapas de Karnaugh

Mapas con filas $E_3 E_2$ y columnas $E_1 E_0$ (orden Gray `00 01 11 10`).

### 4.1 Salida $S_3$ (Minitérminos: $m_8, m_9, m_{10}, m_{11}, m_{12}, m_{13}, m_{14}, m_{15}$)

| $E_3E_2 \backslash E_1E_0$ | 00 | 01 | 11 | 10 |
| :-: | :-: | :-: | :-: | :-: |
| 00 | 0 | 0 | 0 | 0 |
| 01 | 0 | 0 | 0 | 0 |
| 11 | 1 | 1 | 1 | 1 |
| 10 | 1 | 1 | 1 | 1 |

Un solo grupo de 8 (filas `11` y `10`):
$$S_3 = E_3$$

### 4.2 Salida $S_2$ (Minitérminos: $m_4, m_5, m_6, m_7, m_{12}, m_{13}, m_{14}, m_{15}$)

| $E_3E_2 \backslash E_1E_0$ | 00 | 01 | 11 | 10 |
| :-: | :-: | :-: | :-: | :-: |
| 00 | 0 | 0 | 0 | 0 |
| 01 | 1 | 1 | 1 | 1 |
| 11 | 1 | 1 | 1 | 1 |
| 10 | 0 | 0 | 0 | 0 |

Un solo grupo de 8 (filas `01` y `11`):
$$S_2 = E_2$$

### 4.3 Salida $S_1$ (Minitérminos: $m_2, m_3, m_6, m_7, m_{10}, m_{11}, m_{14}, m_{15}$)

| $E_3E_2 \backslash E_1E_0$ | 00 | 01 | 11 | 10 |
| :-: | :-: | :-: | :-: | :-: |
| 00 | 0 | 0 | 1 | 1 |
| 01 | 0 | 0 | 1 | 1 |
| 11 | 0 | 0 | 1 | 1 |
| 10 | 0 | 0 | 1 | 1 |

Un solo grupo de 8 (columnas `11` y `10`):
$$S_1 = E_1$$

### 4.4 Salida $S_0$ (Minitérminos: $m_1, m_3, m_4, m_5, m_7, m_8, m_9, m_{11}, m_{12}, m_{13}, m_{15}$)

| $E_3E_2 \backslash E_1E_0$ | 00 | 01 | 11 | 10 |
| :-: | :-: | :-: | :-: | :-: |
| 00 | 0 | 1 | 1 | 0 |
| 01 | 1 | 1 | 1 | 0 |
| 11 | 1 | 1 | 1 | 0 |
| 10 | 1 | 1 | 1 | 0 |

Implicantes primos (los tres son esenciales):
- $E_0$: columnas `01` y `11` (8 celdas).
- $E_2 \cdot \overline{E_1}$: $m_4, m_5, m_{12}, m_{13}$ (único que cubre $m_4$).
- $E_3 \cdot \overline{E_1}$: $m_8, m_9, m_{12}, m_{13}$ (único que cubre $m_8$).

$$S_0 = E_0 + (E_3 \cdot \overline{E_1}) + (E_2 \cdot \overline{E_1}) = E_0 + (E_3 + E_2)\cdot\overline{E_1}$$

### 4.5 Resumen de la red de compuertas

| Salida | Ecuación | Compuertas |
| :-: | :--- | :--- |
| $S_3$ | $E_3$ | cable directo |
| $S_2$ | $E_2$ | cable directo |
| $S_1$ | $E_1$ | cable directo |
| $S_0$ | $E_0 + (E_3 + E_2)\cdot\overline{E_1}$ | 1 `NOT`, 2 `OR`, 1 `AND` |
