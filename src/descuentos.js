/**
 * Calcula el precio final luego de aplicar el porcentaje de descuento y el beneficio VIP.
 *
 * Reglas confirmadas aplicadas (Fase C):
 * - Uso de let/const (no-var), igualdad estricta === (eqeqeq) y bloques con llaves {} (curly).
 * - Validación de tipos numéricos finitos y rangos válidos (precio >= 0, 0 <= porcentaje <= 100).
 * - Interrupción del flujo mediante excepción cuando el porcentaje o el precio son inválidos.
 * - Tope preventivo para que el descuento no supere el precio (total >= 0) conforme a R-03.
 *
 * Supuestos de negocio pendientes de confirmación (no alterados arbitrariamente):
 * - S-02: Se mantiene el bono VIP fijo de +10 hasta confirmar si requiere monto mínimo de compra.
 * - S-03b: No se implementa excepción por "promociones" hasta definir su parámetro y regla contable.
 */
function calcularDescuento(precio, porcentaje, esVip) {
  if (
    typeof precio !== "number" ||
    typeof porcentaje !== "number" ||
    Number.isNaN(precio) ||
    Number.isNaN(porcentaje)
  ) {
    throw new TypeError("Datos inválidos: precio y porcentaje deben ser numéricos");
  }

  if (precio < 0) {
    throw new RangeError("Precio inválido: no puede ser negativo");
  }

  if (porcentaje < 0 || porcentaje > 100) {
    throw new RangeError("Descuento inválido: el porcentaje debe estar entre 0 y 100");
  }

  let descuento = (precio * porcentaje) / 100;

  if (esVip === true) {
    descuento = descuento + 10;
  }

  if (descuento > precio) {
    descuento = precio;
  }

  const total = precio - descuento;
  return total;
}

module.exports = { calcularDescuento };
