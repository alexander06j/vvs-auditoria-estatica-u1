/**
 * Configuración de ESLint (Flat Config) para la auditoría estática de src/descuentos.js
 *
 * Justificación técnica de las reglas seleccionadas:
 * - "no-var": Prohíbe el uso de `var` (ámbito de función y hoisting propenso a efectos colaterales)
 *   exigiendo `let` o `const` con ámbito de bloque (block scope).
 * - "eqeqeq": Exige operadores de igualdad estricta (`===` y `!==`) para prevenir errores lógicos
 *   derivados de la coerción implícita de tipos en JavaScript (ej. `1 == true` o `"1" == true`).
 * - "no-unused-vars": Detecta variables y parámetros declarados pero nunca utilizados (código muerto
 *   o cálculos inconclusos que degradan la mantenibilidad).
 * - "curly": Obliga a delimitar con llaves `{}` todos los bloques de control (`if`, `else`, `for`,
 *   `while`), evitando ambigüedades visuales y defectos al añadir líneas posteriores (tipo "goto fail").
 */
module.exports = [
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        console: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
    rules: {
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "no-unused-vars": "error",
      "curly": ["error", "all"],
    },
  },
];

