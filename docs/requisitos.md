# Auditoría de Requisitos y Matriz de Trazabilidad

## 1. Marco Conceptual: Verificación y Validación Temprana (ISTQB v4.0.1)

La auditoría estática de requisitos combina dos perspectivas complementarias de calidad de software antes de escribir o ejecutar pruebas dinámicas:

- **Verificación (*"¿Estamos construyendo el producto correctamente?"*):** Evalúa si los artefactos (especificaciones y código en `src/descuentos.js`) cumplen con los estándares de calidad documental (claridad, completitud, consistencia, verificabilidad) y con las reglas técnicas definidas.
- **Validación (*"¿Estamos construyendo el producto correcto?"*):** Evalúa si las reglas de descuento especificadas satisfacen las necesidades comerciales reales de la tienda digital y evitan pérdidas financieras o comportamientos inesperados para el usuario final.

---

## 2. Análisis de Requisitos Originales (`R-01` a `R-04`) y Propuesta Verificable (`RF-01` a `RF-04`)

### R-01 -> RF-01 (Rendimiento del cálculo)
- **Requisito original (R-01):** *«El descuento debe calcularse rápidamente»*.
- **Problema identificado (Ambigüedad / No verificable):** El adverbio *"rápidamente"* es subjetivo y carece de un umbral cuantitativo o métrica de tiempo de respuesta, lo que impide determinar objetivamente si el sistema aprueba o falla una prueba de rendimiento.
- **Impacto:** Imposibilidad de definir criterios de aceptación de rendimiento (SLA) o pruebas de carga automatizadas.
- **Propuesta verificable (RF-01) / RNF-01:** La función `calcularDescuento(precio, porcentaje, esVip)` debe ejecutarse con complejidad temporal $O(1)$ y retornar el resultado en un tiempo máximo de **1 ms** por invocación individual (o menor a **50 ms** en el percentil 99 al integrarse en el servicio de *checkout* bajo una carga normal de hasta 100 solicitudes concurrentes).
- **Supuesto de negocio pendiente de confirmación:**
  - *S-01:* Confirmar con arquitectura/negocio el umbral exacto de latencia aceptable en el flujo de *checkout* y el volumen esperado de transacciones por segundo.

---

### R-02 -> RF-02 (Beneficio para clientes VIP)
- **Requisito original (R-02):** *«Los clientes importantes obtendrán un descuento especial»*.
- **Problema identificado (Subjetividad e Incompletitud):** No se define qué criterio clasifica a un cliente como *"importante"*, ni en qué consiste el *"descuento especial"* (¿monto fijo o porcentaje adicional?, ¿se aplica antes o después del descuento porcentual?, ¿requiere un monto mínimo de compra?).
- **Impacto:** En `src/descuentos.js`, el desarrollador asumió arbitrariamente `if (esVip == true) descuento = descuento + 10;`, otorgando un bono fijo de 10 unidades monetarias sin validar si la compra es menor o igual a 10 (lo que genera totales negativos).
- **Propuesta verificable (RF-02):** Cuando el parámetro booleano `esVip` sea estrictamente `true` (`esVip === true`), el sistema aplicará un beneficio adicional sobre el descuento porcentual base. En la implementación actual se contempla un bono fijo de **10 unidades monetarias**, sujeto a las restricciones de tope máximo de descuento definidas en `RF-03`.
- **Supuestos de negocio pendientes de confirmación:**
  - *S-02a:* Confirmar con el negocio si el beneficio VIP corresponde efectivamente a un monto fijo de `10` unidades monetarias o a un porcentaje adicional.
  - *S-02b:* Confirmar si existe un monto mínimo de `precio` para habilitar el bono VIP de `10` (por ejemplo, compras superiores a `50`).

---

