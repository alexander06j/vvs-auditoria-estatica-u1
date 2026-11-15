# Acta de Inspección por Pares y Tabla de Hallazgos (Fase C)

## 1. Información de la Sesión de Inspección (Método de Fagan, 1976)

- **Artefacto inspeccionado:** `src/descuentos.js` (versión base inicial, 9 líneas)
- **Documentos de entrada:** `docs/requisitos.md` (`RF-01` a `RF-04`), `docs/checklist.md` (`CHK-01` a `CHK-10`) y `evidencias/lint-inicial.txt`
- **Técnica aplicada:** Inspección estática combinada (Análisis estático automatizado con ESLint + Inspección humana estructurada por roles sin ejecución de código)

### Roles de la Inspección por Pares

| Rol | Responsabilidad en la Sesión | Intervención Principal |
| :--- | :--- | :--- |
| **Autor** | Desarrollador original del módulo `src/descuentos.js`. Explica la intención del código base y aplica las correcciones acordadas sobre reglas confirmadas. | Expuso que implementó `descuento + 10` para clientes VIP asumiendo un bono fijo por falta de detalle en `R-02`, y que usó `console.log` en la línea 4 como mensaje informativo sin advertir que la función seguía ejecutándose. |
| **Revisor (Inspector)** | Analiza línea por línea el código frente al *checklist* y los requisitos `RF-01` a `RF-04`, identificando defectos lógicos, de dominio y de estilo. | Detectó que ESLint solo cubrió defectos sintácticos (`var`, `==`, `{}`), pero omitió defectos críticos de negocio: ausencia de interrupción cuando `porcentaje > 100`, falta de validación de negativos/tipos y riesgo de `total < 0` al sumar el bono VIP. |
| **Registrador (*Scribe*)** | Clasifica y documenta formalmente cada hallazgo con su origen, severidad, evidencia, acción correctiva y estado, diferenciando reglas confirmadas de supuestos pendientes. | Consolidó los **7 hallazgos** (`H-01` a `H-07`) en la tabla oficial, verificando que únicamente se modifiquen en código las reglas confirmadas y que los supuestos `S-01` a `S-04` queden trazados como pendientes de validación con el negocio. |

---

## 2. Tabla de Hallazgos de la Auditoría Estática

Se documentan **7 hallazgos** (3 originados por **ESLint** y 4 por **Revisión Humana**):

