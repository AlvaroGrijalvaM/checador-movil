/**
 * Traduce errores de MySQL/mysql2 a mensajes legibles para el cliente.
 *
 * Los stored procedures de checador_db usan SIGNAL SQLSTATE '45000' para
 * las validaciones de negocio (errno 1644), por lo que sus mensajes se
 * devuelven tal cual al cliente.
 */
export function errorMessage(err) {
  if (!err) return 'Error interno del servidor.';
  if (err.errno === 1644 || String(err.sqlState ?? '').startsWith('45')) {
    return String(err.message).split('SQLSTATE')[0].trim() || 'Error de validacion.';
  }
  if (err.errno === 1062) return 'Registro duplicado.';
  if (err.errno === 1452) return 'Registro relacionado inexistente.';
  if (err.errno === 1045) return 'Credenciales de MySQL incorrectas (revise .env).';
  if (err.errno === 1049) return 'La base de datos no existe (ejecute checador_db/Script Completo.txt).';
  return err.message ?? 'Error interno del servidor.';
}