### R-03 -> RF-03 (Límite máximo de descuento y promociones)
- **Requisito original (R-03):** *«El descuento no puede superar el precio, excepto en promociones»*.
- **Problema identificado (Incompletitud y Contradicción de dominio):**
  1. No se especifica cómo el módulo identifica una *"promoción"* (no existe parámetro ni regla asociada en la firma `calcularDescuento(precio, porcentaje, esVip)`).
  2. Permitir que el descuento supere al precio implicaría un `total < 0` (la tienda tendría que pagar dinero al comprador), lo cual constituye un riesgo financiero crítico si no se acota qué significa *"excepto en promociones"* (por ejemplo, saldo a favor en monedero vs. cobro mínimo de `0`).
- **Impacto:** En el código base `src/descuentos.js`, esta regla no está implementada en absoluto: ni se limita `porcentaje` al rango `[0, 100]` de forma efectiva, ni se impide que `descuento > precio` (especialmente cuando se suma el bono VIP de `+ 10`), produciendo totales negativos.
- **Propuesta verificable (RF-03):**
  1. El parámetro `porcentaje` debe encontrarse en el rango cerrado `[0, 100]` y el parámetro `precio` debe ser un número mayor o igual a `0`. En caso contrario, la función debe rechazar la operación lanzando una excepción (`RangeError` / `Error`).
  2. El descuento total acumulado (porcentual + bono VIP) no podrá superar en ningún caso el `precio` del producto; por tanto, el monto final a pagar tendrá como límite inferior `0` (`total = Math.max(0, precio - descuento)`), hasta tanto el negocio no defina formalmente la regla de promociones.
- **Supuestos de negocio pendientes de confirmación:**
  - *S-03a:* Confirmar si al acumular descuento porcentual + bono VIP (`descuento > precio`), el sistema debe truncar el total a pagar a `0` o rechazar la combinación.
  - *S-03b:* Definir formalmente el alcance de *"excepto en promociones"* (parámetro de entrada requerido, tope máximo permitido y tratamiento contable).

---

### R-04 -> RF-04 (Exactitud del cálculo y manejo de entradas inválidas)
- **Requisito original (R-04):** *«Se debe mostrar el resultado correcto»*.
- **Problema identificado (Ambigüedad / Falta de especificación de interfaz y contrato):**
  1. No define la fórmula matemática exacta ni la precisión decimal esperada.
  2. Confunde la responsabilidad del módulo de dominio (retornar un valor numérico) con la capa de presentación (*"mostrar"* en consola o interfaz).
  3. No define el comportamiento ante entradas fuera de rango o tipos de datos inválidos.
- **Impacto:** En `src/descuentos.js`, cuando `porcentaje > 100`, el código solo ejecuta `console.log("Descuento inválido")` pero **continúa la ejecución** y retorna un `total` negativo erróneo en lugar de detener el flujo.
- **Propuesta verificable (RF-04):**
  1. La función debe validar que `precio` y `porcentaje` sean valores numéricos finitos (`typeof === "number"` y `!Number.isNaN()`) y que `esVip` sea booleano.
  2. Si `porcentaje < 0` o `porcentaje > 100` (o `precio < 0`), la función debe interrumpir el cálculo lanzando un `Error("Descuento inválido")` en lugar de solo imprimir en consola.
  3. Para entradas válidas, debe retornar el valor numérico `total = precio - descuento` conforme a la fórmula:
     $$\text{descuento} = \left(\frac{\text{precio} \times \text{porcentaje}}{100}\right) + (\text{esVip} \ ? \ 10 : 0)$$
- **Supuestos de negocio pendientes de confirmación:**
  - *S-04:* Confirmar si el valor retornado debe redondearse a 2 decimales monetarios (ej. `Math.round(total * 100) / 100`) y cuál es el contrato de errores esperado por el módulo consumidor (excepción vs. objeto de resultado).

---

## 3. Observaciones Preliminares sobre `src/descuentos.js` (Sin Ejecución)