| ID | Origen | Severidad | Evidencia en Código Base (`src/descuentos.js`) | Descripción del Defecto | Acción Preventiva / Correctiva | Estado |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **H-01** | **ESLint** (`no-var`) | Media | **Líneas 2 y 5:**<br>`var descuento = ...;`<br>`var total = ...;` | Uso de declaraciones con `var` (alcance de función y *hoisting*) en lugar de variables con alcance de bloque (`let` / `const`), exponiendo el código a redeclaraciones o mutaciones accidentales. | Reemplazar `var descuento` por `let descuento` (ya que puede reasignarse si `esVip === true`) y `var total` por `const total` (referencia inmutable). | **Corregido** (Regla confirmada) |
| **H-02** | **ESLint** (`eqeqeq`) | Alta | **Línea 3:**<br>`if (esVip == true)` | Uso del operador de igualdad abstracta/débil (`==`), que aplica coerción implícita de tipos en JavaScript. Valores no booleanos como `1` o `"1"` activarían indebidamente el descuento VIP. | Sustituir por el operador de igualdad estricta `if (esVip === true)` conforme a `RF-02` y `CHK-03`. | **Corregido** (Regla confirmada) |
| **H-03** | **ESLint** (`curly`) | Media | **Líneas 3 y 4:**<br>`if (esVip == true) descuento = ...;`<br>`if (porcentaje > 100) console.log(...);` | Omisión de llaves `{}` en bloques condicionales de una línea, lo que reduce la legibilidad y eleva el riesgo de defectos de flujo de control durante el mantenimiento. | Delimitar explícitamente todos los bloques condicionales `if` con llaves `{}` (`CHK-04`). | **Corregido** (Regla confirmada) |
| **H-04** | **Revisión Humana** (`RF-04` / `CHK-07`) | **Crítica** | **Línea 4:**<br>`if (porcentaje > 100) console.log("Descuento inválido");` | **Fallo de control de flujo:** Al recibir un `porcentaje > 100`, la función solo imprime un texto en consola pero **no detiene la ejecución**, calculando y retornando un `total` negativo erróneo. ESLint no detecta este defecto. | Reemplazar el `console.log` por el lanzamiento de una excepción (`throw new RangeError(...)`) que interrumpa inmediatamente el cálculo ante porcentajes fuera de `[0, 100]`. | **Corregido** (Regla confirmada) |
| **H-05** | **Revisión Humana** (`RF-03`, `RF-04` / `CHK-05`, `CHK-06`) | Alta | **Líneas 1–2:**<br>`function calcularDescuento(precio, porcentaje, esVip)` | **Ausencia de validación de entradas y rangos negativos:** No se valida que `precio` y `porcentaje` sean números finitos (`typeof === "number"`, `!Number.isNaN`), ni se rechazan valores negativos (`precio < 0` o `porcentaje < 0`). Un porcentaje negativo incrementa el precio final en lugar de descontar. | Incorporar guardas de validación al inicio de la función para rechazar tipos no numéricos (`TypeError`), `precio < 0` y `porcentaje < 0` (`RangeError`). | **Corregido** (Regla confirmada) |
| **H-06** | **Revisión Humana** (`RF-02`, `RF-03` / `CHK-08`) | Alta | **Línea 3 y 5:**<br>`descuento = descuento + 10;`<br>`var total = precio - descuento;` | **Violación del límite `descuento <= precio` (`R-03`):** Cuando `esVip === true`, se suman `10` unidades fijas sin verificar si el descuento acumulado supera al `precio` (ej. `precio = 15`, `porcentaje = 50` -> `descuento = 17.5` -> `total = -2.5`). | Aplicar tope preventivo `if (descuento > precio) { descuento = precio; }` para garantizar `total >= 0` (`R-03`), y conservar el bono `+ 10` sujeto a confirmación de los supuestos `S-02a` y `S-02b`. | **Mitigado en código / Supuesto VIP pendiente (`S-02`)** |
| **H-07** | **Revisión Humana** (`RF-03` / `CHK-10`) | Media | **Firma y cuerpo de `calcularDescuento`** | **Incompletitud de requisito (`R-03` — *"excepto en promociones"*):** El requisito original menciona una excepción para promociones, pero no existe parámetro ni especificación de negocio que la defina. | **No codificar reglas especulativas.** Se mantiene documentado como supuesto pendiente `S-03b` en `docs/requisitos.md` para consulta con el *Product Owner*. | **Diferido (Supuesto no confirmado `S-03b`)** |

---

## 3. Comentarios Técnicos de Revisión (Simulación de Pull Request / Método de Fagan)

> **Comentario Técnico #1 — Rol: Revisor (Inspector)**  
> *"Durante la inspección estática de `src/descuentos.js` se comprobó que ESLint detectó eficazmente las 5 infracciones sintácticas y de estilo (`H-01` por uso de `var`, `H-02` por coerción de tipos en `esVip == true` y `H-03` por omisión de llaves `{}`). Sin embargo, el hallazgo más riesgoso (`H-04`, severidad Crítica) solo pudo identificarse mediante revisión humana: en la línea 4, cuando `porcentaje > 100`, la función ejecuta `console.log('Descuento inválido')` pero continúa hacia la línea 5, devolviendo un total negativo. Asimismo, la suma directa de `+ 10` para clientes VIP (`H-06`) puede hacer que `descuento > precio`, incumpliendo `R-03`. Se aprueba la refactorización que reemplaza `console.log` por `throw new RangeError(...)`, valida entradas negativas/no numéricas (`H-05`) y acota `descuento <= precio`."*

> **Comentario Técnico #2 — Rol: Registrador (*Scribe*)**  
> *"Quedan registrados en el acta los 7 hallazgos (`H-01` a `H-07`) y verificada la trazabilidad con `docs/requisitos.md` y `docs/checklist.md`. Se deja constancia de que en `src/descuentos.js` se corrigieron únicamente las reglas confirmadas (`RF-01` a `RF-04` en lo referente a alcance de bloque, igualdad estricta, validación de rangos `[0, 100]` y tope no negativo `descuento <= precio`), logrando 0 errores en `evidencias/lint-final.txt`. Los supuestos de negocio no confirmados (`S-02`: naturaleza y mínimo de compra del bono VIP; `S-03b`: tratamiento de promociones excepcionales; `S-04`: redondeo decimal) permanecen documentados sin introducir lógica especulativa en producción."*

