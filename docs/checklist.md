# Lista de Comprobación (Checklist) para Inspección Estática

**Artefacto inspeccionado:** `src/descuentos.js`  
**Método de referencia:** Inspección formal de Fagan (1976) y guía de evaluación estática ISTQB v4.0.1.  
**Objetivo:** Verificar el cumplimiento de estándares de codificación JavaScript y la correcta trazabilidad con los requisitos verificables (`RF-01` a `RF-04`) sin ejecutar el código.

---

## Criterios de Verificación

| # | Categoría | Pregunta de Verificación | Regla / Requisito Asociado | Evaluación en Código Base | Observación Preliminar |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **CHK-01** | Declaración y Alcance | ¿Se declaran todas las variables utilizando `const` o `let` con alcance de bloque en lugar de `var`? | ESLint: `no-var` | **No cumple** | Se utiliza `var descuento` (línea 2) y `var total` (línea 5). |
| **CHK-02** | Código Limpio | ¿Están todas las variables y parámetros declarados siendo efectivamente utilizados, sin existir código muerto ni variables huérfanas? | ESLint: `no-unused-vars` | **Cumple** | Los parámetros `precio`, `porcentaje`, `esVip` y las variables locales se utilizan en la función. |
| **CHK-03** | Comparaciones Seguras | ¿Se emplean operadores de igualdad estricta (`===` y `!==`) en todas las comparaciones para evitar coerción implícita de tipos? | ESLint: `eqeqeq` / `RF-02` | **No cumple** | En la línea 3 se evalúa `if (esVip == true)` usando igualdad débil (`==`). |
| **CHK-04** | Estructura de Control | ¿Están todos los bloques condicionales (`if`, `else`) y bucles delimitados explícitamente con llaves `{}` incluso cuando contienen una sola sentencia? | ESLint: `curly` | **No cumple** | Los condicionales de las líneas 3 y 4 carecen de llaves `{}`. |
| **CHK-05** | Validación de Tipos | ¿Se verifica que los parámetros de entrada (`precio`, `porcentaje`, `esVip`) correspondan a los tipos de datos esperados (`number` finito y `boolean`) antes de operar con ellos? | Revisión Humana / `RF-04` | **No cumple** | No existe validación con `typeof` ni `Number.isNaN()`; pasar cadenas o `undefined` produce `NaN` o coerción no deseada. |
| **CHK-06** | Validación de Dominio (Rangos) | ¿Se valida que `precio >= 0` y que `porcentaje` se encuentre dentro del rango válido `[0, 100]` (incluyendo el rechazo de valores negativos)? | Revisión Humana / `RF-03`, `RF-04` | **No cumple** | Solo se verifica `porcentaje > 100`, omitiendo por completo `porcentaje < 0` y `precio < 0`. |
| **CHK-07** | Manejo de Errores y Flujo | ¿El código detiene la ejecución (mediante `throw new Error(...)` o retorno controlado) cuando detecta una entrada inválida en lugar de continuar calculando con datos erróneos? | Revisión Humana / `RF-04` | **No cumple** | En la línea 4 (`if (porcentaje > 100) console.log("Descuento inválido");`) solo se imprime en consola y la función continúa hasta retornar un `total` negativo. |
| **CHK-08** | Regla de Negocio (Tope de Descuento) | ¿Se garantiza que el descuento total acumulado (porcentual + bono VIP) no supere el `precio` del producto (`total >= 0`), salvo regla explícita y documentada de promoción? | Revisión Humana / `RF-02`, `RF-03` | **No cumple** | Si `precio = 15`, `porcentaje = 50` (`descuento = 7.5`) y `esVip = true` (`+10`), el descuento sube a `17.5` y retorna `total = -2.5`, violando `R-03`. |
| **CHK-09** | Separación de Responsabilidades | ¿La función devuelve el resultado a través de su valor de retorno o excepciones sin acoplarse a efectos secundarios de interfaz como `console.log` para reportar errores? | Revisión Humana / `RF-04` | **No cumple** | Se utiliza `console.log` para notificar un error de dominio en lugar de propagarlo al llamador. |
| **CHK-10** | Trazabilidad y Supuestos | ¿Están explícitamente documentados como supuestos pendientes aquellas reglas de negocio ambiguas (`R-02` bono VIP, `R-03` promociones) para evitar asumir comportamientos no confirmados? | Revisión Humana / `RF-01`–`RF-04` | **Cumple (en `docs/requisitos.md`)** | Los supuestos `S-01` a `S-04` quedaron registrados en la matriz de trazabilidad para confirmación con el negocio. |