Al inspeccionar estáticamente el código base frente a los requisitos anteriores, se registran las siguientes observaciones preventivas:

1. **Línea 2 (`var descuento = precio * porcentaje / 100;`):** Uso de `var` (alcance de función y *hoisting*) en lugar de `let`/`const`, y ausencia de validación previa de tipos y signos para `precio` y `porcentaje`.
2. **Línea 3 (`if (esVip == true) descuento = descuento + 10;`):** Uso de comparación débil (`==`) susceptible a coerción implícita de tipos (ej. `esVip = 1` o `"1"` evaluaría como verdadero), omisión de llaves `{}` en el bloque condicional y suma directa de `10` sin verificar si `descuento` supera a `precio` (`R-03`).
3. **Línea 4 (`if (porcentaje > 100) console.log("Descuento inválido");`):** Defecto crítico de control de flujo. Aunque detecta `porcentaje > 100`, únicamente escribe un mensaje en la salida estándar y **no detiene el cálculo**, violando `R-03` y `R-04`. Además, omite llaves `{}` y no valida `porcentaje < 0`.
4. **Línea 5 (`var total = precio - descuento;`):** Uso de `var` para una referencia que no se reasigna (`const`), y cálculo directo que puede producir montos negativos cuando `porcentaje > 100` o cuando el bono VIP excede el saldo restante del precio.

---

## 4. Matriz de Trazabilidad de Requisitos

| ID | Problema | Impacto | Propuesta | Artefacto | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **R-01 / RF-01** | **Ambigüedad:** El término *"rápidamente"* no es medible ni verificable. | Imposibilidad de definir criterios de aceptación objetivos para pruebas de rendimiento. | **RF-01:** Ejecución en complejidad $O(1)$ con tiempo de respuesta $\le 1\text{ ms}$ por llamada individual ($\le 50\text{ ms}$ p99 integrado). *Supuesto S-01 pendiente.* | `docs/requisitos.md`, `src/descuentos.js` | **Pendiente de confirmación de umbral (S-01)** |
| **R-02 / RF-02** | **Subjetividad e incompletitud:** No define *"cliente importante"* ni la regla de *"descuento especial"*. | Implementación arbitraria (`+ 10` fijo con `esVip == true`) que puede exceder el precio del artículo. | **RF-02:** Evaluar estrictamente `esVip === true` para aplicar el bono VIP (+10), acotado por el límite de `RF-03`. *Supuestos S-02a y S-02b pendientes.* | `docs/requisitos.md`, `docs/checklist.md`, `src/descuentos.js` | **Parcialmente confirmado (validación booleana estricta; monto/mínimo en S-02)** |
| **R-03 / RF-03** | **Incompletitud:** No define qué es una *"promoción"* ni implementa el tope `descuento <= precio`. | El código permite `porcentaje > 100`, `porcentaje < 0` y `descuento > precio`, generando totales negativos y pérdida financiera. | **RF-03:** Validar rango `0 <= porcentaje <= 100` y `precio >= 0`; garantizar que el descuento no genere cobros negativos salvo regla explícita de promoción. *Supuestos S-03a y S-03b pendientes.* | `docs/requisitos.md`, `docs/checklist.md`, `src/descuentos.js` | **En corrección para rango de porcentaje; regla de promoción pendiente (S-03)** |
| **R-04 / RF-04** | **Indefinición funcional:** *"Mostrar el resultado correcto"* confunde salida por consola con retorno de función y manejo de errores. | Ante `porcentaje > 100` solo ejecuta `console.log` y retorna un valor erróneo; no valida tipos ni valores negativos. | **RF-04:** Detener la ejecución ante porcentajes o precios inválidos, validar entradas numéricas y retornar `precio - descuento`. *Supuesto S-04 pendiente.* | `docs/requisitos.md`, `docs/checklist.md`, `src/descuentos.js` | **Confirmado para validación de rango y retorno correcto; redondeo pendiente (S-04)** |

